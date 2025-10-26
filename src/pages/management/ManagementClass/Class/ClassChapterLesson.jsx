import React, { useState, useEffect, useCallback } from 'react';
import {
	Table,
	Button,
	Space,
	Modal,
	Input,
	Row,
	Col,
	Tooltip,
	Typography,
	Divider,
	Alert,
	Progress,
	Upload,
} from 'antd';
import {
	EditOutlined,
	DeleteOutlined,
	SearchOutlined,
	DownloadOutlined,
	DragOutlined,
	UploadOutlined,
	EyeOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import ThemedLayoutWithSidebar from '../../../../component/ThemedLayout';
import ThemedLayoutNoSidebar from '../../../../component/teacherlayout/ThemedLayout';
import TableSpinner from '../../../../component/spinner/TableSpinner';
import { spaceToast } from '../../../../component/SpaceToastify';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useClassMenu } from '../../../../contexts/ClassMenuContext';
import usePageTitle from '../../../../hooks/usePageTitle';
import ChapterForm from '../../ManagementManager/syllabus/ChapterForm';
import teacherManagementApi from '../../../../apis/backend/teacherManagement';
import { useSelector } from 'react-redux';
import BottomActionBar from '../../../../component/BottomActionBar';
import './ClassChapterLesson.css';


const ClassChapterLesson = () => {
	const { t } = useTranslation();
	const { classId, chapterId } = useParams();
	const navigate = useNavigate();
	const { theme } = useTheme();
	const { user } = useSelector((state) => state.auth);
	const { enterClassMenu, exitClassMenu } = useClassMenu();
	
	// Determine which layout to use based on user role
	const userRole = user?.role?.toLowerCase();
	const ThemedLayout = (userRole === 'teacher' || userRole === 'teaching_assistant' || userRole === 'student') 
		? ThemedLayoutNoSidebar 
		: ThemedLayoutWithSidebar;
	
	// Check if user is MANAGER or STUDENT (view-only access)
	const isManager = userRole === 'manager';
	const isStudent = userRole === 'student';

	// Check URL path and redirect if student tries to access manager routes
	useEffect(() => {
		const currentPath = window.location.pathname;
		const isStudentAccessingManagerRoute = isStudent && currentPath.includes('/manager/');
		
		if (isStudentAccessingManagerRoute) {
			console.log('Student trying to access manager route, redirecting to 404');
			navigate('/404', { replace: true });
			return;
		}
	}, [isStudent, navigate]);

	// Set page title
	usePageTitle('Class Chapter & Lesson');

	// State management
	const [loading, setLoading] = useState(false);
	const [classData, setClassData] = useState(null);
	const [chapterData, setChapterData] = useState(null);
	const [lessons, setLessons] = useState([]);
	const [searchText, setSearchText] = useState('');
	const [searchTimeout, setSearchTimeout] = useState(null);
	const [totalElements, setTotalElements] = useState(0);
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);

	// Modal states
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
	const [isBulkDeleteModalVisible, setIsBulkDeleteModalVisible] = useState(false);
	const [isViewModalVisible, setIsViewModalVisible] = useState(false);
	const [editingChapter, setEditingChapter] = useState(null);
	const [deleteItem, setDeleteItem] = useState(null);
	const [viewingLesson, setViewingLesson] = useState(null);
	const [importModal, setImportModal] = useState({
		visible: false,
		fileList: [],
		uploading: false,
		progress: 0,
		error: null,
	});

	// Loading states for buttons
	const [templateDownloadLoading, setTemplateDownloadLoading] = useState(false);
	const [validateLoading, setValidateLoading] = useState(false);

	// Pagination state
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 10,
		total: 0,
		showSizeChanger: true,
		showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
	});

	// Determine route prefix based on user role
	const getRoutePrefix = () => {
		const userRole = user?.role?.toLowerCase();
		switch (userRole) {
			case 'manager':
				return '/manager/classes';
			case 'teacher':
				return '/teacher/classes';
			case 'teaching_assistant':
				return '/teaching-assistant/classes';
			case 'student':
				return '/student/classes';
			default:
				return '/manager/classes';
		}
	};

	const routePrefix = getRoutePrefix();

	const fetchClassData = useCallback(async () => {
		if (!classId) return;
		
		setLoading(true);
		try {
			const response = await teacherManagementApi.getClassById(classId);
			const data = response?.data ?? response;
			setClassData({
				id: classId,
				name: data?.name ?? data?.className ?? data?.title ?? '',
				syllabus: {
					id: data?.syllabusId,
					name: data?.syllabusName,
				}
			});
		} catch (error) {
			console.error('Error fetching class info:', error);
			spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message || 'Error fetching class info');
		} finally {
			setLoading(false);
		}
	}, [classId, t]);

	const fetchChapterData = useCallback(async () => {
		if (!chapterId) return;
		
		try {
			const response = await teacherManagementApi.getClassChapterById(chapterId);
			const data = response?.data ?? response;
			setChapterData({
				id: chapterId,
				name: data?.classChapterName,
				description: data?.description,
				order: data?.orderNumber,
				createdBy: data?.createdBy,
				createdAt: data?.createdAt,
			});
		} catch (error) {
			console.error('Error fetching chapter info:', error);
			spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message || 'Error fetching chapter info');
		}
	}, [chapterId, t]);

	const fetchLessonsData = useCallback(async (page = 1, size = 10, search = '') => {
		if (!chapterId) return;
		
		setLoading(true);
		try {
			const params = {
				classChapterId: chapterId,
				page: page - 1, // API uses 0-based indexing
				size: size,
			};
			
			// Add search parameter if provided
			if (search && search.trim()) {
				params.searchText = search.trim();
			}

			const response = await teacherManagementApi.getClassLessons(params);
			
			// Handle different response structures
			let lessonsData = [];
			if (response.data) {
				// Check if response.data is an array
				if (Array.isArray(response.data)) {
					lessonsData = response.data;
				} 
				// Check if response.data has a data property (nested structure)
				else if (response.data.data && Array.isArray(response.data.data)) {
					lessonsData = response.data.data;
				}
				// Check if response.data has content property (Spring Boot pagination)
				else if (response.data.content && Array.isArray(response.data.content)) {
					lessonsData = response.data.content;
				}
				// If it's a single object, wrap it in array
				else if (response.data.id) {
					lessonsData = [response.data];
				}
			}
			
			// Map API response to component format
			const mappedLessons = lessonsData.map((lesson) => ({
				id: lesson.id,
				name: lesson.classLessonName,
				content: lesson.classLessonContent,
				order: lesson.orderNumber,
				createdBy: lesson.createdBy,
				createdAt: lesson.createdAt,
			}));

			setLessons(mappedLessons);
			setTotalElements(response.totalElements || lessonsData.length);
			setPagination(prev => ({
				...prev,
				current: page,
				pageSize: size,
				total: response.totalElements || lessonsData.length,
			}));
			setLoading(false);
		} catch (error) {
			console.error('Error fetching lessons:', error);
			spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message || 'Error fetching lessons');
			setLoading(false);
		}
	}, [chapterId, t]);

	useEffect(() => {
		fetchClassData();
		fetchChapterData();
		fetchLessonsData(1, pagination.pageSize, searchText);
	}, [fetchClassData, fetchChapterData, fetchLessonsData, searchText, pagination.pageSize]);

	// Handle class menu updates - separate effects to avoid infinite loops
	useEffect(() => {
		if (classId) {
			enterClassMenu({ id: classId });
		}
		return () => exitClassMenu();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [classId]);

	useEffect(() => {
		if (classData && chapterData && classId) {
			enterClassMenu({
				id: classData.id,
				name: classData.name,
				description: `${classData.name} / ${chapterData.name}`,
				backUrl: `${routePrefix}/chapters/${classId}` // Custom back URL to chapters list
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [classData?.id, classData?.name, chapterData?.name, classId]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
		};
	}, [searchTimeout]);

	const handleEditLesson = (lesson) => {
		setEditingChapter(lesson);
		setIsModalVisible(true);
	};

	const handleViewLesson = (lesson) => {
		setViewingLesson(lesson);
		setIsViewModalVisible(true);
	};

	const handleDeleteLessonClick = (lesson) => {
		setDeleteItem(lesson);
		setIsDeleteModalVisible(true);
	};

	const handleDeleteLesson = async () => {
		try {
			// TODO: Implement delete lesson API call
			// await teacherManagementApi.deleteLesson(deleteItem.id);
			
			// Update local state
			setLessons(lessons.filter(l => l.id !== deleteItem.id));
			
			spaceToast.success(t('lessonManagement.deleteLessonSuccess'));
			setIsDeleteModalVisible(false);
			setDeleteItem(null);
		} catch (error) {
			console.error('Error deleting lesson:', error);
			spaceToast.error(t('lessonManagement.deleteLessonError'));
		}
	};

	const handleDeleteModalClose = () => {
		setIsDeleteModalVisible(false);
		setDeleteItem(null);
	};

	const handleModalClose = () => {
		setIsModalVisible(false);
		setEditingChapter(null);
	};

	const handleViewModalClose = () => {
		setIsViewModalVisible(false);
		setViewingLesson(null);
	};

	const handleEditOrder = () => {
		navigate(`${routePrefix}/chapters/${classId}/lessons/${chapterId}/edit-order`);
	};

	// Checkbox logic
	const handleSelectAll = async (checked) => {
		if (checked) {
			try {
				// Fetch all lesson IDs from API (without pagination)
				const params = {
					page: 0,
					size: totalElements, // Get all items
				};
				
				// Add search parameter if provided
				if (searchText && searchText.trim()) {
					params.searchText = searchText.trim();
				}

				const response = await teacherManagementApi.getClassLessons({
					classChapterId: chapterId,
					...params
				});

				// Get all IDs from the response
				const allKeys = response.data.map(lesson => lesson.id);
				setSelectedRowKeys(allKeys);
			} catch (error) {
				console.error('Error fetching all lesson IDs:', error);
				spaceToast.error('Error selecting all items');
			}
		} else {
			setSelectedRowKeys([]);
		}
	};

	// Bulk actions
	const handleDeleteAll = () => {
		if (selectedRowKeys.length === 0) {
			spaceToast.warning(t('lessonManagement.selectItemsToDelete'));
			return;
		}
		setIsBulkDeleteModalVisible(true);
	};

	const handleDeleteAllConfirm = async () => {
		try {
			// TODO: Implement bulk delete API call
			// await teacherManagementApi.bulkDeleteLessons(selectedRowKeys);
			
			// Update local state
			setLessons(lessons.filter(l => !selectedRowKeys.includes(l.id)));
			setSelectedRowKeys([]);
			
			spaceToast.success(t('lessonManagement.deleteAllSuccess'));
			setIsBulkDeleteModalVisible(false);
			
			// Refresh the lesson list
			fetchLessonsData(pagination.current, pagination.pageSize, searchText);
		} catch (error) {
			console.error('Error deleting all lessons:', error);
			spaceToast.error(t('lessonManagement.deleteAllError'));
		}
	};

	const handleDeleteAllModalClose = () => {
		setIsBulkDeleteModalVisible(false);
	};

	const handleImportLesson = () => {
		setImportModal({ 
			visible: true, 
			fileList: [], 
			uploading: false, 
			progress: 0, 
			error: null 
		});
	};

	const handleDownloadTemplate = async () => {
		setTemplateDownloadLoading(true);
		try {
			const response = await teacherManagementApi.downloadClassLessonTemplate();
			
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
			link.setAttribute('download', 'class_lesson_import_template.xlsx');
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

	const handleValidateFile = async () => {
		if (importModal.fileList.length === 0) {
			spaceToast.warning(t('lessonManagement.selectFileToValidate'));
			return;
		}

		setValidateLoading(true);
		
		try {
			const file = importModal.fileList[0];
			
			// Create FormData object
			const formData = new FormData();
			formData.append('file', file);
			
			// Call validate API with classId as parameter and FormData
			const response = await teacherManagementApi.validateClassLessonImportFile(classId, formData);

			// API returns validation result file as blob
			if (response.data instanceof Blob) {
				// Create URL from blob to download
				const downloadUrl = window.URL.createObjectURL(response.data);
				
				// Create download link
				const link = document.createElement('a');
				link.setAttribute('href', downloadUrl);
				link.setAttribute('download', `class_lesson_validation_result_${new Date().getTime()}.xlsx`);
				link.setAttribute('target', '_blank');
				link.style.visibility = 'hidden';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				
				// Cleanup URL
				window.URL.revokeObjectURL(downloadUrl);
				
				spaceToast.success(t('lessonManagement.validateSuccess') + ' - ' + t('lessonManagement.fileDownloaded'));
			} else {
				// If not blob, might be JSON response with URL
				let downloadUrl;
				
				if (typeof response.data === 'string') {
					downloadUrl = response.data;
				} else if (response.data && response.data.url) {
					downloadUrl = response.data.url;
				}
				
				if (downloadUrl) {
					const link = document.createElement('a');
					link.setAttribute('href', downloadUrl);
					link.setAttribute('download', `class_lesson_validation_result_${new Date().getTime()}.xlsx`);
					link.setAttribute('target', '_blank');
					link.style.visibility = 'hidden';
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
					
					spaceToast.success(t('lessonManagement.validateSuccess') + ' - ' + t('lessonManagement.fileDownloaded'));
				} else {
					spaceToast.success(response.message || t('lessonManagement.validateSuccess'));
				}
			}
		} catch (error) {
			console.error('Error validating file:', error);
			
			// Handle error in more detail
			let errorMessage = t('lessonManagement.validateError');
			
			if (error.response?.data) {
				if (error.response.data instanceof Blob) {
					// If error returns as blob, read text to get error message
					try {
						const errorText = await error.response.data.text();
						const errorJson = JSON.parse(errorText);
						errorMessage = errorJson.error || errorJson.message || errorMessage;
					} catch (parseError) {
						errorMessage = error.message || errorMessage;
					}
				} else if (error.response.data.error) {
					errorMessage = error.response.data.error;
				} else if (error.response.data.message) {
					errorMessage = error.response.data.message;
				}
			} else if (error.message) {
				errorMessage = error.message;
			}
			
			spaceToast.error(errorMessage);
		} finally {
			setValidateLoading(false);
		}
	};

	const handleImportOk = async () => {
		if (importModal.fileList.length === 0) {
			spaceToast.warning(t('lessonManagement.selectFileToImport'));
			return;
		}

		const file = importModal.fileList[0];
		
		// Validate file type
		const allowedTypes = [
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
			'application/vnd.ms-excel', // .xls
		];
		
		if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
			spaceToast.error(t('lessonManagement.invalidFileType'));
			return;
		}

		// Validate file size (max 10MB)
		const maxSize = 10 * 1024 * 1024; // 10MB
		if (file.size > maxSize) {
			spaceToast.error(t('lessonManagement.fileTooLarge'));
			return;
		}

		setImportModal((prev) => ({ 
			...prev, 
			uploading: true, 
			progress: 0, 
			error: null 
		}));

		try {
			const formData = new FormData();
			formData.append('file', file.originFileObj || file);

			// Simulate progress for better UX
			const progressInterval = setInterval(() => {
				setImportModal((prev) => ({
					...prev,
					progress: Math.min(prev.progress + 10, 90)
				}));
			}, 200);

			// Call import API with classId as parameter and FormData
			const response = await teacherManagementApi.importClassLessons(classId, formData);
			
			clearInterval(progressInterval);
			setImportModal((prev) => ({ ...prev, progress: 100 }));
			
			// Use backend message if available, otherwise fallback to translation
			const successMessage = response.message || t('lessonManagement.importSuccess');
			spaceToast.success(successMessage);

			// Delay closing modal to show completion
			setTimeout(() => {
				setImportModal({ 
					visible: false, 
					fileList: [], 
					uploading: false, 
					progress: 0, 
					error: null 
				});
				
				// Refresh the lesson list
				fetchLessonsData(pagination.current, pagination.pageSize, searchText);
			}, 1000);
			
		} catch (error) {
			console.error('Error importing lessons:', error);
			
			// Handle different error formats
			let errorMessage = t('lessonManagement.importError');
			let errorDetails = '';
			
			if (error.response?.data?.message) {
				errorMessage = error.response.data.message;
			} else if (error.response?.data?.error) {
				errorMessage = error.response.data.error;
			} else if (error.message) {
				errorMessage = error.message;
			}
			
			// Extract more detailed error information
			if (error.response?.data?.details) {
				errorDetails = error.response.data.details;
			} else if (error.response?.data?.errors) {
				errorDetails = Array.isArray(error.response.data.errors) 
					? error.response.data.errors.join(', ')
					: error.response.data.errors;
			}
			
			setImportModal((prev) => ({ 
				...prev, 
				uploading: false, 
				progress: 0,
				error: errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage
			}));
			
			spaceToast.error(errorMessage);
		}
	};

	const handleImportCancel = () => {
		setImportModal({ 
			visible: false, 
			fileList: [], 
			uploading: false, 
			progress: 0, 
			error: null 
		});
	};

	// Handle file selection
	const handleFileSelect = (file) => {
		// Validate file type
		const allowedTypes = [
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
			'application/vnd.ms-excel', // .xls
		];
		
		if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
			spaceToast.error(t('lessonManagement.invalidFileType'));
			return false;
		}
		
		// Validate file size (max 10MB)
		const maxSize = 10 * 1024 * 1024; // 10MB
		if (file.size > maxSize) {
			spaceToast.error(t('lessonManagement.fileTooLarge'));
			return false;
		}
		
		setImportModal(prev => ({
			...prev,
			fileList: [file]
		}));
		
		return false; // Prevent default upload behavior
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
			fetchLessonsData(1, pagination.pageSize, value);
		}, 1000);
		
		setSearchTimeout(newTimeout);
	};

	const handleTableChange = (pagination) => {
		fetchLessonsData(pagination.current, pagination.pageSize, searchText);
	};

	// No need for client-side filtering since API handles filtering
	const filteredLessons = lessons;


	const lessonColumns = [
		{
			title: t('common.index'),
			key: 'index',
			width: '10%',
			render: (_, __, index) => {
				// Calculate index based on current page and page size
				const currentPage = pagination.current || 1;
				const pageSize = pagination.pageSize || 10;
				return (
					<span style={{ fontSize: '20px' }}>
						{(currentPage - 1) * pageSize + index + 1}
					</span>
				);
			},
		},
		{
			title: t('lessonManagement.lessonName'),
			dataIndex: 'name',
			key: 'name',
			width: '80%',
			render: (text) => (
				<span style={{ fontSize: '20px' }}>{text}</span>
			),
		},
		{
			title: t('lessonManagement.actions'),
			key: 'actions',
			width: '10%',
			render: (_, record) => (
				!isManager && !isStudent ? (
					<Space size="small">
						<Tooltip title={t('common.edit')}>
							<Button
								type="text"
								size="small"
								icon={<EditOutlined style={{ fontSize: '25px' }} />}
								onClick={() => handleEditLesson(record)}
							/>
						</Tooltip>
						<Tooltip title={t('common.delete')}>
						<Button
							type="text"
							size="small"
							icon={<DeleteOutlined style={{ fontSize: '25px' }} />}
								onClick={() => handleDeleteLessonClick(record)}
						/>
						</Tooltip>
					</Space>
				) : (
					<Tooltip title={t('common.view')}>
						<Button
							type="text"
							size="small"
							icon={<EyeOutlined style={{ fontSize: '25px' }} />}
							onClick={() => handleViewLesson(record)}
							style={{ color: '#1890ff' }}
						/>
					</Tooltip>
				)
			),
		},
	];


	if (!classData || !chapterData) {
		return (
			<ThemedLayout>
				{/* Main Content Panel */}
				<div className={`main-content-panel ${theme}-main-panel`}>
					<TableSpinner />
				</div>
			</ThemedLayout>
		);
	}

	return (
		<ThemedLayout>
			{/* Main Content Panel */}
			<div className={`main-content-panel ${theme}-main-panel`}>
				{/* Page Title */}
				<div className="page-title-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
				
					<Typography.Title 
						level={1} 
						className="page-title"
						style={{ margin: 0, flex: 1, textAlign: 'center' }}
					>
					{t('lessonManagement.title')} <span className="student-count">({totalElements})</span>
					</Typography.Title>
					<div style={{ width: '100px' }}></div> {/* Spacer để cân bằng layout */}
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
							{!isManager && !isStudent && (
								<Space>
									<Button
									icon={<DownloadOutlined />}
									className={`import-button ${theme}-import-button`}
									onClick={handleImportLesson}
								>
									{t('lessonManagement.importLessons')}
									</Button>
									<Button
									icon={<DragOutlined />}
									onClick={handleEditOrder}
									className="create-button"
								>
									{t('common.edit')}
									</Button>
								</Space>
							)}
						</Col>
					</Row>

				{/* Table Section */}
				<div className={`table-section ${theme}-table-section`}>
					<Table
						columns={lessonColumns}
						dataSource={filteredLessons}
						rowKey="id"
						loading={loading}
						rowSelection={!isManager && !isStudent ? {
							selectedRowKeys,
							onChange: setSelectedRowKeys,
							onSelectAll: handleSelectAll,
						} : null}
						pagination={{
							...pagination,
							showTotal: (total, range) => {
								return `${range[0]}-${range[1]} ${t('lessonManagement.paginationText')} ${total} ${t('lessonManagement.lessons')}`;
							},
						}}
						onChange={handleTableChange}
						scroll={{ x: 1000 }}
					/>
				</div>
			</div>

			{/* Bottom Action Bar - Only show for non-manager and non-student roles */}
			{!isManager && !isStudent && (
				<BottomActionBar
					selectedCount={selectedRowKeys.length}
					onSelectAll={handleSelectAll}
					onDeleteAll={handleDeleteAll}
					onClose={() => setSelectedRowKeys([])}
					selectAllText={t('classManagement.selectAll')}
					deleteAllText={t('classManagement.deleteAll')}
				/>
			)}

			{/* Lesson Modal */}
				<Modal
					title={
						editingChapter
						? t('lessonManagement.editLesson')
						: t('lessonManagement.addLesson')
					}
				open={isModalVisible}
					onCancel={handleModalClose}
					footer={null}
					width={600}
					destroyOnClose
				>
					<ChapterForm
						chapter={editingChapter}
						syllabus={classData?.syllabus}
						onClose={handleModalClose}
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
						{t('lessonManagement.confirmDelete')}
					</div>
				}
					open={isDeleteModalVisible}
				onOk={handleDeleteLesson}
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
					{t('lessonManagement.confirmDeleteMessage')}
				</p>
				{deleteItem && (
					<p style={{
						fontSize: '20px',
						color: '#000',
						margin: 0,
						fontWeight: '400'
					}}>
						<strong>{deleteItem.name}</strong>
					</p>
				)}
				</div>
			</Modal>

			{/* Delete All Confirmation Modal */}
			<Modal
				title={
					<div style={{
						fontSize: '28px',
						fontWeight: '600',
						color: 'rgb(24, 144, 255)',
						textAlign: 'center',
						padding: '10px 0'
					}}>
						{t('lessonManagement.confirmDeleteAll')}
					</div>
				}
				open={isBulkDeleteModalVisible}
				onOk={handleDeleteAllConfirm}
				onCancel={handleDeleteAllModalClose}
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
					{t('lessonManagement.confirmDeleteAllMessage')}
				</p>
				<div style={{
					fontSize: '20px',
					color: '#000',
					margin: 0,
					fontWeight: '400'
				}}>
					<strong>{selectedRowKeys.length} {t('lessonManagement.lessons')}</strong>
				</div>
				</div>
				</Modal>

			{/* View Lesson Modal */}
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
						gap: '10px',
					}}>
						 {t('lessonManagement.lessonName')}
					</div>
				}
				open={isViewModalVisible}
				onCancel={handleViewModalClose}
				width={600}
				centered
				footer={[
					<Button 
						key="close" 
						onClick={handleViewModalClose}
						style={{
							height: '32px',
							fontWeight: '500',
							fontSize: '16px',
							padding: '4px 15px',
							width: '100px'
						}}>
						{t('common.close')}
					</Button>
				]}>
				<div style={{ padding: '20px 0' }}>
					{viewingLesson && (
						<div>
							<div style={{ marginBottom: '20px' }}>
								<Typography.Title level={5} style={{ marginBottom: '8px', color: '#666' }}>
									{t('lessonManagement.lessonName')}:
								</Typography.Title>
								<Typography.Text style={{ fontSize: '18px', fontWeight: '500' }}>
									{viewingLesson.name}
								</Typography.Text>
							</div>
							
							<div style={{ marginBottom: '20px' }}>
								<Typography.Title level={5} style={{ marginBottom: '8px', color: '#666' }}>
									{t('lessonManagement.content')}:
								</Typography.Title>
								<Typography.Text style={{ fontSize: '16px', lineHeight: '1.6' }}>
									{viewingLesson.content || t('lessonManagement.noContent')}
								</Typography.Text>
							</div>

							<div style={{ marginBottom: '20px' }}>
								<Typography.Title level={5} style={{ marginBottom: '8px', color: '#666' }}>
									{t('lessonManagement.createdBy')}:
								</Typography.Title>
								<Typography.Text style={{ fontSize: '16px' }}>
									{viewingLesson.createdBy || t('common.notAvailable')}
								</Typography.Text>
							</div>

							<div>
								<Typography.Title level={5} style={{ marginBottom: '8px', color: '#666' }}>
									{t('lessonManagement.createdAt')}:
								</Typography.Title>
								<Typography.Text style={{ fontSize: '16px' }}>
									{viewingLesson.createdAt ? new Date(viewingLesson.createdAt).toLocaleDateString() : t('common.notAvailable')}
								</Typography.Text>
							</div>
						</div>
					)}
				</div>
			</Modal>

			{/* Import Modal */}
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
						gap: '10px',
					}}>
						<DownloadOutlined style={{ color: 'rgb(24, 144, 255)' }} />
						{t('lessonManagement.importLessons')}
					</div>
				}
				open={importModal.visible}
				onCancel={handleImportCancel}
				width={600}
				centered
				confirmLoading={importModal.uploading}
				footer={[
					<Button 
						key="cancel" 
						onClick={handleImportCancel}
						style={{
							height: '32px',
							fontWeight: '500',
							fontSize: '16px',
							padding: '4px 15px',
							width: '100px'
						}}>
						{t('common.cancel')}
					</Button>,
					<Button 
						key="validate" 
						onClick={handleValidateFile}
						loading={validateLoading}
						disabled={importModal.fileList.length === 0 || validateLoading}
						style={{
							background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
							borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
							color: theme === 'sun' ? '#000' : '#fff',
							borderRadius: '6px',
							height: '32px',
							fontWeight: '500',
							fontSize: '16px',
							padding: '4px 15px',
							width: '120px',
							transition: 'all 0.3s ease',
							boxShadow: 'none',
							marginLeft: '8px'
						}}>
						{t('lessonManagement.validateFile')}
					</Button>,
					<Button 
						key="import" 
						type="primary"
						onClick={handleImportOk}
						loading={importModal.uploading}
						disabled={importModal.fileList.length === 0 || importModal.uploading}
						style={{
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
							boxShadow: 'none',
							marginLeft: '8px'
						}}>
						{t('lessonManagement.import')}
					</Button>
				]}>
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
							{t('lessonManagement.downloadTemplate')}
						</Button>
					</div>

					<Typography.Title
						level={5}
						style={{
							textAlign: 'center',
							marginBottom: '20px',
							color: '#666',
						}}>
						{t('lessonManagement.importInstructions')}
					</Typography.Title>

					<Upload.Dragger
						name="file"
						multiple={false}
						beforeUpload={handleFileSelect}
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
							<UploadOutlined />
						</p>
						<p
							className='ant-upload-text'
							style={{ fontSize: '16px', fontWeight: '500' }}>
							{t('lessonManagement.clickOrDragFile')}
						</p>
						<p className='ant-upload-hint' style={{ color: '#999' }}>
							{t('lessonManagement.supportedFormats')}: Excel (.xlsx, .xls)
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
									✅ {t('lessonManagement.fileSelected')}:{' '}
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

					{importModal.uploading && (
						<div style={{ marginTop: '16px' }}>
							<Progress 
								percent={importModal.progress} 
								status={importModal.progress === 100 ? 'success' : 'active'}
								strokeColor={{
									'0%': '#108ee9',
									'100%': '#87d068',
								}}
							/>
							<div style={{ textAlign: 'center', marginTop: '8px', color: '#666' }}>
								{importModal.progress < 100 ? t('lessonManagement.uploading') : t('lessonManagement.uploadComplete')}
							</div>
						</div>
					)}

					{importModal.error && (
						<Alert
							message={t('lessonManagement.importError')}
							description={importModal.error}
							type="error"
							showIcon
							style={{ marginTop: '16px' }}
						/>
					)}
			</div>
			</Modal>
		</ThemedLayout>
	);
};

export default ClassChapterLesson;
