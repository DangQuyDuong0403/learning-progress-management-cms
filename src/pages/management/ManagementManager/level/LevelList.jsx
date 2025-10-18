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
	const [durationDisplayUnit, setDurationDisplayUnit] = useState('weeks');
	
	// Cycle through duration units
	const durationUnits = ['days', 'weeks', 'months', 'years'];
	const handleDurationUnitClick = () => {
		const currentIndex = durationUnits.indexOf(durationDisplayUnit);
		const nextIndex = (currentIndex + 1) % durationUnits.length;
		setDurationDisplayUnit(durationUnits[nextIndex]);
	}; 
	const [levels, setLevels] = useState([]);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [editingLevel, setEditingLevel] = useState(null);
	const [searchText, setSearchText] = useState('');
	const [searchTimeout, setSearchTimeout] = useState(null);
	
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
			detectPublishStatus(mappedLevels);
			
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
			pageSize: pagination.pageSize
		});
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
			fetchLevels(1, pagination.pageSize, value);
		}, 1000);
		
		setSearchTimeout(newTimeout);
	};

	const handleTableChange = (pagination) => {
		console.log('Level handleTableChange called:', { pagination });
		
		// Handle pagination only
		console.log('Level Pagination only:', {
			current: pagination.current,
			pageSize: pagination.pageSize,
			total: pagination.total
		});
		fetchLevels(pagination.current, pagination.pageSize, searchText);
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
		
		console.log('Detected publish status:', {
			allPublished,
			levelsStatuses: levelsData.map(l => l.status)
		});
	};


	const handlePublishAll = async () => {
		setToggleLoading(true);
		try {
			const response = await levelManagementApi.publishAllLevels();
			const successMessage = response.message || t('levelManagement.publishAllSuccess');
			
			spaceToast.success(successMessage);
			
			// Refresh the list after action
			fetchLevels(pagination.current, pagination.pageSize, searchText);
		} catch (error) {
			console.error('Error publishing all levels:', error);
			
			// Handle API errors with backend messages
			if (error.response) {
				const errorMessage = error.response.data.error || error.response.data?.message;
				spaceToast.error(errorMessage);
			} else {
				spaceToast.error(error.message || t('levelManagement.publishAllError'));
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


	const columns = [
		{
			title: 'STT',
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
					return <span style={{ color: '#999' }}>None</span>;
				}
				return prerequisite.levelName || prerequisite;
			},
		},
		{
			title: (
				<span
					onClick={handleDurationUnitClick}
					style={{
						cursor: 'pointer',
						userSelect: 'none',
						transition: 'color 0.2s ease',
						fontWeight: '500',
						whiteSpace: 'nowrap',
					}}
					onMouseEnter={(e) => {
						e.target.style.color = '#1890ff';
					}}
					onMouseLeave={(e) => {
						e.target.style.color = '#000';
					}}
				>
					{t('levelManagement.duration')} ({t(`levelManagement.${durationDisplayUnit}`)})
				</span>
			),
			dataIndex: 'estimatedDurationWeeks',
			key: 'estimatedDurationWeeks',
			width: '18%',
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
							icon={<EditOutlined style={{ fontSize: '25px', color: '#000000' }} />}
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
				{/* Page Title */}
				<div className="page-title-container">
					<Typography.Title 
						level={1} 
						className="page-title"
					>
						Level Management
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
							icon={<SendOutlined />}
							onClick={handlePublishAll}
							loading={toggleLoading}
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
							}}>
							{t('levelManagement.publishAll')}
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
								opacity: isAllPublished ? 0.5 : 1,
								cursor: isAllPublished ? 'not-allowed' : 'pointer',
							}}
						
						>
							{t('levelManagement.edit')}
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
					<div style={{ textAlign: 'center', fontSize: '30px', fontWeight: '600' }}>
						{editingLevel
							? t('levelManagement.editLevel')
							: t('levelManagement.addLevel')}
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

		</ThemedLayout>
	);
};

export default LevelList;
