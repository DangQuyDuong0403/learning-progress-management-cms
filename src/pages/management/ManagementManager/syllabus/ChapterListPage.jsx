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
	Typography,
	Checkbox,
} from 'antd';
import {
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	SearchOutlined,
	EyeOutlined,
	ArrowLeftOutlined,
	DragOutlined,
	UploadOutlined,
	DownloadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import ChapterForm from './ChapterForm';
import './SyllabusList.css';
import ThemedLayout from '../../../../component/ThemedLayout';
import LoadingWithEffect from '../../../../component/spinner/LoadingWithEffect';
import { useTheme } from '../../../../contexts/ThemeContext';
import syllabusManagementApi from '../../../../apis/backend/syllabusManagement';

const ChapterListPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { syllabusId } = useParams();
	const { theme } = useTheme();

	// State management
	const [loading, setLoading] = useState(false);
	const [chapters, setChapters] = useState([]);
	const [syllabusInfo, setSyllabusInfo] = useState(null);
	const [searchText, setSearchText] = useState('');
	const [searchTimeout, setSearchTimeout] = useState(null);
	const [totalElements, setTotalElements] = useState(0);
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);

	// Modal states
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
	const [isBulkDeleteModalVisible, setIsBulkDeleteModalVisible] = useState(false);
	const [editingChapter, setEditingChapter] = useState(null);
	const [deleteChapter, setDeleteChapter] = useState(null);
	const [importModal, setImportModal] = useState({
		visible: false,
		fileList: [],
		uploading: false
	});

	// Pagination state
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 10,
		total: 0,
		showSizeChanger: true,
		showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
	});

	// Fetch chapters from API
	const fetchChapters = useCallback(async (page = 1, size = 10, search = '') => {
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

			const response = await syllabusManagementApi.getChaptersBySyllabusId(syllabusId, params);

			// Map API response to component format
			const mappedChapters = response.data.map((chapter) => ({
				id: chapter.id,
				name: chapter.chapterName,
				description: chapter.description,
				order: chapter.orderNumber,
				status: chapter.status,
			}));

			setChapters(mappedChapters);
			setTotalElements(response.totalElements || response.data.length);
			setPagination(prev => ({
				...prev,
				current: page,
				pageSize: size,
				total: response.totalElements || response.data.length,
			}));
			setLoading(false);
		} catch (error) {
			console.error('Error fetching chapters:', error);
			
			// Handle error message from backend
			let errorMessage = error.response?.data?.error || 
				error.response?.data?.message || 
				error.message 
			
			message.error(errorMessage);
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
		fetchChapters(1, pagination.pageSize, searchText);
		fetchSyllabusInfo();
	}, [fetchChapters, fetchSyllabusInfo, searchText, pagination.pageSize]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
		};
	}, [searchTimeout]);

	const handleAdd = () => {
		setEditingChapter(null);
		setIsModalVisible(true);
	};

	const handleEdit = (chapter) => {
		setEditingChapter(chapter);
		setIsModalVisible(true);
	};

	const handleDeleteClick = (chapter) => {
		setDeleteChapter(chapter);
		setIsDeleteModalVisible(true);
	};

	const handleDelete = async () => {
		try {
			// TODO: Implement delete chapter API call
			const response = await syllabusManagementApi.deleteChapter(deleteChapter.id);
			
			// Update local state
			setChapters(chapters.filter(c => c.id !== deleteChapter.id));
			
			// Handle success message from backend only
			const successMessage = response?.message || response?.data?.message;
			if (successMessage) {
				message.success(successMessage);
			}
			
			setIsDeleteModalVisible(false);
			setDeleteChapter(null);
		} catch (error) {
			console.error('Error deleting chapter:', error);
			
			// Handle error message from backend
			let errorMessage = error.response?.data?.error || 
				error.response?.data?.message || 
				error.message 
			
			message.error(errorMessage);
		}
	};

	const handleDeleteModalClose = () => {
		setIsDeleteModalVisible(false);
		setDeleteChapter(null);
	};

	const handleViewLessons = (chapter) => {
		navigate(`/manager/syllabuses/${syllabusId}/chapters/${chapter.id}/lessons`);
	};

	const handleViewAllLessons = () => {
		navigate(`/manager/syllabuses/${syllabusId}/lessons`);
	};

	const handleModalClose = () => {
		setIsModalVisible(false);
		setEditingChapter(null);
	};


	const handleBackToSyllabuses = () => {
		navigate('/manager/syllabuses');
	};

	const handleEditOrder = () => {
		navigate(`/manager/syllabuses/${syllabusId}/chapters/edit-order`);
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
			fetchChapters(1, pagination.pageSize, value);
		}, 1000);
		
		setSearchTimeout(newTimeout);
	};

	const handleTableChange = (pagination) => {
		fetchChapters(pagination.current, pagination.pageSize, searchText);
	};

	// Checkbox logic
	const handleSelectAll = async (checked) => {
		if (checked) {
			try {
				// Fetch all chapter IDs from API (without pagination)
				const params = {
					page: 0,
					size: totalElements, // Get all items
				};
				
				// Add search parameter if provided
				if (searchText && searchText.trim()) {
					params.searchText = searchText.trim();
				}

				const response = await syllabusManagementApi.getChaptersBySyllabusId(syllabusId, params);

				// Get all IDs from the response
				const allKeys = response.data.map(chapter => chapter.id);
				setSelectedRowKeys(allKeys);
			} catch (error) {
				console.error('Error fetching all chapter IDs:', error);
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
			message.warning(t('chapterManagement.selectItemsToDelete'));
			return;
		}
		setIsBulkDeleteModalVisible(true);
	};

	const handleBulkExport = () => {
		if (selectedRowKeys.length === 0) {
			message.warning(t('chapterManagement.selectItemsToExport'));
			return;
		}
		// TODO: Implement bulk export functionality
		message.success(t('chapterManagement.bulkExportSuccess'));
	};

	const handleBulkDeleteConfirm = async () => {
		try {
			// TODO: Implement bulk delete API call
			// await syllabusManagementApi.bulkDeleteChapters(selectedRowKeys);
			
			// Update local state
			setChapters(chapters.filter(c => !selectedRowKeys.includes(c.id)));
			setSelectedRowKeys([]);
			
			message.success(t('chapterManagement.bulkDeleteSuccess'));
			setIsBulkDeleteModalVisible(false);
		} catch (error) {
			console.error('Error bulk deleting chapters:', error);
			message.error(t('chapterManagement.bulkDeleteError'));
		}
	};

	const handleBulkDeleteModalClose = () => {
		setIsBulkDeleteModalVisible(false);
	};

	const handleExport = () => {
		// TODO: Implement export functionality
		message.success(t('chapterManagement.exportSuccess'));
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
			// await syllabusManagementApi.importChapters(importModal.fileList);
			
			message.success(t('chapterManagement.importSuccess'));
			setImportModal(prev => ({
				...prev,
				visible: false,
				fileList: [],
				uploading: false
			}));
			
			// Refresh the data
			fetchChapters(pagination.current, pagination.pageSize, searchText);
		} catch (error) {
			console.error('Import error:', error);
			message.error(t('chapterManagement.importError'));
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

	const handleDownloadTemplate = () => {
		// TODO: Implement template download
		message.info(t('chapterManagement.templateDownloadInfo'));
	};

	// No need for client-side filtering since API handles filtering
	const filteredChapters = chapters;

	// Calculate checkbox states with useMemo
	const checkboxStates = useMemo(() => {
		const totalItems = totalElements; // Sử dụng totalElements thay vì chapters.length
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
			title: t('chapterManagement.chapterName'),
			dataIndex: 'name',
			key: 'name',
			width: '20%',
			sorter: (a, b) => a.name.localeCompare(b.name),
			render: (text, record) => (
				<div>
					<div style={{ fontSize: '20px' }}>{text}</div>
					<div style={{ color: '#666', fontSize: '12px' }}>
						{record.description}
					</div>
				</div>
			),
		},
		{
			title: t('chapterManagement.actions'),
			key: 'actions',
			width: '20%',
			render: (_, record) => (
				<Space size="small">
					<Tooltip title={t('chapterManagement.viewLessons')}>
						<Button
							type="text"
							size="small"
							icon={<EyeOutlined style={{ fontSize: '25px' }} />}
							onClick={() => handleViewLessons(record)}
						/>
					</Tooltip>
				</Space>
			),
		},
	];

	if (!syllabusInfo) {
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
						onClick={handleBackToSyllabuses}
						className={`back-button ${theme}-back-button`}
					>
						{t('common.back')}
					</Button>
					<Typography.Title 
						level={1} 
						className="page-title"
						style={{ margin: 0, flex: 1, textAlign: 'center' }}
					>
						{t('chapterManagement.title')} - {syllabusInfo.name} <span className="student-count">({totalElements})</span>
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
								icon={<EyeOutlined />}
								onClick={handleViewAllLessons}
								className="create-button"
								style={{
									backgroundColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
									background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
									borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'transparent',
									color: '#000000',
									height: '40px',
									fontSize: '16px',
									fontWeight: '500',
									minWidth: '100px'
								}}
							>
								{t('lessonManagement.viewAllLessons')}
							</Button>
							<Button
								icon={<UploadOutlined />}
								className={`export-button ${theme}-export-button`}
								onClick={handleExport}
							>
								{t('chapterManagement.exportData')}
							</Button>
							<Button
								icon={<DownloadOutlined />}
								className={`import-button ${theme}-import-button`}
								onClick={handleImport}
							>
								{t('chapterManagement.importChapters')}
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
									{t('chapterManagement.bulkDelete')} ({selectedRowKeys.length})
								</Button>
								<Button
									icon={<UploadOutlined />}
									onClick={handleBulkExport}
									className="bulk-export-button"
								>
									{t('chapterManagement.bulkExport')} ({selectedRowKeys.length})
								</Button>
							</Space>
						</Col>
					</Row>
				)}

				{/* Table Section */}
				<div className={`table-section ${theme}-table-section`}>
					<Table
						columns={columns}
						dataSource={filteredChapters}
						rowKey="id"
						loading={loading}
						pagination={{
							...pagination,
							showTotal: (total, range) => {
								return `${range[0]}-${range[1]} ${t('chapterManagement.paginationText')} ${total} ${t('chapterManagement.chapters')}`;
							},
						}}
						onChange={handleTableChange}
						scroll={{ x: 1000 }}
					/>
				</div>
			</div>

				{/* Chapter Modal */}
				<Modal
					title={
						editingChapter
							? t('chapterManagement.editChapter')
							: t('chapterManagement.addChapter')
					}
					open={isModalVisible}
					onCancel={handleModalClose}
					footer={null}
					width={600}
					destroyOnClose
				>
					<ChapterForm
						chapter={editingChapter}
						syllabus={syllabusInfo}
						onClose={handleModalClose}
					/>
				</Modal>

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
						{t('chapterManagement.confirmDelete')}
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
						{t('chapterManagement.confirmDeleteMessage')}
					</p>
					{deleteChapter && (
						<p style={{
							fontSize: '20px',
							color: '#1890ff',
							margin: 0,
							fontWeight: '600'
						}}>
							<strong>{deleteChapter.name}</strong>
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
						{t('chapterManagement.confirmBulkDelete')}
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
						{t('chapterManagement.confirmBulkDeleteMessage')}
					</p>
					<div style={{
						fontSize: '20px',
						color: '#1890ff',
						margin: 0,
						fontWeight: '600'
					}}>
						<strong>{selectedRowKeys.length} {t('chapterManagement.chapters')}</strong>
					</div>
				</div>
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
						{t('chapterManagement.importChapters')}
					</div>
				}
				open={importModal.visible}
				onOk={handleImportOk}
				onCancel={handleImportCancel}
				okText={t('chapterManagement.importChapters')}
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
							onClick={handleDownloadTemplate}
							style={{
								borderColor: '#1890ff',
								color: '#1890ff',
								height: '36px',
								fontSize: '14px',
								fontWeight: '500',
								marginBottom: '20px'
							}}>
							{t('chapterManagement.downloadTemplate')}
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
							{t('chapterManagement.clickOrDragFile')}
						</p>
						<p
							className='ant-upload-hint'
							style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
							{t('chapterManagement.supportedFormats')}
						</p>
					</div>
				</div>
			</Modal>
		</ThemedLayout>
	);
};

export default ChapterListPage;
