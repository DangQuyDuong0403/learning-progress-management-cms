import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
	Table,
	Button,
	Space,
	Modal,
	Input,
	Tooltip,
	Typography,
	Select,
} from 'antd';
import {
	EditOutlined,
	SearchOutlined,
	ReloadOutlined,
	DragOutlined,
	FilterOutlined,
	SendOutlined,
	FileTextOutlined,
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
	const [toggleLoading, setToggleLoading] = useState(false);
	const [currentAction, setCurrentAction] = useState('publish'); // 'publish' or 'draft' - will be auto-detected
	const [isAllPublished, setIsAllPublished] = useState(false); // Track if all levels are published
	const [durationDisplayUnit, setDurationDisplayUnit] = useState('auto'); // 'auto', 'days', 'weeks', 'months', 'years'
	const [levels, setLevels] = useState([]);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [editingLevel, setEditingLevel] = useState(null);
	const [searchText, setSearchText] = useState('');
	const [statusFilter, setStatusFilter] = useState([]);
	const [searchTimeout, setSearchTimeout] = useState(null);
	
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

	const fetchLevels = useCallback(async (page = 1, size = 10, search = '', statusFilter = []) => {
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
				levelCode: level.levelCode || 'N/A',
				prerequisite: level.prerequisite,
				estimatedDurationWeeks: level.estimatedDurationWeeks,
				status: level.status,
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
			
			// Detect current status to determine button action
			detectCurrentAction(mappedLevels);
			
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
			pageSize: pagination.pageSize
		});
		fetchLevels(1, pagination.pageSize, searchText, statusFilter);
	}, [fetchLevels, searchText, statusFilter, pagination.pageSize]);

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
			fetchLevels(1, pagination.pageSize, value, statusFilter);
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
			filterDropdown.selectedStatuses
		);
	};

	// Handle filter reset
	const handleFilterReset = () => {
		setFilterDropdown((prev) => ({
			...prev,
			selectedStatuses: [],
		}));
	};

	const handleTableChange = (pagination) => {
		console.log('Level handleTableChange called:', { pagination });
		
		// Handle pagination only
		console.log('Level Pagination only:', {
			current: pagination.current,
			pageSize: pagination.pageSize,
			total: pagination.total
		});
		fetchLevels(pagination.current, pagination.pageSize, searchText, statusFilter);
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
				levelCode: response.data.levelCode,
				description: response.data.description || '',
				prerequisite: response.data.prerequisite,
				estimatedDurationWeeks: response.data.estimatedDurationWeeks,
				status: response.data.status,
				orderNumber: response.data.orderNumber,
				promotionCriteria: response.data.promotionCriteria || '',
				learningObjectives: response.data.learningObjectives || '',
			};
			console.log('Level details:', levelDetails);
			
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


	const handleModalClose = (shouldRefresh = false, successMessage = null) => {
		setIsModalVisible(false);
		setEditingLevel(null);
		
		// Only refresh data if save was successful
		if (shouldRefresh === true) {
			// Only show success message if provided from LevelForm
			if (successMessage) {
				spaceToast.success(successMessage);
			}
			fetchLevels(pagination.current, pagination.pageSize, searchText, statusFilter);
		}
	};

	// Detect current action based on levels status
	const detectCurrentAction = (levelsData) => {
		if (!levelsData || levelsData.length === 0) {
			setCurrentAction('publish'); // Default to publish if no data
			return;
		}

		// Check if all levels are in DRAFT status (inactive)
		const allDraft = levelsData.every(level => level.status === 'DRAFT');
		// Check if all levels are in PUBLISHED status (active)
		const allPublished = levelsData.every(level => level.status === 'PUBLISHED');
		
		if (allDraft) {
			// All levels are draft → show Publish All button
			setCurrentAction('publish');
			setIsAllPublished(false);
		} else if (allPublished) {
			// All levels are published → show Draft All button
			setCurrentAction('draft');
			setIsAllPublished(true);
		} else {
			// Mixed status → default to publish
			setCurrentAction('publish');
			setIsAllPublished(false);
		}
		
		console.log('Detected action:', {
			allDraft,
			allPublished,
			currentAction: allDraft ? 'publish' : allPublished ? 'draft' : 'publish',
			levelsStatuses: levelsData.map(l => l.status)
		});
	};

	const handleRefresh = () => {
		fetchLevels(pagination.current, pagination.pageSize, searchText, statusFilter);
	};

	const handleTogglePublishDraft = async () => {
		setToggleLoading(true);
		try {
			let response;
			let successMessage;
			
			if (currentAction === 'publish') {
				// Currently showing Publish, so execute publish
				response = await levelManagementApi.publishAllLevels();
				successMessage = response.message || t('levelManagement.publishAllSuccess');
			} else {
				// Currently showing Draft, so execute draft
				response = await levelManagementApi.draftAllLevels();
				successMessage = response.message || t('levelManagement.draftAllSuccess');
			}
			
			spaceToast.success(successMessage);
			
			// Refresh the list after action - detectCurrentAction will determine the next button state
			fetchLevels(pagination.current, pagination.pageSize, searchText, statusFilter);
		} catch (error) {
			console.error(`Error ${currentAction === 'publish' ? 'publishing' : 'drafting'} all levels:`, error);
			
			// Handle API errors with backend messages
			if (error.response) {
				const errorMessage = error.response.data.error || error.response.data?.message;
				spaceToast.error(errorMessage);
			} else {
				const errorKey = currentAction === 'publish' ? 'levelManagement.publishAllError' : 'levelManagement.draftAllError';
				spaceToast.error(error.message || t(errorKey));
			}
		} finally {
			setToggleLoading(false);
		}
	};

	const handleEditPositions = () => {
		navigate(ROUTER_PAGE.MANAGER_LEVEL_EDIT_POSITIONS);
	};

	// Convert duration display based on selected unit
	const formatDuration = (weeks, unit) => {
		if (!weeks) return '0 weeks';
		
		switch (unit) {
			case 'days':
				const days = Math.round(weeks * 7 * 100) / 100;
				return `${days} ${t('levelManagement.days')}`;
			case 'weeks':
				return `${weeks} ${t('levelManagement.weeks')}`;
			case 'months':
				const months = Math.round(weeks / 4.33 * 100) / 100;
				return `${months} ${t('levelManagement.months')}`;
			case 'years':
				const years = Math.round(weeks / 52 * 100) / 100;
				return `${years} ${t('levelManagement.years')}`;
			case 'auto':
			default:
				// Auto-detect best unit to display
				if (weeks >= 52) {
					const years = Math.round(weeks / 52 * 100) / 100;
					return `${years} ${t('levelManagement.years')}`;
				} else if (weeks >= 4.33) {
					const months = Math.round(weeks / 4.33 * 100) / 100;
					return `${months} ${t('levelManagement.months')}`;
				} else if (weeks < 1) {
					const days = Math.round(weeks * 7 * 100) / 100;
					return `${days} ${t('levelManagement.days')}`;
				} else {
					return `${weeks} ${t('levelManagement.weeks')}`;
				}
		}
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
					return <span style={{ color: '#999' }}>None</span>;
				}
				return prerequisite.levelName || prerequisite;
			},
		},
		{
			title: (
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<span>{t('levelManagement.duration')}</span>
					<Select
						value={durationDisplayUnit}
						onChange={setDurationDisplayUnit}
						size="small"
						style={{ width: 80 }}
						dropdownMatchSelectWidth={false}
					>
						<Select.Option value="auto">{t('levelManagement.auto')}</Select.Option>
						<Select.Option value="days">{t('levelManagement.days')}</Select.Option>
						<Select.Option value="weeks">{t('levelManagement.weeks')}</Select.Option>
						<Select.Option value="months">{t('levelManagement.months')}</Select.Option>
						<Select.Option value="years">{t('levelManagement.years')}</Select.Option>
					</Select>
				</div>
			),
			dataIndex: 'estimatedDurationWeeks',
			key: 'estimatedDurationWeeks',
			width: '15%',
			render: (estimatedDurationWeeks) => formatDuration(estimatedDurationWeeks, durationDisplayUnit),
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
							icon={currentAction === 'publish' ? <SendOutlined /> : <FileTextOutlined />}
							onClick={handleTogglePublishDraft}
							loading={toggleLoading}
							className={`toggle-publish-draft-button ${theme}-toggle-publish-draft-button`}
							style={{
								height: '40px',
								borderRadius: '8px',
								fontWeight: '500',
								border: theme === 'space' 
									? currentAction === 'publish' 
										? '1px solid rgba(34, 197, 94, 0.3)' 
										: '1px solid rgba(245, 158, 11, 0.3)'
									: currentAction === 'publish' 
										? '1px solid rgba(34, 197, 94, 0.3)' 
										: '1px solid rgba(245, 158, 11, 0.3)',
								background: theme === 'space'
									? currentAction === 'publish' 
										? 'rgb(34, 197, 94)' 
										: 'rgb(245, 158, 11)'
									: currentAction === 'publish' 
										? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' 
										: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
								color: '#fff',
								backdropFilter: 'blur(10px)',
								transition: 'all 0.3s ease',
								boxShadow: theme === 'space'
									? currentAction === 'publish' 
										? '0 4px 12px rgba(34, 197, 94, 0.3)' 
										: '0 4px 12px rgba(245, 158, 11, 0.3)'
									: currentAction === 'publish' 
										? '0 4px 12px rgba(34, 197, 94, 0.3)' 
										: '0 4px 12px rgba(245, 158, 11, 0.3)',
							}}>
							{currentAction === 'publish' ? t('levelManagement.publishAll') : t('levelManagement.draftAll')}
						</Button>
						<Button
							icon={<DragOutlined />}
							className={`edit-positions-button ${theme}-edit-positions-button`}
							onClick={handleEditPositions}
							disabled={isAllPublished}
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
								opacity: isAllPublished ? 0.5 : 1,
								cursor: isAllPublished ? 'not-allowed' : 'pointer',
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

		</ThemedLayout>
	);
};

export default LevelList;
