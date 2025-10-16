import React, { useState, useEffect, useCallback } from 'react';
import {
	Table,
	Button,
	Space,
	Modal,
	message,
	Input,
	Card,
	Row,
	Col,
	Tooltip,
	Upload,
	Typography,
	Divider,
	Progress,
	Alert,
} from 'antd';
import {
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	SearchOutlined,
	ReloadOutlined,
	PlayCircleOutlined,
	ArrowLeftOutlined,
	SwapOutlined,
	UploadOutlined,
	DownloadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
	fetchLessonsByChapter,
} from '../../../../redux/syllabus';
import syllabusManagementApi from '../../../../apis/backend/syllabusManagement';
import { spaceToast } from '../../../../component/SpaceToastify';
import './SyllabusList.css';
import ThemedLayout from '../../../../component/ThemedLayout';
import { useTheme } from '../../../../contexts/ThemeContext';

const { Dragger } = Upload;
const { Title, Text } = Typography;

const LessonListPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { syllabusId, chapterId } = useParams();
	const { theme } = useTheme();
	const dispatch = useDispatch();
	const { lessons, loading, lessonsPagination } = useSelector((state) => state.syllabus);

	// State management
	const [searchText, setSearchText] = useState('');
	const [searchTimeout, setSearchTimeout] = useState(null);
	const [chapterInfo, setChapterInfo] = useState(null);

	// Modal states
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
	const [deleteLesson, setDeleteLesson] = useState(null);
	const [importModal, setImportModal] = useState({
		visible: false,
		fileList: [],
		uploading: false,
		progress: 0,
		error: null,
	});

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
		fetchLessons(1, pagination.pageSize, searchText);
		fetchChapterInfo();
	}, [fetchLessons, fetchChapterInfo, searchText, pagination.pageSize]);

	// Update pagination when Redux state changes
	useEffect(() => {
		if (lessonsPagination) {
			setPagination(prev => ({
				...prev,
				total: lessonsPagination.totalElements || 0,
			}));
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

	const handleAdd = () => {
		navigate(`/manager/syllabuses/${syllabusId}/chapters/${chapterId}/lessons/form`);
	};

	const handleEdit = (lesson) => {
		navigate(`/manager/syllabuses/${syllabusId}/chapters/${chapterId}/lessons/${lesson.id}/edit`);
	};

	const handleDeleteClick = (lesson) => {
		setDeleteLesson(lesson);
		setIsDeleteModalVisible(true);
	};

	const handleDelete = async () => {
		try {
			await dispatch(deleteLesson(deleteLesson.id));
			message.success(t('lessonManagement.deleteLessonSuccess'));
			setIsDeleteModalVisible(false);
			setDeleteLesson(null);
			// Refresh the list
			fetchLessons(pagination.current, pagination.pageSize, searchText);
		} catch (error) {
			console.error('Error deleting lesson:', error);
			message.error(t('lessonManagement.deleteLessonError'));
		}
	};

	const handleDeleteModalClose = () => {
		setIsDeleteModalVisible(false);
		setDeleteLesson(null);
	};


	const handleRefresh = () => {
		fetchLessons(pagination.current, pagination.pageSize, searchText);
	};

	const handleBackToChapters = () => {
		navigate(`/manager/syllabuses/${syllabusId}/chapters`);
	};

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
			fetchLessons(1, pagination.pageSize, value);
		}, 1000);
		
		setSearchTimeout(newTimeout);
	};

	const handleTableChange = (pagination) => {
		fetchLessons(pagination.current, pagination.pageSize, searchText);
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

	const handleExportTemplate = async () => {
		try {
			const response = await syllabusManagementApi.downloadLessonTemplate();
			
			console.log('Template response:', response);
			console.log('Is response a Blob?', response instanceof Blob);
			console.log('Response size:', response.size);
			console.log('Response type:', response.type);
			
			// If response is already a blob (which it seems to be), use it directly
			let blob;
			if (response instanceof Blob) {
				blob = response;
				console.log('Response is already a blob, using directly');
			} else if (response.data instanceof Blob) {
				blob = response.data;
				console.log('Using response.data blob');
			} else {
				// Create blob from response data
				blob = new Blob([response.data], { 
					type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
				});
				console.log('Created new blob from response data');
			}
			
			console.log('Final blob:', blob);
			console.log('Blob type:', blob.type);
			console.log('Blob size:', blob.size);
			
			// Validate blob
			if (blob.size === 0) {
				throw new Error('Downloaded file is empty');
			}
			
			// Create download link
			const link = document.createElement('a');
			const url = URL.createObjectURL(blob);
			link.href = url;
			link.download = 'lesson_template.xlsx';
			link.style.display = 'none';
			
			// Trigger download
			document.body.appendChild(link);
			link.click();
			
			// Cleanup
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			spaceToast.success(t('lessonManagement.templateDownloaded'));
		} catch (error) {
			console.error('Error downloading template:', error);
			spaceToast.error(t('lessonManagement.templateDownloadError'));
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

	const handleImportOk = async () => {
		if (importModal.fileList.length === 0) {
			message.warning(t('lessonManagement.selectFileToImport'));
			return;
		}

		const file = importModal.fileList[0];
		
		// Validate file type
		const allowedTypes = [
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
			'application/vnd.ms-excel', // .xls
			'text/csv', // .csv
		];
		
		if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
			message.error(t('lessonManagement.invalidFileType'));
			return;
		}

		// Validate file size (max 10MB)
		const maxSize = 10 * 1024 * 1024; // 10MB
		if (file.size > maxSize) {
			message.error(t('lessonManagement.fileTooLarge'));
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
			formData.append('file', file.originFileObj);
			
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

	// Use Redux state for lessons data
	const filteredLessons = lessons;

	const columns = [
		{
			title: 'No',
			key: 'index',
			width: '10%',
			render: (_, __, index) => {
				// Calculate index based on current page and page size
				const currentPage = pagination.current || 1;
				const pageSize = pagination.pageSize || 10;
				return (currentPage - 1) * pageSize + index + 1;
			},
		},
		{
			title: t('lessonManagement.lessonName'),
			dataIndex: 'name',
			key: 'name',
			width: '30%',
			sorter: (a, b) => a.name.localeCompare(b.name),
			render: (text) => (
				<div style={{ fontWeight: 'bold', fontSize: '16px' }}>
					{text}
				</div>
			),
		},
		{
			title: t('lessonManagement.content'),
			dataIndex: 'content',
			key: 'content',
			width: '35%',
			render: (content) => (
				<div style={{ 
					maxWidth: '300px',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					whiteSpace: 'nowrap'
				}}>
					{content || 'N/A'}
				</div>
			),
		},
		{
			title: t('lessonManagement.createdBy'),
			dataIndex: 'createdBy',
			key: 'createdBy',
			width: '15%',
			render: (createdBy) => (
				<div style={{ fontWeight: '500' }}>
					{createdBy || 'N/A'}
				</div>
			),
		},
		{
			title: t('lessonManagement.createdAt'),
			dataIndex: 'createdAt',
			key: 'createdAt',
			width: '15%',
			render: (date) => (
				<div>
					{new Date(date).toLocaleDateString()}
				</div>
			),
		},
		{
			title: t('lessonManagement.actions'),
			key: 'actions',
			width: '10%',
			render: (_, record) => (
				<Space size="small">
					<Tooltip title={t('common.edit')}>
						<Button
							type="text"
							size="small"
							icon={<EditOutlined style={{ fontSize: '20px' }} />}
							onClick={() => handleEdit(record)}
						/>
					</Tooltip>
					<Tooltip title={t('common.delete')}>
						<Button
							type="text"
							size="small"
							icon={<DeleteOutlined style={{ fontSize: '20px' }} />}
							onClick={() => handleDeleteClick(record)}
						/>
					</Tooltip>
				</Space>
			),
		},
	];

	if (!chapterInfo) {
		return (
			<ThemedLayout>
				<div className="lesson-list-container">
					<Card>
						<div style={{ textAlign: 'center', padding: '50px' }}>
							<h3>{t('lessonManagement.chapterNotFound')}</h3>
							<Button type="primary" onClick={handleBackToChapters}>
								{t('lessonManagement.backToChapters')}
							</Button>
						</div>
					</Card>
				</div>
			</ThemedLayout>
		);
	}

	return (
		<ThemedLayout>
			<div className="lesson-list-container">
				{/* Main Container Card */}
				<Card className="main-container-card">
					{/* Back Button */}
					<div style={{ marginBottom: '16px' }}>
						<Button 
							type="text" 
							icon={<ArrowLeftOutlined />}
							onClick={handleBackToChapters}
							style={{ padding: '4px 8px' }}
						>
							{t('common.back')}
						</Button>
					</div>

					{/* Header */}
					<div style={{ marginBottom: '24px' }}>
						<h2 
							style={{ 
								margin: 0, 
								fontSize: '24px', 
								fontWeight: 'bold',
								color: theme === 'space' ? '#ffffff' : '#000000'
							}}
						>
							<PlayCircleOutlined style={{ marginRight: '8px' }} />
							{t('lessonManagement.title')} - {chapterInfo.name}
						</h2>
					</div>

					

					{/* Action Bar */}
					<Row gutter={16} align="middle" style={{ marginBottom: '16px' }}>
						<Col flex="auto">
							<Input
								prefix={<SearchOutlined />}
								value={searchText}
								onChange={(e) => handleSearch(e.target.value)}
								className="search-input"
								style={{ minWidth: '350px', maxWidth: '500px', height: '40px', fontSize: '16px' }}
								allowClear
							/>
						</Col>
						<Col>
							<Space>
								<Button
									icon={<ReloadOutlined />}
									className={`refresh-button ${theme}-refresh-button`}
									onClick={handleRefresh}
									loading={loading}
								>
									{t('lessonManagement.refresh')}
								</Button>
								<Button
									icon={<DownloadOutlined />}
									className="import-button"
									onClick={handleImportLesson}
								>
									{t('lessonManagement.importLessons')}
								</Button>
								<Button
									icon={<SwapOutlined rotate={90} />}
									onClick={handleEditOrder}
									style={{
										background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
										color: '#ffffff',
										border: 'none',
										fontWeight: 500,
									}}
								>
									{t('lessonManagement.editOrder')}
								</Button>
								<Button
									icon={<PlusOutlined />}
									className="create-button"
									onClick={handleAdd}
								>
									{t('lessonManagement.addLesson')}
								</Button>
							</Space>
						</Col>
					</Row>

					{/* Table Card */}
					<Card className="table-card">
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
					</Card>
				</Card>

				{/* Delete Confirmation Modal */}
				<Modal
					title={t('lessonManagement.confirmDelete')}
					open={isDeleteModalVisible}
					onOk={handleDelete}
					onCancel={handleDeleteModalClose}
					okText={t('common.yes')}
					cancelText={t('common.no')}
					okButtonProps={{ danger: true }}>
					<p>{t('lessonManagement.confirmDeleteMessage')}</p>
					{deleteLesson && (
						<p>
							<strong>{deleteLesson.name}</strong>
						</p>
					)}
				</Modal>

				{/* Import Modal */}
				<Modal
					title={
						<div
							style={{
								fontSize: '20px',
								fontWeight: '600',
								color: '#1890ff',
								textAlign: 'center',
								padding: '10px 0',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: '10px',
							}}>
							<DownloadOutlined />
							{t('lessonManagement.importLessons')}
						</div>
					}
					open={importModal.visible}
					onOk={handleImportOk}
					onCancel={handleImportCancel}
					okText={t('lessonManagement.import')}
					cancelText={t('common.cancel')}
					width={600}
					centered
					confirmLoading={importModal.uploading}
					okButtonProps={{
						disabled: importModal.fileList.length === 0 || importModal.uploading,
						style: {
							backgroundColor: '#52c41a',
							borderColor: '#52c41a',
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
					}}>
					<div style={{ padding: '20px 0' }}>
						<Title
							level={5}
							style={{
								textAlign: 'center',
								marginBottom: '20px',
								color: '#666',
							}}>
							{t('lessonManagement.importInstructions')}
						</Title>

						{/* Progress Bar */}
						{importModal.uploading && (
							<div style={{ marginBottom: '20px' }}>
								<Progress 
									percent={importModal.progress} 
									status={importModal.progress === 100 ? 'success' : 'active'}
									strokeColor={{
										'0%': '#108ee9',
										'100%': '#87d068',
									}}
								/>
								<div style={{ textAlign: 'center', marginTop: '8px', color: '#666' }}>
									{importModal.progress < 100 ? t('lessonManagement.uploading') : t('lessonManagement.processing')}
								</div>
							</div>
						)}

						{/* Error Display */}
						{importModal.error && (
							<div style={{ marginBottom: '20px' }}>
								<Alert
									message={t('lessonManagement.importError')}
									description={importModal.error}
									type="error"
									showIcon
									closable
									onClose={() => setImportModal((prev) => ({ ...prev, error: null }))}
								/>
							</div>
						)}

						{/* Export Template Button */}
						<div style={{ textAlign: 'center', marginBottom: '20px' }}>
							<Button
								icon={<DownloadOutlined />}
								type="dashed"
								onClick={handleExportTemplate}
								style={{
									borderColor: '#1890ff',
									color: '#1890ff',
									height: '40px',
									fontSize: '16px',
									fontWeight: '500',
									padding: '0 20px',
								}}>
								{t('lessonManagement.exportTemplate')}
							</Button>
						</div>

						<Dragger
							multiple={false}
							accept='.xlsx,.xls,.csv'
							fileList={importModal.fileList}
							onChange={({ fileList }) => {
								// Limit to 1 file
								const limitedFileList = fileList.slice(-1);
								setImportModal((prev) => ({ ...prev, fileList: limitedFileList }));
							}}
							beforeUpload={(file) => {
								// Validate file type
								const allowedTypes = [
									'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
									'application/vnd.ms-excel',
									'text/csv',
								];
								
								const isValidType = allowedTypes.includes(file.type) || 
									file.name.match(/\.(xlsx|xls|csv)$/i);
								
								if (!isValidType) {
									message.error(t('lessonManagement.invalidFileType'));
									return false;
								}
								
								// Validate file size (max 10MB)
								const maxSize = 10 * 1024 * 1024;
								if (file.size > maxSize) {
									message.error(t('lessonManagement.fileTooLarge'));
									return false;
								}
								
								return false; // Prevent auto upload
							}}
							style={{
								marginBottom: '20px',
								border: '2px dashed #d9d9d9',
								borderRadius: '8px',
								background: '#fafafa',
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
								{t('lessonManagement.supportedFormats')}: Excel (.xlsx, .xls), CSV (.csv)
							</p>
							<p className='ant-upload-hint' style={{ color: '#ff7875', fontSize: '12px' }}>
								{t('lessonManagement.maxFileSize')}: 10MB
							</p>
						</Dragger>

						<Divider />

						<div
							style={{
								background: '#f6f8fa',
								padding: '16px',
								borderRadius: '8px',
								border: '1px solid #e1e4e8',
							}}>
							<Title level={5} style={{ marginBottom: '12px', color: '#24292e' }}>
								📋 {t('lessonManagement.fileFormat')}
							</Title>
							<Text
								style={{ color: '#586069', fontSize: '14px', lineHeight: '1.6' }}>
								{t('lessonManagement.fileFormatDescription')}
							</Text>

							<div
								style={{ marginTop: '12px', fontSize: '13px', color: '#6a737d' }}>
								<div>
									<strong>{t('lessonManagement.requiredColumns')}:</strong>
								</div>
								<div>• name, description, duration, type</div>
								<div>
									<strong>{t('lessonManagement.optionalColumns')}:</strong>
								</div>
								<div>• order (thứ tự bài học)</div>
								<div>• note (ghi chú)</div>
							</div>
						</div>

						{importModal.fileList.length > 0 && (
							<div
								style={{
									marginTop: '16px',
									padding: '16px',
									background: '#e6f7ff',
									border: '1px solid #91d5ff',
									borderRadius: '8px',
								}}>
								<div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
									<Text style={{ color: '#1890ff', fontWeight: '600', fontSize: '16px' }}>
										✅ {t('lessonManagement.fileSelected')}
									</Text>
								</div>
								<div style={{ marginBottom: '8px' }}>
									<Text style={{ color: '#1890ff', fontWeight: '500' }}>
										📄 {importModal.fileList[0].name}
									</Text>
								</div>
								<div style={{ fontSize: '12px', color: '#666' }}>
									<Text>
										📊 {t('lessonManagement.fileSize')}: {(importModal.fileList[0].size / 1024 / 1024).toFixed(2)} MB
									</Text>
								</div>
								<div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
									<Text>
										📅 {t('lessonManagement.lastModified')}: {new Date(importModal.fileList[0].lastModified).toLocaleString()}
									</Text>
								</div>
							</div>
						)}
					</div>
				</Modal>
			</div>
		</ThemedLayout>
	);
};

export default LessonListPage;
