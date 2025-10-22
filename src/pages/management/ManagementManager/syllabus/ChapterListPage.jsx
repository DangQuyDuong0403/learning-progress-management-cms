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
	Tooltip,
	Typography,
	Tabs,
	Upload,
	Divider,
} from 'antd';
import {
	SearchOutlined,
	EyeOutlined,
	DragOutlined,
	DownloadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import usePageTitle from '../../../../hooks/usePageTitle';
import ChapterForm from './ChapterForm';
import './SyllabusList.css';
import ThemedLayout from '../../../../component/ThemedLayout';
import LoadingWithEffect from '../../../../component/spinner/LoadingWithEffect';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useSyllabusMenu } from '../../../../contexts/SyllabusMenuContext';
import BottomActionBar from '../../../../component/BottomActionBar';
import syllabusManagementApi from '../../../../apis/backend/syllabusManagement';
import { spaceToast } from '../../../../component/SpaceToastify';

const ChapterListPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { syllabusId } = useParams();
	const { theme } = useTheme();
	const { enterSyllabusMenu, exitSyllabusMenu } = useSyllabusMenu();

	// Set page title
	usePageTitle('Chapter Management');

	// State management
	const [loading, setLoading] = useState(false);
	const [chapters, setChapters] = useState([]);
	const [syllabusInfo, setSyllabusInfo] = useState(null);
	const [searchText, setSearchText] = useState('');
	const [searchTimeout, setSearchTimeout] = useState(null);
	const [totalElements, setTotalElements] = useState(0);
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);
	const [activeTab, setActiveTab] = useState('chapters');

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
	}, [syllabusId]);

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

	// Enter syllabus menu mode when component mounts and syllabusInfo is available
	useEffect(() => {
		if (syllabusInfo) {
			enterSyllabusMenu({
				id: syllabusInfo.id,
				name: syllabusInfo.name,
				description: syllabusInfo.description,
				backUrl: '/manager/syllabuses'
			});
		}
		
		// Cleanup function to exit syllabus menu mode when leaving
		return () => {
			exitSyllabusMenu();
		};
	}, [syllabusInfo?.id, enterSyllabusMenu, exitSyllabusMenu]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
		};
	}, [searchTimeout]);


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


	const handleModalClose = () => {
		setIsModalVisible(false);
		setEditingChapter(null);
	};


	const handleEditOrder = () => {
		navigate(`/manager/syllabuses/${syllabusId}/chapters/edit-order`);
	};

	const handleTabChange = (key) => {
		setActiveTab(key);
		if (key === 'lessons') {
			navigate(`/manager/syllabuses/${syllabusId}/lessons`);
		}
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


	// Bulk actions
	const handleDeleteAll = () => {
		if (selectedRowKeys.length === 0) {
			message.warning(t('chapterManagement.selectItemsToDelete'));
			return;
		}
		setIsBulkDeleteModalVisible(true);
	};

	const handleDeleteAllConfirm = async () => {
		try {
			// TODO: Implement bulk delete API call
			// await syllabusManagementApi.bulkDeleteChapters(selectedRowKeys);
			
			// Update local state
			setChapters(chapters.filter(c => !selectedRowKeys.includes(c.id)));
			setSelectedRowKeys([]);
			
			message.success(t('chapterManagement.deleteAllSuccess'));
			setIsBulkDeleteModalVisible(false);
		} catch (error) {
			console.error('Error deleting all chapters:', error);
			message.error(t('chapterManagement.deleteAllError'));
		}
	};

	const handleDeleteAllModalClose = () => {
		setIsBulkDeleteModalVisible(false);
	};

	const handleImport = () => {
		setImportModal(prev => ({
			...prev,
			visible: true,
			fileList: [],
			uploading: false
		}));
	};

	const handleValidateFile = async () => {
		if (importModal.fileList.length === 0) {
			spaceToast.warning(t('chapterManagement.selectFileToValidate'));
			return;
		}

		setValidateLoading(true);
		
		try {
			const file = importModal.fileList[0];
			
			// Create FormData object
			const formData = new FormData();
			formData.append('file', file);
			formData.append('syllabusId', syllabusId);
			
			// Call validate API with FormData
			const response = await syllabusManagementApi.validateChapterImportFile(formData);

			// API trả về file validation result dưới dạng blob
			if (response.data instanceof Blob) {
				// Tạo URL từ blob để download
				const downloadUrl = window.URL.createObjectURL(response.data);
				
				// Tạo link download
				const link = document.createElement('a');
				link.setAttribute('href', downloadUrl);
				link.setAttribute('download', `chapter_validation_result_${new Date().getTime()}.xlsx`);
				link.setAttribute('target', '_blank');
				link.style.visibility = 'hidden';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				
				// Cleanup URL
				window.URL.revokeObjectURL(downloadUrl);
				
				spaceToast.success(t('chapterManagement.validateSuccess') + ' - ' + t('chapterManagement.fileDownloaded'));
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
					link.setAttribute('download', `chapter_validation_result_${new Date().getTime()}.xlsx`);
					link.setAttribute('target', '_blank');
					link.style.visibility = 'hidden';
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
					
					spaceToast.success(t('chapterManagement.validateSuccess') + ' - ' + t('chapterManagement.fileDownloaded'));
				} else {
					spaceToast.success(response.message || t('chapterManagement.validateSuccess'));
				}
			}
		} catch (error) {
			console.error('Error validating file:', error);
			
			// Xử lý lỗi chi tiết hơn
			let errorMessage = t('chapterManagement.validateError');
			
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
			spaceToast.warning(t('chapterManagement.selectFileToImport'));
			return;
		}

		setImportModal(prev => ({ ...prev, uploading: true }));
		
		try {
			const file = importModal.fileList[0];
			
			// Create FormData object
			const formData = new FormData();
			formData.append('file', file);
			formData.append('syllabusId', syllabusId);
			
			// Call import API with FormData
			const response = await syllabusManagementApi.importChapters(formData);

			if (response.success) {
				// Refresh the list to get updated data from server
				fetchChapters(pagination.current, pagination.pageSize, searchText);
				
				// Use backend message if available, otherwise fallback to translation
				const successMessage = response.message || t('chapterManagement.importSuccess');
				spaceToast.success(successMessage);
				
				setImportModal({ visible: false, fileList: [], uploading: false });
			} else {
				throw new Error(response.message || 'Import failed');
			}
		} catch (error) {
			console.error('Error importing chapters:', error);
			spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message || t('chapterManagement.importError'));
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

	const handleDownloadTemplate = async () => {
		setTemplateDownloadLoading(true);
		try {
			const response = await syllabusManagementApi.downloadChapterTemplate();
			
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
			link.setAttribute('download', 'chapter_import_template.xlsx');
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

	// No need for client-side filtering since API handles filtering
	const filteredChapters = chapters;



	const columns = [
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
		render: (text) => (
			<div style={{ fontSize: '20px' }}>
				{text}
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
				<div className="page-title-container" style={{ marginBottom: '24px' }}>
					<Typography.Title 
						level={1} 
						className="page-title"
						style={{ margin: 0, textAlign: 'center' }}
					>
						{t('chapterManagement.title')} <span className="student-count">({totalElements})</span>
					</Typography.Title>
				</div>

				{/* Tabs Section */}
				<div className={`custom-tabs-container ${theme}-tabs-container`} style={{ marginBottom: '24px' }}>
					<Tabs
						activeKey={activeTab}
						onChange={handleTabChange}
						className={`custom-tabs ${theme}-tabs`}
						items={[
							{
								key: 'chapters',
								label: (
									<div className={`tab-label ${theme}-tab-label`}>
										<span className={`tab-text ${theme}-tab-text`}>{t('chapterManagement.title')}</span>
									</div>
								),
							},
							{
								key: 'lessons',
								label: (
									<div className={`tab-label ${theme}-tab-label`}>
										<span className={`tab-text ${theme}-tab-text`}>{t('lessonManagement.viewAllLessons')}</span>
									</div>
								),
							},
						]}
					/>
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

			{/* Bottom Action Bar */}
			<BottomActionBar
				selectedCount={selectedRowKeys.length}
				onSelectAll={handleSelectAll}
				onDeleteAll={handleDeleteAll}
				onClose={() => setSelectedRowKeys([])}
				selectAllText={t('classManagement.selectAll')}
				deleteAllText={t('classManagement.deleteAll')}
			/>

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
						fontSize: '28px', 
						fontWeight: '600', 
						color: 'rgb(24, 144, 255)',
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
						{t('chapterManagement.confirmDeleteMessage')}
					</p>
					{deleteChapter && (
						<p style={{
							fontSize: '20px',
							color: '#000',
							margin: 0,
							fontWeight: '400'
						}}>
							<strong>{deleteChapter.name}</strong>
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
						{t('chapterManagement.confirmDeleteAll')}
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
						{t('chapterManagement.confirmDeleteAllMessage')}
					</p>
					<div style={{
						fontSize: '20px',
						color: '#000',
						margin: 0,
						fontWeight: '400'
					}}>
						<strong>{selectedRowKeys.length} {t('chapterManagement.chapters')}</strong>
					</div>
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
				}}>
					<DownloadOutlined style={{ color: 'rgb(24, 144, 255)' }} /> {t('chapterManagement.importChapters')}
				</div>
			}
			open={importModal.visible}
				onOk={handleImportOk}
				onCancel={handleImportCancel}
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
							{t('chapterManagement.downloadTemplate')}
						</Button>
					</div>

					<Typography.Title
						level={5}
						style={{
							textAlign: 'center',
							marginBottom: '20px',
							color: '#666',
						}}>
						{t('chapterManagement.importInstructions')}
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
							{t('chapterManagement.clickOrDragFile')}
						</p>
						<p className='ant-upload-hint' style={{ color: '#999' }}>
							{t('chapterManagement.supportedFormats')}: Excel (.xlsx, .xls)
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
									✅ {t('chapterManagement.fileSelected')}:{' '}
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
		</ThemedLayout>
	);
};

export default ChapterListPage;
