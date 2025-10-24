import React, { useState, useEffect, useCallback } from 'react';
import {
	Table,
	Button,
	Space,
	Modal,
	message,
	Input,
	Row,
	Col,
	Typography,
	Divider,
	Alert,
	Progress,
	Upload,
} from 'antd';
import {
	SearchOutlined,
	DownloadOutlined,
	DragOutlined,
	UploadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import usePageTitle from '../../../../hooks/usePageTitle';
import {
	fetchLessonsByChapter,
} from '../../../../redux/syllabus';
import syllabusManagementApi from '../../../../apis/backend/syllabusManagement';
import { spaceToast } from '../../../../component/SpaceToastify';
import './SyllabusList.css';
import ThemedLayout from '../../../../component/ThemedLayout';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useSyllabusMenu } from '../../../../contexts/SyllabusMenuContext';
import LessonForm from './LessonForm';
import LoadingWithEffect from '../../../../component/spinner/LoadingWithEffect';
import BottomActionBar from '../../../../component/BottomActionBar';

const LessonListPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { syllabusId, chapterId } = useParams();
	const { theme } = useTheme();
	const { enterSyllabusMenu, exitSyllabusMenu } = useSyllabusMenu();
	const dispatch = useDispatch();
	const { lessons, loading, lessonsPagination } = useSelector((state) => state.syllabus);

	// Set page title
	usePageTitle('Lesson Management');

	// State management
	const [searchText, setSearchText] = useState('');
	const [searchTimeout, setSearchTimeout] = useState(null);
	const [chapterInfo, setChapterInfo] = useState(null);
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);
	const [totalElements, setTotalElements] = useState(0);
	const [isInitialLoading, setIsInitialLoading] = useState(true);

	// Modal states
	const [isBulkDeleteModalVisible, setIsBulkDeleteModalVisible] = useState(false);
	const [isFormModalVisible, setIsFormModalVisible] = useState(false);
	const [editingLesson, setEditingLesson] = useState(null);
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

	// Fetch lessons from API using Redux
	const fetchLessons = useCallback(async (page = 1, size = 10, search = '') => {
		if (!chapterId) return;
		
		const params = {
			page: page - 1, // API uses 0-based indexing
			size: size,
		};
		
		// Add search parameter if provided
		if (search && search.trim()) {
			params.searchText = search.trim();
		}

		dispatch(fetchLessonsByChapter({ chapterId: parseInt(chapterId), params }));
	}, [chapterId, dispatch]);

	// Fetch chapter info
	const fetchChapterInfo = useCallback(async () => {
		if (!chapterId || !syllabusId) return;
		
		try {
			const response = await syllabusManagementApi.getChaptersBySyllabusId(syllabusId, {
				params: { page: 0, size: 100 }
			});
			
			// Find the specific chapter
			const chapter = response.data.find(c => c.id === parseInt(chapterId));
			if (chapter) {
				setChapterInfo({
					id: chapter.id,
					name: chapter.chapterName,
					description: chapter.description,
				});
			}
		} catch (error) {
			console.error('Error fetching chapter info:', error);
		}
	}, [chapterId, syllabusId]);

	useEffect(() => {
		const fetchData = async () => {
			setIsInitialLoading(true);
			await Promise.all([
				fetchLessons(1, pagination.pageSize, searchText),
				fetchChapterInfo()
			]);
			setIsInitialLoading(false);
		};
		fetchData();
	}, [fetchLessons, fetchChapterInfo, searchText, pagination.pageSize]);

	// Fetch syllabus info for header and enter syllabus menu
	useEffect(() => {
		const fetchSyllabusInfo = async () => {
			if (!syllabusId || !chapterInfo) return;
			
			try {
				const response = await syllabusManagementApi.getSyllabuses({
					params: { page: 0, size: 100 }
				});
				
				const syllabus = response.data.find(s => s.id === parseInt(syllabusId));
				if (syllabus) {
					enterSyllabusMenu({
						id: syllabus.id,
						name: syllabus.syllabusName,
						description: syllabus.description,
						chapterName: chapterInfo.name,
					});
				}
			} catch (error) {
				console.error('Error fetching syllabus info:', error);
			}
		};

		fetchSyllabusInfo();
		
		return () => {
			exitSyllabusMenu();
		};
	}, [syllabusId, chapterInfo, enterSyllabusMenu, exitSyllabusMenu]);

	// Update pagination when Redux state changes
	useEffect(() => {
		if (lessonsPagination) {
			setPagination(prev => ({
				...prev,
				total: lessonsPagination.totalElements || 0,
			}));
			setTotalElements(lessonsPagination.totalElements || 0);
		}
	}, [lessonsPagination]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
		};
	}, [searchTimeout]);

	const handleEditOrder = () => {
		navigate(`/manager/syllabuses/${syllabusId}/chapters/${chapterId}/lessons/edit-order`);
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
			setPagination(prev => ({
				...prev,
				current: 1,
			}));
			fetchLessons(1, pagination.pageSize, value);
		}, 1000);
		
		setSearchTimeout(newTimeout);
	};

	const handleTableChange = (newPagination) => {
		// Update local pagination state
		setPagination(prev => ({
			...prev,
			current: newPagination.current,
			pageSize: newPagination.pageSize,
		}));
		
		// Fetch data with new pagination
		fetchLessons(newPagination.current, newPagination.pageSize, searchText);
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

				const response = await syllabusManagementApi.getLessonsByChapterId(chapterId, params);

				// Get all IDs from the response
				const allKeys = response.data.map(lesson => lesson.id);
				setSelectedRowKeys(allKeys);
			} catch (error) {
				console.error('Error fetching all lesson IDs:', error);
				message.error('Error selecting all items');
			}
		} else {
			setSelectedRowKeys([]);
		}
	};


	// Bulk actions
	const handleDeleteAll = () => {
		if (selectedRowKeys.length === 0) {
			message.warning(t('lessonManagement.selectItemsToDelete'));
			return;
		}
		setIsBulkDeleteModalVisible(true);
	};

	const handleDeleteAllConfirm = async () => {
		try {
			// TODO: Implement bulk delete API call
			// await syllabusManagementApi.bulkDeleteLessons(selectedRowKeys);
			
			// Update local state
			setSelectedRowKeys([]);
			
			message.success(t('lessonManagement.deleteAllSuccess'));
			setIsBulkDeleteModalVisible(false);
			
			// Refresh the lesson list
			fetchLessons(pagination.current, pagination.pageSize, searchText);
		} catch (error) {
			console.error('Error deleting all lessons:', error);
			message.error(t('lessonManagement.deleteAllError'));
		}
	};

	const handleDeleteAllModalClose = () => {
		setIsBulkDeleteModalVisible(false);
	};

	const handleFormModalClose = () => {
		setIsFormModalVisible(false);
		setEditingLesson(null);
	};

	const handleFormSubmit = async (success, lessonData) => {
		if (success) {
			// TODO: Implement API call to save lesson
			// if (editingLesson) {
			//     await syllabusManagementApi.updateLesson(editingLesson.id, lessonData);
			// } else {
			//     await syllabusManagementApi.createLesson(lessonData);
			// }
			
			// Refresh the lesson list
			fetchLessons(pagination.current, pagination.pageSize, searchText);
		}
		// Always close modal regardless of success or cancel
		handleFormModalClose();
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
			
			const response = await syllabusManagementApi.downloadLessonTemplate();
			
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
			link.setAttribute('download', 'lesson_import_template.xlsx');
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
			formData.append('chapterId', chapterId);
			
			// Call validate API with FormData
			const response = await syllabusManagementApi.validateLessonImportFile(formData);

			// API trả về file validation result dưới dạng blob
			if (response.data instanceof Blob) {
				// Tạo URL từ blob để download
				const downloadUrl = window.URL.createObjectURL(response.data);
				
				// Tạo link download
				const link = document.createElement('a');
				link.setAttribute('href', downloadUrl);
				link.setAttribute('download', `lesson_validation_result_${new Date().getTime()}.xlsx`);
				link.setAttribute('target', '_blank');
				link.style.visibility = 'hidden';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				
				// Cleanup URL
				window.URL.revokeObjectURL(downloadUrl);
				
				spaceToast.success(t('lessonManagement.validateSuccess') + ' - ' + t('lessonManagement.fileDownloaded'));
			} else {
				// Nếu không phải blob, có thể là JSON response với URL
				let downloadUrl;
				
				if (typeof response.data === 'string') {
					downloadUrl = response.data;
				} else if (response.data && response.data.url) {
					downloadUrl = response.data.url;
				}
				
				if (downloadUrl) {
					const link = document.createElement('a');
					link.setAttribute('href', downloadUrl);
					link.setAttribute('download', `lesson_validation_result_${new Date().getTime()}.xlsx`);
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
			
			// Xử lý lỗi chi tiết hơn
			let errorMessage = t('lessonManagement.validateError');
			
			if (error.response?.data) {
				if (error.response.data instanceof Blob) {
					// Nếu lỗi trả về dưới dạng blob, đọc text để lấy thông báo lỗi
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
			
			// Add chapterId to the request
			formData.append('chapterId', chapterId);

			// Simulate progress for better UX
			const progressInterval = setInterval(() => {
				setImportModal((prev) => ({
					...prev,
					progress: Math.min(prev.progress + 10, 90)
				}));
			}, 200);

			const response = await syllabusManagementApi.importLessons(formData);
			
			clearInterval(progressInterval);
			setImportModal((prev) => ({ ...prev, progress: 100 }));
			
			// Handle different response formats
			const importedCount = response.data?.importedCount || 
								 response.data?.data?.importedCount || 
								 response.data?.count || 0;
			
			const successMessage = importedCount > 0 
				? `${t('lessonManagement.importSuccess')} ${importedCount} ${t('lessonManagement.lessons')}`
				: t('lessonManagement.importSuccessNoData');

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
				fetchLessons(pagination.current, pagination.pageSize, searchText);
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

	// Use Redux state for lessons data
	const filteredLessons = lessons;


	const columns = [
		{
			title: t('lessonManagement.stt'),
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
			width: '20%',
			render: (text) => (
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
			title: t('lessonManagement.content'),
			dataIndex: 'content',
			key: 'content',
			width: '45%',
			render: (content) => (
				<div style={{ 
					maxWidth: '400px',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					whiteSpace: 'nowrap'
				}}>
					{content || 'N/A'}
				</div>
			),
		},
	];

	if (!chapterInfo || isInitialLoading) {
		return (
			<ThemedLayout>
				{/* Main Content Panel */}
				<div className={`main-content-panel ${theme}-main-panel`}>
					<div style={{ textAlign: 'center', padding: '50px' }}>
						<LoadingWithEffect
							loading={true}
							message={t('common.loading')}
						>
							<div></div>
						</LoadingWithEffect>
					</div>
				</div>
			</ThemedLayout>
		);
	}

	return (
		<ThemedLayout>
			{/* Main Content Panel */}
			<div className={`main-content-panel ${theme}-main-panel`}>
			{/* Page Title */}
			<div className="page-title-container" style={{ marginBottom: '24px' }}>
				<Typography.Title 
					level={1} 
					className="page-title"
					style={{ margin: 0, textAlign: 'center' }}
				>
					{t('lessonManagement.title')} <span className="student-count">({totalElements})</span>
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
					</Col>
				</Row>


				{/* Table Section */}
				<div className={`table-section ${theme}-table-section`}>
					<Table
						columns={columns}
						dataSource={filteredLessons}
						rowKey="id"
						loading={loading}
						pagination={{
							...pagination,
							showQuickJumper: true,
							showTotal: (total, range) => {
								return `${range[0]}-${range[1]} ${t('lessonManagement.paginationText')} ${total} ${t('lessonManagement.lessons')}`;
							},
						}}
						onChange={handleTableChange}
						scroll={{ x: 1000 }}
					/>
				</div>
			</div>

			{/* Bottom Action Bar */}
			<BottomActionBar
				selectedCount={selectedRowKeys.length}
				onSelectAll={handleSelectAll}
				onDeleteAll={handleDeleteAll}
				onClose={() => setSelectedRowKeys([])}
				selectAllText={t('classManagement.selectAll')}
				deleteAllText={t('classManagement.deleteAll')}
			/>

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

		{/* Lesson Form Modal */}
		<Modal
			title={
				<div style={{ textAlign: 'center', fontSize: '28px', fontWeight: '600', color: 'rgb(24, 144, 255)' }}>
					{editingLesson
						? t('lessonManagement.editLesson')
						: t('lessonManagement.addLesson')}
				</div>
			}
			open={isFormModalVisible}
			onCancel={handleFormModalClose}
			footer={null}
			width={600}
			destroyOnClose
			bodyStyle={{
				padding: '30px 40px',
				fontSize: '16px',
				lineHeight: '1.6'
			}}
		>
				<LessonForm
					lesson={editingLesson}
					chapter={chapterInfo}
					onClose={handleFormSubmit}
					theme={theme}
				/>
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
				}}>
					<DownloadOutlined style={{ color: 'rgb(24, 144, 255)' }} /> {t('lessonManagement.importLessons')}
				</div>
			}
			open={importModal.visible}
				onCancel={handleImportCancel}
				width={600}
				centered
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

export default LessonListPage;
