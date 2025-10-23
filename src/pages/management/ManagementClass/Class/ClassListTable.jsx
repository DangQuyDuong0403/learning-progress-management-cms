import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Table, Button, Space, Modal, Input, Tooltip, Typography, Form, Select, Checkbox, DatePicker, Avatar, Radio, Upload } from 'antd';
import {
	PlusOutlined,
	SearchOutlined,
	EyeOutlined,
	EditOutlined,
	DeleteOutlined,
	FilterOutlined,
	UserOutlined,
	SwapOutlined,
	UploadOutlined,
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

const { Option } = Select;

const ClassListTable = () => {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const navigate = useNavigate();
	const { enterClassMenu, exitClassMenu } = useClassMenu();
	
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
	
	// Filter states - removed old individual states, using appliedFilters instead
	
	// Sort state - start with createdAt DESC (newest first)
	const [sortBy, setSortBy] = useState("createdAt");
	const [sortDir, setSortDir] = useState("desc");
	
	// Modal states
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [confirmModal, setConfirmModal] = useState({
		visible: false,
		title: '',
		content: '',
		onConfirm: null,
		type: '' // 'delete', 'status', 'bulkDelete', 'bulkDeactivate'
	});
	const [selectedStatus, setSelectedStatus] = useState(null);
	const [currentRecord, setCurrentRecord] = useState(null); // Store current class being edited
	const [editingClass, setEditingClass] = useState(null);
	const [form] = Form.useForm();
	
	// Image upload states
	const [imageFile, setImageFile] = useState(null);
	const [imagePreview, setImagePreview] = useState(null);
	const [selectedAvatarType, setSelectedAvatarType] = useState('system'); // 'system' or 'upload'
	const [systemAvatars] = useState([
		'/img/student_avatar/avatar1.png',
		'/img/student_avatar/avatar2.png',
		'/img/student_avatar/avatar3.png',
		'/img/student_avatar/avatar4.png',
		'/img/student_avatar/avatar5.png',
		'/img/student_avatar/avatar6.png',
		'/img/student_avatar/avatar7.png',
		'/img/student_avatar/avatar8.png',
		'/img/student_avatar/avatar9.png',
		'/img/student_avatar/avatar10.png',
		'/img/student_avatar/avatar11.png',
		'/img/student_avatar/avatar12.png',
		'/img/student_avatar/avatar13.png',
		'/img/student_avatar/avatar14.png',
		'/img/student_avatar/avatar15.png',
		'/img/student_avatar/avatar16.png',
		'/img/student_avatar/avatar17.png',
		'/img/student_avatar/avatar18.png',
	]);
	
	// Loading states
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [actionLoading, setActionLoading] = useState({
		delete: null,
		toggle: null,
	});
	const [buttonLoading, setButtonLoading] = useState({
		add: false,
		deleteAll: false,
	});
	
	// Syllabus data for form
	const [syllabuses, setSyllabuses] = useState([]);
	const [syllabusLoading, setSyllabusLoading] = useState(false);
	
	// Selected rows for bulk operations
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);
	
	// Filter dropdown state
	const [filterDropdown, setFilterDropdown] = useState({
		visible: false,
		selectedStatus: [], // Changed to array to support multiple status selection
		selectedSyllabus: null,
	});
	
	// Flag to prevent closing filter when interacting with components
	const [isInteractingWithFilter, setIsInteractingWithFilter] = useState(false);
	
	// Filter state for immediate application
	const [appliedFilters, setAppliedFilters] = useState({
		status: [], // Changed to array to support multiple status selection
		syllabusId: null,
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
			if (filters.status && filters.status.length > 0) {
				params.status = filters.status; // Send array of status values
			}
			if (filters.syllabusId) {
				params.syllabusId = filters.syllabusId;
			}

			console.log('Fetching classes with params:', params);
			console.log('Filter values:', filters);
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
						syllabusId: classItem.syllabusId || classItem.syllabus?.id || null,
						level: classItem.syllabus?.level?.levelName || '-',
						studentCount: classItem.studentCount || 0,
						status: classItem.status,
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

	// Exit class menu mode when entering this page (to remove back button)
	useEffect(() => {
		exitClassMenu();
	}, [exitClassMenu]);

	// Initial load and filter changes with debounced search
	useEffect(() => {
		// Debounce searchText changes
		const timeoutId = setTimeout(() => {
			fetchClasses(1, pagination.pageSize, searchText, sortBy, sortDir, appliedFilters);
		}, searchText ? 1000 : 0); // No delay for empty search

		return () => clearTimeout(timeoutId);
	}, [fetchClasses, pagination.pageSize, sortBy, sortDir, appliedFilters, searchText]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			// Cleanup any pending timeouts
		};
	}, []);

	// Handle click outside to close filter dropdown
	useEffect(() => {
		let timeoutId;
		
		const handleClickOutside = (event) => {
			if (filterDropdown.visible && filterContainerRef.current) {
				// Check if click is outside the filter container and not on any Ant Design components
				const isAntSelect = event.target.closest('.ant-select');
				const isAntDatePicker = event.target.closest('.ant-picker');
				const isAntButton = event.target.closest('.ant-btn');
				const isAntModal = event.target.closest('.ant-modal');
				const isAntDropdown = event.target.closest('.ant-dropdown');
				const isAntSelectDropdown = event.target.closest('.ant-select-dropdown');
				const isAntPickerDropdown = event.target.closest('.ant-picker-dropdown');
				const isAntSelectSelector = event.target.closest('.ant-select-selector');
				const isAntPickerInput = event.target.closest('.ant-picker-input');
				const isAntSelectArrow = event.target.closest('.ant-select-arrow');
				const isAntPickerSuffix = event.target.closest('.ant-picker-suffix');
				
				// Check if click is inside the filter container
				const isInsideFilter = filterContainerRef.current.contains(event.target);
				
				// Check if click is on any Ant Design dropdown/select components
				const isOnAntComponent = isAntSelect || 
					isAntDatePicker || 
					isAntButton || 
					isAntModal ||
					isAntDropdown ||
					isAntSelectDropdown ||
					isAntPickerDropdown ||
					isAntSelectSelector ||
					isAntPickerInput ||
					isAntSelectArrow ||
					isAntPickerSuffix;
				
				// Only close if click is outside filter container AND not on any Ant Design components AND not interacting with filter
				if (!isInsideFilter && !isOnAntComponent && !isInteractingWithFilter) {
					// Add small delay to prevent immediate closing
					timeoutId = setTimeout(() => {
						setFilterDropdown(prev => ({
							...prev,
							visible: false,
						}));
					}, 100);
				}
			}
		};

		// Add event listener when dropdown is visible
		if (filterDropdown.visible) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		// Cleanup event listener and timeout
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [filterDropdown.visible, isInteractingWithFilter]);

	const handleSearch = (value) => {
		setSearchText(value);
		// Reset to first page when searching
		setPagination(prev => ({
			...prev,
			current: 1,
		}));
	};

	const handleTableChange = (pagination, filters, sorter) => {
		let newSortBy = sorter.field || 'createdAt';
		let newSortDir = 'desc'; // Default
		
		// Map frontend field names to backend field names
		if (newSortBy === 'name') {
			newSortBy = 'className';
		}
		
		// Handle 3-state sorting: ASC -> DESC -> No Sort
		if (sorter.order === 'ascend') {
			newSortDir = 'asc';
		} else if (sorter.order === 'descend') {
			newSortDir = 'desc';
		} else {
			// No sorting - reset to default
			newSortBy = 'createdAt';
			newSortDir = 'desc';
		}
		
		setSortBy(newSortBy);
		setSortDir(newSortDir);
		
		fetchClasses(pagination.current, pagination.pageSize, searchText, newSortBy, newSortDir, appliedFilters);
	};

	// Handle image upload
	const handleImageUpload = (file, fileList) => {
		// Check if file exists
		if (!file) {
			return false;
		}
		
		// Validate file type
		const isImage = file.type.startsWith('image/');
		if (!isImage) {
			spaceToast.error('Please upload an image file');
			return false; // Prevent default upload
		}
		
		// Validate file size (max 5MB)
		const isLt5M = file.size / 1024 / 1024 < 5;
		if (!isLt5M) {
			spaceToast.error('Image must be smaller than 5MB');
			return false; // Prevent default upload
		}
		
		setImageFile(file);
		setSelectedAvatarType('upload');
		
		// Create preview URL
		const reader = new FileReader();
		reader.onload = (e) => {
			setImagePreview(e.target.result);
		};
		reader.onerror = (e) => {
			console.error('FileReader error:', e);
		};
		reader.readAsDataURL(file);
		
		return false; // Prevent default upload behavior
	};
	
	// Handle system avatar selection
	const handleSystemAvatarSelect = (avatarPath) => {
		setImagePreview(avatarPath);
		setImageFile(null);
		setSelectedAvatarType('system');
	};
	
	// Handle image removal
	const handleImageRemove = () => {
		setImageFile(null);
		setImagePreview(null);
		setSelectedAvatarType('system');
	};
	

	const handleAdd = () => {
		setEditingClass(null);
		setImageFile(null);
		setImagePreview(null);
		setSelectedAvatarType('system');
		setIsModalVisible(true);
	};

	const handleDelete = (record) => {
		setConfirmModal({
			visible: true,
			title: t('classManagement.confirmDelete'),
			content: t('classManagement.deleteClassMessage'),
			displayData: record.name,
			onConfirm: async () => {
				setActionLoading(prev => ({ ...prev, delete: record.id }));
				try {
					const deleteResponse = await classManagementApi.deleteClass(record.id);
					
					// Use BE success message if available, otherwise use i18n
					const successMessage = deleteResponse?.data?.message || 
										  deleteResponse?.message || 
										  t('classManagement.classDeletedSuccess', { className: record.name });
					spaceToast.success(successMessage);
					
					// Close modal
					setConfirmModal({ visible: false, title: '', content: '', onConfirm: null, type: '' });
					setSelectedStatus(null);
					
					fetchClasses(pagination.current, pagination.pageSize, searchText, sortBy, sortDir, appliedFilters);
					setConfirmModal({ visible: false, title: '', content: '', displayData: null, onConfirm: null });
				} catch (error) {
					console.error('Error deleting class:', error);
					
					// Use BE error message if available, otherwise fallback to generic message
					const errorMessage = error.response?.data?.message || 
										error.response?.data?.error || 
										error.message || 
										'Failed to delete class';
					
					spaceToast.error(errorMessage);
					setConfirmModal({ visible: false, title: '', content: '', displayData: null, onConfirm: null });
				} finally {
					setActionLoading(prev => ({ ...prev, delete: null }));
				}
			}
		});
	};

	// Helper function to format status display (capitalize first letter only)
	const formatStatusDisplay = (status) => {
		if (!status) return '';
		return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
	};

	const handleStatusChange = (record) => {
		// Reset selectedStatus to null when opening modal
		setSelectedStatus(null);
		setCurrentRecord(record);
		setConfirmModal({
			visible: true,
			title: t('classManagement.changeStatus'),
			type: 'status',
			onConfirm: null // Set to null initially, will be handled by separate function
		});
	};

	const handleConfirmStatusChange = async () => {
		if (!selectedStatus) {
			spaceToast.warning(t('classManagement.pleaseSelectStatus'));
			return;
		}

		setActionLoading(prev => ({ ...prev, toggle: currentRecord.id }));
		try {
			const toggleResponse = await classManagementApi.toggleClassStatus(currentRecord.id, selectedStatus);
			
			// Use BE success message if available, otherwise use i18n
			const successMessage = toggleResponse?.data?.message || 
								  toggleResponse?.message;
				
			spaceToast.success(successMessage);
			
			// Close modal
			setConfirmModal({ visible: false, title: '', content: '', onConfirm: null, type: '' });
			setSelectedStatus(null);
			setCurrentRecord(null);
			
			fetchClasses(pagination.current, pagination.pageSize, searchText, sortBy, sortDir, appliedFilters);
		} catch (error) {
			console.error('Error updating class status:', error);
			
			// Use BE error message if available, otherwise fallback to generic message
			const errorMessage = error.response?.data?.message || 
								error.response?.data?.error || 
								error.message;
			
			spaceToast.error(errorMessage);
		} finally {
			setActionLoading(prev => ({ ...prev, toggle: null }));
		}
	};

	const handleModalOk = async () => {
		setIsSubmitting(true);
		try {
			const values = await form.validateFields();
			
			let avatarUrl = editingClass?.avatarUrl || "string"; // Default fallback
			
			// Handle avatar based on type
			if (selectedAvatarType === 'upload' && imageFile) {
				// TODO: Implement actual image upload when API is ready
				// For now, send "string" like StudentList does
				avatarUrl = "string";
				// Don't show info message, let BE handle the response
			} else if (selectedAvatarType === 'system' && imagePreview) {
				// Use system avatar
				avatarUrl = imagePreview;
			}

			if (editingClass) {
				// Update existing class
				const updateData = {
					className: values.name,
					avatarUrl: avatarUrl,
					startDate: values.startDate ? values.startDate.format('YYYY-MM-DDTHH:mm:ss+07:00') : null,
					endDate: values.endDate ? values.endDate.format('YYYY-MM-DDTHH:mm:ss+07:00') : null,
				};
				
				const updateResponse = await classManagementApi.updateClass(editingClass.id, updateData);
				
				// Refresh the list
				fetchClasses(pagination.current, pagination.pageSize, searchText, sortBy, sortDir, appliedFilters);
				
				// Use BE success message if available, otherwise use i18n
				const successMessage = updateResponse?.message || t('classManagement.classUpdatedSuccess');
				spaceToast.success(successMessage);
			} else {
				// Add new class
				const newClassData = {
					className: values.name,
					syllabusId: values.syllabusId,
					avatarUrl: avatarUrl,
					startDate: values.startDate ? values.startDate.format('YYYY-MM-DDTHH:mm:ss+07:00') : null,
					endDate: values.endDate ? values.endDate.format('YYYY-MM-DDTHH:mm:ss+07:00') : null,
				};
				
				const createResponse = await classManagementApi.createClass(newClassData);
				
				// Refresh the list
				fetchClasses(1, pagination.pageSize, searchText, sortBy, sortDir, appliedFilters);
				
				// Use BE success message if available, otherwise use i18n
				const successMessage = createResponse?.message || t('classManagement.classCreatedSuccess');
				spaceToast.success(successMessage);
			}

			setIsModalVisible(false);
			form.resetFields();
			setImageFile(null);
			setImagePreview(null);
			setSelectedAvatarType('system');
		} catch (error) {
			console.error('Error saving class:', error);
			
			// Use BE message if available, otherwise fallback to generic message
			const errorMessage = error.response?.data?.message || 
								error.response?.data?.error || 
								error.message || 
								'Failed to save class. Please try again.';
			
			spaceToast.error(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleModalCancel = () => {
		setIsModalVisible(false);
		form.resetFields();
		setImageFile(null);
		setImagePreview(null);
		setSelectedAvatarType('system');
	};

	const handleEdit = (record) => {
		console.log('Editing record:', record);
		console.log('Record syllabusId:', record.syllabusId);
		console.log('Record startDate:', record.startDate);
		console.log('Record endDate:', record.endDate);
		
		setEditingClass(record);
		
		form.setFieldsValue({
			name: record.name,
			syllabusId: record.syllabusId, // Add syllabusId to form values
			startDate: record.startDate && record.startDate !== null && record.startDate !== 'null' ? dayjs(record.startDate) : undefined,
			endDate: record.endDate && record.endDate !== null && record.endDate !== 'null' ? dayjs(record.endDate) : undefined,
		});
		
		// Set current image preview if exists
		if (record.avatarUrl && record.avatarUrl !== "string") {
			setImagePreview(record.avatarUrl);
			// Check if it's a system avatar or uploaded
			if (systemAvatars.includes(record.avatarUrl)) {
				setSelectedAvatarType('system');
			} else {
				setSelectedAvatarType('upload');
			}
		} else {
			setImagePreview(null);
			setSelectedAvatarType('system');
		}
		setImageFile(null); // Reset file state
		
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
				if (appliedFilters.status && appliedFilters.status.length > 0) {
					params.status = appliedFilters.status;
				}
				if (appliedFilters.syllabusId) {
					params.syllabusId = appliedFilters.syllabusId;
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
			selectedStatus: prev.visible ? prev.selectedStatus : [...appliedFilters.status], // Copy array
			selectedSyllabus: prev.visible ? prev.selectedSyllabus : appliedFilters.syllabusId,
		}));
	};

	// Handle filter submission
	const handleFilterSubmit = () => {
		const newFilters = {
			status: filterDropdown.selectedStatus,
			syllabusId: filterDropdown.selectedSyllabus,
		};
		
		setAppliedFilters(newFilters);
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
	};

	// Handle filter reset
	const handleFilterReset = () => {
		setFilterDropdown(prev => ({
			...prev,
			selectedStatus: [], // Reset to empty array
			selectedSyllabus: null,
		}));
	};

	// Bulk operations

	const handleDeleteAll = async () => {
		if (selectedRowKeys.length === 0) {
			spaceToast.warning(t('classManagement.selectItemsToDelete'));
			return;
		}
		
		setButtonLoading(prev => ({ ...prev, deleteAll: true }));
		
		setConfirmModal({
			visible: true,
			title: t('classManagement.confirmDeleteAll'),
			content: t('classManagement.deleteAllMessage'),
			displayData: `${selectedRowKeys.length} ${t('classManagement.classes')}`,
			onConfirm: async () => {
				try {
					// Delete classes one by one since bulk delete API might not be available
					const deletePromises = selectedRowKeys.map(classId => 
						classManagementApi.deleteClass(classId)
					);
					
					const responses = await Promise.allSettled(deletePromises);
					
					// Check if all deletions were successful
					const failedDeletions = responses.filter(response => response.status === 'rejected');
					const successfulDeletions = responses.filter(response => response.status === 'fulfilled');
					
					if (failedDeletions.length === 0) {
						// All successful - use first response message or fallback
						const successMessage = successfulDeletions[0]?.value?.data?.message || 
											  successfulDeletions[0]?.value?.message || 
											  t('classManagement.allClassesDeletedSuccess');
						spaceToast.success(successMessage);
					} else if (successfulDeletions.length > 0) {
						// Partial success
						spaceToast.warning(`${successfulDeletions.length} classes deleted successfully, ${failedDeletions.length} failed`);
					} else {
						// All failed - use first error message
						const errorMessage = failedDeletions[0]?.reason?.response?.data?.message || 
											 failedDeletions[0]?.reason?.response?.data?.error || 
											 'Failed to delete all classes';
						spaceToast.error(errorMessage);
					}
					
					setSelectedRowKeys([]);
					
					// Close modal
					setConfirmModal({ visible: false, title: '', content: '', onConfirm: null, type: '' });
					setSelectedStatus(null);
					
					fetchClasses(pagination.current, pagination.pageSize, searchText, sortBy, sortDir, appliedFilters);
				} catch (error) {
					console.error('Error deleting all classes:', error);
					const errorMessage = error.response?.data?.message || 
										 error.response?.data?.error || 
										 'Failed to delete all classes';
					spaceToast.error(errorMessage);
				} finally {
					setButtonLoading(prev => ({ ...prev, deleteAll: false }));
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
			key: 'className',
			width: '20%',
			sorter: true,
			sortOrder: sortBy === 'className' ? (sortDir === 'asc' ? 'ascend' : 'descend') : null,
			render: (text) => (
				<Tooltip placement="topLeft" title={text}>
					<div style={{ 
						fontSize: '16px',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap'
					}}>
						{text}
					</div>
				</Tooltip>
			),
		},
		{
			title: t('classManagement.syllabus'),
			dataIndex: 'syllabus',
			key: 'syllabus',
			width: '18%',
			render: (text) => (
				<Tooltip placement="topLeft" title={text}>
					<div style={{ 
						fontSize: '16px',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap'
					}}>
						{text}
					</div>
				</Tooltip>
			),
		},
		{
			title: t('classManagement.level'),
			dataIndex: 'level',
			key: 'level',
			width: '12%',
			render: (text) => (
				<Tooltip placement="topLeft" title={text}>
					<div style={{ 
						fontSize: '16px',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap'
					}}>
						{text}
					</div>
				</Tooltip>
			),
		},
		{
			title: t('classManagement.status'),
			dataIndex: 'status',
			key: 'status',
			width: '12%',
			render: (text) => (
				<Tooltip placement="topLeft" title={formatStatusDisplay(text)}>
					<div style={{ 
						fontSize: '16px',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap'
					}}>
						{formatStatusDisplay(text)}
					</div>
				</Tooltip>
			),
		},
		{
			title: t('classManagement.actions'),
			key: 'actions',
			width: '18%',
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
					{record.status !== 'FINISHED' && (
						<Tooltip title={t('classManagement.changeStatus')}>
							<Button
								type="text"
								size="small"
								icon={<SwapOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
								onClick={() => handleStatusChange(record)}
							/>
						</Tooltip>
					)}
					{record.status !== 'FINISHED' && (
						<Tooltip title={t('classManagement.edit')}>
							<Button
								type="text"
								size="small"
								icon={<EditOutlined style={{ fontSize: '20px' }} />}
								onClick={() => handleEdit(record)}
							/>
						</Tooltip>
					)}
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
										className={`filter-button ${theme}-filter-button ${filterDropdown.visible ? 'active' : ''} ${(appliedFilters.status.length > 0 || appliedFilters.syllabusId) ? 'has-filters' : ''}`}
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
														mode="multiple"
														value={filterDropdown.selectedStatus}
														onChange={(value) => setFilterDropdown(prev => ({ ...prev, selectedStatus: value }))}
														onDropdownVisibleChange={(open) => setIsInteractingWithFilter(open)}
														style={{ width: '100%', height: '40px' }}
														placeholder={t('classManagement.selectStatus')}
														allowClear
													>
														<Option value="ACTIVE">{t('classManagement.active')}</Option>
														<Option value="PENDING">{t('classManagement.pending')}</Option>
														<Option value="UPCOMING_END">{t('classManagement.upcomingEnd')}</Option>
														<Option value="FINISHED">{t('classManagement.finished')}</Option>
														<Option value="INACTIVE">{t('classManagement.inactive')}</Option>
													</Select>
												</div>

												{/* Syllabus Filter */}
												<div style={{ marginBottom: '24px' }}>
													<Typography.Title level={5} style={{ marginBottom: '12px', fontSize: '16px' }}>
														{t('classManagement.syllabus')}
													</Typography.Title>
													<Select
														value={filterDropdown.selectedSyllabus}
														onChange={(value) => setFilterDropdown(prev => ({ ...prev, selectedSyllabus: value }))}
														onDropdownVisibleChange={(open) => setIsInteractingWithFilter(open)}
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


												{/* Action Buttons */}
												<div style={{ 
													display: 'flex', 
													justifyContent: 'space-between', 
													gap: '12px',
													paddingTop: '16px',
													borderTop: theme === 'dark' ? '1px solid #333' : '1px solid #f0f0f0'
												}}>
													<Button
														onClick={handleFilterReset}
														className="filter-reset-button"
														style={{
															height: '48px',
															fontSize: '16px',
															fontWeight: '500',
															flex: 1,
															borderRadius: '8px'
														}}
													>
														{t('common.reset')}
													</Button>
													<Button
														type="primary"
														onClick={handleFilterSubmit}
														className="filter-submit-button"
														style={{
															height: '48px',
															fontSize: '16px',
															fontWeight: '500',
															flex: 1,
															borderRadius: '8px',
															backgroundColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#5a1fb8',
															borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#5a1fb8',
															color: theme === 'sun' ? '#000000' : '#ffffff'
														}}
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
						<div style={{ 
							fontSize: '28px', 
							fontWeight: '600', 
							color: 'rgb(24, 144, 255)',
							textAlign: 'center',
							padding: '10px 0',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '12px'
						}}>
							{editingClass ? (
								<>
									<EditOutlined style={{ fontSize: '28px', color: 'rgb(24, 144, 255)' }} />
									<span>{t('classManagement.editClass')}</span>
								</>
							) : (
								<>
									<PlusOutlined style={{ fontSize: '28px', color: 'rgb(24, 144, 255)' }} />
									<span>{t('classManagement.addClass')}</span>
								</>
							)}
						</div>
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

						{/* Avatar Selection - Show for both create and edit */}
						<Form.Item
							label={t('classManagement.avatar')}
							name="avatar"
						>
							<div style={{ marginBottom: '16px' }}>
								{/* Avatar Type Selection */}
								<div style={{ marginBottom: '16px' }}>
									<Radio.Group 
										value={selectedAvatarType} 
										onChange={(e) => {
											setSelectedAvatarType(e.target.value);
											if (e.target.value === 'system') {
												setImageFile(null);
											}
										}}
									>
										<Radio value="system">Choose from System</Radio>
										<Radio value="upload">Upload from Computer</Radio>
									</Radio.Group>
								</div>

								{/* Current Avatar Preview */}
								<div style={{ 
									display: 'flex', 
									alignItems: 'center', 
									gap: '16px',
									marginBottom: '16px',
									padding: '12px',
									border: '1px solid #f0f0f0',
									borderRadius: '8px',
									backgroundColor: '#fafafa'
								}}>
									<Avatar
										size={60}
										src={imagePreview}
										icon={<UserOutlined />}
										style={{
											backgroundColor: imagePreview ? 'transparent' : '#1890ff',
											border: '2px solid #f0f0f0'
										}}
									/>
									<div>
										<div style={{ fontSize: '14px', fontWeight: '500', color: '#666' }}>
											{imagePreview ? 
												(selectedAvatarType === 'system' ? 'System Avatar Selected' : 'Custom Image Selected') 
												: 'No Avatar Selected'
											}
										</div>
										{imageFile && (
											<div style={{ fontSize: '12px', color: '#1890ff' }}>
												{imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
											</div>
										)}
									</div>
									{imagePreview && (
										<Button 
											type="text"
											danger
											onClick={handleImageRemove}
											style={{
												height: '32px',
												fontSize: '12px',
											}}
										>
											Remove
										</Button>
									)}
								</div>

								{/* System Avatar Selection */}
								{selectedAvatarType === 'system' && (
									<div>
										<div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: '#666' }}>
											Choose an avatar:
										</div>
										<div style={{ 
											display: 'grid', 
											gridTemplateColumns: 'repeat(6, 1fr)', 
											gap: '8px',
											maxHeight: '200px',
											overflowY: 'auto',
											padding: '8px',
											border: '1px solid #f0f0f0',
											borderRadius: '8px'
										}}>
											{systemAvatars.map((avatar, index) => (
												<div
													key={index}
													onClick={() => handleSystemAvatarSelect(avatar)}
													style={{
														width: '50px',
														height: '50px',
														borderRadius: '50%',
														border: imagePreview === avatar ? '3px solid #1890ff' : '2px solid #f0f0f0',
														cursor: 'pointer',
														overflow: 'hidden',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														backgroundColor: '#f5f5f5',
														transition: 'all 0.2s ease'
													}}
												>
													<img
														src={avatar}
														alt={`Avatar ${index + 1}`}
														style={{
															width: '100%',
															height: '100%',
															objectFit: 'cover'
														}}
														onError={(e) => {
															e.target.style.display = 'none';
															e.target.nextSibling.style.display = 'flex';
														}}
													/>
													<div style={{ 
														display: 'none',
														width: '100%',
														height: '100%',
														alignItems: 'center',
														justifyContent: 'center',
														backgroundColor: '#f0f0f0',
														fontSize: '12px',
														color: '#999'
													}}>
														{index + 1}
													</div>
												</div>
											))}
										</div>
									</div>
								)}

								{/* Upload Section */}
								{selectedAvatarType === 'upload' && (
									<div>
										<div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: '#666' }}>
											Upload an image:
										</div>
										<Upload
											name="avatar"
											listType="text"
											showUploadList={false}
											beforeUpload={handleImageUpload}
											accept="image/*"
											customRequest={() => {}} // Prevent default upload
										>
											<Button 
												icon={<UploadOutlined />}
												style={{
													height: '40px',
													fontSize: '14px',
													fontWeight: '500',
													width: '100%'
												}}
											>
												{imageFile ? 'Change Image' : 'Select Image'}
											</Button>
										</Upload>
										
										{/* Upload Tips */}
										<div style={{ 
											marginTop: '8px', 
											fontSize: '12px', 
											color: '#999',
											lineHeight: '1.4'
										}}>
											• Maximum file size: 5MB<br/>
										</div>
									</div>
								)}
							</div>
						</Form.Item>

						<Form.Item
							label={
								<span>
									{t('classManagement.syllabus')}
									{!editingClass && <span style={{ color: '#ff4d4f' }}> *</span>}
								</span>
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
								<span>
									{t('classManagement.startDate')}
									{!editingClass && <span style={{ color: '#ff4d4f' }}> *</span>}
								</span>
							}
							name="startDate"
							required={!editingClass}
							rules={[
								{ required: !editingClass, message: 'Please select start date' },
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
								// Allow all dates including past dates
							/>
						</Form.Item>

						{/* End Date */}
						<Form.Item
							label={
								<span>
									{t('classManagement.endDate')}
									{!editingClass && <span style={{ color: '#ff4d4f' }}> *</span>}
								</span>
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
					onOk={confirmModal.type === 'status' ? handleConfirmStatusChange : confirmModal.onConfirm}
					onCancel={() => {
						setConfirmModal({ visible: false, title: '', content: '', onConfirm: null, type: '' });
						setSelectedStatus(null);
						setCurrentRecord(null);
					}}
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
					}}
				>
					{confirmModal.type === 'status' ? (
						// Status change modal content
						<div>
							<p style={{ marginBottom: '16px', textAlign: 'center', fontSize: '16px' }}>
								{currentRecord && t('classManagement.changeStatusMessage', { className: currentRecord.name })}
							</p>
							<Select
								placeholder={t('classManagement.selectNewStatus')}
								style={{ width: '100%' }}
								value={selectedStatus}
								onChange={(value) => {
									setSelectedStatus(value);
								}}
							>
								{currentRecord && (() => {
									// Get available status options based on current status
									const getAvailableStatuses = (currentStatus) => {
										switch (currentStatus) {
											case 'PENDING':
												return [
													{ value: 'INACTIVE', label: t('classManagement.inactive') }
												];
											case 'ACTIVE':
											case 'UPCOMING_END':
												return [
													{ value: 'FINISHED', label: t('classManagement.finished') }
												];
											default:
												return [
													{ value: 'INACTIVE', label: t('classManagement.inactive') }
												];
										}
									};
									
									const availableStatuses = getAvailableStatuses(currentRecord.status);
									return availableStatuses.map(status => (
										<Option key={status.value} value={status.value}>
											{status.label}
										</Option>
									));
								})()}
							</Select>
						</div>
				) : (
					// Default confirmation modal content
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
						{confirmModal.displayData && (
							<p style={{
								fontSize: '20px',
								color: '#000',
								margin: 0,
								fontWeight: '400'
							}}>
								<strong>{confirmModal.displayData}</strong>
							</p>
						)}
					</div>
				)}
				</Modal>

				{/* Bottom Action Bar */}
				<BottomActionBar
					selectedCount={selectedRowKeys.length}
					onSelectAll={handleSelectAll}
					onDeleteAll={handleDeleteAll}
					onClose={() => setSelectedRowKeys([])}
					selectAllText={t('classManagement.selectAll')}
					deleteAllText={t('classManagement.deleteAll')}
					deleteAllLoading={buttonLoading.deleteAll}
				/>
			</ThemedLayout>
		</>
	);
};

export default ClassListTable;
