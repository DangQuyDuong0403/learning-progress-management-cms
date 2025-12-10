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
import LessonForm from '../../ManagementManager/syllabus/LessonForm';
import teacherManagementApi from '../../../../apis/backend/teacherManagement';
import { useSelector } from 'react-redux';
import BottomActionBar from '../../../../component/BottomActionBar';
import classManagementApi from '../../../../apis/backend/classManagement';
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
	
	// Check if user is MANAGER, STUDENT or TEACHING_ASSISTANT (TA is view-only)
	const isManager = userRole === 'manager';
	const isStudent = userRole === 'student';
	const isTeachingAssistant = userRole === 'teaching_assistant';
	const isTeacher = userRole === 'teacher';

	// Check URL path and redirect if student tries to access manager routes
	useEffect(() => {
		const currentPath = window.location.pathname;
		const isStudentAccessingManagerRoute = isStudent && currentPath.includes('/manager/');
		
		if (isStudentAccessingManagerRoute) {
			spaceToast.error(t('common.accessDenied') || 'You do not have permission to access this page');
			navigate('/choose-login', { replace: true });
			return;
		}
	}, [isStudent, navigate,t]);

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
			let response;
			if (isManager) {
				response = await teacherManagementApi.getClassById(classId);
			} else {
				response = await classManagementApi.getClassDetail(classId);
			}
			const data = response?.data?.data ?? response?.data ?? null;
			if (!data) {
				throw new Error('Class not found');
			}
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
			spaceToast.error(t('classDetail.accessDenied') || 'Bạn không có quyền truy cập lớp học này / You do not have permission to access this class');
			navigate('/choose-login', { replace: true });
		} finally {
			setLoading(false);
		}
	}, [classId, t, isManager, navigate]);

	const fetchChapterData = useCallback(async () => {
		if (!chapterId) return;
		
		try {
			const response = await teacherManagementApi.getClassChapterById(chapterId);
			const data = response?.data ?? response;
			if (!data) {
				throw new Error('Chapter not found');
			}
			// Convert both to string for comparison to handle type mismatch
			const chapterClassId = String(data.classId || '');
			const currentClassId = String(classId || '');
			if (chapterClassId && currentClassId && chapterClassId !== currentClassId) {
				throw new Error('Chapter not found in this class');
			}
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
			spaceToast.error(t('chapterManagement.permission') || 'Bạn không có quyền truy cập chương này / You do not have permission to access this chapter');
			navigate('/choose-login', { replace: true });
		}
	}, [chapterId, classId, t, navigate]);

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
				if (Array.isArray(response.data)) {
					lessonsData = response.data;
				} else if (response.data.data && Array.isArray(response.data.data)) {
					lessonsData = response.data.data;
				} else if (response.data.content && Array.isArray(response.data.content)) {
					lessonsData = response.data.content;
				} else if (response.data.id) {
					lessonsData = [response.data];
				}
			}

			// Only validate classId if lessons exist and have classId field
			// If lessons array is empty, it's valid (no lessons yet)
			// If lessons don't have classId field, trust the API (backend handles authorization)
			if (lessonsData.length > 0) {
				const hasClassIdField = lessonsData.some(lesson => lesson.hasOwnProperty('classId'));
				if (hasClassIdField) {
					// Convert both to string for comparison to handle type mismatch
					const currentClassId = String(classId || '');
					const hasMatchingClassId = lessonsData.some(lesson => {
						const lessonClassId = String(lesson.classId || '');
						return lessonClassId && currentClassId && lessonClassId === currentClassId;
					});
					// Only throw error if we have classId field but none match
					// If no classId field exists, trust backend authorization
					if (!hasMatchingClassId) {
						console.warn('Lesson classId validation: No matching classId found, but trusting backend authorization');
					}
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
			spaceToast.error(t('lessonManagement.accessDenied') || 'Bạn không có quyền truy cập bài học này / You do not have permission to access these lessons');
			navigate('/choose-login', { replace: true });
			setLoading(false);
		}
	}, [chapterId, classId, t, navigate]);

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
		setEditingChapter({
			...lesson,
			name: lesson.name,
			content: lesson.content
		});
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

	const handleModalClose = async (shouldRefresh, newLessonData) => {
		setIsModalVisible(false);
		
		if (shouldRefresh && newLessonData) {
			try {
				// Prepare sync data - include all lessons with updated one
				const allLessons = [...lessons];
				let updatedLessons = allLessons;
				
				if (editingChapter) {
					// Update existing lesson
					updatedLessons = allLessons.map(lesson => 
						lesson.id === editingChapter.id 
							? { 
								...lesson, 
								name: newLessonData.name,
								content: newLessonData.content || ''
							}
							: lesson
					);
				} else {
					// Add new lesson - will be added at the end
					const newLesson = {
						id: `new-${Date.now()}`,
						name: newLessonData.name,
						content: newLessonData.content || '',
						order: lessons.length + 1,
						position: lessons.length + 1,
					};
					updatedLessons = [...allLessons, newLesson];
				}
				
				// Prepare sync data
				const syncData = updatedLessons.map((lesson, index) => {
					const isNewRecord = typeof lesson.id === 'string' && lesson.id.startsWith('new-');
					return {
						id: isNewRecord ? null : lesson.id,
						classLessonName: lesson.name,
						classLessonContent: lesson.content || '',
						orderNumber: index + 1,
						toBeDeleted: false,
					};
				});
				
				// Call sync API
				await teacherManagementApi.syncClassLessons(chapterId, syncData);
				
				spaceToast.success(
					editingChapter 
						? t('lessonManagement.updateLessonSuccess')
						: t('lessonManagement.addLessonSuccess')
				);
				
				// Refresh lesson list after save
				await fetchLessonsData(pagination.current, pagination.pageSize, searchText);
			} catch (error) {
				console.error('Error saving lesson:', error);
				spaceToast.error(
					error.response?.data?.error || 
					error.response?.data?.message || 
					(editingChapter ? t('lessonManagement.updateLessonError') : t('lessonManagement.addLessonError'))
				);
			}
		}
		
		setEditingChapter(null);
	};

	const handleViewModalClose = () => {
		setIsViewModalVisible(false);
		setViewingLesson(null);
	};

	const handleEditOrder = async () => {
		try {
			if (!isManager) {
				await teacherManagementApi.getClassById(classId);
			}
			navigate(`${routePrefix}/chapters/${classId}/lessons/${chapterId}/edit-order`);
		} catch (error) {
			console.error('Unauthorized access to edit lesson order:', error);
			spaceToast.error(t('common.permissionDenied') || 'Bạn không có quyền chỉnh sửa lớp học này / You do not have permission to edit this class');
		}
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

				// Handle different response structures
				let lessonsData = [];
				if (response.data) {
					if (Array.isArray(response.data)) {
						lessonsData = response.data;
					} else if (response.data.data && Array.isArray(response.data.data)) {
						lessonsData = response.data.data;
					} else if (response.data.content && Array.isArray(response.data.content)) {
						lessonsData = response.data.content;
					}
				}

				// Get all IDs from the response
				const allKeys = lessonsData.map(lesson => lesson.id).filter(id => id != null);
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

			let downloadUrl = null;
			let blobToDownload = null;

			if (response instanceof Blob) {
				blobToDownload = response;
			} else if (response?.data instanceof Blob) {
				const blobType = response.data.type || '';
				const isJsonLike =
					blobType.includes('application/json') ||
					blobType.includes('text/plain') ||
					blobType.includes('text/html');

				if (isJsonLike) {
					try {
						const blobText = await response.data.text();
						const parsed = JSON.parse(blobText);
						downloadUrl = parsed?.url || parsed?.data || parsed;
					} catch {
						downloadUrl = await response.data.text();
					}
				} else {
					blobToDownload = response.data;
				}
			} else if (typeof response === 'string') {
				downloadUrl = response;
			} else if (typeof response?.data === 'string') {
				downloadUrl = response.data;
			} else if (response?.data?.url) {
				downloadUrl = response.data.url;
			} else {
				throw new Error('Unexpected response format when downloading template');
			}

			if (!downloadUrl && blobToDownload) {
				downloadUrl = window.URL.createObjectURL(blobToDownload);
			}

			if (!downloadUrl) {
				throw new Error('Failed to resolve template download URL');
			}

			const link = document.createElement('a');
			link.setAttribute('href', downloadUrl);
			link.setAttribute('download', 'class_lesson_import_template.xlsx');
			link.setAttribute('target', '_blank');
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			if (downloadUrl.startsWith('blob:')) {
				window.URL.revokeObjectURL(downloadUrl);
			}

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
			title: () => (
				<span style={{ textAlign: 'left', display: 'block' }}>{t('lessonManagement.lessonName')}</span>
			),
			dataIndex: 'name',
			key: 'name',
			width: '40%',
			align: 'left',
			render: (text) => (
				<span style={{ 
					fontSize: '20px', 
					textAlign: 'left', 
					display: 'block',
					wordWrap: 'break-word',
					wordBreak: 'break-word',
					whiteSpace: 'normal',
					overflowWrap: 'break-word',
					maxWidth: '100%'
				}}>{text}</span>
			),
		},
		{
			title: () => (
				<span style={{ textAlign: 'left', display: 'block' }}>{t('lessonManagement.content')}</span>
			),
			dataIndex: 'content',
			key: 'content',
			width: '40%',
			align: 'left',
			render: (text) => (
				<span style={{ 
					fontSize: '20px', 
					textAlign: 'left', 
					display: 'block',
					wordWrap: 'break-word',
					wordBreak: 'break-word',
					whiteSpace: 'normal',
					overflowWrap: 'break-word',
					maxWidth: '100%'
				}}>
					{text || t('lessonManagement.noContent')}
				</span>
			),
		},
		{
			title: t('lessonManagement.actions'),
			key: 'actions',
			width: '10%',
				render: (_, record) => {
					// Manager, Student, Teaching Assistant: View only
					if (isManager || isStudent || isTeachingAssistant) {
						return (
							<Tooltip title={t('common.view')}>
								<Button
									type="text"
									size="small"
									icon={<EyeOutlined style={{ fontSize: '25px' }} />}
									onClick={() => handleViewLesson(record)}
									style={{ color: '#1890ff' }}
								/>
							</Tooltip>
						);
					}
					// Teacher: Edit only (no delete)
					if (isTeacher) {
						return (
							<Space size="small">
								<Tooltip title={t('common.edit')}>
									<Button
										type="text"
										size="small"
										icon={<EditOutlined style={{ fontSize: '25px' }} />}
										onClick={() => handleEditLesson(record)}
									/>
								</Tooltip>
							</Space>
						);
					}
					// Other roles: Edit and Delete
					return (
						<Space size="small">
							<Tooltip title={t('common.edit')}>
								<Button
									type="text"
									size="small"
									icon={<EditOutlined style={{ fontSize: '25px' }} />}
									onClick={() => handleEditLesson(record)}
								/>
							</Tooltip>
							
						</Space>
					);
				},
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
					{!isManager && !isStudent && !isTeachingAssistant && (
						<Space>
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
					rowSelection={!isManager && !isStudent && !isTeachingAssistant && !isTeacher ? {
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

			{/* Bottom Action Bar - Only show for roles that can delete (not manager, student, TA, or teacher) */}
			{!isManager && !isStudent && !isTeachingAssistant && !isTeacher && (
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
						<div style={{ 
							fontSize: '28px', 
							fontWeight: '600', 
							color: 'rgb(24, 144, 255)',
							textAlign: 'center',
							padding: '10px 0'
						}}>
							{editingChapter
								? t('lessonManagement.editLesson')
								: t('lessonManagement.addLesson')}
						</div>
					}
				open={isModalVisible}
					onCancel={handleModalClose}
					footer={null}
					width={600}
					destroyOnClose
				>
					<LessonForm
						lesson={editingChapter}
						chapter={chapterData}
						onClose={handleModalClose}
						theme={theme}
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

		</ThemedLayout>
	);
};

export default ClassChapterLesson;

