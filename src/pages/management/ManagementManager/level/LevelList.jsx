import React, { useState, useEffect, useCallback } from 'react';
import {
	Table,
	Button,
	Space,
	Modal,
	Input,
	Select,
	Tag,
	Tooltip,
} from 'antd';
import {
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	SearchOutlined,
	ReloadOutlined,
	CheckOutlined,
	StopOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import ThemedLayout from '../../../../component/ThemedLayout';
import LoadingWithEffect from '../../../../component/spinner/LoadingWithEffect';
import { useTheme } from '../../../../contexts/ThemeContext';
import { spaceToast } from '../../../../component/SpaceToastify';
import levelManagementApi from '../../../../apis/backend/levelManagement';
import LevelForm from './LevelForm';

const { Option } = Select;

const LevelList = () => {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const [loading, setLoading] = useState(false);
	const [levels, setLevels] = useState([]);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
	const [editingLevel, setEditingLevel] = useState(null);
	const [deleteLevel, setDeleteLevel] = useState(null);
	const [searchText, setSearchText] = useState('');
	const [statusFilter, setStatusFilter] = useState('active');
	const [searchTimeout, setSearchTimeout] = useState(null);
	const [sortBy, setSortBy] = useState('orderNumber');
	const [sortDir, setSortDir] = useState('asc');
	
	// Pagination state
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 10,
		total: 0,
		showSizeChanger: true,
		showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
	});

	const fetchLevels = useCallback(async (page = 1, size = 10, search = '', statusFilter = 'active', sortField = 'orderNumber', sortDirection = 'asc') => {
		setLoading(true);
		try {
			const params = {
				page: page - 1, // API uses 0-based indexing
				size: size,
				sortBy: sortField,
				sortDir: sortDirection,
			};
			
			// Add search parameter if provided (API uses 'text' parameter)
			if (search && search.trim()) {
				params.text = search.trim();
			}

			// Add status filter if not 'all' (API expects array of booleans)
			if (statusFilter && statusFilter !== 'all') {
				params.status = [statusFilter === 'active'];
			}

			const response = await levelManagementApi.getLevels({
				params: params,
			});

			// Map API response to component format 
			const mappedLevels = response.data.map((level) => ({
				id: level.id,
				levelName: level.levelName,
				// code: level.difficulty,
				difficulty: level.difficulty,
				estimatedDurationWeeks: level.estimatedDurationWeeks,
				status: level.isActive ? 'active' : 'inactive',
				orderNumber: level.orderNumber,
				createdAt: new Date().toLocaleDateString(), // API doesn't provide createdAt, using current date
				description: '', // API doesn't provide description
			}));

			setLevels(mappedLevels);
			setPagination(prev => ({
				...prev,
				current: page,
				pageSize: size,
				total: response.totalElements || mappedLevels.length,
			}));
			setLoading(false);
		} catch (error) {
			console.error('Error fetching levels:', error);
			spaceToast.error(t('levelManagement.loadLevelsError'));
			setLoading(false);
		}
	}, [t]);

	useEffect(() => {
		fetchLevels(1, pagination.pageSize, searchText, statusFilter, sortBy, sortDir);
	}, [fetchLevels, searchText, statusFilter, sortBy, sortDir, pagination.pageSize]);

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
			fetchLevels(1, pagination.pageSize, value, statusFilter, sortBy, sortDir);
		}, 1000);
		
		setSearchTimeout(newTimeout);
	};

	const handleStatusFilterChange = (value) => {
		setStatusFilter(value);
		// Reset to first page when filtering
		fetchLevels(1, pagination.pageSize, searchText, value, sortBy, sortDir);
	};

	const handleTableChange = (pagination, filters, sorter) => {
		// Handle sorting
		if (sorter && sorter.field) {
			const newSortBy = sorter.field;
			const newSortDir = sorter.order === 'ascend' ? 'asc' : 'desc';
			
			setSortBy(newSortBy);
			setSortDir(newSortDir);
			
			// Fetch data with new sorting
			fetchLevels(pagination.current, pagination.pageSize, searchText, statusFilter, newSortBy, newSortDir);
		} else {
			// Handle pagination without sorting change
			fetchLevels(pagination.current, pagination.pageSize, searchText, statusFilter, sortBy, sortDir);
		}
	};

	const handleAdd = () => {
		setEditingLevel(null);
		setIsModalVisible(true);
	};

	const handleEdit = async (level) => {
		try {
			// Fetch full level details from API
			const response = await levelManagementApi.getLevelById(level.id);
			console.log(response);
			
			// Map API response to form format
			const levelDetails = {
				id: response.data.id,
				levelName: response.data.levelName,
				description: response.data.description || '',
				difficulty: response.data.difficulty,
				estimatedDurationWeeks: response.data.estimatedDurationWeeks,
				status: response.data.isActive ? 'active' : 'inactive',
				orderNumber: response.data.orderNumber,
				promotionCriteria: response.data.promotionCriteria || '',
				learningObjectives: response.data.learningObjectives || '',
			};
			
			setEditingLevel(levelDetails);
			setIsModalVisible(true);
		} catch (error) {
			console.error('Error fetching level details:', error);
			spaceToast.error(t('levelManagement.loadLevelDetailsError'));
			setLoading(false);
		}
	};

	const handleDeactivateClick = (level) => {
		setDeleteLevel(level);
		setIsDeleteModalVisible(true);
	};

	const handleDeactivate = async () => {
		try {
			await levelManagementApi.activateDeactivateLevel(deleteLevel.id);
			const action = deleteLevel.status === 'active' ? 'deactivated' : 'activated';
			spaceToast.success(t(`levelManagement.${action}LevelSuccess`));
			setIsDeleteModalVisible(false);
			setDeleteLevel(null);
			// Refresh the list after deactivation
			fetchLevels(pagination.current, pagination.pageSize, searchText, statusFilter, sortBy, sortDir);
		} catch (error) {
			console.error('Error deactivating level:', error);
			spaceToast.error(t('levelManagement.deactivateLevelError'));
		}
	};

	const handleDeactivateModalClose = () => {
		setIsDeleteModalVisible(false);
		setDeleteLevel(null);
	};

	const handleModalClose = (shouldRefresh = false) => {
		setIsModalVisible(false);
		setEditingLevel(null);
		// Refresh data if save was successful
		if (shouldRefresh) {
			fetchLevels(pagination.current, pagination.pageSize, searchText, statusFilter, sortBy, sortDir);
		}
	};

	const handleRefresh = () => {
		fetchLevels(pagination.current, pagination.pageSize, searchText, statusFilter, sortBy, sortDir);
	};


	const columns = [
		{
			title: 'No',
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
			width: '30%',
			sorter: true,
			render: (text) => (
				<div>
					<div>{text}</div>
				</div>
			),
		},
		{
			title: t('levelManagement.difficulty'),
			dataIndex: 'difficulty',
			key: 'difficulty',
			width: '15%',
		},
		{
			title: t('levelManagement.status'),
			dataIndex: 'status',
			key: 'status',
			width: '15%',
			render: (status) => (
				<Tag color={status === 'active' ? 'green' : 'red'}>{status}</Tag>
			),
		},
		{
			title: t('levelManagement.duration'),
			dataIndex: 'estimatedDurationWeeks',
			key: 'estimatedDurationWeeks',
			width: '15%',
			sorter: true,
			render: (estimatedDurationWeeks) => `${estimatedDurationWeeks} weeks`,
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
							icon={<EditOutlined style={{ fontSize: '25px' }} />}
							size='small'
							onClick={() => handleEdit(record)}
						/>
					</Tooltip>
					<Tooltip title={record.status === 'active' ? t('levelManagement.deactivate') : t('levelManagement.activate')}>
						<Button
							type='text'
							size='small'
							icon={
								record.status === 'active' ? (
									<StopOutlined style={{ fontSize: '25px' }} />
								) : (
									<CheckOutlined style={{ fontSize: '25px' }} />
								)
							}
							onClick={() => handleDeactivateClick(record)}
							style={{
								color: record.status === 'active' ? '#ff4d4f' : '#52c41a',
								padding: '4px 8px',
							}}
						/>
					</Tooltip>
				</Space>
			),
		},
	];

	return (
		<ThemedLayout>
			{/* Main Content Panel */}
			<div className={`main-content-panel ${theme}-main-panel`}>
				{/* Header Section */}
				<div className={`panel-header ${theme}-panel-header`}>
					<div className='search-section'>
						<Input
							prefix={<SearchOutlined />}
							value={searchText}
							onChange={(e) => handleSearch(e.target.value)}
							className={`search-input ${theme}-search-input`}
							style={{ flex: '1', minWidth: '250px', maxWidth: '400px', width: '350px' }}
							allowClear
						/>
						
						{/* Status Filter */}
						<Select
							placeholder={t('levelManagement.filterByStatus')}
							value={statusFilter}
							onChange={handleStatusFilterChange}
							className={`filter-select ${theme}-filter-select`}
							style={{ width: 130, marginLeft: '12px' }}
							allowClear>
							<Option value='all'>{t('levelManagement.allStatuses')}</Option>
							<Option value='active'>{t('levelManagement.active')}</Option>
							<Option value='inactive'>{t('levelManagement.inactive')}</Option>
						</Select>
						
						{/* Spacer để đẩy action buttons về bên phải */}
						<div style={{ flex: '1' }}></div>
					</div>
					<div className='action-buttons'>
						<Button
							icon={<ReloadOutlined />}
							onClick={handleRefresh}
							loading={loading}
							className={`refresh-button ${theme}-refresh-button`}>
							{t('levelManagement.refresh')}
						</Button>
						<Button
							icon={<PlusOutlined />}
							className={`create-button ${theme}-create-button`}
							onClick={handleAdd}>
							{t('levelManagement.addLevel')}
						</Button>
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
					editingLevel
						? t('levelManagement.editLevel')
						: t('levelManagement.addLevel')
				}
				open={isModalVisible}
				onCancel={handleModalClose}
				footer={null}
				width={800}
				destroyOnClose
				style={{ top: 20 }}
				bodyStyle={{
					maxHeight: '70vh',
					overflowY: 'auto',
					padding: '24px',
				}}>
				<LevelForm level={editingLevel} onClose={handleModalClose} />
			</Modal>

			{/* Delete Confirmation Modal */}
			<Modal
				title={
					<div
						style={{
							fontSize: '20px',
							fontWeight: '600',
							color: '#1890ff',
							textAlign: 'center',
							padding: '10px 0',
						}}>
						{deleteLevel?.status === 'active' ? t('levelManagement.confirmDeactivate') : t('levelManagement.confirmActivate')}
					</div>
				}
				open={isDeleteModalVisible}
				onOk={handleDeactivate}
				onCancel={handleDeactivateModalClose}
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
						backgroundColor: '#ff4d4f',
						borderColor: '#ff4d4f',
						height: '40px',
						fontSize: '16px',
						fontWeight: '500',
						minWidth: '100px',
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
							color: '#ff4d4f',
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
						{deleteLevel?.status === 'active' ? t('levelManagement.confirmDeactivateMessage') : t('levelManagement.confirmActivateMessage')}
					</p>
					{deleteLevel && (
						<p
							style={{
								fontSize: '16px',
								color: '#666',
								margin: 0,
								fontWeight: '600',
							}}>
							<strong>{deleteLevel.levelName}</strong>
						</p>
					)}
				</div>
			</Modal>
		</ThemedLayout>
	);
};

export default LevelList;
