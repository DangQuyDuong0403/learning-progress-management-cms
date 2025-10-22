import React, { useState, useEffect, useCallback, useMemo } from 'react';
import usePageTitle from '../../../../hooks/usePageTitle';
import SecurityWrapper from '../../../../component/SecurityWrapper';
import {
	Table,
	Button,
	Space,
	Modal,
	message,
	Input,
	Tag,
	Row,
	Col,
	Tooltip,
	Typography,
	Divider,
	Checkbox,
	Upload,
} from 'antd';
import {
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	SearchOutlined,
	EyeOutlined,
	DownloadOutlined,
	UploadOutlined,
	PlayCircleOutlined,
	ClockCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import SyllabusForm from './SyllabusForm';
import './SyllabusList.css';
import ThemedLayout from '../../../../component/ThemedLayout';
import { useTheme } from '../../../../contexts/ThemeContext';
import LoadingWithEffect from '../../../../component/spinner/LoadingWithEffect';
import { spaceToast } from '../../../../component/SpaceToastify';
import BottomActionBar from '../../../../component/BottomActionBar';
import syllabusManagementApi from '../../../../apis/backend/syllabusManagement';

const SyllabusList = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { theme } = useTheme();
	
	// Set page title
	usePageTitle('Syllabus Management');

	// State management
	const [loading, setLoading] = useState(false);
	const [syllabuses, setSyllabuses] = useState([]);
	const [totalElements, setTotalElements] = useState(0);
	const [searchText, setSearchText] = useState('');
	const [currentView] = useState('syllabuses'); // 'syllabuses', 'chapters', 'lessons'
	const [searchTimeout, setSearchTimeout] = useState(null);
	const [sortBy, setSortBy] = useState('createdAt');
	const [sortDir, setSortDir] = useState('desc');
	
	// Checkbox selection state
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);

	// Modal states
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
	const [isBulkDeleteModalVisible, setIsBulkDeleteModalVisible] = useState(false);
	const [isExportModalVisible, setIsExportModalVisible] = useState(false);
	const [editingSyllabus, setEditingSyllabus] = useState(null);
	const [deleteSyllabus, setDeleteSyllabus] = useState(null);
	const [importModal, setImportModal] = useState({
		visible: false,
		fileList: [],
		uploading: false
	});

	// Loading states for buttons
	const [templateDownloadLoading, setTemplateDownloadLoading] = useState(false);
	const [exportSelectedLoading, setExportSelectedLoading] = useState(false);
	const [exportAllLoading, setExportAllLoading] = useState(false);

	// Pagination state
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 10,
		total: 0,
		showSizeChanger: true,
		showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
	});

	// Fetch syllabuses from API
	const fetchSyllabuses = useCallback(async (page = 1, size = 10, search = '', sortField = 'createdAt', sortDirection = 'desc') => {
		setLoading(true);
		try {
			const params = {
				page: page - 1, // API uses 0-based indexing
				size: size,
				sortBy: sortField,
				sortDir: sortDirection,
			};

			// Add search parameter if provided
			if (search && search.trim()) {
				params.searchText = search.trim();
			}

			const response = await syllabusManagementApi.getSyllabuses({
				params: params,
			});

			// Map API response to component format
			const mappedSyllabuses = response.data.map((syllabus) => ({
				id: syllabus.id,
				name: syllabus.syllabusName,
				description: syllabus.description,
				levelId: syllabus.levelId,
				level: syllabus.level,
				duration: syllabus.duration,
				status: syllabus.status,
				objectives: syllabus.objectives,
				learningOutcomes: syllabus.learningOutcomes,
				assessmentCriteria: syllabus.assessmentCriteria,
				createdAt: syllabus.createdAt,
				chapters: syllabus.chapters || [],
				chapterCount: syllabus.chapterCount || 0,
				lessonCount: syllabus.lessonCount || 0,
			}));

			setSyllabuses(mappedSyllabuses);
			setTotalElements(response.totalElements || response.data.length);
			setPagination(prev => ({
				...prev,
				current: page,
				pageSize: size,
				total: response.totalElements || response.data.length,
			}));
			setLoading(false);
		} catch (error) {
			console.error('Error fetching syllabuses:', error);
			
			// Handle error message from backend
			let errorMessage = error.response?.data?.error || 
				error.response?.data?.message || 
				error.message 
			
			message.error(errorMessage);
			setLoading(false);
		}
	}, []);


	useEffect(() => {
		fetchSyllabuses(1, pagination.pageSize, searchText, sortBy, sortDir);
	}, [fetchSyllabuses, searchText, sortBy, sortDir, pagination.pageSize]);

	// Calculate checkbox states with useMemo
	const checkboxStates = useMemo(() => {
		const currentPageKeys = syllabuses.map(syllabus => syllabus.id);
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
	}, [selectedRowKeys, syllabuses]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
		};
	}, [searchTimeout]);


	const handleAdd = () => {
		setEditingSyllabus(null);
		setIsModalVisible(true);
	};

	const handleEdit = (syllabus) => {
		setEditingSyllabus(syllabus);
		setIsModalVisible(true);
	};

	const handleDeleteClick = (syllabus) => {
		setDeleteSyllabus(syllabus);
		setIsDeleteModalVisible(true);
	};

	const handleDelete = async () => {
		try {
			const response = await syllabusManagementApi.deleteSyllabus(deleteSyllabus.id);
			
			// Update local state
			setSyllabuses(syllabuses.filter(s => s.id !== deleteSyllabus.id));
			
			// Update selectedRowKeys - remove deleted item if it was selected
			setSelectedRowKeys(prev => prev.filter(key => key !== deleteSyllabus.id));
			
			// Update totalElements
			setTotalElements(prev => prev - 1);
			
			// Show success message
			spaceToast.success(response.message);
			
			setIsDeleteModalVisible(false);
			setDeleteSyllabus(null);
		} catch (error) {
			console.error('Error deleting syllabus:', error);
			
			// Handle error message from backend
			let errorMessage = error.response?.data?.error || 
				error.response?.data?.message || 
				error.message 
			
			spaceToast.error(errorMessage);
		}
	};

	const handleDeleteModalClose = () => {
		setIsDeleteModalVisible(false);
		setDeleteSyllabus(null);
	};

	const handleViewChapters = (syllabus) => {
		navigate(`/manager/syllabuses/${syllabus.id}/chapters`);
	};


	const handleModalClose = () => {
		setIsModalVisible(false);
		setEditingSyllabus(null);
	};


	const handleRefresh = () => {
		fetchSyllabuses(pagination.current, pagination.pageSize, searchText, sortBy, sortDir);
	};

	const handleSearch = (value) => {
		setSearchText(value);
		
		// Clear existing timeout
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
		
		// Set new timeout for 1 second delay
		const newTimeout = setTimeout(() => {
			// Reset to first page when searching
			fetchSyllabuses(1, pagination.pageSize, value, sortBy, sortDir);
		}, 1000);
		
		setSearchTimeout(newTimeout);
	};

	const handleTableChange = (pagination, filters, sorter) => {
		// Handle sorting
		if (sorter && sorter.field) {
			const newSortBy = sorter.field;
			const newSortDir = sorter.order === 'ascend' ? 'asc' : 'desc';
			
			setSortBy(newSortBy);
			setSortDir(newSortDir);
			
			// Fetch data with new sorting
			fetchSyllabuses(pagination.current, pagination.pageSize, searchText, newSortBy, newSortDir);
		} else {
			// Handle pagination without sorting change
			fetchSyllabuses(pagination.current, pagination.pageSize, searchText, sortBy, sortDir);
		}
	};

	const handleExport = () => {
		setIsExportModalVisible(true);
	};

	const handleImport = () => {
		setImportModal({
			visible: true,
			fileList: [],
			uploading: false
		});
	};

	const handleImportCancel = () => {
		setImportModal({
			visible: false,
			fileList: [],
			uploading: false
		});
	};

	const handleImportOk = async () => {
		if (importModal.fileList.length === 0) {
			spaceToast.warning(t('syllabusManagement.selectFileToImport'));
			return;
		}

		setImportModal(prev => ({ ...prev, uploading: true }));
		
		try {
			const file = importModal.fileList[0];
			
			// Create FormData object
			const formData = new FormData();
			formData.append('file', file);
			
			// Call import API with FormData
			const response = await syllabusManagementApi.importSyllabuses(formData);

			if (response.success) {
				// Refresh the list to get updated data from server
				fetchSyllabuses(pagination.current, pagination.pageSize, searchText, sortBy, sortDir);
				
				// Use backend message if available, otherwise fallback to translation
				const successMessage = response.message || t('syllabusManagement.importSuccess');
				spaceToast.success(successMessage);
				
				setImportModal({ visible: false, fileList: [], uploading: false });
			} else {
				throw new Error(response.message || 'Import failed');
			}
		} catch (error) {
			console.error('Error importing syllabuses:', error);
			spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message || t('syllabusManagement.importError'));
			setImportModal(prev => ({ ...prev, uploading: false }));
		}
	};

	// Handle file selection
	const handleFileSelect = (file) => {
		// Validate file type
		const allowedTypes = [
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
			'application/vnd.ms-excel', // .xls
		];
		
		if (!allowedTypes.includes(file.type)) {
			spaceToast.error('Please select a valid Excel (.xlsx, .xls) file');
			return false;
		}
		
		// Validate file size (max 10MB)
		const maxSize = 10 * 1024 * 1024; // 10MB
		if (file.size > maxSize) {
			spaceToast.error('File size must be less than 10MB');
			return false;
		}
		
		setImportModal(prev => ({
			...prev,
			fileList: [file]
		}));
		
		return false; // Prevent default upload behavior
	};

	const handleDownloadTemplate = async () => {
		setTemplateDownloadLoading(true);
		try {
			
			const response = await syllabusManagementApi.downloadSyllabusTemplate();
			
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
			}
			
			// Create download link directly from SAS URL
			const link = document.createElement('a');
			link.setAttribute('href', downloadUrl);
			link.setAttribute('download', 'syllabus_import_template.xlsx');
			link.setAttribute('target', '_blank');
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			
			spaceToast.success('Template downloaded successfully');
		} catch (error) {
			console.error('Error downloading template:', error);
			spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to download template');
		} finally {
			setTemplateDownloadLoading(false);
		}
	};

	// Fetch all syllabus IDs for select all functionality
	const fetchAllSyllabusIds = useCallback(async () => {
		try {
			// Fetch all syllabuses without pagination to get all IDs
			const params = {
				page: 0,
				size: totalElements || 1000, // Use totalElements or a large number
				sortBy: sortBy,
				sortDir: sortDir,
			};

			// Add search parameter if provided
			if (searchText && searchText.trim()) {
				params.searchText = searchText.trim();
			}

			const response = await syllabusManagementApi.getSyllabuses({
				params: params,
			});

			return response.data.map(syllabus => syllabus.id);
		} catch (error) {
			console.error('Error fetching all syllabus IDs:', error);
			spaceToast.error(t('syllabusManagement.errorFetchingAllSyllabuses'));
			return [];
		}
	}, [totalElements, sortBy, sortDir, searchText, t]);

	// Checkbox selection handlers
	const handleSelectAll = async (checked) => {
		if (checked) {
			// Fetch all syllabus IDs and select them
			const allSyllabusIds = await fetchAllSyllabusIds();
			setSelectedRowKeys(allSyllabusIds);
		} else {
			// Clear all selections
			setSelectedRowKeys([]);
		}
	};

	// Handle table header checkbox (only current page)
	const handleSelectAllCurrentPage = (checked) => {
		const currentPageKeys = syllabuses.map(syllabus => syllabus.id);
		
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

	const handleSelectRow = (record, checked) => {
		if (checked) {
			setSelectedRowKeys(prev => [...prev, record.id]);
		} else {
			setSelectedRowKeys(prev => prev.filter(key => key !== record.id));
		}
	};


	// Bulk actions for selected items
	const handleBulkDelete = () => {
		if (selectedRowKeys.length === 0) {
			message.warning(t('syllabusManagement.selectItemsToDelete'));
			return;
		}
		setIsBulkDeleteModalVisible(true);
	};

	// Bulk delete modal handlers
	const handleBulkDeleteConfirm = async () => {
		try {
			// TODO: Implement actual bulk delete API call
			await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
			
			// Update local state
			setSyllabuses(syllabuses.filter(s => !selectedRowKeys.includes(s.id)));
			
			// Update totalElements
			setTotalElements(prev => prev - selectedRowKeys.length);
			
			// Show success message
			spaceToast.success(`${t('syllabusManagement.bulkDeleteSuccess')} ${selectedRowKeys.length} ${t('syllabusManagement.syllabuses')} ${t('common.success')}`);
			
			setIsBulkDeleteModalVisible(false);
			setSelectedRowKeys([]);
		} catch (error) {
			console.error('Error bulk deleting syllabuses:', error);
			
			// Handle error message from backend
			let errorMessage = error.response?.data?.error || 
				error.response?.data?.message || 
				error.message ||
				t('syllabusManagement.bulkDeleteError');
			
			spaceToast.error(errorMessage);
		}
	};

	const handleBulkDeleteModalClose = () => {
		setIsBulkDeleteModalVisible(false);
	};

	// Export modal handlers
	const handleExportModalClose = () => {
		setIsExportModalVisible(false);
	};

	const handleExportSelected = async () => {
		setExportSelectedLoading(true);
		try {
			if (selectedRowKeys.length === 0) {
				spaceToast.warning(t('syllabusManagement.selectItemsToExport'));
				return;
			}

			// Export selected syllabuses using new API with ids parameter
			const response = await syllabusManagementApi.exportSyllabuses(selectedRowKeys, searchText);
			
			// Since we modified axios interceptor to return full response for blob requests,
			// response.data should contain the blob data directly
			const blobData = response.data;
			
			// Create download link
			const url = window.URL.createObjectURL(blobData);
			const link = document.createElement('a');
			link.href = url;
			
			// Generate filename with timestamp and count
			const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
			const filename = `selected_syllabuses_${selectedRowKeys.length}_${timestamp}.xlsx`;
			
			link.download = filename;
			link.style.display = 'none';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
			
			spaceToast.success(`${t('syllabusManagement.exportSuccess')}: ${selectedRowKeys.length} ${t('syllabusManagement.syllabuses')}`);
			setIsExportModalVisible(false);
		} catch (error) {
			console.error('Error exporting selected syllabuses:', error);
			
			// Handle error message extraction
			let errorMessage = 'Export failed';
			
			try {
				// If response.data is a Blob (which happens with responseType: 'blob' errors)
				if (error.response?.data instanceof Blob) {
					// Read the blob as text to get the JSON error
					const errorText = await error.response.data.text();
					console.log('Error blob text:', errorText);
					
					// Try to parse the JSON error
					const errorJson = JSON.parse(errorText);
					errorMessage = errorJson.error || errorJson.message || errorMessage;
				} else if (error.response?.data?.error) {
					// Direct JSON error
					errorMessage = error.response.data.error;
				} else if (error.response?.data?.message) {
					errorMessage = error.response.data.message;
				} else if (error.message) {
					errorMessage = error.message;
				}
			} catch (parseError) {
				console.error('Error parsing error response:', parseError);
				errorMessage = error.message || 'Export failed';
			}
			
			console.error('Final error message:', errorMessage);
			spaceToast.error(errorMessage);
		} finally {
			setExportSelectedLoading(false);
		}
	};

	const handleExportAll = async () => {
		setExportAllLoading(true);
		try {
			// Call export all API using new unified API (no ids parameter = export all)
			const response = await syllabusManagementApi.exportSyllabuses(null, searchText);
			
			// Since we modified axios interceptor to return full response for blob requests,
			// response.data should contain the blob data directly
			const blobData = response.data;
			
			// Create download link
			const url = window.URL.createObjectURL(blobData);
			const link = document.createElement('a');
			link.href = url;
			
			// Generate filename with timestamp
			const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
			const filename = `all_syllabuses_${timestamp}.xlsx`;
			
			link.download = filename;
			link.style.display = 'none';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
			
			spaceToast.success(`${t('syllabusManagement.exportSuccess')}: ${totalElements} ${t('syllabusManagement.syllabuses')}`);
			setIsExportModalVisible(false);
		} catch (error) {
			console.error('Error exporting all syllabuses:', error);
			
			// Handle error message extraction
			let errorMessage = 'Export failed';
			
			try {
				// If response.data is a Blob (which happens with responseType: 'blob' errors)
				if (error.response?.data instanceof Blob) {
					// Read the blob as text to get the JSON error
					const errorText = await error.response.data.text();
					console.log('Error blob text:', errorText);
					
					// Try to parse the JSON error
					const errorJson = JSON.parse(errorText);
					errorMessage = errorJson.error || errorJson.message || errorMessage;
				} else if (error.response?.data?.error) {
					// Direct JSON error
					errorMessage = error.response.data.error;
				} else if (error.response?.data?.message) {
					errorMessage = error.response.data.message;
				} else if (error.message) {
					errorMessage = error.message;
				}
			} catch (parseError) {
				console.error('Error parsing error response:', parseError);
				errorMessage = error.message || 'Export failed';
			}
			
			console.error('Final error message:', errorMessage);
			spaceToast.error(errorMessage);
		} finally {
			setExportAllLoading(false);
		}
	};

	// No need for client-side filtering since API handles filtering
	const filteredSyllabuses = syllabuses;

	// Calculate statistics based on current view
	const getCurrentData = () => {
		switch (currentView) {
			case 'syllabuses':
				return filteredSyllabuses;
			case 'chapters':
				return filteredChapters;
			case 'lessons':
				return filteredLessons;
			default:
				return filteredSyllabuses;
		}
	};

	// Get all chapters from all syllabuses
	const allChapters = syllabuses.flatMap(syllabus => 
		syllabus.chapters?.map(chapter => ({
			...chapter,
			syllabusName: syllabus.name,
			syllabusId: syllabus.id
		})) || []
	);

	// Get all lessons from all chapters
	const allLessons = allChapters.flatMap(chapter => 
		chapter.lessons?.map(lesson => ({
			...lesson,
			chapterName: chapter.name,
			chapterId: chapter.id,
			syllabusName: chapter.syllabusName,
			syllabusId: chapter.syllabusId
		})) || []
	);

	// Filter chapters based on search
	const filteredChapters = allChapters.filter((chapter) => {
		const matchesSearch =
			chapter.name.toLowerCase().includes(searchText.toLowerCase()) ||
			chapter.description.toLowerCase().includes(searchText.toLowerCase()) ||
			chapter.syllabusName.toLowerCase().includes(searchText.toLowerCase());
		return matchesSearch;
	});

	// Filter lessons based on search
	const filteredLessons = allLessons.filter((lesson) => {
		const matchesSearch =
			lesson.name.toLowerCase().includes(searchText.toLowerCase()) ||
			lesson.description.toLowerCase().includes(searchText.toLowerCase()) ||
			lesson.chapterName.toLowerCase().includes(searchText.toLowerCase()) ||
			lesson.syllabusName.toLowerCase().includes(searchText.toLowerCase());
		return matchesSearch;
	});


	const syllabusColumns = [
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
			title: t('syllabusManagement.stt'),
			key: 'index',
			width: '5%',
			render: (_, __, index) => {
				// Calculate index based on current page and page size
				const currentPage = pagination.current || 1;
				const pageSize = pagination.pageSize || 10;
				return (currentPage - 1) * pageSize + index + 1;
			},
		},
		{
			title: t('syllabusManagement.syllabusName'),
			dataIndex: 'name',
			width: '18%',
			key: 'name',
			render: (text, record) => (
				<div style={{ 
					fontSize: '20px',
					maxWidth: '200px',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					whiteSpace: 'nowrap'
				}}>
					{text}
				</div>
			),
		},
		{
			title: t('syllabusManagement.level'),
			dataIndex: 'level',
			key: 'level',
			width: '12%',
			render: (level) => {
				return (
					<div style={{ color: 'black', fontSize: '20px' }}>
						{level?.levelName || '-'}
					</div>
				);
			},
		},
		{
			title: t('syllabusManagement.totalChapters'),
			dataIndex: 'chapterCount',
			key: 'chapters',
			width: '15%',
			render: (chapterCount) => (
				<div style={{ textAlign: 'center' }}>
					{chapterCount || 0}
				</div>
			),
		},
		{
			title: t('syllabusManagement.totalLessons'),
			dataIndex: 'lessonCount',
			key: 'totalLessons',
			width: '15%',
			render: (lessonCount) => (
				<div style={{ textAlign: 'center' }}>
					{lessonCount || 0}
				</div>
			),
		},
		{
			title: t('syllabusManagement.actions'),
			key: 'actions',
			width: '15%',
			render: (_, record) => (
				<Space size="small">
					<Tooltip title={t('syllabusManagement.viewChapters')}>
						<Button
							type="text"
							size="small"
							icon={<EyeOutlined style={{ fontSize: '25px' }} />}
							onClick={() => handleViewChapters(record)}
						/>
					</Tooltip>
					<Tooltip title={t('common.edit')}>
						<Button
							type="text"
							size="small"
							icon={<EditOutlined style={{ fontSize: '25px' }} />}
							onClick={() => handleEdit(record)}
						/>
					</Tooltip>
				<Button
					type="text"
					size="small"
					icon={<DeleteOutlined style={{ fontSize: '25px', color: '#ff4d4f' }} />}
					onClick={() => handleDeleteClick(record)}
				/>
				</Space>
			),
		},
	];

	const chapterColumns = [
		{
			title: t('chapterManagement.chapterNumber'),
			dataIndex: 'order',
			key: 'order',
			width: 80,
			sorter: (a, b) => a.order - b.order,
			render: (order) => (
				<Tag color="blue" style={{ textAlign: 'center', minWidth: '30px' }}>
					{order}
				</Tag>
			),
		},
		{
			title: t('chapterManagement.chapterName'),
			dataIndex: 'name',
			key: 'name',
			width: 200,
			sorter: (a, b) => a.name.localeCompare(b.name),
			render: (text) => (
				<div style={{ fontSize: '20px' }}>{text}</div>
			),
		},
		{
			title: t('syllabusManagement.syllabusName'),
			dataIndex: 'name',
			key: 'name',
			width: 150,
			render: (syllabusName) => (
				<span style={{ }}>{syllabusName}</span>
			),
		},
		{
			title: t('chapterManagement.lessons'),
			dataIndex: 'lessons',
			key: 'lessons',
			width: 100,
			render: (lessons) => (
				<div style={{ textAlign: 'center' }}>
					<PlayCircleOutlined style={{ marginRight: '4px' }} />
					{lessons?.length || 0}
				</div>
			),
		},
		{
			title: t('chapterManagement.duration'),
			dataIndex: 'duration',
			key: 'duration',
			width: 100,
			render: (duration) => `${duration} ${t('chapterManagement.hours')}`,
		},
		{
			title: t('chapterManagement.status'),
			dataIndex: 'status',
			key: 'status',
			width: 100,
			render: (status) => (
				<Tag color={status === 'active' ? 'green' : 'red'}>
					{t(`chapterManagement.${status}`)}
				</Tag>
			),
		},
		{
			title: t('chapterManagement.createdAt'),
			dataIndex: 'createdAt',
			key: 'createdAt',
			width: 120,
			render: (date) => new Date(date).toLocaleDateString(),
		},
	];

	const lessonColumns = [
		{
			title: t('lessonManagement.lessonNumber'),
			dataIndex: 'order',
			key: 'order',
			width: 80,
			sorter: (a, b) => a.order - b.order,
			render: (order) => (
				<Tag color="green" style={{ textAlign: 'center', minWidth: '30px' }}>
					{order}
				</Tag>
			),
		},
		{
			title: t('lessonManagement.lessonName'),
			dataIndex: 'name',
			key: 'name',
			width: 200,
			sorter: (a, b) => a.name.localeCompare(b.name),
			render: (text) => (
				<div style={{ fontSize: '20px' }}>{text}</div>
			),
		},
		{
			title: t('chapterManagement.chapterName'),
			dataIndex: 'chapterName',
			key: 'chapterName',
			width: 120,
			render: (chapterName) => (
				<span>{chapterName}</span>
			),
		},
		{
			title: t('syllabusManagement.syllabusName'),
			dataIndex: 'syllabusName',
			key: 'syllabusName',
			width: 120,
			render: (syllabusName) => (
				<span>{syllabusName}</span>
			),
		},
		{
			title: t('lessonManagement.duration'),
			dataIndex: 'duration',
			key: 'duration',
			width: 100,
			render: (duration) => (
				<div style={{ textAlign: 'center' }}>
					<ClockCircleOutlined style={{ marginRight: '4px' }} />
					{duration}h
				</div>
			),
		},
		{
			title: t('lessonManagement.lessonType'),
			dataIndex: 'type',
			key: 'type',
			width: 120,
			render: (type) => (
				<span>{t(`lessonManagement.${type}`)}</span>
			),
		},
		{
			title: t('lessonManagement.status'),
			dataIndex: 'status',
			key: 'status',
			width: 100,
			render: (status) => (
				<Tag color={status === 'active' ? 'green' : 'red'}>
					{t(`lessonManagement.${status}`)}
				</Tag>
			),
		},
		{
			title: t('lessonManagement.createdAt'),
			dataIndex: 'createdAt',
			key: 'createdAt',
			width: 120,
			render: (date) => new Date(date).toLocaleDateString(),
		},
	];

	const getCurrentColumns = () => {
		switch (currentView) {
			case 'syllabuses':
				return syllabusColumns;
			case 'chapters':
				return chapterColumns;
			case 'lessons':
				return lessonColumns;
			default:
				return syllabusColumns;
		}
	};


	return (
		<SecurityWrapper requiredRoles={['MANAGER', 'ADMIN']}>
			<ThemedLayout>
				{/* Main Content Panel */}
				<div className={`main-content-panel ${theme}-main-panel`}>
						{/* Page Title */}
						<div className="page-title-container">
							<Typography.Title 
								level={1} 
								className="page-title"
							>
								{t('syllabusManagement.title')} <span className="student-count">({totalElements})</span>
							</Typography.Title>
						</div>

						{/* Action Bar */}
						<Row gutter={16} align="middle" style={{ marginBottom: '16px' }}>
					<Col flex="auto">
						<Space size="middle">
							<Input
								prefix={<SearchOutlined />}
								value={searchText}
								onChange={(e) => handleSearch(e.target.value)}
								className="search-input"
								style={{ minWidth: '350px', maxWidth: '500px', height: '40px', fontSize: '16px' }}
								allowClear
							/>
						</Space>
					</Col>
					<Col>
						<Space>
							<Button
								icon={<UploadOutlined />}
								className={`export-button ${theme}-export-button`}
								onClick={handleExport}
							>
								{t('syllabusManagement.exportData')}
								{selectedRowKeys.length > 0 && ` (${selectedRowKeys.length})`}
							</Button>
							<Button
								icon={<DownloadOutlined />}
								className={`import-button ${theme}-import-button`}
								onClick={handleImport}
							>
								{t('syllabusManagement.importSyllabuses')}
							</Button>
							{currentView === 'syllabuses' && (
								<Button
									icon={<PlusOutlined />}
									className="create-button"
									onClick={handleAdd}
								>
									{t('syllabusManagement.addSyllabus')}
								</Button>
							)}
						</Space>
					</Col>
				</Row>


				{/* Table Section */}
				<div className={`table-section ${theme}-table-section`}>
					<LoadingWithEffect
						loading={loading}
						message={t('syllabusManagement.loadingSyllabuses')}>
						<Table
							columns={getCurrentColumns()}
							dataSource={getCurrentData()}
							rowKey="id"
							loading={loading}
							pagination={currentView === 'syllabuses' ? {
								...pagination,
								showTotal: (total, range) => {
									const itemName = t('syllabusManagement.syllabuses');
									return `${range[0]}-${range[1]} ${t('syllabusManagement.paginationText')} ${total} ${itemName}`;
								},
							} : {
								total: getCurrentData().length,
								pageSize: 10,
								showSizeChanger: true,
								showTotal: (total, range) => {
									const itemName = currentView === 'chapters' ? t('chapterManagement.chapters') :
													t('lessonManagement.lessons');
									return `${range[0]}-${range[1]} ${t('syllabusManagement.paginationText')} ${total} ${itemName}`;
								},
							}}
							onChange={currentView === 'syllabuses' ? handleTableChange : undefined}
							scroll={{ x: currentView === 'lessons' ? 1200 : 1000 }}
						/>
					</LoadingWithEffect>
				</div>
			</div>

			{/* Bottom Action Bar - Jira Style */}
			{currentView === 'syllabuses' && (
				<BottomActionBar
					selectedCount={selectedRowKeys.length}
					onSelectAll={handleSelectAll}
					onDeleteAll={handleBulkDelete}
					onClose={() => setSelectedRowKeys([])}
					selectAllText={t('classManagement.selectAll')}
					deleteAllText={t('classManagement.deleteAll')}
				/>
			)}

		{/* Syllabus Modal */}
		<Modal
			title={
				<div style={{ textAlign: 'center', fontSize: '28px', fontWeight: '600', color: 'rgb(24, 144, 255)' }}>
					{t('syllabusManagement.editSyllabus')}
				</div>
			}
			open={isModalVisible}
				onCancel={handleModalClose}
				footer={null}
				width={600}
				destroyOnClose
			>
				<SyllabusForm 
					syllabus={editingSyllabus} 
					onClose={handleModalClose}
					onSuccess={handleRefresh}
				/>
			</Modal>


		{/* Delete Confirmation Modal */}
		<Modal
			title={
				<div style={{ 
					fontSize: '28px', 
					fontWeight: '600', 
					color: 'rgb(24, 144, 255)',
					textAlign: 'center',
					padding: '10px 0'
				}}>
					{t('syllabusManagement.confirmDelete')}
				</div>
			}
			open={isDeleteModalVisible}
				onOk={handleDelete}
				onCancel={handleDeleteModalClose}
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
						{t('syllabusManagement.confirmDeleteMessage')}
					</p>
					{deleteSyllabus && (
						<p style={{
							fontSize: '20px',
							color: '#000',
							margin: 0,
							fontWeight: '400'
						}}>
							<strong>{deleteSyllabus.name}</strong>
						</p>
					)}
				</div>
			</Modal>

		{/* Bulk Delete Confirmation Modal */}
		<Modal
			title={
				<div style={{ 
					fontSize: '28px', 
					fontWeight: '600', 
					color: 'rgb(24, 144, 255)',
					textAlign: 'center',
					padding: '10px 0'
				}}>
					{t('syllabusManagement.confirmBulkDelete')}
				</div>
			}
			open={isBulkDeleteModalVisible}
				onOk={handleBulkDeleteConfirm}
				onCancel={handleBulkDeleteModalClose}
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
						{t('syllabusManagement.confirmBulkDeleteMessage')}
					</p>
					<div style={{
						fontSize: '20px',
						color: '#000',
						margin: 0,
						fontWeight: '400'
					}}>
						<strong>{selectedRowKeys.length} {t('syllabusManagement.syllabuses')}</strong>
					</div>
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
					}}>
					<DownloadOutlined style={{ color: 'rgb(24, 144, 255)' }} /> {t('syllabusManagement.importSyllabuses')}
				</div>
				}
				open={importModal.visible}
				onOk={handleImportOk}
				onCancel={handleImportCancel}
				okText={t('syllabusManagement.import')}
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
							loading={templateDownloadLoading}
							disabled={templateDownloadLoading}
							style={{
								borderColor: '#1890ff',
								color: '#1890ff',
								height: '36px',
								fontSize: '14px',
								fontWeight: '500',
							}}>
							{t('syllabusManagement.downloadTemplate')}
						</Button>
					</div>

					<Typography.Title
						level={5}
						style={{
							textAlign: 'center',
							marginBottom: '20px',
							color: '#666',
						}}>
						{t('syllabusManagement.importInstructions')}
					</Typography.Title>

					<Upload.Dragger
						name="file"
						multiple={false}
						beforeUpload={handleFileSelect}
						showUploadList={false}
						accept=".xlsx,.xls"
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
							{t('syllabusManagement.clickOrDragFile')}
						</p>
						<p className='ant-upload-hint' style={{ color: '#999' }}>
							{t('syllabusManagement.supportedFormats')}: Excel (.xlsx, .xls)
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
									✅ {t('syllabusManagement.fileSelected')}:{' '}
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
					{t('syllabusManagement.exportData')}
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
						<Typography.Title level={4} style={{ color: '#666', marginBottom: '8px' }}>
							{t('syllabusManagement.chooseExportOption')}
						</Typography.Title>
						<Typography.Text style={{ color: '#999' }}>
							{t('syllabusManagement.exportDescription')}
						</Typography.Text>
					</div>

					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						{selectedRowKeys.length > 0 && (
							<Button
								type="primary"
								icon={<UploadOutlined />}
								onClick={handleExportSelected}
								loading={exportSelectedLoading}
								disabled={exportSelectedLoading}
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
								{t('syllabusManagement.exportSelected')} ({selectedRowKeys.length} {t('syllabusManagement.syllabuses')})
							</Button>
						)}

						<Button
							icon={<UploadOutlined />}
							onClick={handleExportAll}
							loading={exportAllLoading}
							disabled={exportAllLoading}
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
							{t('syllabusManagement.exportAll')} ({totalElements} {t('syllabusManagement.syllabuses')})
						</Button>
					</div>
				</div>
			</Modal>
		</ThemedLayout>
		</SecurityWrapper>
	);
};

export default SyllabusList;
