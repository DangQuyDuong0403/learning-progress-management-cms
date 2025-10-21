import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Table, Button, Space, Modal, Input, Tooltip, Typography, Switch, Upload, Form, Select, Checkbox, DatePicker } from 'antd';
import {
	PlusOutlined,
	SearchOutlined,
	EyeOutlined,
	DownloadOutlined,
	UploadOutlined,
	EditOutlined,
	DeleteOutlined,
	FilterOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../../../../hooks/usePageTitle';
import './ClassList.css';
import ThemedLayout from '../../../../component/ThemedLayout';
import LoadingWithEffect from '../../../../component/spinner/LoadingWithEffect';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useClassMenu } from '../../../../contexts/ClassMenuContext';
import { spaceToast } from '../../../../component/SpaceToastify';
import { classManagementApi, syllabusManagementApi } from '../../../../apis/apis';
import BottomActionBar from '../../../../component/BottomActionBar';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const ClassListTable = () => {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const navigate = useNavigate();
	const { enterClassMenu } = useClassMenu();
	
	// Set page title
	usePageTitle(t('classManagement.title'));

	// State for classes data
	const [classes, setClasses] = useState([]);
	const [loading, setLoading] = useState(true);
	const [totalClasses, setTotalClasses] = useState(0);
	
	// Pagination state
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 10,
		total: 0,
		showSizeChanger: true,
		showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
	});
	
	// Search and filter state
	const [searchText, setSearchText] = useState("");
	const [searchTimeout, setSearchTimeout] = useState(null);
	
	// Filter states
	const [statusFilter, setStatusFilter] = useState("all");
	const [syllabusFilter, setSyllabusFilter] = useState(null);
	const [startDateFrom, setStartDateFrom] = useState(null);
	const [startDateTo, setStartDateTo] = useState(null);
	const [endDateFrom, setEndDateFrom] = useState(null);
	const [endDateTo, setEndDateTo] = useState(null);
	
	// Sort state - start with createdAt DESC (newest first)
	const [sortBy, setSortBy] = useState("createdAt");
	const [sortDir, setSortDir] = useState("desc");
	
	// Modal states
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isExportModalVisible, setIsExportModalVisible] = useState(false);
	const [confirmModal, setConfirmModal] = useState({
		visible: false,
		title: '',
		content: '',
		onConfirm: null
	});
	const [editingClass, setEditingClass] = useState(null);
	const [form] = Form.useForm();
	const [importModal, setImportModal] = useState({
		visible: false,
		fileList: [],
		uploading: false
	});
	
	// Loading states
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [actionLoading, setActionLoading] = useState({
		delete: null,
		toggle: null,
	});
	
	// Syllabus data for form
	const [syllabuses, setSyllabuses] = useState([]);
	const [syllabusLoading, setSyllabusLoading] = useState(false);
	
	// Selected rows for bulk operations
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);
	
	// Filter dropdown state
	const [filterDropdown, setFilterDropdown] = useState({
		visible: false,
		selectedStatus: 'all',
		selectedSyllabus: null,
		selectedStartDateRange: null,
		selectedEndDateRange: null,
	});
	
	// Refs for click outside detection
	const filterContainerRef = useRef(null);

	// Fetch classes from API
	const fetchClasses = useCallback(async (page = 1, size = 10, search = '', sortField = 'createdAt', sortDirection = 'desc', filters = {}) => {
		setLoading(true);
		try {
			const params = {
				page: page - 1, // API uses 0-based indexing
				size: size,
			};

			// Add sort parameters
			if (sortField && sortDirection) {
				params.sortBy = sortField;
				params.sortDir = sortDirection;
			}

			// Add search parameter if provided
			if (search && search.trim()) {
				params.searchText = search.trim();
			}

			// Add filter parameters
			if (filters.status && filters.status !== 'all') {
				params.status = filters.status;
			}
			if (filters.syllabusId) {
				params.syllabusId = filters.syllabusId;
			}
			if (filters.startDateFrom) {
				params.startDateFrom = filters.startDateFrom;
			}
			if (filters.startDateTo) {
				params.startDateTo = filters.startDateTo;
			}
			if (filters.endDateFrom) {
				params.endDateFrom = filters.endDateFrom;
			}
			if (filters.endDateTo) {
				params.endDateTo = filters.endDateTo;
			}

			console.log('Fetching classes with params:', params);
			const response = await classManagementApi.getClasses(params);
			
			console.log('API Response:', response);
			console.log('First class data:', response.data?.[0]);
			
			if (response.success && response.data) {
				// Map API response to component format
				const mappedClasses = response.data.map(classItem => {
					console.log('Class item:', classItem);
					console.log('Syllabus data:', classItem.syllabus);
					console.log('Level data:', classItem.syllabus?.level);
					
					return {
						id: classItem.id,
						name: classItem.className,
						syllabus: classItem.syllabus?.syllabusName || '-',
						syllabusId: classItem.syllabusId,
						level: classItem.syllabus?.level?.levelName || '-',
						studentCount: classItem.studentCount || 0,
						status: classItem.status === 'ACTIVE' ? 'active' : 'inactive',
						createdAt: classItem.createdAt,
						updatedAt: classItem.updatedAt,
						avatarUrl: classItem.avatarUrl,
						startDate: classItem.startDate,
						endDate: classItem.endDate,
					};
				});

				setClasses(mappedClasses);
				setTotalClasses(response.totalElements || response.data.length);
				setPagination(prev => ({
					...prev,
					current: page,
					pageSize: size,
					total: response.totalElements || response.data.length,
				}));
			}
		} catch (error) {
			console.error('Error fetching classes:', error);
			spaceToast.error(error.response?.data?.error || error.message || 'Failed to fetch classes');
		} finally {
			setLoading(false);
		}
	}, []);

	// Fetch syllabuses for form
	const fetchSyllabuses = useCallback(async () => {
		setSyllabusLoading(true);
		try {
			const response = await syllabusManagementApi.getSyllabuses({
				params: { page: 0, size: 100 }
			});
			
			if (response.success && response.data) {
				setSyllabuses(response.data);
			}
		} catch (error) {
			console.error('Error fetching syllabuses:', error);
			spaceToast.error('Failed to fetch syllabuses');
		} finally {
			setSyllabusLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchSyllabuses();
	}, [fetchSyllabuses]);

	useEffect(() => {
		const filters = {
			status: statusFilter,
			syllabusId: syllabusFilter,
			startDateFrom,
			startDateTo,
			endDateFrom,
			endDateTo,
		};
		fetchClasses(1, pagination.pageSize, searchText, sortBy, sortDir, filters);
	}, [fetchClasses, pagination.pageSize, searchText, sortBy, sortDir, statusFilter, syllabusFilter, startDateFrom, startDateTo, endDateFrom, endDateTo]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
		};
	}, [searchTimeout]);

	// Handle click outside to close filter dropdown
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (filterDropdown.visible && filterContainerRef.current) {
				// Check if click is outside the filter container
				if (!filterContainerRef.current.contains(event.target)) {
					setFilterDropdown(prev => ({
						...prev,
						visible: false,
					}));
				}
			}
		};

		// Add event listener when dropdown is visible
		if (filterDropdown.visible) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		// Cleanup event listener
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [filterDropdown.visible]);

	const handleSearch = (value) => {
		setSearchText(value);
		
		// Clear existing timeout
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
		
		// Set new timeout for 1 second delay
		const newTimeout = setTimeout(() => {
			// Reset to first page when searching
			const filters = {
				status: statusFilter,
				syllabusId: syllabusFilter,
				startDateFrom,
				startDateTo,
				endDateFrom,
				endDateTo,
			};
			fetchClasses(1, pagination.pageSize, value, sortBy, sortDir, filters);
		}, 1000);
		
		setSearchTimeout(newTimeout);
	};

	const handleTableChange = (pagination, filters, sorter) => {
		const newSortBy = sorter.field || 'createdAt';
		const newSortDir = sorter.order === 'ascend' ? 'asc' : 'desc';
		
		setSortBy(newSortBy);
		setSortDir(newSortDir);
		
		const currentFilters = {
			status: statusFilter,
			syllabusId: syllabusFilter,
			startDateFrom,
			startDateTo,
			endDateFrom,
			endDateTo,
		};
		
		fetchClasses(pagination.current, pagination.pageSize, searchText, newSortBy, newSortDir, currentFilters);
	};

	const handleAdd = () => {
		setEditingClass(null);
		setIsModalVisible(true);
	};

	const handleDelete = (record) => {
		setConfirmModal({
			visible: true,
			title: t('classManagement.confirmDelete'),
			content: t('classManagement.deleteClassMessage', { className: record.name }),
			onConfirm: async () => {
				setActionLoading(prev => ({ ...prev, delete: record.id }));
				try {
					await classManagementApi.deleteClass(record.id);
					spaceToast.success(t('classManagement.classDeletedSuccess', { className: record.name }));
					const filters = {
						status: statusFilter,
						syllabusId: syllabusFilter,
						startDateFrom,
						startDateTo,
						endDateFrom,
						endDateTo,
					};
					fetchClasses(pagination.current, pagination.pageSize, searchText, sortBy, sortDir, filters);
				} catch (error) {
					console.error('Error deleting class:', error);
					spaceToast.error(error.response?.data?.message || error.message || 'Failed to delete class');
				} finally {
					setActionLoading(prev => ({ ...prev, delete: null }));
				}
			}
		});
	};

	const handleStatusToggle = (record) => {
		const newStatus = record.status === 'active' ? 'inactive' : 'active';
		
		setConfirmModal({
			visible: true,
			title: t('classManagement.confirmStatusChange'),
			content: newStatus === 'active' 
				? t('classManagement.activateClassMessage', { className: record.name })
				: t('classManagement.deactivateClassMessage', { className: record.name }),
			onConfirm: async () => {
				setActionLoading(prev => ({ ...prev, toggle: record.id }));
				try {
					await classManagementApi.toggleClassStatus(record.id, newStatus);
					spaceToast.success(newStatus === 'active' 
						? t('classManagement.classActivatedSuccess', { className: record.name })
						: t('classManagement.classDeactivatedSuccess', { className: record.name }));
					const filters = {
						status: statusFilter,
						syllabusId: syllabusFilter,
						startDateFrom,
						startDateTo,
						endDateFrom,
						endDateTo,
					};
					fetchClasses(pagination.current, pagination.pageSize, searchText, sortBy, sortDir, filters);
				} catch (error) {
					console.error('Error updating class status:', error);
					spaceToast.error('Failed to update class status');
				} finally {
					setActionLoading(prev => ({ ...prev, toggle: null }));
				}
			}
		});
	};

	const handleModalOk = async () => {
		setIsSubmitting(true);
		try {
			const values = await form.validateFields();

			if (editingClass) {
				// Update existing class
				const updateData = {
					className: values.name,
					avatarUrl: "string", // Default as per API requirements
					startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
					endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
				};
				
				await classManagementApi.updateClass(editingClass.id, updateData);
				
				// Refresh the list
				const filters = {
					status: statusFilter,
					syllabusId: syllabusFilter,
					startDateFrom,
					startDateTo,
					endDateFrom,
					endDateTo,
				};
				fetchClasses(pagination.current, pagination.pageSize, searchText, sortBy, sortDir, filters);
				spaceToast.success(t('classManagement.classUpdatedSuccess'));
			} else {
				// Add new class
				const newClassData = {
					className: values.name,
					syllabusId: values.syllabusId,
					avatarUrl: "string", // Default as per API requirements
					startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
					endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
				};
				
				await classManagementApi.createClass(newClassData);
				
				// Refresh the list
				const filters = {
					status: statusFilter,
					syllabusId: syllabusFilter,
					startDateFrom,
					startDateTo,
					endDateFrom,
					endDateTo,
				};
				fetchClasses(1, pagination.pageSize, searchText, sortBy, sortDir, filters);
				spaceToast.success(t('classManagement.classCreatedSuccess'));
			}

			setIsModalVisible(false);
			form.resetFields();
		} catch (error) {
			console.error('Error saving class:', error);
			spaceToast.error(error.response?.data?.message || error.message || 'Failed to save class. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleModalCancel = () => {
		setIsModalVisible(false);
		form.resetFields();
	};

	const handleEdit = (record) => {
		setEditingClass(record);
		
		form.setFieldsValue({
			name: record.name,
			startDate: record.startDate ? dayjs(record.startDate) : null,
			endDate: record.endDate ? dayjs(record.endDate) : null,
		});
		
		setIsModalVisible(true);
	};

	const handleViewDetail = (record) => {
		// Enter class menu mode with class data
		enterClassMenu({
			id: record.id,
			name: record.name,
			description: record.description || ''
		});
		
		// Navigate to class menu
		navigate(`/manager/classes/menu/${record.id}`);
	};

	const handleImport = () => {
		setImportModal(prev => ({
			...prev,
			visible: true,
			fileList: [],
			uploading: false
		}));
	};

	const handleImportOk = async () => {
		setImportModal(prev => ({ ...prev, uploading: true }));
		
		try {
			// TODO: Implement import functionality
			spaceToast.success('Classes imported successfully!');
			setImportModal(prev => ({
				...prev,
				visible: false,
				fileList: [],
				uploading: false
			}));
			
			// Refresh the data
			const filters = {
				status: statusFilter,
				syllabusId: syllabusFilter,
				startDateFrom,
				startDateTo,
				endDateFrom,
				endDateTo,
			};
			fetchClasses(pagination.current, pagination.pageSize, searchText, sortBy, sortDir, filters);
		} catch (error) {
			console.error('Import error:', error);
			spaceToast.error('Failed to import classes');
		} finally {
			setImportModal(prev => ({ ...prev, uploading: false }));
		}
	};

	const handleImportCancel = () => {
		setImportModal(prev => ({
			...prev,
			visible: false,
			fileList: [],
			uploading: false
		}));
	};

	const handleExport = () => {
		setIsExportModalVisible(true);
	};

	const handleExportModalClose = () => {
		setIsExportModalVisible(false);
	};

	const handleExportSelected = async () => {
		try {
			// TODO: Implement export selected items API call
			// await classManagementApi.exportClasses(selectedRowKeys);
			
			spaceToast.success(`${t('classManagement.classesExportedSuccess')}: ${selectedRowKeys.length} ${t('classManagement.classes')}`);
			setIsExportModalVisible(false);
		} catch (error) {
			console.error('Error exporting selected classes:', error);
			spaceToast.error(t('classManagement.exportError'));
		}
	};

	const handleExportAll = async () => {
		try {
			// TODO: Implement export all items API call
			// await classManagementApi.exportAllClasses();
			
			spaceToast.success(`${t('classManagement.classesExportedSuccess')}: ${totalClasses} ${t('classManagement.classes')}`);
			setIsExportModalVisible(false);
		} catch (error) {
			console.error('Error exporting all classes:', error);
			spaceToast.error(t('classManagement.exportError'));
		}
	};

	const handleDownloadTemplate = async () => {
		try {
			// TODO: Implement template download functionality
			spaceToast.success(t('classManagement.templateDownloaded'));
		} catch (error) {
			console.error('Error downloading template:', error);
			spaceToast.error('Failed to download template');
		}
	};

	// Handle table header checkbox (only current page)
	const handleSelectAllCurrentPage = (checked) => {
		const currentPageKeys = classes.map(classItem => classItem.id);
		
		if (checked) {
			// Add all current page items to selection
			setSelectedRowKeys(prev => {
				const newKeys = [...prev];
				currentPageKeys.forEach(key => {
					if (!newKeys.includes(key)) {
						newKeys.push(key);
					}
				});
				return newKeys;
			});
		} else {
			// Remove all current page items from selection
			setSelectedRowKeys(prev => prev.filter(key => !currentPageKeys.includes(key)));
		}
	};

	// Checkbox logic for BottomActionBar (select all in entire dataset)
	const handleSelectAll = async (checked) => {
		if (checked) {
			try {
				// Fetch all class IDs from API (without pagination)
				const params = {
					page: 0,
					size: totalClasses, // Get all items
					include: 'ALL',
				};
				
				// Add search parameter if provided
				if (searchText && searchText.trim()) {
					params.searchText = searchText.trim();
				}

				// Add filter parameters
				if (statusFilter && statusFilter !== 'all') {
					params.status = statusFilter;
				}
				if (syllabusFilter) {
					params.syllabusId = syllabusFilter;
				}
				if (startDateFrom) {
					params.startDateFrom = startDateFrom;
				}
				if (startDateTo) {
					params.startDateTo = startDateTo;
				}
				if (endDateFrom) {
					params.endDateFrom = endDateFrom;
				}
				if (endDateTo) {
					params.endDateTo = endDateTo;
				}

				const response = await classManagementApi.getClasses(params);

				// Get all IDs from the response
				const allKeys = response.data.map(classItem => classItem.id);
				setSelectedRowKeys(allKeys);
			} catch (error) {
				console.error('Error fetching all class IDs:', error);
				spaceToast.error('Error selecting all items');
			}
		} else {
			setSelectedRowKeys([]);
		}
	};

	const handleSelectRow = (record, checked) => {
		if (checked) {
			setSelectedRowKeys(prev => [...prev, record.id]);
		} else {
			setSelectedRowKeys(prev => prev.filter(key => key !== record.id));
		}
	};

	// Handle filter dropdown toggle
	const handleFilterToggle = () => {
		setFilterDropdown(prev => ({
			...prev,
			visible: !prev.visible,
			selectedStatus: prev.visible ? prev.selectedStatus : statusFilter,
			selectedSyllabus: prev.visible ? prev.selectedSyllabus : syllabusFilter,
			selectedStartDateRange: prev.visible ? prev.selectedStartDateRange : (startDateFrom && startDateTo ? [startDateFrom, startDateTo] : null),
			selectedEndDateRange: prev.visible ? prev.selectedEndDateRange : (endDateFrom && endDateTo ? [endDateFrom, endDateTo] : null),
		}));
	};

	// Handle filter submission
	const handleFilterSubmit = () => {
		setStatusFilter(filterDropdown.selectedStatus);
		setSyllabusFilter(filterDropdown.selectedSyllabus);
		
		// Handle start date range
		if (filterDropdown.selectedStartDateRange && filterDropdown.selectedStartDateRange[0] && filterDropdown.selectedStartDateRange[1]) {
			setStartDateFrom(filterDropdown.selectedStartDateRange[0]);
			setStartDateTo(filterDropdown.selectedStartDateRange[1]);
		} else {
			setStartDateFrom(null);
			setStartDateTo(null);
		}
		
		// Handle end date range
		if (filterDropdown.selectedEndDateRange && filterDropdown.selectedEndDateRange[0] && filterDropdown.selectedEndDateRange[1]) {
			setEndDateFrom(filterDropdown.selectedEndDateRange[0]);
			setEndDateTo(filterDropdown.selectedEndDateRange[1]);
		} else {
			setEndDateFrom(null);
			setEndDateTo(null);
		}
		
		setFilterDropdown(prev => ({
			...prev,
			visible: false,
		}));
		
		// Clear selected rows when applying filters
		setSelectedRowKeys([]);
		// Reset to first page when applying filters
		setPagination(prev => ({
			...prev,
			current: 1,
		}));
		
		const filters = {
			status: filterDropdown.selectedStatus,
			syllabusId: filterDropdown.selectedSyllabus,
			startDateFrom: filterDropdown.selectedStartDateRange && filterDropdown.selectedStartDateRange[0] ? filterDropdown.selectedStartDateRange[0] : null,
			startDateTo: filterDropdown.selectedStartDateRange && filterDropdown.selectedStartDateRange[1] ? filterDropdown.selectedStartDateRange[1] : null,
			endDateFrom: filterDropdown.selectedEndDateRange && filterDropdown.selectedEndDateRange[0] ? filterDropdown.selectedEndDateRange[0] : null,
			endDateTo: filterDropdown.selectedEndDateRange && filterDropdown.selectedEndDateRange[1] ? filterDropdown.selectedEndDateRange[1] : null,
		};
		
		fetchClasses(1, pagination.pageSize, searchText, sortBy, sortDir, filters);
	};

	// Handle filter reset
	const handleFilterReset = () => {
		setFilterDropdown(prev => ({
			...prev,
			selectedStatus: 'all',
			selectedSyllabus: null,
			selectedStartDateRange: null,
			selectedEndDateRange: null,
		}));
	};

	// Bulk operations
	const handleActivateAll = async () => {
		if (selectedRowKeys.length === 0) {
			spaceToast.warning(t('classManagement.selectItemsToActivate'));
			return;
		}
		
		setConfirmModal({
			visible: true,
			title: t('classManagement.confirmActivateAll'),
			content: t('classManagement.activateAllMessage', { count: selectedRowKeys.length }),
			onConfirm: async () => {
				try {
					// TODO: Implement bulk activate API call
					// await classManagementApi.bulkActivateClasses(selectedRowKeys);
					
					setSelectedRowKeys([]);
					spaceToast.success(t('classManagement.allClassesActivatedSuccess'));
					const filters = {
						status: statusFilter,
						syllabusId: syllabusFilter,
						startDateFrom,
						startDateTo,
						endDateFrom,
						endDateTo,
					};
					fetchClasses(pagination.current, pagination.pageSize, searchText, sortBy, sortDir, filters);
				} catch (error) {
					console.error('Error activating all classes:', error);
					spaceToast.error('Failed to activate all classes');
				}
			}
		});
	};

	const handleDeactivateAll = async () => {
		if (selectedRowKeys.length === 0) {
			spaceToast.warning(t('classManagement.selectItemsToDeactivate'));
			return;
		}
		
		setConfirmModal({
			visible: true,
			title: t('classManagement.confirmDeactivateAll'),
			content: t('classManagement.deactivateAllMessage', { count: selectedRowKeys.length }),
			onConfirm: async () => {
				try {
					// TODO: Implement bulk deactivate API call
					// await classManagementApi.bulkDeactivateClasses(selectedRowKeys);
					
					setSelectedRowKeys([]);
					spaceToast.success(t('classManagement.allClassesDeactivatedSuccess'));
					const filters = {
						status: statusFilter,
						syllabusId: syllabusFilter,
						startDateFrom,
						startDateTo,
						endDateFrom,
						endDateTo,
					};
					fetchClasses(pagination.current, pagination.pageSize, searchText, sortBy, sortDir, filters);
				} catch (error) {
					console.error('Error deactivating all classes:', error);
					spaceToast.error('Failed to deactivate all classes');
				}
			}
		});
	};

	const handleDeleteAll = async () => {
		if (selectedRowKeys.length === 0) {
			spaceToast.warning(t('classManagement.selectItemsToDelete'));
			return;
		}
		
		setConfirmModal({
			visible: true,
			title: t('classManagement.confirmDeleteAll'),
			content: t('classManagement.deleteAllMessage', { count: selectedRowKeys.length }),
			onConfirm: async () => {
				try {
					// TODO: Implement bulk delete API call
					// await classManagementApi.bulkDeleteClasses(selectedRowKeys);
					
					setSelectedRowKeys([]);
					spaceToast.success(t('classManagement.allClassesDeletedSuccess'));
					const filters = {
						status: statusFilter,
						syllabusId: syllabusFilter,
						startDateFrom,
						startDateTo,
						endDateFrom,
						endDateTo,
					};
					fetchClasses(pagination.current, pagination.pageSize, searchText, sortBy, sortDir, filters);
				} catch (error) {
					console.error('Error deleting all classes:', error);
					spaceToast.error('Failed to delete all classes');
				}
			}
		});
	};

	// Calculate checkbox states with useMemo
	const checkboxStates = useMemo(() => {
		const currentPageKeys = classes.map(classItem => classItem.id);
		const selectedCount = selectedRowKeys.length;
		
		// Check if all items on current page are selected
		const allCurrentPageSelected = currentPageKeys.length > 0 && 
			currentPageKeys.every(key => selectedRowKeys.includes(key));
		
		// For table header checkbox: only check if all current page items are selected
		const isSelectAll = allCurrentPageSelected;
		// Never show indeterminate state for table header checkbox
		const isIndeterminate = false;
		
		console.log('Checkbox Debug:', {
			currentPageKeys,
			selectedRowKeys,
			allCurrentPageSelected,
			isSelectAll,
			isIndeterminate,
			selectedCount,
		});
		
		return { isSelectAll, isIndeterminate, totalItems: currentPageKeys.length, selectedCount };
	}, [selectedRowKeys, classes]);

	const columns = [
		{
			title: (
				<Checkbox
					key={`select-all-${checkboxStates.selectedCount}-${checkboxStates.totalItems}`}
					checked={checkboxStates.isSelectAll}
					indeterminate={checkboxStates.isIndeterminate}
					onChange={(e) => handleSelectAllCurrentPage(e.target.checked)}
					style={{
						transform: 'scale(1.2)',
						marginRight: '8px'
					}}
				/>
			),
			key: 'selection',
			width: '5%',
			render: (_, record) => (
				<Checkbox
					checked={selectedRowKeys.includes(record.id)}
					onChange={(e) => handleSelectRow(record, e.target.checked)}
					style={{
						transform: 'scale(1.2)'
					}}
				/>
			),
		},
		{
			title: t('classManagement.stt'),
			key: 'index',
			width: '8%',
			render: (_, __, index) => {
				// Calculate index based on current page and page size
				const currentPage = pagination.current || 1;
				const pageSize = pagination.pageSize || 10;
				return (
					<span style={{ fontSize: '16px' }}>
						{(currentPage - 1) * pageSize + index + 1}
					</span>
				);
			},
		},
		{
			title: t('classManagement.className'),
			dataIndex: 'name',
			key: 'name',
			width: '20%',
			sorter: true,
			render: (text) => (
				<div style={{ fontSize: '16px' }}>
					{text}
				</div>
			),
		},
		{
			title: t('classManagement.syllabus'),
			dataIndex: 'syllabus',
			key: 'syllabus',
			width: '18%',
			sorter: true,
			render: (text) => (
				<div style={{ fontSize: '16px' }}>
					{text}
				</div>
			),
		},
		{
			title: t('classManagement.level'),
			dataIndex: 'level',
			key: 'level',
			width: '12%',
			sorter: true,
			render: (text) => (
				<div style={{ fontSize: '16px' }}>
					{text}
				</div>
			),
		},
		{
			title: t('classManagement.status'),
			dataIndex: 'status',
			key: 'status',
			width: '10%',
			render: (status, record) => (
				<Switch
					checked={status === 'active'}
					onChange={() => handleStatusToggle(record)}
				/>
			),
		},
		{
			title: t('classManagement.actions'),
			key: 'actions',
			width: '15%',
			render: (_, record) => (
				<Space size="small">
					<Tooltip title={t('classManagement.viewDetails')}>
						<Button
							type="text"
							size="small"
							icon={<EyeOutlined style={{ fontSize: '20px' }} />}
							onClick={() => handleViewDetail(record)}
						/>
					</Tooltip>
					<Tooltip title={t('classManagement.edit')}>
						<Button
							type="text"
							size="small"
							icon={<EditOutlined style={{ fontSize: '20px' }} />}
							onClick={() => handleEdit(record)}
						/>
					</Tooltip>
					<Tooltip title={t('classManagement.delete')}>
						<Button
							type="text"
							size="small"
							danger
							icon={<DeleteOutlined style={{ fontSize: '20px', color: '#ff4d4f' }} />}
							onClick={() => handleDelete(record)}
						/>
					</Tooltip>
				</Space>
			),
		},
	];

	return (
		<>
			<ThemedLayout>
				{/* Main Content Panel */}
				<div className={`class-page main-content-panel ${theme}-main-panel`}>
					{/* Page Title */}
					<div className="page-title-container">
						<Typography.Title 
							level={1} 
							className="page-title"
						>
							{t('classManagement.title')} <span className="student-count">({totalClasses})</span>
						</Typography.Title>
					</div>

					{/* Action Bar */}
					<div className="action-bar" style={{ marginBottom: '16px' }}>
						<Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
							<Space size="middle">
								<Input
									prefix={<SearchOutlined />}
									value={searchText}
									onChange={(e) => handleSearch(e.target.value)}
									className="search-input"
									style={{ minWidth: '300px', maxWidth: '400px', height: '40px', fontSize: '16px' }}
									allowClear
								/>
								
								<div ref={filterContainerRef} style={{ position: 'relative' }}>
									<Button 
										icon={<FilterOutlined />}
										onClick={handleFilterToggle}
										className={`filter-button ${theme}-filter-button ${filterDropdown.visible ? 'active' : ''} ${(statusFilter !== 'all' || syllabusFilter || startDateFrom || endDateFrom) ? 'has-filters' : ''}`}
									>
										{t('common.filter')}
									</Button>
									
									{/* Filter Dropdown Panel */}
									{filterDropdown.visible && (
										<div className={`filter-dropdown-panel ${theme}-filter-dropdown`}>
											<div style={{ padding: '20px' }}>
												{/* Status Filter */}
												<div style={{ marginBottom: '20px' }}>
													<Typography.Title level={5} style={{ marginBottom: '12px', fontSize: '16px' }}>
														{t('classManagement.status')}
													</Typography.Title>
													<Select
														value={filterDropdown.selectedStatus}
														onChange={(value) => setFilterDropdown(prev => ({ ...prev, selectedStatus: value }))}
														style={{ width: '100%', height: '40px' }}
													>
														<Option value="all">{t('classManagement.allStatus')}</Option>
														<Option value="ACTIVE">{t('classManagement.active')}</Option>
														<Option value="INACTIVE">{t('classManagement.inactive')}</Option>
													</Select>
												</div>

												{/* Syllabus Filter */}
												<div style={{ marginBottom: '20px' }}>
													<Typography.Title level={5} style={{ marginBottom: '12px', fontSize: '16px' }}>
														{t('classManagement.syllabus')}
													</Typography.Title>
													<Select
														value={filterDropdown.selectedSyllabus}
														onChange={(value) => setFilterDropdown(prev => ({ ...prev, selectedSyllabus: value }))}
														style={{ width: '100%', height: '40px' }}
														placeholder={t('classManagement.selectSyllabus')}
														allowClear
														loading={syllabusLoading}
													>
														{syllabuses.map(syllabus => (
															<Option key={syllabus.id} value={syllabus.id}>
																{syllabus.syllabusName}
															</Option>
														))}
													</Select>
												</div>

												{/* Start Date Range Filter */}
												<div style={{ marginBottom: '20px' }}>
													<Typography.Title level={5} style={{ marginBottom: '12px', fontSize: '16px' }}>
														{t('classManagement.startDateRange')}
													</Typography.Title>
													<DatePicker.RangePicker
														value={filterDropdown.selectedStartDateRange ? [
															filterDropdown.selectedStartDateRange[0] ? dayjs(filterDropdown.selectedStartDateRange[0]) : null,
															filterDropdown.selectedStartDateRange[1] ? dayjs(filterDropdown.selectedStartDateRange[1]) : null
														] : null}
														onChange={(dates) => {
															if (dates && dates[0] && dates[1]) {
																setFilterDropdown(prev => ({
																	...prev,
																	selectedStartDateRange: [dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]
																}));
															} else {
																setFilterDropdown(prev => ({
																	...prev,
																	selectedStartDateRange: null
																}));
															}
														}}
														style={{ width: '100%', height: '40px' }}
														placeholder={[t('classManagement.startDateFrom'), t('classManagement.startDateTo')]}
													/>
												</div>

												{/* End Date Range Filter */}
												<div style={{ marginBottom: '20px' }}>
													<Typography.Title level={5} style={{ marginBottom: '12px', fontSize: '16px' }}>
														{t('classManagement.endDateRange')}
													</Typography.Title>
													<DatePicker.RangePicker
														value={filterDropdown.selectedEndDateRange ? [
															filterDropdown.selectedEndDateRange[0] ? dayjs(filterDropdown.selectedEndDateRange[0]) : null,
															filterDropdown.selectedEndDateRange[1] ? dayjs(filterDropdown.selectedEndDateRange[1]) : null
														] : null}
														onChange={(dates) => {
															if (dates && dates[0] && dates[1]) {
																setFilterDropdown(prev => ({
																	...prev,
																	selectedEndDateRange: [dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]
																}));
															} else {
																setFilterDropdown(prev => ({
																	...prev,
																	selectedEndDateRange: null
																}));
															}
														}}
														style={{ width: '100%', height: '40px' }}
														placeholder={[t('classManagement.endDateFrom'), t('classManagement.endDateTo')]}
													/>
												</div>

												{/* Action Buttons */}
												<div style={{ 
													display: 'flex', 
													justifyContent: 'space-between', 
													marginTop: '20px',
													paddingTop: '16px',
													borderTop: '1px solid #f0f0f0'
												}}>
													<Button
														onClick={handleFilterReset}
														className="filter-reset-button"
													>
														{t('common.reset')}
													</Button>
													<Button
														type="primary"
														onClick={handleFilterSubmit}
														className="filter-submit-button"
													>
														{t('common.viewResults')}
													</Button>
												</div>
											</div>
										</div>
									)}
								</div>
							</Space>
							<Space>
								<Button
									icon={<UploadOutlined />}
									onClick={handleExport}
									className="export-button"
								>
									{t('classManagement.exportData')}
									{selectedRowKeys.length > 0 && ` (${selectedRowKeys.length})`}
								</Button>
								<Button
									icon={<DownloadOutlined />}
									onClick={handleImport}
									className="import-button"
								>
									{t('classManagement.importClasses')}
								</Button>
								<Button
									icon={<PlusOutlined />}
									className={`create-button ${theme}-create-button`}
									onClick={handleAdd}>
									{t('classManagement.addClass')}
								</Button>
							</Space>
						</Space>
					</div>

					{/* Table Section */}
					<div className={`table-section ${theme}-table-section`}>
						<LoadingWithEffect
							loading={loading}>
							<Table
								columns={columns}
								dataSource={classes}
								rowKey="id"
								pagination={{
									...pagination,
									showTotal: (total, range) => {
										return `${range[0]}-${range[1]} of ${total} classes`;
									},
								}}
								onChange={handleTableChange}
								scroll={{ x: 1000 }}
							/>
						</LoadingWithEffect>
					</div>
				</div>

				{/* Class Modal */}
				<Modal
					title={
						editingClass
							? t('classManagement.editClass')
							: t('classManagement.addClass')
					}
					open={isModalVisible}
					onOk={handleModalOk}
					onCancel={handleModalCancel}
					width={600}
					okText={t('common.save')}
					cancelText={t('common.cancel')}
					destroyOnClose
					confirmLoading={isSubmitting}
					okButtonProps={{
						style: {
							backgroundColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
							background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
							borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'transparent',
							color: theme === 'sun' ? '#000000' : '#ffffff',
							height: '40px',
							fontSize: '16px',
							fontWeight: '500',
							minWidth: '100px',
						},
					}}
					cancelButtonProps={{
						style: {
							height: '40px',
							fontSize: '16px',
							fontWeight: '500',
							minWidth: '100px',
						},
					}}
					bodyStyle={{
						padding: '24px',
					}}
				>
					<Form
						form={form}
						layout="vertical"
					>
						<Form.Item
							label={
								<span>
									 {t('classManagement.className')}<span style={{ color: '#ff4d4f' }}> *</span>
								</span>
							}
							name="name"
							required
							rules={[
								{ required: true, message: 'Class name is required' },
								{ min: 3, message: 'Class name must be at least 3 characters' },
								{ max: 100, message: 'Class name must not exceed 100 characters' },
							]}
						>
							<Input 
								placeholder="Enter class name" 
								style={{
									fontSize: "15px",
									padding: "12px 16px",
									borderRadius: "10px",
									border: "2px solid #e2e8f0",
									transition: "all 0.3s ease",
									height: "40px",
								}}
							/>
						</Form.Item>

						<Form.Item
							label={
								!editingClass ? (
									<span>
										 {t('classManagement.syllabus')}<span style={{ color: '#ff4d4f' }}> *</span>
									</span>
								) : (
									t('classManagement.syllabus')
								)
							}
							name="syllabusId"
							required={!editingClass}
							rules={[
								{ required: !editingClass, message: 'Please select a syllabus for the class' },
							]}
						>
							<Select 
								placeholder="Select a syllabus"
								loading={syllabusLoading}
								disabled={editingClass}
								style={{
									fontSize: "15px",
									height: "40px",
								}}
							>
								{syllabuses.map(syllabus => (
									<Option key={syllabus.id} value={syllabus.id}>
										{syllabus.syllabusName}
									</Option>
								))}
							</Select>
						</Form.Item>

						{/* Start Date */}
						<Form.Item
							label={
								!editingClass ? (
									<span>
										 {t('classManagement.startDate')}<span style={{ color: '#ff4d4f' }}> *</span>
									</span>
								) : (
									t('classManagement.startDate')
								)
							}
							name="startDate"
							required={!editingClass}
							rules={[
								{ required: !editingClass, message: 'Please select start date' },
								{
									validator(_, value) {
										if (!value) {
											return Promise.resolve();
										}
										const today = dayjs().startOf('day');
										if (value.isBefore(today)) {
											return Promise.reject(new Error('Start date cannot be in the past'));
										}
										return Promise.resolve();
									},
								},
							]}
						>
							<DatePicker 
								placeholder="Select start date"
								style={{
									fontSize: "15px",
									width: "100%",
									height: "40px",
								}}
								format="YYYY-MM-DD"
								disabledDate={(current) => {
									// Disable dates before today
									return current && current < dayjs().startOf('day');
								}}
							/>
						</Form.Item>

						{/* End Date */}
						<Form.Item
							label={
								!editingClass ? (
									<span>
										 {t('classManagement.endDate')}<span style={{ color: '#ff4d4f' }}> *</span>
									</span>
								) : (
									t('classManagement.endDate')
								)
							}
							name="endDate"
							required={!editingClass}
							rules={[
								{ required: !editingClass, message: 'Please select end date' },
								({ getFieldValue }) => ({
									validator(_, value) {
										const startDate = getFieldValue('startDate');
										if (!value || !startDate) {
											return Promise.resolve();
										}
										if (value.isBefore(startDate)) {
											return Promise.reject(new Error('End date must be after start date'));
										}
										return Promise.resolve();
									},
								}),
							]}
						>
							<DatePicker 
								placeholder="Select end date"
								style={{
									fontSize: "15px",
									width: "100%",
									height: "40px",
								}}
								format="YYYY-MM-DD"
								disabledDate={(current) => {
									// Disable dates before today
									return current && current < dayjs().startOf('day');
								}}
							/>
						</Form.Item>
					</Form>
				</Modal>

				{/* Confirmation Modal */}
				<Modal
					title={
						<div style={{ 
							fontSize: '20px', 
							fontWeight: '600', 
							color: '#1890ff',
							textAlign: 'center',
							padding: '10px 0'
						}}>
							{confirmModal.title}
						</div>
					}
					open={confirmModal.visible}
					onOk={confirmModal.onConfirm}
					onCancel={() => setConfirmModal({ visible: false, title: '', content: '', onConfirm: null })}
					okText={t('common.confirm')}
					cancelText={t('common.cancel')}
					width={500}
					centered
					confirmLoading={actionLoading.delete !== null || actionLoading.toggle !== null}
					bodyStyle={{
						padding: '30px 40px',
						fontSize: '16px',
						lineHeight: '1.6',
						textAlign: 'center'
					}}
					okButtonProps={{
						style: {
							backgroundColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
							background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
							borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'transparent',
							color: theme === 'sun' ? '#000000' : '#ffffff',
							height: '40px',
							fontSize: '16px',
							fontWeight: '500',
							minWidth: '100px'
						}
					}}
					cancelButtonProps={{
						style: {
							height: '40px',
							fontSize: '16px',
							fontWeight: '500',
							minWidth: '100px'
						}
					}}
				>
					<div style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: '20px'
					}}>
						<div style={{
							fontSize: '48px',
							color: '#ff4d4f',
							marginBottom: '10px'
						}}>
							⚠️
						</div>
						<p style={{
							fontSize: '18px',
							color: '#333',
							margin: 0,
							fontWeight: '500'
						}}>
							{confirmModal.content}
						</p>
					</div>
				</Modal>

				{/* Import Modal */}
				<Modal
					title={
						<div
							style={{
								fontSize: '20px',
								fontWeight: '600',
								color: '#000000',
								textAlign: 'center',
								padding: '10px 0',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: '10px',
							}}>
							<DownloadOutlined style={{ color: '#000000' }} />
							{t('classManagement.importClasses')}
						</div>
					}
					open={importModal.visible}
					onOk={handleImportOk}
					onCancel={handleImportCancel}
					okText={t('classManagement.importClasses')}
					cancelText={t('common.cancel')}
					width={600}
					centered
					confirmLoading={importModal.uploading}
					okButtonProps={{
						disabled: importModal.fileList.length === 0,
						style: {
							backgroundColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
							background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
							borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'transparent',
							color: theme === 'sun' ? '#000000' : '#ffffff',
							height: '40px',
							fontSize: '16px',
							fontWeight: '500',
							minWidth: '120px',
						},
					}}
					cancelButtonProps={{
						style: {
							height: '40px',
							fontSize: '16px',
							fontWeight: '500',
							minWidth: '100px',
						},
					}}
				>
					<div style={{ padding: '20px 0' }}>
						<div style={{ textAlign: 'center', marginBottom: '20px' }}>
							<Button
								type="dashed"
								icon={<DownloadOutlined />}
								onClick={handleDownloadTemplate}
								style={{
									borderColor: '#1890ff',
									color: '#1890ff',
									height: '36px',
									fontSize: '14px',
									fontWeight: '500',
								}}>
								{t('classManagement.downloadTemplate')}
							</Button>
						</div>
						
						<Title
							level={5}
							style={{
								textAlign: 'center',
								marginBottom: '20px',
								color: '#666',
							}}>
							{t('classManagement.importInstructions')}
						</Title>

						<Upload.Dragger
							name="file"
							multiple={false}
							beforeUpload={() => false}
							showUploadList={false}
							accept=".xlsx,.xls,.csv"
							style={{
								marginBottom: '20px',
							border: '2px dashed #d9d9d9',
							borderRadius: '8px',
								background: '#fafafa',
								padding: '40px',
							textAlign: 'center',
						}}>
							<p
								className='ant-upload-drag-icon'
								style={{ fontSize: '48px', color: '#1890ff' }}>
								<DownloadOutlined />
							</p>
							<p
								className='ant-upload-text'
								style={{ fontSize: '16px', fontWeight: '500' }}>
								{t('classManagement.clickOrDragFile')}
							</p>
							<p className='ant-upload-hint' style={{ color: '#999' }}>
								{t('classManagement.supportedFormats')}
							</p>
						</Upload.Dragger>
					</div>
				</Modal>

				{/* Export Data Modal */}
				<Modal
					title={
						<div
							style={{
								fontSize: '24px',
								fontWeight: '600',
								color: theme === 'dark' ? '#ffffff' : '#000000',
								textAlign: 'center',
								padding: '10px 0',
							}}>
							{t('classManagement.exportData')}
						</div>
					}
					open={isExportModalVisible}
					onCancel={handleExportModalClose}
					width={500}
					footer={[
						<Button 
							key="cancel" 
							onClick={handleExportModalClose}
							style={{
								height: '32px',
								fontWeight: '500',
								fontSize: '14px',
								padding: '4px 15px',
								width: '100px'
							}}>
							{t('common.cancel')}
						</Button>
					]}>
					<div style={{ padding: '20px 0' }}>
						<div style={{ textAlign: 'center', marginBottom: '30px' }}>
							<UploadOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
							<Typography.Title level={4} style={{ color: theme === 'dark' ? '#cccccc' : '#666', marginBottom: '8px' }}>
								{t('classManagement.chooseExportOption')}
							</Typography.Title>
							<Typography.Text style={{ color: theme === 'dark' ? '#999999' : '#999' }}>
								{t('classManagement.exportDescription')}
							</Typography.Text>
						</div>

						<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
							{selectedRowKeys.length > 0 && (
								<Button
									type="primary"
									icon={<UploadOutlined />}
									onClick={handleExportSelected}
									style={{
										height: '48px',
										fontSize: '16px',
										fontWeight: '500',
										background: theme === 'sun' 
											? 'linear-gradient(135deg, #FFFFFF, #B6D8FE 77%, #94C2F5)'
											: 'linear-gradient(135deg, #FFFFFF 0%, #9F96B6 46%, #A79EBB 64%, #ACA5C0 75%, #6D5F8F 100%)',
										borderColor: theme === 'sun' ? '#B6D8FE' : '#9F96B6',
										color: '#000000',
										borderRadius: '8px',
									}}>
									{t('classManagement.exportSelected')} ({selectedRowKeys.length} {t('classManagement.classes')})
								</Button>
							)}

							<Button
								icon={<UploadOutlined />}
								onClick={handleExportAll}
								style={{
									height: '48px',
									fontSize: '16px',
									fontWeight: '500',
									background: theme === 'sun' 
										? 'linear-gradient(135deg, #FFFFFF, #B6D8FE 77%, #94C2F5)'
										: 'linear-gradient(135deg, #FFFFFF 0%, #9F96B6 46%, #A79EBB 64%, #ACA5C0 75%, #6D5F8F 100%)',
									borderColor: theme === 'sun' ? '#B6D8FE' : '#9F96B6',
									color: '#000000',
									borderRadius: '8px',
								}}>
								{t('classManagement.exportAll')} ({totalClasses} {t('classManagement.classes')})
							</Button>
						</div>
					</div>
				</Modal>

				{/* Bottom Action Bar */}
				<BottomActionBar
					selectedCount={selectedRowKeys.length}
					onSelectAll={handleSelectAll}
					onDeleteAll={handleDeleteAll}
					onClose={() => setSelectedRowKeys([])}
					selectAllText={t('classManagement.selectAll')}
					deleteAllText={t('classManagement.deleteAll')}
				additionalActions={[
					{
						key: 'activateAll',
						label: t('classManagement.activateAll'),
						onClick: handleActivateAll,
						type: 'text'
					},
					{
						key: 'deactivateAll',
						label: t('classManagement.deactivateAll'),
						onClick: handleDeactivateAll,
						type: 'text'
					}
				]}
				/>
			</ThemedLayout>
		</>
	);
};

export default ClassListTable;
