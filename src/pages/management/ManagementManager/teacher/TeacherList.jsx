import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Table, Button, Space, Modal, Input, Tooltip, Typography, Switch, Upload, Divider, Checkbox } from 'antd';
import {
	PlusOutlined,
	SearchOutlined,
	EyeOutlined,
	DownloadOutlined,
	UploadOutlined,
	FilterOutlined,
	DeleteOutlined,
	LoadingOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../../../../hooks/usePageTitle';
import TeacherForm from './TeacherForm';
import AssignTeacherToClass from './AssignTeacherToClass';
import './TeacherList.css';
import ThemedLayout from '../../../../component/ThemedLayout';
import LoadingWithEffect from '../../../../component/spinner/LoadingWithEffect';
import { useTheme } from '../../../../contexts/ThemeContext';
import { spaceToast } from '../../../../component/SpaceToastify';
import { teacherManagementApi } from '../../../../apis/apis';
import accountManagementApi from '../../../../apis/backend/accountManagement';
import StudentBottomActionBar from '../../../../component/StudentBottomActionBar';


const TeacherList = () => {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const navigate = useNavigate();
	
	// Set page title
	usePageTitle('Teacher Management');

	// State for teachers data
	const [teachers, setTeachers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [totalTeachers, setTotalTeachers] = useState(0);
	
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
	const [statusFilter, setStatusFilter] = useState([]);
	const [roleNameFilter, setRoleNameFilter] = useState([]);
	const [searchTimeout, setSearchTimeout] = useState(null);
	
	// Sort state - start with createdAt DESC (newest first)
	const [sortBy, setSortBy] = useState("createdAt");
	const [sortDir, setSortDir] = useState("desc");
	
	// Checkbox selection state
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);
	
	// Modal states
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
	const [isExportModalVisible, setIsExportModalVisible] = useState(false);
	const [confirmModal, setConfirmModal] = useState({
		visible: false,
		title: '',
		content: '',
		displayData: null,
		onConfirm: null,
		loading: false,
	});
	const [editingTeacher, setEditingTeacher] = useState(null);
	const [assigningTeacher, setAssigningTeacher] = useState(null);
	const [importModal, setImportModal] = useState({
		visible: false,
		fileList: [],
		uploading: false
	});
	
	// Filter dropdown state
	const [filterDropdown, setFilterDropdown] = useState({
		visible: false,
		selectedRoles: [],
		selectedStatuses: [],
	});
	const [exportLoading, setExportLoading] = useState(false);
	const [bulkLoading, setBulkLoading] = useState({
		active: false,
		deactive: false,
	});
	const [templateLoading, setTemplateLoading] = useState(false);
	const [fileValidationLoading, setFileValidationLoading] = useState(false);
	
	// Refs for click outside detection
	const filterContainerRef = useRef(null);

	// Fetch teachers from API
	const fetchTeachers = useCallback(async (page = 1, size = 10, search = '', statusFilter = [], roleNameFilter = [], sortField = 'createdAt', sortDirection = 'desc') => {
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

			// Thêm search text nếu có
			if (search && search.trim()) {
				params.text = search.trim();
			}

			// Thêm status filter nếu có
			if (statusFilter.length > 0) {
				params.status = statusFilter;
			}

			// Thêm roleName filter nếu có
			if (roleNameFilter.length > 0) {
				params.roleName = roleNameFilter;
			}

			console.log('Fetching teachers with params:', params);
			const response = await teacherManagementApi.getTeachers(params);
			
			if (response.success && response.data) {
				setTeachers(response.data);
				setTotalTeachers(response.totalElements || response.data.length);
				setPagination(prev => ({
					...prev,
					current: page,
					pageSize: size,
					total: response.totalElements || response.data.length,
				}));
			} else {
				setTeachers([]);
				setTotalTeachers(0);
				setPagination(prev => ({
					...prev,
					current: page,
					pageSize: size,
					total: 0,
				}));
			}
		} catch (error) {
			console.error('Error fetching teachers:', error);
			spaceToast.error(t('teacherManagement.loadTeachersError'));
			setTeachers([]);
			setTotalTeachers(0);
			setPagination(prev => ({
				...prev,
				current: page,
				pageSize: size,
				total: 0,
			}));
		} finally {
			setLoading(false);
		}
	}, [t]);

	useEffect(() => {
		fetchTeachers(1, 10, searchText, statusFilter, roleNameFilter, sortBy, sortDir);
	}, [fetchTeachers, searchText, statusFilter, roleNameFilter, sortBy, sortDir]);

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

	const handleAdd = () => {
		setEditingTeacher(null);
		setIsModalVisible(true);
	};


	const handleViewProfile = (teacher) => {
		navigate(`/manager/teachers/profile/${teacher.id}`);
	};

	const handleAssignToClass = (teacher) => {
		setAssigningTeacher(teacher);
		setIsAssignModalVisible(true);
	};

	// Handle navigate to class management
	const handleNavigateToClass = (classInfo) => {
		if (!classInfo || !classInfo.id) {
			spaceToast.warning('Class information not available');
			return;
		}
		
		console.log('Navigating to class:', classInfo);
		navigate(`/manager/classes/menu/${classInfo.id}`);
	};

	// Handle toggle teacher status (ACTIVE/INACTIVE)
	const handleToggleStatus = (teacherId) => {
		const teacher = teachers.find(t => t.id === teacherId);
		if (!teacher) return;

		const newStatus = teacher.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
		const teacherName = teacher.fullName || teacher.userName;
		
		setConfirmModal({
			visible: true,
			title: newStatus === 'ACTIVE' 
				? t('accountManagement.activate') + ' ' + t('common.teacher')
				: t('accountManagement.deactivate') + ' ' + t('common.teacher'),
			content: newStatus === 'ACTIVE' 
				? t('teacherManagement.confirmActivateTeacher')
				: t('teacherManagement.confirmDeactivateTeacher'),
			displayData: teacherName,
			onConfirm: async () => {
				try {
					// Call API to update teacher status
					const response = await teacherManagementApi.updateTeacherStatus(teacherId, newStatus);
					
					if (response.success) {
						// Close modal first
						setConfirmModal({ visible: false, title: '', content: '', displayData: null, onConfirm: null });
						
						// Show success toast
						spaceToast.success(newStatus === 'ACTIVE' 
							? t('teacherManagement.activateTeacherSuccess') 
							: t('teacherManagement.deactivateTeacherSuccess'));
						
						// Refresh the list
						fetchTeachers(pagination.current, pagination.pageSize, searchText, statusFilter, roleNameFilter, sortBy, sortDir);
					} else {
						throw new Error(response.message || 'Failed to update teacher status');
					}
				} catch (error) {
					console.error('Error updating teacher status:', error);
					setConfirmModal({ visible: false, title: '', content: '', displayData: null, onConfirm: null });
					spaceToast.error(error.response?.data?.error || error.message || t('teacherManagement.updateStatusError'));
				}
			}
		});
	};

	const handleConfirmCancel = () => {
		setConfirmModal({ visible: false, title: '', content: '', displayData: null, onConfirm: null });
	};

	// Handle delete for PENDING teachers (trash button)
	const handleDeletePending = (id) => {
		const teacher = teachers.find(t => t.id === id);
		if (!teacher || teacher.status !== 'PENDING') return;
		
		const teacherName = teacher.fullName || teacher.userName;
		
		setConfirmModal({
			visible: true,
			title: t('teacherManagement.deleteTeacher'),
			content: `${t('teacherManagement.confirmDeletePending')}? ${t('teacherManagement.deletePendingNote')}`,
			displayData: teacherName,
			onConfirm: async () => {
				try {
					// Call API to delete teacher
					const response = await accountManagementApi.deleteAccount(id);
					
					// Close modal first
					setConfirmModal({ visible: false, title: '', content: '', displayData: null, onConfirm: null });
					
					// Use backend message if available, otherwise fallback to translation
					const successMessage = response.message + ` "${teacherName}"`;
					spaceToast.success(successMessage);
					
					// Refresh the list to get updated data from server
					fetchTeachers(pagination.current, pagination.pageSize, searchText, statusFilter, roleNameFilter, sortBy, sortDir);
				} catch (error) {
					console.error('Error deleting PENDING teacher:', error);
					setConfirmModal({ visible: false, title: '', content: '', displayData: null, onConfirm: null });
					spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message );
				}
			}
		});
	};

	const handleModalClose = () => {
		setIsModalVisible(false);
		setEditingTeacher(null);
	};

	const handleAssignModalClose = () => {
		setIsAssignModalVisible(false);
		setAssigningTeacher(null);
	};

	// Handle search input change
	const handleSearch = (value) => {
		setSearchText(value);
		
		// Clear selected rows when searching
		setSelectedRowKeys([]);
		
		// Clear existing timeout
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
		
		// Set new timeout for debounced search
		const newTimeout = setTimeout(() => {
			// Reset to first page when searching
			setPagination(prev => ({
				...prev,
				current: 1,
			}));
			fetchTeachers(1, pagination.pageSize, value, statusFilter, roleNameFilter, sortBy, sortDir);
		}, 500);
		
		setSearchTimeout(newTimeout);
	};

	// Handle table change (pagination, sorting, filtering)
	const handleTableChange = (paginationInfo, filters, sorter) => {
		console.log('handleTableChange called:', { paginationInfo, filters, sorter });
		console.log('Current sortBy:', sortBy, 'Current sortDir:', sortDir);
		
		// Handle sorting
		if (sorter && sorter.field) {
			// Map frontend field names to backend field names
			const fieldMapping = {
				'fullName': 'fullName', // Map to fullName field
				'createdAt': 'createdAt'
			};
			
			const backendField = fieldMapping[sorter.field] || sorter.field;
			
			// Handle sorting direction - force toggle if same field
			let newSortDir;
			if (backendField === sortBy) {
				// Same field - toggle direction
				newSortDir = sortDir === 'asc' ? 'desc' : 'asc';
				console.log('Same field clicked, toggling from', sortDir, 'to', newSortDir);
			} else {
				// Different field - start with asc
				newSortDir = 'asc';
				console.log('Different field clicked, starting with asc');
			}

			console.log('Sorting:', {
				frontendField: sorter.field,
				backendField: backendField,
				direction: newSortDir,
				order: sorter.order
			});

			// Update state - useEffect will handle the API call
			setSortBy(backendField);
			setSortDir(newSortDir);
		}
		
		// Handle pagination changes
		if (paginationInfo) {
			console.log('Pagination change:', {
				current: paginationInfo.current,
				pageSize: paginationInfo.pageSize,
				total: paginationInfo.total
			});
			
			// Update pagination state
			setPagination(prev => ({
				...prev,
				current: paginationInfo.current,
				pageSize: paginationInfo.pageSize,
				total: paginationInfo.total || prev.total,
			}));
			
			// Fetch data for the new page
			fetchTeachers(
				paginationInfo.current, 
				paginationInfo.pageSize, 
				searchText, 
				statusFilter, 
				roleNameFilter, 
				sortBy, 
				sortDir
			);
		}
	};



	const handleImport = () => {
		setImportModal({ visible: true, fileList: [], uploading: false });
	};

	const handleImportCancel = () => {
		setImportModal({ visible: false, fileList: [], uploading: false });
	};

	const handleImportOk = async () => {
		if (importModal.fileList.length === 0) {
			spaceToast.warning(t('teacherManagement.selectFileToImport'));
			return;
		}

		setImportModal((prev) => ({ ...prev, uploading: true }));

		try {
			const file = importModal.fileList[0];
			
			// Create FormData object
			const formData = new FormData();
			formData.append('file', file);
			
			// Call import API with FormData
			const response = await teacherManagementApi.importTeachers(formData);

			if (response.success) {
				// Close modal first
				setImportModal({ visible: false, fileList: [], uploading: false });
				
				// Use backend message if available, otherwise fallback to translation
				const successMessage = response.message || t('teacherManagement.importSuccess');
				spaceToast.success(successMessage);
				
				// Refresh the list to get updated data from server
				fetchTeachers(pagination.current, pagination.pageSize, searchText, statusFilter, roleNameFilter, sortBy, sortDir);
			} else {
				throw new Error(response.message || 'Import failed');
			}
		} catch (error) {
			console.error('Error importing teachers:', error);
			spaceToast.error(error.response?.data?.error || error.message || t('teacherManagement.importError'));
			setImportModal((prev) => ({ ...prev, uploading: false }));
		}
	};

	// Handle file selection
	const handleFileSelect = (file) => {
		setFileValidationLoading(true);
		
		// Simulate validation delay to show loading state
		setTimeout(() => {
			// Validate file type
			const allowedTypes = [
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
				'application/vnd.ms-excel', // .xls
				'text/csv' // .csv
			];
			
			if (!allowedTypes.includes(file.type)) {
				spaceToast.error('Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file');
				setFileValidationLoading(false);
				return false;
			}
			
			// Validate file size (max 10MB)
			const maxSize = 10 * 1024 * 1024; // 10MB
			if (file.size > maxSize) {
				spaceToast.error('File size must be less than 10MB');
				setFileValidationLoading(false);
				return false;
			}
			
			setImportModal(prev => ({
				...prev,
				fileList: [file]
			}));
			
			setFileValidationLoading(false);
		}, 500); // Small delay to show loading state
		
		return false; // Prevent default upload behavior
	};

	const handleDownloadTemplate = async () => {
		setTemplateLoading(true);
		try {
			
			const response = await teacherManagementApi.downloadTeacherTemplate();
			
			// API returns SAS URL directly (due to axios interceptor returning response.data)
			let downloadUrl;
			if (typeof response === 'string') {
				downloadUrl = response;
			} else if (response && typeof response.data === 'string') {
				downloadUrl = response.data;
			} else if (response && response.data && response.data.url) {
				downloadUrl = response.data.url;
			} else {
				console.error('Unexpected response format:', response);
				throw new Error('No download URL received from server');
			}
			
			// Create download link directly from SAS URL
			const link = document.createElement('a');
			link.setAttribute('href', downloadUrl);
			link.setAttribute('download', 'teacher_import_template.xlsx');
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			
			// Track download start time
			const downloadStartTime = Date.now();
			
			// Monitor for download completion by checking if file appears in downloads
			const checkDownloadProgress = () => {
				// Check if download has started by monitoring network activity or file system
				// For now, we'll use a shorter timeout since the file should download quickly
				const elapsed = Date.now() - downloadStartTime;
				
				if (elapsed > 2000) { // 2 seconds should be enough for most files
					setTemplateLoading(false);
					spaceToast.success('Template downloaded successfully');
					document.body.removeChild(link);
					return;
				}
				
				// Continue checking
				setTimeout(checkDownloadProgress, 500);
			};
			
			// Start download
			link.click();
			
			// Start monitoring download progress
			setTimeout(checkDownloadProgress, 500);
			
			// Fallback: if still loading after 15 seconds, assume download completed
			setTimeout(() => {
				if (templateLoading) {
					setTemplateLoading(false);
					spaceToast.success('Template download completed');
					document.body.removeChild(link);
				}
			}, 15000);
			
		} catch (error) {
			console.error('Error downloading template:', error);
			spaceToast.error(error.response?.data?.error || error.message || 'Failed to download template');
			setTemplateLoading(false);
		}
	};

	// Handle filter dropdown toggle
	const handleFilterToggle = () => {
		setFilterDropdown(prev => ({
			...prev,
			visible: !prev.visible,
			selectedRoles: prev.visible ? prev.selectedRoles : [...roleNameFilter],
			selectedStatuses: prev.visible ? prev.selectedStatuses : [...statusFilter],
		}));
	};

	// Handle filter submission
	const handleFilterSubmit = () => {
		setRoleNameFilter(filterDropdown.selectedRoles);
		setStatusFilter(filterDropdown.selectedStatuses);
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
		fetchTeachers(1, pagination.pageSize, searchText, filterDropdown.selectedStatuses, filterDropdown.selectedRoles, sortBy, sortDir);
	};

	// Handle filter reset
	const handleFilterReset = () => {
		setFilterDropdown(prev => ({
			...prev,
			selectedRoles: [],
			selectedStatuses: [],
		}));
	};

	// Status options for filter
	const statusOptions = [
		{ key: "ACTIVE", label: t('teacherManagement.active') },
		{ key: "INACTIVE", label: t('teacherManagement.inactive') },
		{ key: "PENDING", label: t('teacherManagement.pending') },
	];

	// Role options for filter
	const roleOptions = [
		{ key: "TEACHER", label: t('teacherManagement.teacher') },
		{ key: "TEACHING_ASSISTANT", label: t('teacherManagement.teacherAssistant') },
	];

	// Calculate checkbox states with useMemo
	const checkboxStates = useMemo(() => {
		// Filter out PENDING records from current page
		const nonPendingTeachers = teachers.filter(teacher => teacher.status !== 'PENDING');
		const currentPageKeys = nonPendingTeachers.map(teacher => teacher.id);
		const selectedCount = selectedRowKeys.length;
		
		// Check if all non-PENDING items on current page are selected
		const allCurrentPageSelected = currentPageKeys.length > 0 && 
			currentPageKeys.every(key => selectedRowKeys.includes(key));
		
		// For table header checkbox: only check if all non-PENDING current page items are selected
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
			nonPendingTeachers: nonPendingTeachers.length,
		});
		
		return { isSelectAll, isIndeterminate, totalItems: currentPageKeys.length, selectedCount };
	}, [selectedRowKeys, teachers]);

	// Handle table header checkbox (only current page)
	const handleSelectAllCurrentPage = (checked) => {
		// Filter out PENDING records from current page
		const nonPendingTeachers = teachers.filter(teacher => teacher.status !== 'PENDING');
		const currentPageKeys = nonPendingTeachers.map(teacher => teacher.id);
		
		if (checked) {
			// Add all non-PENDING current page items to selection
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
				// Fetch all teacher IDs from API (without pagination)
				const params = {
					page: 0,
					size: totalTeachers, // Get all items
				};
				
				// Add search parameter if provided
				if (searchText && searchText.trim()) {
					params.text = searchText.trim();
				}

				// Add status filter if provided
				if (statusFilter.length > 0) {
					params.status = statusFilter;
				}

				// Add roleName filter if provided
				if (roleNameFilter.length > 0) {
					params.roleName = roleNameFilter;
				}

				// Add sort parameters
				if (sortBy && sortDir) {
					params.sortBy = sortBy;
					params.sortDir = sortDir;
				}

				const response = await teacherManagementApi.getTeachers(params);
				
				if (response.success && response.data) {
					// Get all IDs from the response, excluding PENDING records
					const allIds = response.data
						.filter(teacher => teacher.status !== 'PENDING')
						.map(teacher => teacher.id);
					setSelectedRowKeys(allIds);
				}
			} catch (error) {
				console.error('Error fetching all teachers for selection:', error);
				spaceToast.error(t('teacherManagement.loadTeachersError'));
			}
		} else {
			setSelectedRowKeys([]);
		}
	};

	const handleSelectRow = (record, checked) => {
		// Don't allow selection of PENDING records
		if (record.status === 'PENDING') {
			return;
		}
		
		if (checked) {
			setSelectedRowKeys(prev => [...prev, record.id]);
		} else {
			setSelectedRowKeys(prev => prev.filter(key => key !== record.id));
		}
	};

	// Bulk actions
	const handleBulkActive = () => {
		if (selectedRowKeys.length === 0) {
			spaceToast.warning(t('teacherManagement.selectItemsToActiveDeactive'));
			return;
		}
		
		// Get all selected teachers from all pages, not just current page
		// We need to fetch all teachers to find the selected ones
		const confirmContent = t('teacherManagement.confirmBulkActivate');
		const displayData = `${selectedRowKeys.length} ${t('teacherManagement.teachers')}`;
		
		setConfirmModal({
			visible: true,
			title: `${t('teacherManagement.activeAll')} ${t('teacherManagement.teachers')}`,
			content: confirmContent,
			displayData: displayData,
			onConfirm: async () => {
				setBulkLoading(prev => ({ ...prev, active: true }));
				setConfirmModal(prev => ({ ...prev, loading: true }));
				try {
					// Call bulk API to update status for multiple teachers at once
					// Use all selectedRowKeys directly since they are already filtered for non-PENDING
					const response = await teacherManagementApi.bulkUpdateTeacherStatus(selectedRowKeys, 'ACTIVE');
					
					if (response.success) {
						// Close modal first
						setConfirmModal({ visible: false, title: '', content: '', displayData: null, onConfirm: null, loading: false });
						
						// Clear selection
						setSelectedRowKeys([]);
						
						// Show success toast
						spaceToast.success(`${t('teacherManagement.bulkUpdateSuccess')} ${selectedRowKeys.length} ${t('teacherManagement.teachers')}`);
						
						// Refresh the list
						fetchTeachers(pagination.current, pagination.pageSize, searchText, statusFilter, roleNameFilter, sortBy, sortDir);
					} else {
						throw new Error(response.message || 'No teachers were updated');
					}
				} catch (error) {
					console.error('Error in bulk update:', error);
					setConfirmModal({ visible: false, title: '', content: '', displayData: null, onConfirm: null, loading: false });
					spaceToast.error(error.response?.data?.error || error.message || t('teacherManagement.bulkUpdateError'));
				} finally {
					setBulkLoading(prev => ({ ...prev, active: false }));
				}
			}
		});
	};

	const handleBulkDeactive = () => {
		if (selectedRowKeys.length === 0) {
			spaceToast.warning(t('teacherManagement.selectItemsToActiveDeactive'));
			return;
		}
		
		// Get all selected teachers from all pages, not just current page
		const confirmContent = t('teacherManagement.confirmBulkDeactivate');
		const displayData = `${selectedRowKeys.length} ${t('teacherManagement.teachers')}`;
		
		setConfirmModal({
			visible: true,
			title: `${t('teacherManagement.deactiveAll')} ${t('teacherManagement.teachers')}`,
			content: confirmContent,
			displayData: displayData,
			onConfirm: async () => {
				setBulkLoading(prev => ({ ...prev, deactive: true }));
				setConfirmModal(prev => ({ ...prev, loading: true }));
				try {
					// Call bulk API to update status for multiple teachers at once
					// Use all selectedRowKeys directly since they are already filtered for non-PENDING
					const response = await teacherManagementApi.bulkUpdateTeacherStatus(selectedRowKeys, 'INACTIVE');
					
					if (response.success) {
						// Close modal first
						setConfirmModal({ visible: false, title: '', content: '', displayData: null, onConfirm: null, loading: false });
						
						// Clear selection
						setSelectedRowKeys([]);
						
						// Show success toast
						spaceToast.success(`${t('teacherManagement.bulkUpdateSuccess')} ${selectedRowKeys.length} ${t('teacherManagement.teachers')}`);
						
						// Refresh the list
						fetchTeachers(pagination.current, pagination.pageSize, searchText, statusFilter, roleNameFilter, sortBy, sortDir);
					} else {
						throw new Error(response.message || 'No teachers were updated');
					}
				} catch (error) {
					console.error('Error in bulk update:', error);
					setConfirmModal({ visible: false, title: '', content: '', displayData: null, onConfirm: null, loading: false });
					spaceToast.error(error.response?.data?.error || error.message || t('teacherManagement.bulkUpdateError'));
				} finally {
					setBulkLoading(prev => ({ ...prev, deactive: false }));
				}
			}
		});
	};

	const handleExportTeachers = () => {
		setIsExportModalVisible(true);
	};

	const handleExportModalClose = () => {
		setIsExportModalVisible(false);
	};


	const handleExportAll = async () => {
		setExportLoading(true);
		
		try {
			// Prepare export parameters with current page filters
			const exportParams = {
				text: searchText || undefined,
				status: statusFilter.length > 0 ? statusFilter : undefined,
				roleName: roleNameFilter.length > 0 ? roleNameFilter : undefined,
			};

			console.log('Exporting all teachers with current filters:', exportParams);
			
			const response = await teacherManagementApi.exportTeachers(exportParams);
			
			// Create blob URL and trigger download
			const blob = new Blob([response.data], { 
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
			});
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `all_teachers_export_${new Date().toISOString().split('T')[0]}.xlsx`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
			
			spaceToast.success('Export file successfully');
			setIsExportModalVisible(false);
		} catch (error) {
			console.error('Error exporting all teachers:', error);
			spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message || t('teacherManagement.exportError'));
		} finally {
			setExportLoading(false);
		}
	};

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
					disabled={record.status === 'PENDING'}
					style={{
						transform: 'scale(1.2)'
					}}
				/>
			),
		},
		{
			title: t('teacherManagement.stt'),
			key: "stt",
			width: 50,
			render: (_, __, index) => {
				// Calculate index based on current page and page size
				const currentPage = pagination.current || 1;
				const pageSize = pagination.pageSize || 10;
				return (
					<span className="stt-text">
						{(currentPage - 1) * pageSize + index + 1}
					</span>
				);
			},
		},
		{
			title: t('teacherManagement.fullName'),
			dataIndex: "fullName",
			key: "fullName",
			width: 120,
			sorter: true,
			sortDirections: ['ascend', 'descend'],
			ellipsis: true,
			render: (fullName) => (
				<span className="fullname-text">
					{fullName || '-'}
				</span>
			),
		},
		{
			title: t('teacherManagement.role'),
			dataIndex: "roleName",
			key: "roleName",
			width: 100,
			ellipsis: true,
			render: (roleName) => (
				<span className="role-text">
					{roleName === 'TEACHER'
						? t('common.teacher')
						: t('common.teachingAssistant')}
				</span>
			),
		},
		{
			title: t('teacherManagement.classes'),
			dataIndex: "classList",
			key: "classList",
			width: 120,
			ellipsis: true,
			render: (classList, record) => {
				if (classList && classList.length > 0) {
					// Show class names if teacher has classes
					return (
						<div className="classes-text">
							{classList.map((cls, index) => {
								const className = cls.name || cls.className || `Class ${index + 1}`;
								return (
									<span 
										key={cls.id || index} 
										className="clickable-class-name"
										onClick={() => handleNavigateToClass(cls)}
										style={{ 
											display: 'block', 
											marginBottom: '2px',
											cursor: 'pointer',
											textDecoration: 'none',
											transition: 'all 0.2s ease',
											padding: '2px 4px',
											borderRadius: '4px',
										}}
										title={`Click to view class: ${className}`}
										onMouseEnter={(e) => {
											e.target.style.color = '#40a9ff';
											e.target.style.transform = 'translateY(-1px)';
										}}
										onMouseLeave={(e) => {
											e.target.style.color = '#000000';
											e.target.style.transform = 'translateY(0)';
											e.target.style.boxShadow = 'none';
										}}
									>
										{className}
									</span>
								);
							})}
						</div>
					);
				} else if (record.status === 'ACTIVE') {
					// Show assign button if teacher is active but has no classes
					return (
						<Button
							type="primary"
							size="small"
							icon={<PlusOutlined />}
							onClick={() => handleAssignToClass(record)}
							className={`assign-class-button ${theme}-assign-class-button`}
							style={{
								fontSize: '12px',
								height: '28px',
								padding: '0 8px',
								backgroundColor: '#52c41a',
								borderColor: '#52c41a',
								borderRadius: '4px'
							}}
						>
							{t('teacherManagement.assignToClass')}
						</Button>
					);
				} else {
					// Show dash for inactive teachers
					return (
						<span className="classes-text">
							-
						</span>
					);
				}
			},
		},
		{
			title: t('teacherManagement.status'),
			dataIndex: "status",
			key: "status",
			width: 80,
			align: 'center',
			render: (status, record) => {
				if (status === 'PENDING') {
					return <span style={{ color: '#000' }}>{t('teacherManagement.pending')}</span>;
				}
				
				return (
					<Switch
						checked={status === 'ACTIVE'}
						onChange={() => handleToggleStatus(record.id)}
						size="large"
						style={{
							transform: 'scale(1.2)',
						}}
					/>
				);
			},
		},
		{
			title: t('teacherManagement.actions'),
			key: "actions",
			width: 80,
			render: (_, record) => (
				<Space size='small'>
					<Tooltip title={t('teacherManagement.viewProfile')}>
						<Button
							type='text'
							icon={<EyeOutlined style={{ fontSize: '25px' }} />}
							size='small'
							onClick={() => handleViewProfile(record)}
							style={{
								color: '#1890ff',
								padding: '8px 12px'
							}}
						/>
					</Tooltip>
					{record.status === 'PENDING' && (
						<Tooltip title={t('teacherManagement.deleteTeacher')}>
							<Button
								type="text"
								icon={<DeleteOutlined style={{ fontSize: '25px', color: '#ff4d4f' }} />}
								size="small"
								onClick={() => handleDeletePending(record.id)}
								danger
								style={{ 
									padding: '8px 12px'
								}}
							/>
						</Tooltip>
					)}
				</Space>
			),
		},
	];

	return (
		<>
			<ThemedLayout>
				{/* Main Content Panel */}
				<div className={`teacher-page main-content-panel ${theme}-main-panel`}>
				{/* Page Title */}
				<div className="page-title-container">
					<Typography.Title 
						level={1} 
						className="page-title"
					>
						{t('teacherManagement.title')} <span className="student-count">({totalTeachers})</span>
					</Typography.Title>
				</div>
				{/* Header Section */}
				<div className={`panel-header ${theme}-panel-header`}>
					<div className='search-section' style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
						<Input
							prefix={<SearchOutlined />}
							value={searchText}
							onChange={(e) => handleSearch(e.target.value)}
							className={`search-input ${theme}-search-input`}
							style={{ flex: '1', minWidth: '200px', maxWidth: '300px', width: '250px', height: '40px', fontSize: '16px' }}
							allowClear
						/>
						<div ref={filterContainerRef} style={{ position: 'relative' }}>
							<Button 
								icon={<FilterOutlined />}
								onClick={handleFilterToggle}
								className={`filter-button ${theme}-filter-button ${filterDropdown.visible ? 'active' : ''} ${(statusFilter.length > 0 || roleNameFilter.length > 0) ? 'has-filters' : ''}`}
							>
								{t('common.filter')}
							</Button>
							
							{/* Filter Dropdown Panel */}
							{filterDropdown.visible && (
								<div className={`filter-dropdown-panel ${theme}-filter-dropdown`}>
									<div style={{ padding: '20px' }}>
										{/* Role and Status Filters in same row */}
										<div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
											{/* Role Filter */}
											<div style={{ flex: 1 }}>
												<Typography.Title level={5} style={{ marginBottom: '12px', fontSize: '16px' }}>
													Role
												</Typography.Title>
												<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
													{roleOptions.map(option => (
														<Button
															key={option.key}
															onClick={() => {
																const newRoles = filterDropdown.selectedRoles.includes(option.key)
																	? filterDropdown.selectedRoles.filter(role => role !== option.key)
																	: [...filterDropdown.selectedRoles, option.key];
																setFilterDropdown(prev => ({ ...prev, selectedRoles: newRoles }));
															}}
															className={`filter-option ${filterDropdown.selectedRoles.includes(option.key) ? 'selected' : ''}`}
														>
															{option.label}
														</Button>
													))}
												</div>
											</div>

											{/* Status Filter */}
											<div style={{ flex: 1 }}>
												<Typography.Title level={5} style={{ marginBottom: '12px', fontSize: '16px' }}>
													Status
												</Typography.Title>
												<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
													{statusOptions.map(option => (
														<Button
															key={option.key}
															onClick={() => {
																const newStatuses = filterDropdown.selectedStatuses.includes(option.key)
																	? filterDropdown.selectedStatuses.filter(status => status !== option.key)
																	: [...filterDropdown.selectedStatuses, option.key];
																setFilterDropdown(prev => ({ ...prev, selectedStatuses: newStatuses }));
															}}
															className={`filter-option ${filterDropdown.selectedStatuses.includes(option.key) ? 'selected' : ''}`}
														>
															{option.label}
														</Button>
													))}
												</div>
											</div>
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
					</div>
					<div className='action-buttons'>
						<Button
							icon={<UploadOutlined />}
							className={`export-button ${theme}-export-button`}
							onClick={handleExportTeachers}
							loading={exportLoading}
							disabled={exportLoading}>
							{t('teacherManagement.exportData')}
						</Button>
						<Button
							icon={<DownloadOutlined />}
							className={`import-button ${theme}-import-button`}
							onClick={handleImport}>
							{t('teacherManagement.importTeachers')}
						</Button>
						<Button
							icon={<PlusOutlined />}
							className={`create-button ${theme}-create-button`}
							onClick={handleAdd}>
							{t('teacherManagement.addTeacher')}
						</Button>
					</div>
				</div>


				{/* Table Section */}
				<div className={`table-section ${theme}-table-section`}>
					<LoadingWithEffect
						loading={loading}>
						<Table
							columns={columns}
							dataSource={teachers}
							rowKey="id"
							pagination={{
								...pagination,
								className: `${theme}-pagination`,
								pageSizeOptions: ['5', '10', '20', '50', '100'],
							}}
							onChange={handleTableChange}
							className={`teacher-table ${theme}-teacher-table`}
							showSorterTooltip={false}
							sortDirections={['ascend', 'descend']}
							defaultSortOrder={
								sortBy === 'fullName' ? (sortDir === 'asc' ? 'ascend' : 'descend') :
								null
							}
						/>
					</LoadingWithEffect>
				</div>
			</div>

			{/* Add/Edit Teacher Modal */}
			<Modal
				title={
					editingTeacher
						? t('teacherManagement.editTeacher')
						: t('teacherManagement.addTeacher')
				}
				open={isModalVisible}
				onCancel={handleModalClose}
				footer={null}
				width={800}
				destroyOnClose
				style={{ top: 20 }}
				bodyStyle={{
					maxHeight: '70vh',
					overflowY: 'auto',
					padding: '24px',
				}}>
				<TeacherForm 
					teacher={editingTeacher} 
					onClose={handleModalClose}
					onSuccess={(teacherData) => {
						// Navigate to teacher profile if teacher ID is available and it's a new teacher
						if (teacherData && teacherData.id) {
							console.log('Navigating to teacher profile:', teacherData.id);
							navigate(`/manager/teachers/profile/${teacherData.id}`);
						} else {
							// Refresh the teacher list after successful creation/update
							fetchTeachers(pagination.current, pagination.pageSize, searchText, statusFilter, roleNameFilter, sortBy, sortDir);
						}
					}}
				/>
			</Modal>

			{/* Assign Teacher to Class Modal */}
			<Modal
				title={t('teacherManagement.assignTeacherToClass')}
				open={isAssignModalVisible}
				onCancel={handleAssignModalClose}
				footer={null}
				width={1000}
				destroyOnClose
				style={{ top: 20 }}
				bodyStyle={{
					maxHeight: '70vh',
					overflowY: 'auto',
					padding: '24px',
				}}>
				<AssignTeacherToClass
					teacher={assigningTeacher}
					onClose={handleAssignModalClose}
					onSuccess={() => {
						// Refresh teacher list to show updated class assignments
						fetchTeachers(pagination.current, pagination.pageSize, searchText, statusFilter, roleNameFilter, sortBy, sortDir);
					}}
				/>
			</Modal>

			{/* Status Change Confirmation Modal */}
			<Modal
				title={
					<div style={{ 
						fontSize: '28px', 
						fontWeight: '600', 
						color: 'rgb(24, 144, 255)',
						textAlign: 'center',
						padding: '10px 0'
					}}>
						{confirmModal.title}
					</div>
				}
				open={confirmModal.visible}
				onOk={confirmModal.onConfirm}
				onCancel={handleConfirmCancel}
				confirmLoading={confirmModal.loading}
				okText={t('common.confirm')}
				cancelText={t('common.cancel')}
				width={500}
				centered
				bodyStyle={{
					padding: '30px 40px',
					fontSize: '16px',
					lineHeight: '1.6',
					textAlign: 'center'
				}}
				okButtonProps={{
					style: {
						background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
						borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
						color: theme === 'sun' ? '#000' : '#fff',
						borderRadius: '6px',
						height: '32px',
						fontWeight: '500',
						fontSize: '16px',
						padding: '4px 15px',
						width: '100px',
						transition: 'all 0.3s ease',
						boxShadow: 'none'
					}
				}}
				cancelButtonProps={{
					style: {
						height: '32px',
						fontWeight: '500',
						fontSize: '16px',
						padding: '4px 15px',
						width: '100px'
					}
				}}>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: '20px',
					}}>
					<div
						style={{
							fontSize: '48px',
							color: '#ff4d4f',
							marginBottom: '10px'
						}}>
						⚠️
					</div>
					<p
						style={{
							fontSize: '18px',
							color: '#333',
							margin: 0,
							fontWeight: '500'
						}}>
						{confirmModal.content}
					</p>
					{confirmModal.displayData && (
						<p
							style={{
								fontSize: '20px',
								color: '#000',
								margin: 0,
								fontWeight: '400'
							}}>
							<strong>{confirmModal.displayData}</strong>
						</p>
					)}
				</div>
			</Modal>
			{/* Import Modal */}
			<Modal
				title={
					<div
						style={{
							fontSize: '28px',
							fontWeight: '600',
							color: 'rgb(24, 144, 255)',
							textAlign: 'center',
							padding: '10px 0',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '10px',
						}}>
						<DownloadOutlined style={{ color: 'rgb(24, 144, 255)' }} />
						{t('teacherManagement.importTeachers')}
					</div>
				}
				open={importModal.visible}
				onOk={handleImportOk}
				onCancel={handleImportCancel}
				okText={t('teacherManagement.import')}
				cancelText={t('common.cancel')}
				width={600}
				centered
				confirmLoading={importModal.uploading}
				okButtonProps={{
					disabled: importModal.fileList.length === 0,
					style: {
						background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
						borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
						color: theme === 'sun' ? '#000' : '#fff',
						borderRadius: '6px',
						height: '32px',
						fontWeight: '500',
						fontSize: '16px',
						padding: '4px 15px',
						width: '100px',
						transition: 'all 0.3s ease',
						boxShadow: 'none'
					},
				}}
				cancelButtonProps={{
					style: {
						height: '32px',
						fontWeight: '500',
						fontSize: '16px',
						padding: '4px 15px',
						width: '100px'
					},
				}}>
				<div style={{ padding: '20px 0' }}>
					<div style={{ textAlign: 'center', marginBottom: '20px' }}>
						<Button
							type="dashed"
							icon={<DownloadOutlined />}
							onClick={handleDownloadTemplate}
							loading={templateLoading}
							disabled={templateLoading}
							style={{
								borderColor: '#1890ff',
								color: '#1890ff',
								height: '36px',
								fontSize: '14px',
								fontWeight: '500',
							}}>
							{t('teacherManagement.downloadTemplate')}
						</Button>
					</div>

					<Typography.Title
						level={5}
						style={{
							textAlign: 'center',
							marginBottom: '20px',
							color: '#666',
						}}>
						{t('teacherManagement.importInstructions')}
					</Typography.Title>

					<Upload.Dragger
						name="file"
						multiple={false}
						beforeUpload={handleFileSelect}
						showUploadList={false}
						accept=".xlsx,.xls,.csv"
						disabled={fileValidationLoading}
						style={{
							marginBottom: '20px',
							border: '2px dashed #d9d9d9',
							borderRadius: '8px',
							background: fileValidationLoading ? '#f0f0f0' : '#fafafa',
							padding: '40px',
							textAlign: 'center',
							opacity: fileValidationLoading ? 0.6 : 1,
						}}>
						<p
							className='ant-upload-drag-icon'
							style={{ fontSize: '48px', color: '#1890ff' }}>
							{fileValidationLoading ? <LoadingOutlined /> : <DownloadOutlined />}
						</p>
						<p
							className='ant-upload-text'
							style={{ fontSize: '16px', fontWeight: '500' }}>
							{fileValidationLoading ? 'Validating file...' : t('teacherManagement.clickOrDragFile')}
						</p>
						<p className='ant-upload-hint' style={{ color: '#999' }}>
							{t('teacherManagement.supportedFormats')}: Excel (.xlsx, .xls),
						</p>
					</Upload.Dragger>

					<Divider />

					{importModal.fileList.length > 0 && (
						<div
							style={{
								marginTop: '16px',
								padding: '12px',
								background: '#e6f7ff',
								border: '1px solid #91d5ff',
								borderRadius: '6px',
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}>
							<div>
								<Typography.Text style={{ color: '#1890ff', fontWeight: '500' }}>
									✅ {t('teacherManagement.fileSelected')}:{' '}
									{importModal.fileList[0].name}
								</Typography.Text>
								<br />
								<Typography.Text style={{ color: '#666', fontSize: '12px' }}>
									Size: {importModal.fileList[0].size < 1024 * 1024 
										? `${(importModal.fileList[0].size / 1024).toFixed(1)} KB`
										: `${(importModal.fileList[0].size / 1024 / 1024).toFixed(2)} MB`
									}
								</Typography.Text>
							</div>
							<Button
								type="text"
								size="small"
								onClick={() => setImportModal(prev => ({ ...prev, fileList: [] }))}
								style={{ color: '#ff4d4f' }}>
								Remove
							</Button>
						</div>
					)}
				</div>
			</Modal>

			{/* Export Data Modal */}
			<Modal
				title={
					<div
						style={{
							fontSize: '28px',
							fontWeight: '600',
							color: 'rgb(24, 144, 255)',
							textAlign: 'center',
							padding: '10px 0',
						}}>
						{t('teacherManagement.exportData')}
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
							fontSize: '16px',
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
							{t('teacherManagement.chooseExportOption')}
						</Typography.Title>
						<Typography.Text style={{ color: theme === 'dark' ? '#999999' : '#999' }}>
							{t('teacherManagement.exportDescription')}
						</Typography.Text>
					</div>

					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						<Button
							type="primary"
							icon={<UploadOutlined />}
							onClick={handleExportAll}
							loading={exportLoading}
							disabled={exportLoading}
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
							{t('teacherManagement.exportAll')} ({totalTeachers} {t('teacherManagement.teachers')})
						</Button>
					</div>
				</div>
			</Modal>
			</ThemedLayout>
			
			{/* Bottom Action Bar - Fixed at bottom of viewport */}
			<StudentBottomActionBar
				selectedCount={selectedRowKeys.length}
				onSelectAll={handleSelectAll}
				onActiveAll={handleBulkActive}
				onDeactiveAll={handleBulkDeactive}
				onClose={() => setSelectedRowKeys([])}
				selectAllText={t('classManagement.selectAll')}
				activeAllText={t('teacherManagement.activeAll')}
				deactiveAllText={t('teacherManagement.deactiveAll')}
				loadingActive={bulkLoading.active}
				loadingDeactive={bulkLoading.deactive}
			/>
		</>
	);
};

export default TeacherList;
