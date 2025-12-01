import React, { useState, useEffect, useCallback } from 'react';
import {
	Table,
	Button,
	Space,
	Modal,
	Input,
	Tooltip,
	Typography,
} from 'antd';
import {
	EditOutlined,
	SearchOutlined,
	DragOutlined,
	SendOutlined,
	FileTextOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import usePageTitle from '../../../../hooks/usePageTitle';
import { useNavigate } from 'react-router-dom';
import ThemedLayout from '../../../../component/ThemedLayout';
import LoadingWithEffect from '../../../../component/spinner/LoadingWithEffect';
import { useTheme } from '../../../../contexts/ThemeContext';
import { spaceToast } from '../../../../component/SpaceToastify';
import levelManagementApi from '../../../../apis/backend/levelManagement';
import LevelForm from './LevelForm';
import ROUTER_PAGE from '../../../../constants/router';

const LevelList = () => {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const navigate = useNavigate();
	
	// Set page title
	usePageTitle('Level Management');
	
	const [loading, setLoading] = useState(false);
	const [toggleLoading, setToggleLoading] = useState(false);
	const [isAllPublished, setIsAllPublished] = useState(false); 
	const [totalElements, setTotalElements] = useState(0);
	const [currentStatus, setCurrentStatus] = useState(''); 
	const [levels, setLevels] = useState([]);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [editingLevel, setEditingLevel] = useState(null);
	const [searchText, setSearchText] = useState('');
	const [searchTimeout, setSearchTimeout] = useState(null);
	const [confirmModal, setConfirmModal] = useState({
		visible: false,
		title: '',
		content: '',
		onConfirm: null
	});
	
	// Pagination state
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 10,
		total: 0,
		showSizeChanger: true,
		showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
	});

	const fetchLevels = useCallback(async (page = 1, size = 10, search = '') => {
		setLoading(true);
		try {
			const params = {
				page: page - 1, // API uses 0-based indexing
				size: size,
			};
			
			// Add search parameter if provided (API uses 'text' parameter)
			if (search && search.trim()) {
				params.text = search.trim();
			}


			const response = await levelManagementApi.getLevels(params);

			// Handle different response structures
			let levelsData = [];
			let totalElements = 0;

			if (response && response.data) {
				// Check if it's a paginated response with direct array
				if (Array.isArray(response.data)) {
					levelsData = response.data;
					// Get totalElements from response metadata (not from data array length)
					totalElements = response.totalElements || response.data.length;
				} else if (response.data.content && Array.isArray(response.data.content)) {
					levelsData = response.data.content;
					totalElements = response.data.totalElements || response.data.total || 0;
				} else {
					levelsData = [];
					totalElements = 0;
				}
			}

			// Map API response to component format 
			const mappedLevels = levelsData.map((level) => ({
				id: level.id,
				levelName: level.levelName,
				levelCode: level.levelCode || 'N/A',
				prerequisite: level.prerequisite,
				status: level.status,
				orderNumber: level.orderNumber,
				createdAt: level.createdAt ? new Date(level.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
				description: level.description || '',
			}));

			setLevels(mappedLevels);
			setTotalElements(totalElements);
			
			// Detect current status to determine button action
			detectPublishStatus(mappedLevels);
			
			// Set current status based on actual data
			if (mappedLevels.length === 0) {
				setCurrentStatus('');
			} else if (mappedLevels.every(level => level.status === 'PUBLISHED')) {
				setCurrentStatus(t('levelManagement.published'));
			} else if (mappedLevels.every(level => level.status === 'DRAFT')) {
				setCurrentStatus(t('levelManagement.draft'));
			} else {
				setCurrentStatus(t('levelManagement.mixed'));
			}
			
			setPagination(prev => ({
				...prev,
				current: page,
				pageSize: size,
				total: totalElements,
			}));
			
			setLoading(false);
		} catch (error) {
			console.error('Error fetching levels:', error);
			
			// Handle API errors with backend messages
			let errorMessage;
			if (error.response) {
				errorMessage = error.response.data.error || error.response.data?.message || error.message;
			} else {
				errorMessage = error.message;
			}
			
			spaceToast.error(errorMessage);
			setLoading(false);
		}
	}, [t]);

	useEffect(() => {
		fetchLevels(1, pagination.pageSize, searchText);
	}, [fetchLevels, searchText, pagination.pageSize]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
		};
	}, [searchTimeout]);

	const handleSearch = (value) => {
		setSearchText(value);
		
		// Clear existing timeout
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
		
		// Set new timeout for 1 second delay
		const newTimeout = setTimeout(() => {
			// Reset to first page when searching
			fetchLevels(1, pagination.pageSize, value);
		}, 1000);
		
		setSearchTimeout(newTimeout);
	};

	const handleTableChange = (pagination) => {
		fetchLevels(pagination.current, pagination.pageSize, searchText);
	};


	const handleEdit = async (level) => {
		try {
			setIsModalVisible(true); // Mở modal ngay lập tức
			
			// Fetch full level details from API
			const response = await levelManagementApi.getLevelById(level.id);
			
			// Map API response to form format
			const levelDetails = {
				id: response.data.id,
				levelName: response.data.levelName,
				levelCode: response.data.levelCode,
				description: response.data.description || '',
				prerequisite: response.data.prerequisite,
				status: response.data.status,
				orderNumber: response.data.orderNumber,
				promotionCriteria: response.data.promotionCriteria || '',
				learningObjectives: response.data.learningObjectives || '',
			};
			setEditingLevel(levelDetails);
		} catch (error) {
			console.error('Error fetching level details:', error);
			
			// Handle API errors with backend messages
			let errorMessage;
			if (error.response) {
				errorMessage = error.response.data.error || error.response.data?.message || error.message;
			} else {
				errorMessage = error.message;
			}
			
			spaceToast.error(errorMessage);
			setIsModalVisible(false); // Đóng modal nếu có lỗi
		}
	};


	const handleModalClose = (shouldRefresh = false, successMessage = null) => {
		setIsModalVisible(false);
		setEditingLevel(null);
		
		// Only refresh data if save was successful
		if (shouldRefresh === true) {
			// Only show success message if provided from LevelForm
			if (successMessage) {
				spaceToast.success(successMessage);
			}
			fetchLevels(pagination.current, pagination.pageSize, searchText);
		}
	};

	// Detect current action based on levels status
	const detectPublishStatus = (levelsData) => {
		if (!levelsData || levelsData.length === 0) {
			setIsAllPublished(false);
			return;
		}

		// Check if all levels are in PUBLISHED status (active)
		const allPublished = levelsData.every(level => level.status === 'PUBLISHED');
		setIsAllPublished(allPublished);
		
	};


	const handlePublishAll = () => {
		setConfirmModal({
			visible: true,
			title: t('levelManagement.confirmPublishAll'),
			content: t('levelManagement.confirmPublishAllMessage'),
			onConfirm: async () => {
				setToggleLoading(true);
				try {
					const response = await levelManagementApi.publishAllLevels();
					const successMessage = response.message || t('levelManagement.publishAllSuccess');
					
					// Close modal first
					setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
					
					spaceToast.success(successMessage);
					
					// Refresh the list after action
					fetchLevels(pagination.current, pagination.pageSize, searchText);
				} catch (error) {
					console.error('Error publishing all levels:', error);
					
					// Handle API errors with backend messages
					let errorMessage;
					if (error.response) {
						errorMessage = error.response.data.error || error.response.data?.message || error.message;
					} else {
						errorMessage = error.message;
					}
					
					setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
					spaceToast.error(errorMessage);
				} finally {
					setToggleLoading(false);
				}
			}
		});
	};

	const handleConfirmCancel = () => {
		setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
	};

	const handleEditPositions = () => {
		navigate(ROUTER_PAGE.MANAGER_LEVEL_EDIT_POSITIONS);
	};



	const columns = [
		{
			title: t('levelManagement.stt'),
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
			title: t('levelManagement.levelName'),
			dataIndex: 'levelName',
			key: 'levelName',
			width: '20%',
			render: (text) => (
				<div>
					<div>{text}</div>
				</div>
			),
		},
		{
			title: t('levelManagement.levelCode'),
			dataIndex: 'levelCode',
			key: 'levelCode',
			width: '15%',
			render: (text) => (
				<div>
					<div>{text}</div>
				</div>
			),
		},
		{
			title: t('levelManagement.prerequisite'),
			dataIndex: 'prerequisite',
			key: 'prerequisite',
			width: '20%',
			render: (prerequisite) => {
				if (!prerequisite) {
					return <span style={{ color: '#000000', textAlign: 'center' }}>-</span>;
				}
				return prerequisite.levelName || prerequisite;
			},
		},
		{
			title: t('levelManagement.actions'),
			key: 'actions',
			width: '20%',
			render: (_, record) => (
				<Space size='small'>
					<Tooltip title={t('levelManagement.edit')}>
						<Button
							type='text'
							icon={<EditOutlined style={{ fontSize: '25px', color: '#000000' }} />}
							size='small'
							onClick={() => handleEdit(record)}
						/>
					</Tooltip>
				</Space>
			),
		},
	];

	const hasVisibleLevels = levels.length > 0;
	const publishButtonDisabled = !hasVisibleLevels || isAllPublished;
	const showEditPositionsButton = hasVisibleLevels && !isAllPublished;

	return (
		<ThemedLayout>
			{/* Main Content Panel */}
			<div className={`main-content-panel ${theme}-main-panel`}>
				{/* Page Title */}
				<div className="page-title-container">
					<Typography.Title 
						level={1} 
						className="page-title"
					>
						{t('levelManagement.title')} <span className="student-count">({totalElements})</span>
					</Typography.Title>
				</div>
				{/* Header Section */}
				<div className={`panel-header ${theme}-panel-header`}>
					<div
						className='search-section'
						style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
						<Input
							prefix={<SearchOutlined />}
							value={searchText}
							onChange={(e) => handleSearch(e.target.value)}
							className={`search-input ${theme}-search-input`}
							style={{
								minWidth: '200px',
								maxWidth: '300px',
								width: '250px',
								height: '40px',
								fontSize: '16px',
							}}
							allowClear
						/>
					</div>
					<div className='action-buttons'>
						<Button
							icon={publishButtonDisabled ? null : <SendOutlined />}
							onClick={publishButtonDisabled ? null : handlePublishAll}
							loading={toggleLoading}
							disabled={publishButtonDisabled}
							className={`publish-all-button ${theme}-publish-all-button`}
							style={{
								height: '40px',
								borderRadius: '8px',
								fontWeight: '500',
								border: theme === 'space' 
									? '1px solid rgba(77, 208, 255, 0.3)' 
									: '1px solid #0000001a',
								background: theme === 'space'
									? 'linear-gradient(135deg, #b5b0c0 19%, #a79ebb 64%, #8377a0 75%, #aca5c0 97%, #6d5f8f)'
									: '#71b3fd',
								color: '#000',
								backdropFilter: 'blur(10px)',
								transition: 'all 0.3s ease',
								boxShadow: theme === 'space'
									? '0 4px 12px rgba(76, 29, 149, 0.3)'
									: '0 4px 12px rgba(24, 144, 255, 0.3)',
								opacity: publishButtonDisabled ? 0.5 : 1,
								cursor: publishButtonDisabled ? 'not-allowed' : 'pointer',
							}}>
							{isAllPublished ? t('levelManagement.published') : t('levelManagement.publishAll')}
						</Button>
						{showEditPositionsButton && (
							<Button
								icon={<DragOutlined />}
								className={`edit-positions-button ${theme}-edit-positions-button`}
								onClick={handleEditPositions}
								style={{
									height: '40px',
									borderRadius: '8px',
									fontWeight: '500',
									border: theme === 'space' 
										? '1px solid rgba(77, 208, 255, 0.3)' 
										: '1px solid #0000001a',
									background: theme === 'space'
										? 'linear-gradient(135deg, #b5b0c0 19%, #a79ebb 64%, #8377a0 75%, #aca5c0 97%, #6d5f8f)'
										: '#71b3fd',
									color: '#000',
									backdropFilter: 'blur(10px)',
									transition: 'all 0.3s ease',
									boxShadow: theme === 'space'
										? '0 4px 12px rgba(76, 29, 149, 0.3)'
										: '0 4px 12px rgba(24, 144, 255, 0.3)',
								}}
							>
								{t('levelManagement.edit')}
							</Button>
						)}
					</div>
				</div>

				{/* Table Section */}
				<div className={`table-section ${theme}-table-section`}>
					<LoadingWithEffect
						loading={loading}
						message={t('levelManagement.loadingLevels')}>
						<Table
							columns={columns}
							dataSource={levels}
							rowKey='id'
							pagination={{
								...pagination,
								className: `${theme}-pagination`,
							}}
							onChange={handleTableChange}
							scroll={{ x: 1200 }}
							className={`level-table ${theme}-level-table`}
						/>
					</LoadingWithEffect>
				</div>
			</div>

		{/* Modal */}
		<Modal
		title={
			<div style={{ textAlign: 'center', fontSize: '28px', fontWeight: '600', color: 'rgb(24, 144, 255)' }}>
				{t('levelManagement.editLevel')}
			</div>
		}
			open={isModalVisible}
				onCancel={() => {
					setIsModalVisible(false);
					setEditingLevel(null);
				}}
				footer={null}
				width={800}
				destroyOnClose
				style={{ top: 20 }}
				bodyStyle={{
					maxHeight: '70vh',
					overflowY: 'auto',
					padding: '24px',
				}}>
				<LevelForm level={editingLevel} onClose={handleModalClose} showPrerequisiteAndCode={true} />
			</Modal>

		{/* Confirm Modal */}
		<Modal
			title={
				<div style={{ textAlign: 'center', fontSize: '28px', fontWeight: '600', color: 'rgb(24, 144, 255)' }}>
					{confirmModal.title}
				</div>
			}
			open={confirmModal.visible}
				onOk={confirmModal.onConfirm}
				onCancel={handleConfirmCancel}
				okText={t('common.confirm')}
				cancelText={t('common.cancel')}
				width={500}
				centered
				bodyStyle={{
					padding: '30px 40px',
					fontSize: '16px',
					lineHeight: '1.6',
					textAlign: 'center',
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
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: '20px',
					}}>
					<div
						style={{
							fontSize: '48px',
							color: '#1890ff',
							marginBottom: '10px',
						}}>
						⚠️
					</div>
					<p
						style={{
							fontSize: '18px',
							color: '#333',
							margin: 0,
							fontWeight: '500',
						}}>
						{confirmModal.content}
					</p>
				</div>
			</Modal>

		</ThemedLayout>
	);
};

export default LevelList;
