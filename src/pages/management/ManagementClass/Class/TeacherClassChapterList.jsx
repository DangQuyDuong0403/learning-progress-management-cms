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
import ThemedLayoutWithSidebar from '../../../../component/ThemedLayout';
import ThemedLayoutNoSidebar from '../../../../component/teacherlayout/ThemedLayout';
import LoadingWithEffect from '../../../../component/spinner/LoadingWithEffect';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useClassMenu } from '../../../../contexts/ClassMenuContext';
import teacherManagementApi from '../../../../apis/backend/teacherManagement';
import { useSelector } from 'react-redux';
import usePageTitle from '../../../../hooks/usePageTitle';
import { spaceToast } from '../../../../component/SpaceToastify';

const TeacherClassChapterList = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { classId } = useParams();
	const { theme } = useTheme();
	const { user } = useSelector((state) => state.auth);
	const { enterClassMenu, exitClassMenu } = useClassMenu();
	
	// Determine which layout to use based on user role
	const userRole = user?.role?.toLowerCase();
	const ThemedLayout = (userRole === 'teacher' || userRole === 'teaching_assistant') 
		? ThemedLayoutNoSidebar 
		: ThemedLayoutWithSidebar;

	// Set page title
	usePageTitle('Chapter Management');

	// State management
	const [loading, setLoading] = useState(false);
	const [chapters, setChapters] = useState([]);
	const [classInfo, setClassInfo] = useState(null);
	const [searchText, setSearchText] = useState('');
	const [searchTimeout, setSearchTimeout] = useState(null);

	// Modal states
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
			default:
				return '/manager/classes';
		}
	};

	const routePrefix = getRoutePrefix();

	// Fetch class info
	const fetchClassInfo = useCallback(async () => {
		if (!classId) return;
		
		try {
			const response = await teacherManagementApi.getClassById(classId);
			const data = response?.data ?? response;
			setClassInfo({
				id: classId,
				name: data?.name ?? data?.className ?? data?.title ?? '',
				syllabus: {
					id: data?.syllabusId,
					name: data?.syllabusName,
				}
			});
		} catch (error) {
			console.error('Error fetching class info:', error);
		}
	}, [classId]);

	// Fetch chapters from API
	const fetchChapters = useCallback(async (page = 1, size = 10, search = '') => {
		if (!classId) return;
		
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

			const response = await teacherManagementApi.getClassChapters(classId, params);

			// Map API response to component format
			const mappedChapters = response.data.map((chapter) => ({
				id: chapter.id,
				name: chapter.classChapterName,
				description: chapter.description,
				order: chapter.orderNumber,
				status: chapter.status,
				createdBy: chapter.createdBy || chapter.createdByUser || 'N/A',
				createdAt: chapter.createdAt,
			}));

			setChapters(mappedChapters);
			setPagination(prev => ({
				...prev,
				current: page,
				pageSize: size,
				total: response.totalElements || response.data.length,
			}));
			setLoading(false);
		} catch (error) {
			console.error('Error fetching chapters:', error);
			message.error(t('chapterManagement.loadChaptersError'));
			setLoading(false);
		}
	}, [classId, t]);

	useEffect(() => {
		fetchClassInfo();
	}, [fetchClassInfo]);

	useEffect(() => {
		if (classId) {
			fetchChapters(1, pagination.pageSize, searchText);
		}
	}, [fetchChapters, searchText, pagination.pageSize, classId]);

	// Handle class menu updates - separate effects to avoid infinite loops
	useEffect(() => {
		if (classId) {
			enterClassMenu({ id: classId });
		}
		return () => exitClassMenu();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [classId]);

	useEffect(() => {
		if (classInfo && classId) {
			enterClassMenu({
				id: classInfo.id,
				name: classInfo.name,
				description: classInfo.name,
				backUrl: `${routePrefix}/menu/${classId}`
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [classInfo?.id, classInfo?.name, classId]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
		};
	}, [searchTimeout]);

	const handleViewLessons = (chapter) => {
		navigate(`${routePrefix}/chapters/${classId}/${chapter.id}/lessons`);
	};

	const handleEditOrder = () => {
		navigate(`${routePrefix}/chapters/${classId}/edit-order`);
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

	const handleImport = () => {
		setImportModal(prev => ({
			...prev,
			visible: true,
			fileList: [],
			uploading: false
		}));
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
			formData.append('classId', classId);
			
			// Call import API with FormData
			const response = await teacherManagementApi.importClassChapters(formData);

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
		try {
			const response = await teacherManagementApi.downloadClassChapterTemplate();
			
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
			link.setAttribute('download', 'class_chapter_import_template.xlsx');
			link.setAttribute('target', '_blank');
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			
			spaceToast.success('Template downloaded successfully');
		} catch (error) {
			console.error('Error downloading template:', error);
			spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to download template');
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
			render: (text, record) => (
				<div>
					<div style={{ 
						fontSize: '20px',
						maxWidth: '200px',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap'
					}}>{text}</div>
					<div style={{ 
						color: '#666', 
						fontSize: '12px',
						maxWidth: '200px',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap'
					}}>
						{record.description}
					</div>
				</div>
			),
		},
		{
			title: t('chapterManagement.createdBy'),
			dataIndex: 'createdBy',
			key: 'createdBy',
			width: '20%',
			render: (createdBy) => createdBy || 'N/A',
		},
		{
			title: t('chapterManagement.createdAt'),
			dataIndex: 'createdAt',
			key: 'createdAt',
			width: '20%',
			render: (date) => new Date(date).toLocaleDateString(),
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

	if (!classInfo) {
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
				
					<Typography.Title 
						level={1} 
						className="page-title"
						style={{ margin: 0, flex: 1, textAlign: 'center' }}
					>
					{t('chapterManagement.title')} <span className="student-count">({pagination.total})</span>
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
						{t('chapterManagement.importChapters')}
					</div>
				}
				open={importModal.visible}
				onOk={handleImportOk}
				onCancel={handleImportCancel}
				okText={t('chapterManagement.import')}
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

export default TeacherClassChapterList;
