import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
	Table,
	Button,
	Space,
	Modal,
	message,
	Input,
	Row,
	Col,
	Tooltip,
	Upload,
	Typography,
	Divider,
	Progress,
	Alert,
	Checkbox,
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
	DragOutlined,
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
import LessonForm from './LessonForm';
import LoadingWithEffect from '../../../../component/spinner/LoadingWithEffect';

const { Dragger } = Upload;
const { Title, Text } = Typography;

const LessonListBySyllabus = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { syllabusId } = useParams();
	const { theme } = useTheme();
	const dispatch = useDispatch();

	// State management
	const [searchText, setSearchText] = useState('');
	const [searchTimeout, setSearchTimeout] = useState(null);
	const [syllabusInfo, setSyllabusInfo] = useState(null);
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);
	const [totalElements, setTotalElements] = useState(0);
	const [isInitialLoading, setIsInitialLoading] = useState(true);
	const [lessons, setLessons] = useState([]);
	const [loading, setLoading] = useState(false);

	// Modal states
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
	const [isBulkDeleteModalVisible, setIsBulkDeleteModalVisible] = useState(false);
	const [isFormModalVisible, setIsFormModalVisible] = useState(false);
	const [deleteLesson, setDeleteLesson] = useState(null);
	const [editingLesson, setEditingLesson] = useState(null);
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

	// Fetch lessons from API using syllabusId
	const fetchLessons = useCallback(async (page = 1, size = 10, search = '') => {
		if (!syllabusId) return;
		
		setLoading(true);
		try {
			const params = {
				page: page - 1, // API uses 0-based indexing
				size: size,
			};
			
			// Add search parameter if provided
			if (search && search.trim()) {
				params.searchText = search.trim();
			}

			const response = await syllabusManagementApi.getLessonsBySyllabusId(syllabusId, params);

			// Map API response to component format
			const mappedLessons = response.data.map((lesson) => ({
				id: lesson.id,
				name: lesson.lessonName,
				content: lesson.content || '',
				duration: lesson.duration || 0,
				lessonType: lesson.lessonType || 'theory',
				materials: lesson.materials || '',
				homework: lesson.homework || '',
				objectives: lesson.objectives || '',
				status: lesson.status || 'active',
				createdBy: lesson.createdBy || lesson.createdByUser || 'N/A',
			}));

			setLessons(mappedLessons);
			setTotalElements(response.totalElements || response.data.length);
			setPagination(prev => ({
				...prev,
				current: page,
				pageSize: size,
				total: response.totalElements || response.data.length,
			}));
		} catch (error) {
			console.error('Error fetching lessons:', error);
			spaceToast.error(t('lessonManagement.loadLessonsError'));
		} finally {
			setLoading(false);
		}
	}, [syllabusId, t]);

	// Fetch syllabus info
	const fetchSyllabusInfo = useCallback(async () => {
		if (!syllabusId) return;
		
		try {
			const response = await syllabusManagementApi.getSyllabuses({
				params: { page: 0, size: 100 }
			});
			
			// Find the specific syllabus
			const syllabus = response.data.find(s => s.id === parseInt(syllabusId));
			if (syllabus) {
				setSyllabusInfo({
					id: syllabus.id,
					name: syllabus.syllabusName,
					description: syllabus.description,
				});
			}
		} catch (error) {
			console.error('Error fetching syllabus info:', error);
		}
	}, [syllabusId]);

	useEffect(() => {
		const fetchData = async () => {
			setIsInitialLoading(true);
			await Promise.all([
				fetchLessons(1, pagination.pageSize, searchText),
				fetchSyllabusInfo()
			]);
			setIsInitialLoading(false);
		};
		fetchData();
	}, [fetchLessons, fetchSyllabusInfo, searchText, pagination.pageSize]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
		};
	}, [searchTimeout]);

	const handleAdd = () => {
		setEditingLesson(null);
		setIsFormModalVisible(true);
	};

	const handleEdit = (lesson) => {
		setEditingLesson(lesson);
		setIsFormModalVisible(true);
	};

	const handleDeleteClick = (lesson) => {
		setDeleteLesson(lesson);
		setIsDeleteModalVisible(true);
	};

	const handleDelete = async () => {
		try {
			await syllabusManagementApi.deleteLesson(deleteLesson.id);
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
		navigate(`/manager/syllabuses/${syllabusId}/lessons/edit-order`);
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

				const response = await syllabusManagementApi.getLessonsBySyllabusId(syllabusId, params);

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

	const handleSelectRow = (record, checked) => {
		if (checked) {
			setSelectedRowKeys(prev => [...prev, record.id]);
		} else {
			setSelectedRowKeys(prev => prev.filter(key => key !== record.id));
		}
	};

	// Bulk actions
	const handleBulkDelete = () => {
		if (selectedRowKeys.length === 0) {
			message.warning(t('lessonManagement.selectItemsToDelete'));
			return;
		}
		setIsBulkDeleteModalVisible(true);
	};

	const handleBulkExport = () => {
		if (selectedRowKeys.length === 0) {
			message.warning(t('lessonManagement.selectItemsToExport'));
			return;
		}
		// TODO: Implement bulk export functionality
		message.success(t('lessonManagement.bulkExportSuccess'));
	};

	const handleBulkDeleteConfirm = async () => {
		try {
			// TODO: Implement bulk delete API call
			// await syllabusManagementApi.bulkDeleteLessons(selectedRowKeys);
			
			// Update local state
			setSelectedRowKeys([]);
			
			message.success(t('lessonManagement.bulkDeleteSuccess'));
			setIsBulkDeleteModalVisible(false);
			
			// Refresh the lesson list
			fetchLessons(pagination.current, pagination.pageSize, searchText);
		} catch (error) {
			console.error('Error bulk deleting lessons:', error);
			message.error(t('lessonManagement.bulkDeleteError'));
		}
	};

	const handleBulkDeleteModalClose = () => {
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

	const handleExport = () => {
		// TODO: Implement export functionality
		message.success(t('lessonManagement.exportSuccess'));
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
			
			// Add syllabusId to the request
			formData.append('syllabusId', syllabusId);

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

	// Use lessons data
	const filteredLessons = lessons;

	// Calculate checkbox states with useMemo
	const checkboxStates = useMemo(() => {
		const totalItems = totalElements; // Sử dụng totalElements thay vì lessons.length
		const selectedCount = selectedRowKeys.length;
		const isSelectAll = selectedCount === totalItems && totalItems > 0;
		const isIndeterminate = false; // Không bao giờ hiển thị indeterminate

		console.log('Checkbox Debug:', {
			totalItems,
			selectedCount,
			selectedRowKeys,
			isSelectAll,
			isIndeterminate,
		});

		return { isSelectAll, isIndeterminate, totalItems, selectedCount };
	}, [selectedRowKeys, totalElements]);

	const columns = [
		{
			title: (
				<Checkbox
					key={`select-all-${checkboxStates.selectedCount}-${checkboxStates.totalItems}`}
					checked={checkboxStates.isSelectAll}
					indeterminate={checkboxStates.isIndeterminate}
					onChange={(e) => handleSelectAll(e.target.checked)}
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
			title: 'STT',
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
			sorter: (a, b) => a.name.localeCompare(b.name),
			render: (text) => (
				<div style={{ fontSize: '20px' }}>
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

	if (!syllabusInfo || isInitialLoading) {
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
				<div className="page-title-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
					<Button 
						icon={<ArrowLeftOutlined />}
						onClick={handleBackToChapters}
						className={`back-button ${theme}-back-button`}
					>
						{t('common.back')}
					</Button>
					<Typography.Title 
						level={1} 
						className="page-title"
						style={{ margin: 0, flex: 1, textAlign: 'center' }}
					>
						{t('lessonManagement.title')} - {syllabusInfo.name} <span className="student-count">({totalElements})</span>
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
						<Space>
							<Button
								icon={<UploadOutlined />}
								className={`export-button ${theme}-export-button`}
								onClick={handleExport}
							>
								{t('lessonManagement.exportData')}
							</Button>
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

				{/* Bulk Actions Row */}
				{selectedRowKeys.length > 0 && (
					<Row justify="end" style={{ marginBottom: '16px' }}>
						<Col>
							<Space>
								<Button
									icon={<DeleteOutlined />}
									onClick={handleBulkDelete}
									className="bulk-delete-button"
								>
									{t('lessonManagement.bulkDelete')} ({selectedRowKeys.length})
								</Button>
								<Button
									icon={<UploadOutlined />}
									onClick={handleBulkExport}
									className="bulk-export-button"
								>
									{t('lessonManagement.bulkExport')} ({selectedRowKeys.length})
								</Button>
							</Space>
						</Col>
					</Row>
				)}

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

			{/* Delete Confirmation Modal */}
			<Modal
				title={
					<div style={{ 
						fontSize: '20px', 
						fontWeight: '600', 
						color: '#1890ff',
						textAlign: 'center',
						padding: '10px 0'
					}}>
						{t('lessonManagement.confirmDelete')}
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
						{t('lessonManagement.confirmDeleteMessage')}
					</p>
					{deleteLesson && (
						<p style={{
							fontSize: '20px',
							color: '#1890ff',
							margin: 0,
							fontWeight: '600'
						}}>
							<strong>{deleteLesson.name}</strong>
						</p>
					)}
				</div>
			</Modal>

			{/* Bulk Delete Confirmation Modal */}
			<Modal
				title={
					<div style={{
						fontSize: '20px',
						fontWeight: '600',
						color: '#1890ff',
						textAlign: 'center',
						padding: '10px 0'
					}}>
						{t('lessonManagement.confirmBulkDelete')}
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
						{t('lessonManagement.confirmBulkDeleteMessage')}
					</p>
					<div style={{
						fontSize: '20px',
						color: '#1890ff',
						margin: 0,
						fontWeight: '600'
					}}>
						<strong>{selectedRowKeys.length} {t('lessonManagement.lessons')}</strong>
					</div>
				</div>
			</Modal>

			{/* Lesson Form Modal */}
			<Modal
				title={
					editingLesson
						? t('lessonManagement.editLesson')
						: t('lessonManagement.addLesson')
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
					chapter={null} // No specific chapter context for syllabus-level lessons
					onClose={handleFormSubmit}
					theme={theme}
				/>
			</Modal>

			{/* Import Modal */}
			<Modal
				title={
					<div style={{
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
						{t('lessonManagement.importLessons')}
					</div>
				}
				open={importModal.visible}
				onOk={handleImportOk}
				onCancel={handleImportCancel}
				okText={t('lessonManagement.importLessons')}
				cancelText={t('common.cancel')}
				width={600}
				centered
				confirmLoading={importModal.uploading}
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
				bodyStyle={{
					padding: '30px 40px',
					fontSize: '16px',
					lineHeight: '1.6',
					textAlign: 'center'
				}}>
				<div style={{ padding: '20px 0' }}>
					<div style={{ textAlign: 'center', marginBottom: '20px' }}>
						<Button
							type="dashed"
							icon={<DownloadOutlined />}
							onClick={handleExportTemplate}
							style={{
								borderColor: '#1890ff',
								color: '#1890ff',
								height: '36px',
								fontSize: '14px',
								fontWeight: '500',
								marginBottom: '20px'
							}}>
							{t('lessonManagement.exportTemplate')}
						</Button>
					</div>
					
					<div style={{
						border: '2px dashed #d9d9d9',
						borderRadius: '8px',
						padding: '40px 20px',
						backgroundColor: '#fafafa',
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
							{t('lessonManagement.clickOrDragFile')}
						</p>
						<p
							className='ant-upload-hint'
							style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
							{t('lessonManagement.supportedFormats')}
						</p>
					</div>
				</div>
				</Modal>
		</ThemedLayout>
	);
};

export default LessonListBySyllabus;
