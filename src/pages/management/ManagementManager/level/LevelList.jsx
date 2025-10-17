import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
	Table,
	Button,
	Space,
	Modal,
	Input,
	Tag,
	Tooltip,
	Typography,
} from 'antd';
import {
	EditOutlined,
	SearchOutlined,
	ReloadOutlined,
	CheckOutlined,
	StopOutlined,
	DragOutlined,
	FilterOutlined,
	PlusOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ThemedLayout from '../../../../component/ThemedLayout';
import LoadingWithEffect from '../../../../component/spinner/LoadingWithEffect';
import { useTheme } from '../../../../contexts/ThemeContext';
import { spaceToast } from '../../../../component/SpaceToastify';
import levelManagementApi from '../../../../apis/backend/levelManagement';
import LevelForm from './LevelForm';
import ROUTER_PAGE from '../../../../constants/router';

const { Title } = Typography;

const LevelList = () => {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [levels, setLevels] = useState([]);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
	const [editingLevel, setEditingLevel] = useState(null);
	const [deleteLevel, setDeleteLevel] = useState(null);
	const [searchText, setSearchText] = useState('');
	const [statusFilter, setStatusFilter] = useState([]);
	const [searchTimeout, setSearchTimeout] = useState(null);
	const [sortBy, setSortBy] = useState('orderNumber');
	const [sortDir, setSortDir] = useState('asc');
	
	// Filter dropdown state
	const [filterDropdown, setFilterDropdown] = useState({
		visible: false,
		selectedStatuses: [],
	});

	// Refs for click outside detection
	const filterContainerRef = useRef(null);
	
	// Pagination state
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 10,
		total: 0,
		showSizeChanger: true,
		showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
	});

	const fetchLevels = useCallback(async (page = 1, size = 10, search = '', statusFilter = [], sortField = 'orderNumber', sortDirection = 'asc') => {
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

			// Add status filter if provided (API expects array of booleans)
			if (statusFilter && statusFilter.length > 0) {
				params.status = statusFilter.map(status => status === 'active');
			}

			console.log('Level API Request Params:', params);

			const response = await levelManagementApi.getLevels(params);

			console.log('Level API Response:', response);
			console.log('Response structure check:', {
				isArray: Array.isArray(response.data),
				hasContent: response.data?.content,
				totalElements: response.totalElements,
				dataLength: response.data?.length
			});

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
				prerequisite: level.prerequisite,
				estimatedDurationWeeks: level.estimatedDurationWeeks,
				status: level.isActive ? 'active' : 'inactive',
				orderNumber: level.orderNumber,
				createdAt: level.createdAt ? new Date(level.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
				description: level.description || '',
			}));

			// Debug: Log actual level data to see what fields are available
			if (levelsData.length > 0) {
				console.log('Level Data Sample:', levelsData[0]);
				console.log('Mapped Level Sample:', mappedLevels[0]);
			}

			setLevels(mappedLevels);
			setPagination(prev => ({
				...prev,
				current: page,
				pageSize: size,
				total: totalElements,
			}));
			
			console.log('Level Pagination Updated:', {
				current: page,
				pageSize: size,
				total: totalElements,
				levelsCount: mappedLevels.length,
				responseTotalElements: response.totalElements,
				responseTotalPages: response.totalPages
			});
			setLoading(false);
		} catch (error) {
			console.error('Error fetching levels:', error);
			
			// Handle API errors with backend messages
			if (error.response) {
				const errorMessage = error.response.data.error || error.response.data?.message;
				spaceToast.error(errorMessage);
			} else {
				spaceToast.error(error.message || t('levelManagement.loadLevelsError'));
			}
			setLoading(false);
		}
	}, [t]);

	useEffect(() => {
		console.log('Level useEffect triggered:', {
			searchText,
			statusFilter,
			sortBy,
			sortDir,
			pageSize: pagination.pageSize
		});
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

	// Handle click outside to close filter dropdown
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (filterDropdown.visible && filterContainerRef.current) {
				// Check if click is outside the filter container
				if (!filterContainerRef.current.contains(event.target)) {
					setFilterDropdown((prev) => ({
						...prev,
						visible: false,
					}));
				}
			}
		};

		// Add event listener when dropdown is visible
		if (filterDropdown.visible) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		// Cleanup event listener
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [filterDropdown.visible]);

	const handleSearch = (value) => {
		console.log('Level Search:', value);
		setSearchText(value);
		
		// Clear existing timeout
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
		
		// Set new timeout for 1 second delay
		const newTimeout = setTimeout(() => {
			console.log('Level Search executing:', value);
			// Reset to first page when searching
			fetchLevels(1, pagination.pageSize, value, statusFilter, sortBy, sortDir);
		}, 1000);
		
		setSearchTimeout(newTimeout);
	};

	// Handle filter dropdown toggle
	const handleFilterToggle = () => {
		setFilterDropdown((prev) => ({
			...prev,
			visible: !prev.visible,
			selectedStatuses: prev.visible ? prev.selectedStatuses : [...statusFilter],
		}));
	};

	// Handle filter submission
	const handleFilterSubmit = () => {
		setStatusFilter(filterDropdown.selectedStatuses);
		setFilterDropdown((prev) => ({
			...prev,
			visible: false,
		}));
		// Reset to first page when applying filters
		fetchLevels(
			1,
			pagination.pageSize,
			searchText,
			filterDropdown.selectedStatuses,
			sortBy,
			sortDir
		);
	};

	// Handle filter reset
	const handleFilterReset = () => {
		setFilterDropdown((prev) => ({
			...prev,
			selectedStatuses: [],
		}));
	};

	const handleTableChange = (pagination, filters, sorter) => {
		console.log('Level handleTableChange called:', { pagination, filters, sorter });
		console.log('Current sortBy:', sortBy, 'Current sortDir:', sortDir);
		
		// Handle sorting
		if (sorter && sorter.field) {
			const backendField = sorter.field;
			
			// Handle sorting direction - force toggle if same field
			let newSortDir;
			if (backendField === sortBy) {
				// Same field - toggle direction
				newSortDir = sortDir === 'asc' ? 'desc' : 'asc';
				console.log('Same field clicked, toggling from', sortDir, 'to', newSortDir);
			} else {
				// Different field - start with asc
				newSortDir = 'asc';
				console.log('Different field clicked, starting with asc');
			}

			console.log('Level Sorting:', {
				frontendField: sorter.field,
				backendField: backendField,
				direction: newSortDir,
				order: sorter.order
			});

			setSortBy(backendField);
			setSortDir(newSortDir);

			// Fetch data with new sorting
			fetchLevels(pagination.current, pagination.pageSize, searchText, statusFilter, backendField, newSortDir);
		} else {
			// Handle pagination without sorting change
			console.log('Level Pagination only, no sorting change:', {
				current: pagination.current,
				pageSize: pagination.pageSize,
				total: pagination.total
			});
			fetchLevels(pagination.current, pagination.pageSize, searchText, statusFilter, sortBy, sortDir);
		}
	};


	const handleEdit = async (level) => {
		try {
			console.log('Level Edit clicked for:', level);
			setIsModalVisible(true); // Mở modal ngay lập tức
			
			// Fetch full level details from API
			const response = await levelManagementApi.getLevelById(level.id);
			console.log('Level details response:', response);
			
			// Map API response to form format
			const levelDetails = {
				id: response.data.id,
				levelName: response.data.levelName,
				description: response.data.description || '',
				prerequisite: response.data.prerequisite,
				estimatedDurationWeeks: response.data.estimatedDurationWeeks,
				status: response.data.isActive ? 'active' : 'inactive',
				orderNumber: response.data.orderNumber,
				promotionCriteria: response.data.promotionCriteria || '',
				learningObjectives: response.data.learningObjectives || '',
			};
			
			setEditingLevel(levelDetails);
			
			// Show success toast
			spaceToast.success(t('levelManagement.editLevelSuccess'));
		} catch (error) {
			console.error('Error fetching level details:', error);
			
			// Handle API errors with backend messages
			if (error.response) {
				const errorMessage = error.response.data.error || error.response.data?.message;
				spaceToast.error(errorMessage);
			} else {
				spaceToast.error(error.message || t('levelManagement.loadLevelDetailsError'));
			}
			setIsModalVisible(false); // Đóng modal nếu có lỗi
		}
	};

	const handleDeactivateClick = (level) => {
		setDeleteLevel(level);
		setIsDeleteModalVisible(true);
	};

	const handleDeactivate = async () => {
		try {
			const response = await levelManagementApi.activateDeactivateLevel(deleteLevel.id);
			
			// Use backend message if available, otherwise fallback to translation
			const action = deleteLevel.status === 'active' ? 'deactivated' : 'activated';
			const successMessage = response.message || t(`levelManagement.${action}LevelSuccess`);
			spaceToast.success(successMessage);
			
			setIsDeleteModalVisible(false);
			setDeleteLevel(null);
			// Refresh the list after deactivation
			fetchLevels(pagination.current, pagination.pageSize, searchText, statusFilter, sortBy, sortDir);
		} catch (error) {
			console.error('Error deactivating level:', error);
			
			// Handle API errors with backend messages
			if (error.response) {
				const errorMessage = error.response.data.error || error.response.data?.message;
				spaceToast.error(errorMessage);
			} else {
				spaceToast.error(error.message || t('levelManagement.deactivateLevelError'));
			}
		}
	};

	const handleDeactivateModalClose = () => {
		setIsDeleteModalVisible(false);
		setDeleteLevel(null);
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
			fetchLevels(pagination.current, pagination.pageSize, searchText, statusFilter, sortBy, sortDir);
		}
	};

	const handleRefresh = () => {
		fetchLevels(pagination.current, pagination.pageSize, searchText, statusFilter, sortBy, sortDir);
	};

	const handleAddLevel = () => {
		console.log('Add Level clicked');
		setEditingLevel(null); // No existing level data
		setIsModalVisible(true);
	};

	const handleEditPositions = () => {
		navigate(ROUTER_PAGE.MANAGER_LEVEL_EDIT_POSITIONS);
	};

	// Status options for filter
	const statusOptions = [
		{ key: 'active', label: t('levelManagement.active') },
		{ key: 'inactive', label: t('levelManagement.inactive') },
	];


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
			width: '25%',
			sorter: true,
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
					return <span style={{ color: '#999' }}>None</span>;
				}
				return prerequisite.levelName || prerequisite;
			},
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
					<div
						className='search-section'
						style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
						<Input
							prefix={<SearchOutlined />}
							value={searchText}
							onChange={(e) => handleSearch(e.target.value)}
							className={`search-input ${theme}-search-input`}
							style={{
								flex: '1',
								minWidth: '250px',
								maxWidth: '400px',
								width: '350px',
								height: '40px',
								fontSize: '16px',
							}}
							allowClear
						/>
						<div ref={filterContainerRef} style={{ position: 'relative' }}>
							<Button
								icon={<FilterOutlined />}
								onClick={handleFilterToggle}
								className={`filter-button ${theme}-filter-button ${
									filterDropdown.visible ? 'active' : ''
								} ${
									statusFilter.length > 0
										? 'has-filters'
										: ''
								}`}>
								{t('levelManagement.filter')}
							</Button>

							{/* Filter Dropdown Panel */}
							{filterDropdown.visible && (
								<div
									className={`filter-dropdown-panel ${theme}-filter-dropdown`}>
									<div style={{ padding: '20px' }}>
										{/* Status Filter */}
										<div style={{ marginBottom: '24px' }}>
											<Title
												level={5}
												style={{
													marginBottom: '12px',
													color: '#1890ff',
													fontSize: '16px',
												}}>
												{t('levelManagement.status')}
											</Title>
											<div
												style={{
													display: 'flex',
													flexWrap: 'wrap',
													gap: '8px',
												}}>
												{statusOptions.map((option) => (
													<Button
														key={option.key}
														onClick={() => {
															const newStatuses =
																filterDropdown.selectedStatuses.includes(
																	option.key
																)
																	? filterDropdown.selectedStatuses.filter(
																			(status) => status !== option.key
																	  )
																	: [
																			...filterDropdown.selectedStatuses,
																			option.key,
																	  ];
															setFilterDropdown((prev) => ({
																...prev,
																selectedStatuses: newStatuses,
															}));
														}}
														className={`filter-option ${
															filterDropdown.selectedStatuses.includes(
																option.key
															)
																? 'selected'
																: ''
														}`}>
														{option.label}
													</Button>
												))}
											</div>
										</div>

										{/* Action Buttons */}
										<div
											style={{
												display: 'flex',
												justifyContent: 'space-between',
												marginTop: '20px',
												paddingTop: '16px',
												borderTop: '1px solid #f0f0f0',
											}}>
											<Button
												onClick={handleFilterReset}
												className='filter-reset-button'>
												{t('levelManagement.reset')}
											</Button>
											<Button
												type='primary'
												onClick={handleFilterSubmit}
												className='filter-submit-button'>
												{t('levelManagement.viewResults')}
											</Button>
										</div>
									</div>
								</div>
							)}
						</div>
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
							className={`add-button ${theme}-add-button`}
							onClick={handleAddLevel}
							style={{
								height: '40px',
								borderRadius: '8px',
								fontWeight: '500',
								border: theme === 'space' 
									? '1px solid rgba(77, 208, 255, 0.3)' 
									: '1px solid rgba(24, 144, 255, 0.3)',
								background: theme === 'space'
									? 'rgb(75, 65, 119)'
									: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 50%, #69c0ff 100%)',
								color: theme === 'space' ? '#fff' : '#000',
								backdropFilter: 'blur(10px)',
								transition: 'all 0.3s ease',
								boxShadow: theme === 'space'
									? '0 4px 12px rgba(76, 29, 149, 0.3)'
									: '0 4px 12px rgba(24, 144, 255, 0.3)',
							}}>
							{t('levelManagement.addLevel')}
						</Button>
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
									: '1px solid rgba(24, 144, 255, 0.3)',
								background: theme === 'space'
									? 'rgb(75, 65, 119)'
									: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 50%, #69c0ff 100%)',
								color: theme === 'space' ? '#fff' : '#000',
								backdropFilter: 'blur(10px)',
								transition: 'all 0.3s ease',
								boxShadow: theme === 'space'
									? '0 4px 12px rgba(76, 29, 149, 0.3)'
									: '0 4px 12px rgba(24, 144, 255, 0.3)',
							}}
						
						>
							{t('levelManagement.editPositions')}
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
							sortDirections={['ascend', 'descend']}
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
