import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
	Table,
	Button,
	Space,
	Modal,
	message,
	Input,
	Tag,
	Card,
	Row,
	Col,
	Tooltip,
	Typography,
} from 'antd';
import {
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	SearchOutlined,
	ReloadOutlined,
	BookOutlined,
	EyeOutlined,
	FileTextOutlined,
	DownloadOutlined,
	UploadOutlined,
	PlayCircleOutlined,
	ClockCircleOutlined,
	FilterOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import SyllabusForm from './SyllabusForm';
import './SyllabusList.css';
import ThemedLayout from '../../../../component/ThemedLayout';
import { useTheme } from '../../../../contexts/ThemeContext';
import LoadingWithEffect from '../../../../component/spinner/LoadingWithEffect';
import { spaceToast } from '../../../../component/SpaceToastify';
import syllabusManagementApi from '../../../../apis/backend/syllabusManagement';
import levelManagementApi from '../../../../apis/backend/levelManagement';

const { Title } = Typography;

const SyllabusList = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { theme } = useTheme();

	// State management
	const [loading, setLoading] = useState(false);
	const [syllabuses, setSyllabuses] = useState([]);
	const [levels, setLevels] = useState([]);
	const [searchText, setSearchText] = useState('');
	const [statusFilter, setStatusFilter] = useState([]);
	const [levelFilter, setLevelFilter] = useState([]);
	const [currentView, setCurrentView] = useState('syllabuses'); // 'syllabuses', 'chapters', 'lessons'
	const [searchTimeout, setSearchTimeout] = useState(null);
	const [sortBy, setSortBy] = useState('createdAt');
	const [sortDir, setSortDir] = useState('desc');
	const [filterDropdown, setFilterDropdown] = useState({
		visible: false,
		selectedStatuses: [],
		selectedLevels: [],
	});
	
	// Refs for click outside detection
	const filterContainerRef = useRef(null);

	// Filter options
	const statusOptions = [
		{ key: 'active', label: t('syllabusManagement.active') },
		{ key: 'inactive', label: t('syllabusManagement.inactive') },
	];

	// Modal states
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
	const [editingSyllabus, setEditingSyllabus] = useState(null);
	const [deleteSyllabus, setDeleteSyllabus] = useState(null);

	// Pagination state
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 10,
		total: 0,
		showSizeChanger: true,
		showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
	});

	// Fetch syllabuses from API
	const fetchSyllabuses = useCallback(async (page = 1, size = 10, search = '', statusFilter = [], levelFilter = [], sortField = 'createdAt', sortDirection = 'desc') => {
		setLoading(true);
		try {
			const params = {
				page: page - 1, // API uses 0-based indexing
				size: size,
				sortBy: sortField,
				sortDir: sortDirection,
			};
			
			// Add search parameter if provided
			if (search && search.trim()) {
				params.text = search.trim();
			}

			// Add status filter if provided
			if (statusFilter.length > 0) {
				params.status = statusFilter;
			}

			// Add level filter if provided
			if (levelFilter.length > 0) {
				params.levelId = levelFilter.map(id => parseInt(id));
			}

			const response = await syllabusManagementApi.getSyllabuses({
				params: params,
			});

			// Map API response to component format
			const mappedSyllabuses = response.data.map((syllabus) => ({
				id: syllabus.id,
				name: syllabus.syllabusName,
				description: syllabus.description,
				levelId: syllabus.levelId,
				level: syllabus.level,
				duration: syllabus.duration,
				status: syllabus.status,
				objectives: syllabus.objectives,
				learningOutcomes: syllabus.learningOutcomes,
				assessmentCriteria: syllabus.assessmentCriteria,
				createdAt: syllabus.createdAt,
				chapters: syllabus.chapters || [],
			}));

			setSyllabuses(mappedSyllabuses);
			setPagination(prev => ({
				...prev,
				current: page,
				pageSize: size,
				total: response.totalElements || response.data.length,
			}));
			setLoading(false);
		} catch (error) {
			console.error('Error fetching syllabuses:', error);
			message.error(t('syllabusManagement.loadSyllabusesError'));
			setLoading(false);
		}
	}, [t]);

	// Fetch levels for filter dropdown
	const fetchLevels = useCallback(async () => {
		try {
			const params = {
				page: 0,
				size: 100, // Get all levels
				sortBy: 'orderNumber',
				sortDir: 'asc',
			};
			
			// Add status filter - API expects array of booleans
			params.status = [true]; // true for active levels
			
			const response = await levelManagementApi.getLevels({
				params: params,
			});
			
			// Handle different response structures
			const levelsData = response.data?.content || response.data || [];
			setLevels(levelsData);
			
			console.log('Fetched levels for filter:', levelsData);
		} catch (error) {
			console.error('Error fetching levels:', error);
			setLevels([]); // Set empty array on error
		}
	}, []);

	useEffect(() => {
		fetchSyllabuses(1, pagination.pageSize, searchText, statusFilter, levelFilter, sortBy, sortDir);
		fetchLevels(); // Load levels for filter dropdown
	}, [fetchSyllabuses, fetchLevels, searchText, statusFilter, levelFilter, sortBy, sortDir, pagination.pageSize]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
		};
	}, [searchTimeout]);

	// Click outside detection for filter dropdown
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (filterContainerRef.current && !filterContainerRef.current.contains(event.target)) {
				setFilterDropdown(prev => ({
					...prev,
					visible: false,
				}));
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	const handleAdd = () => {
		setEditingSyllabus(null);
		setIsModalVisible(true);
	};

	const handleEdit = (syllabus) => {
		setEditingSyllabus(syllabus);
		setIsModalVisible(true);
	};

	const handleDeleteClick = (syllabus) => {
		setDeleteSyllabus(syllabus);
		setIsDeleteModalVisible(true);
	};

	const handleDelete = async () => {
		try {
			await syllabusManagementApi.deleteSyllabus(deleteSyllabus.id);
			
			// Update local state
			setSyllabuses(syllabuses.filter(s => s.id !== deleteSyllabus.id));
			
			spaceToast.success(t('syllabusManagement.deleteSyllabusSuccess'));
			setIsDeleteModalVisible(false);
			setDeleteSyllabus(null);
		} catch (error) {
			console.error('Error deleting syllabus:', error);
			message.error(t('syllabusManagement.deleteSyllabusError'));
		}
	};

	const handleDeleteModalClose = () => {
		setIsDeleteModalVisible(false);
		setDeleteSyllabus(null);
	};

	const handleViewChapters = (syllabus) => {
		navigate(`/manager/syllabuses/${syllabus.id}/chapters`);
	};


	const handleModalClose = () => {
		setIsModalVisible(false);
		setEditingSyllabus(null);
	};


	const handleRefresh = () => {
		fetchSyllabuses(pagination.current, pagination.pageSize, searchText, statusFilter, levelFilter, sortBy, sortDir);
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
			fetchSyllabuses(1, pagination.pageSize, value, statusFilter, levelFilter, sortBy, sortDir);
		}, 1000);
		
		setSearchTimeout(newTimeout);
	};

	// Handle filter dropdown toggle
	const handleFilterToggle = () => {
		setFilterDropdown(prev => ({
			...prev,
			visible: !prev.visible,
			selectedStatuses: prev.visible ? prev.selectedStatuses : [...statusFilter],
			selectedLevels: prev.visible ? prev.selectedLevels : [...levelFilter],
		}));
	};

	// Handle filter submission
	const handleFilterSubmit = () => {
		setStatusFilter(filterDropdown.selectedStatuses);
		setLevelFilter(filterDropdown.selectedLevels);
		setFilterDropdown(prev => ({
			...prev,
			visible: false,
		}));
		// Reset to first page when applying filters
		fetchSyllabuses(1, pagination.pageSize, searchText, filterDropdown.selectedStatuses, filterDropdown.selectedLevels, sortBy, sortDir);
	};

	// Handle filter reset
	const handleFilterReset = () => {
		setFilterDropdown(prev => ({
			...prev,
			selectedStatuses: [],
			selectedLevels: [],
		}));
	};

	const handleTableChange = (pagination, filters, sorter) => {
		// Handle sorting
		if (sorter && sorter.field) {
			const newSortBy = sorter.field;
			const newSortDir = sorter.order === 'ascend' ? 'asc' : 'desc';
			
			setSortBy(newSortBy);
			setSortDir(newSortDir);
			
			// Fetch data with new sorting
			fetchSyllabuses(pagination.current, pagination.pageSize, searchText, statusFilter, levelFilter, newSortBy, newSortDir);
		} else {
			// Handle pagination without sorting change
			fetchSyllabuses(pagination.current, pagination.pageSize, searchText, statusFilter, levelFilter, sortBy, sortDir);
		}
	};

	const handleExport = () => {
		// TODO: Implement export functionality
		message.success(t('syllabusManagement.exportSuccess'));
	};

	const handleImport = () => {
		// TODO: Implement import functionality
		message.success(t('syllabusManagement.importSuccess'));
	};

	// No need for client-side filtering since API handles filtering
	const filteredSyllabuses = syllabuses;

	// Get all chapters from all syllabuses
	const allChapters = syllabuses.flatMap(syllabus => 
		syllabus.chapters?.map(chapter => ({
			...chapter,
			syllabusName: syllabus.name,
			syllabusId: syllabus.id
		})) || []
	);

	// Get all lessons from all chapters
	const allLessons = allChapters.flatMap(chapter => 
		chapter.lessons?.map(lesson => ({
			...lesson,
			chapterName: chapter.name,
			chapterId: chapter.id,
			syllabusName: chapter.syllabusName,
			syllabusId: chapter.syllabusId
		})) || []
	);

	// Filter chapters based on search
	const filteredChapters = allChapters.filter((chapter) => {
		const matchesSearch =
			chapter.name.toLowerCase().includes(searchText.toLowerCase()) ||
			chapter.description.toLowerCase().includes(searchText.toLowerCase()) ||
			chapter.syllabusName.toLowerCase().includes(searchText.toLowerCase());
		return matchesSearch;
	});

	// Filter lessons based on search
	const filteredLessons = allLessons.filter((lesson) => {
		const matchesSearch =
			lesson.name.toLowerCase().includes(searchText.toLowerCase()) ||
			lesson.description.toLowerCase().includes(searchText.toLowerCase()) ||
			lesson.chapterName.toLowerCase().includes(searchText.toLowerCase()) ||
			lesson.syllabusName.toLowerCase().includes(searchText.toLowerCase());
		return matchesSearch;
	});


	const syllabusColumns = [
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
			title: t('syllabusManagement.syllabusName'),
			dataIndex: 'name',
			width: '20%',
			key: 'name',
			sorter: true,
			render: (text, record) => (
				<div>
					<div style={{ fontWeight: 'bold', fontSize: '16px' }}>{text}</div>
					<div style={{ color: '#666', fontSize: '12px' }}>
						{record.description}
					</div>
				</div>
			),
		},
		{
			title: t('syllabusManagement.level'),
			dataIndex: 'levelId',
			key: 'levelId',
			width: '20%',
			render: (levelId) => {
				// Find level by matching levelId with levels array
				const level = levels.find(l => l.id === levelId);
				return (
					<div style={{ color: 'black', fontSize: '20px' }}>
						{level ? `${level.levelName} (${level.difficulty})` : 'N/A'}
					</div>
				);
			},
		},
		{
			title: t('syllabusManagement.chapters'),
			dataIndex: 'chapters',
			key: 'chapters',
			width: '10%',
			render: (chapters) => (
				<div style={{ textAlign: 'center' }}>
					<FileTextOutlined style={{ marginRight: '4px' }} />
					{chapters?.length || 0}
				</div>
			),
		},
		{
			title: t('syllabusManagement.totalLessons'),
			dataIndex: 'totalLessons',
			key: 'totalLessons',
			width: '10%',
			render: (totalLessons, record) => (
				<div style={{ textAlign: 'center' }}>
					<BookOutlined style={{ marginRight: '4px' }} />
					{record.chapters?.reduce((sum, chapter) => sum + (chapter.lessons?.length || 0), 0) || 0}
				</div>
			),
		},
		{
			title: t('syllabusManagement.duration'),
			dataIndex: 'duration',
			key: 'duration',
			width: '10%',
			render: (duration) => `${duration} ${t('syllabusManagement.weeks')}`,
		},
		{
			title: t('syllabusManagement.actions'),
			key: 'actions',
			width: '15%',
			render: (_, record) => (
				<Space size="small">
					<Tooltip title={t('syllabusManagement.viewChapters')}>
						<Button
							type="text"
							size="small"
							icon={<EyeOutlined style={{ fontSize: '25px' }} />}
							onClick={() => handleViewChapters(record)}
						/>
					</Tooltip>
					<Tooltip title={t('common.edit')}>
						<Button
							type="text"
							size="small"
							icon={<EditOutlined style={{ fontSize: '25px' }} />}
							onClick={() => handleEdit(record)}
						/>
					</Tooltip>
					<Button
						type="text"
						size="small"
						icon={<DeleteOutlined style={{ fontSize: '25px' }} />}
						onClick={() => handleDeleteClick(record)}
					/>
				</Space>
			),
		},
	];

	const chapterColumns = [
		{
			title: t('chapterManagement.chapterNumber'),
			dataIndex: 'order',
			key: 'order',
			width: 80,
			sorter: (a, b) => a.order - b.order,
			render: (order) => (
				<Tag color="blue" style={{ textAlign: 'center', minWidth: '30px' }}>
					{order}
				</Tag>
			),
		},
		{
			title: t('chapterManagement.chapterName'),
			dataIndex: 'name',
			key: 'name',
			width: 200,
			sorter: (a, b) => a.name.localeCompare(b.name),
			render: (text) => (
				<div style={{ fontSize: '20px' }}>{text}</div>
			),
		},
		{
			title: t('syllabusManagement.syllabusName'),
			dataIndex: 'name',
			key: 'name',
			width: 150,
			render: (syllabusName) => (
				<span style={{ }}>{syllabusName}</span>
			),
		},
		{
			title: t('chapterManagement.lessons'),
			dataIndex: 'lessons',
			key: 'lessons',
			width: 100,
			render: (lessons) => (
				<div style={{ textAlign: 'center' }}>
					<PlayCircleOutlined style={{ marginRight: '4px' }} />
					{lessons?.length || 0}
				</div>
			),
		},
		{
			title: t('chapterManagement.duration'),
			dataIndex: 'duration',
			key: 'duration',
			width: 100,
			render: (duration) => `${duration} ${t('chapterManagement.hours')}`,
		},
		{
			title: t('chapterManagement.status'),
			dataIndex: 'status',
			key: 'status',
			width: 100,
			render: (status) => (
				<Tag color={status === 'active' ? 'green' : 'red'}>
					{t(`chapterManagement.${status}`)}
				</Tag>
			),
		},
		{
			title: t('chapterManagement.createdAt'),
			dataIndex: 'createdAt',
			key: 'createdAt',
			width: 120,
			render: (date) => new Date(date).toLocaleDateString(),
		},
	];

	const lessonColumns = [
		{
			title: t('lessonManagement.lessonNumber'),
			dataIndex: 'order',
			key: 'order',
			width: 80,
			sorter: (a, b) => a.order - b.order,
			render: (order) => (
				<Tag color="green" style={{ textAlign: 'center', minWidth: '30px' }}>
					{order}
				</Tag>
			),
		},
		{
			title: t('lessonManagement.lessonName'),
			dataIndex: 'name',
			key: 'name',
			width: 200,
			sorter: (a, b) => a.name.localeCompare(b.name),
			render: (text) => (
				<div style={{ fontSize: '20px' }}>{text}</div>
			),
		},
		{
			title: t('chapterManagement.chapterName'),
			dataIndex: 'chapterName',
			key: 'chapterName',
			width: 120,
			render: (chapterName) => (
				<span>{chapterName}</span>
			),
		},
		{
			title: t('syllabusManagement.syllabusName'),
			dataIndex: 'syllabusName',
			key: 'syllabusName',
			width: 120,
			render: (syllabusName) => (
				<span>{syllabusName}</span>
			),
		},
		{
			title: t('lessonManagement.duration'),
			dataIndex: 'duration',
			key: 'duration',
			width: 100,
			render: (duration) => (
				<div style={{ textAlign: 'center' }}>
					<ClockCircleOutlined style={{ marginRight: '4px' }} />
					{duration}h
				</div>
			),
		},
		{
			title: t('lessonManagement.lessonType'),
			dataIndex: 'type',
			key: 'type',
			width: 120,
			render: (type) => (
				<span>{t(`lessonManagement.${type}`)}</span>
			),
		},
		{
			title: t('lessonManagement.status'),
			dataIndex: 'status',
			key: 'status',
			width: 100,
			render: (status) => (
				<Tag color={status === 'active' ? 'green' : 'red'}>
					{t(`lessonManagement.${status}`)}
				</Tag>
			),
		},
		{
			title: t('lessonManagement.createdAt'),
			dataIndex: 'createdAt',
			key: 'createdAt',
			width: 120,
			render: (date) => new Date(date).toLocaleDateString(),
		},
	];

	// Calculate statistics based on current view
	const getCurrentData = () => {
		switch (currentView) {
			case 'syllabuses':
				return filteredSyllabuses;
			case 'chapters':
				return filteredChapters;
			case 'lessons':
				return filteredLessons;
			default:
				return filteredSyllabuses;
		}
	};

	const getCurrentColumns = () => {
		switch (currentView) {
			case 'syllabuses':
				return syllabusColumns;
			case 'chapters':
				return chapterColumns;
			case 'lessons':
				return lessonColumns;
			default:
				return syllabusColumns;
		}
	};


	return (
		<ThemedLayout>
			<div className="syllabus-list-container">

			{/* Main Container Card */}
			<Card className="main-container-card">
				


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
							{currentView === 'syllabuses' && (
								<div ref={filterContainerRef} style={{ position: 'relative' }}>
									<Button 
										icon={<FilterOutlined />}
										onClick={handleFilterToggle}
										className={`filter-button ${theme}-filter-button ${filterDropdown.visible ? 'active' : ''} ${(statusFilter.length > 0 || levelFilter.length > 0) ? 'has-filters' : ''}`}
									>
										Filter
									</Button>
									
									{/* Filter Dropdown Panel */}
									{filterDropdown.visible && (
										<div className={`filter-dropdown-panel ${theme}-filter-dropdown`}>
											<div style={{ padding: '20px' }}>
												{/* Status and Level Filters in same row */}
												<div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
													{/* Status Filter */}
													<div style={{ flex: 1 }}>
														<Title level={5} style={{ marginBottom: '12px', fontSize: '16px' }}>
															Status
														</Title>
														<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
															{statusOptions.map(option => (
																<Button
																	key={option.key}
																	onClick={() => {
																		const newStatuses = filterDropdown.selectedStatuses.includes(option.key)
																			? filterDropdown.selectedStatuses.filter(status => status !== option.key)
																			: [...filterDropdown.selectedStatuses, option.key];
																		setFilterDropdown(prev => ({ ...prev, selectedStatuses: newStatuses }));
																	}}
																	className={`filter-option ${filterDropdown.selectedStatuses.includes(option.key) ? 'selected' : ''}`}
																>
																	{option.label}
																</Button>
															))}
														</div>
													</div>

													{/* Level Filter */}
													<div style={{ flex: 1 }}>
														<Title level={5} style={{ marginBottom: '12px', fontSize: '16px' }}>
															Level
														</Title>
														<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
															{levels.map(level => (
																<Button
																	key={level.id}
																	onClick={() => {
																		const levelId = level.id.toString();
																		const newLevels = filterDropdown.selectedLevels.includes(levelId)
																			? filterDropdown.selectedLevels.filter(id => id !== levelId)
																			: [...filterDropdown.selectedLevels, levelId];
																		setFilterDropdown(prev => ({ ...prev, selectedLevels: newLevels }));
																	}}
																	className={`filter-option ${filterDropdown.selectedLevels.includes(level.id.toString()) ? 'selected' : ''}`}
																>
																	{level.levelName} ({level.difficulty})
																</Button>
															))}
														</div>
													</div>
												</div>

												{/* Action Buttons */}
												<div style={{ 
													display: 'flex', 
													justifyContent: 'space-between', 
													marginTop: '20px',
													paddingTop: '16px',
													borderTop: '1px solid #f0f0f0'
												}}>
													<Button
														onClick={handleFilterReset}
														className="filter-reset-button"
													>
														Reset
													</Button>
													<Button
														type="primary"
														onClick={handleFilterSubmit}
														className="filter-submit-button"
													>
														View Results
													</Button>
												</div>
											</div>
										</div>
									)}
								</div>
							)}
						</Space>
					</Col>
					<Col>
						<Space>
							<Button
								icon={<DownloadOutlined />}
								className={`export-button ${theme}-export-button`}
								onClick={handleExport}
							>
								{t('syllabusManagement.exportData')}
							</Button>
							<Button
								icon={<UploadOutlined />}
								className={`import-button ${theme}-import-button`}
								onClick={handleImport}
							>
								{t('syllabusManagement.importSyllabuses')}
							</Button>
							<Button
								icon={<ReloadOutlined />}
								className={`refresh-button ${theme}-refresh-button`}
								onClick={handleRefresh}
								loading={loading}
							>
								{t('syllabusManagement.refresh')}
							</Button>
							{currentView === 'syllabuses' && (
								<Button
									icon={<PlusOutlined />}
									className="create-button"
									onClick={handleAdd}
								>
									{t('syllabusManagement.addSyllabus')}
								</Button>
							)}
						</Space>
					</Col>
				</Row>

				{/* Table Card */}
				<Card className="table-card">
					<LoadingWithEffect
						loading={loading}
						message={t('syllabusManagement.loadingSyllabuses')}>
						<Table
							columns={getCurrentColumns()}
							dataSource={getCurrentData()}
							rowKey="id"
							loading={loading}
							pagination={currentView === 'syllabuses' ? {
								...pagination,
								showQuickJumper: true,
								showTotal: (total, range) => {
									const itemName = t('syllabusManagement.syllabuses');
									return `${range[0]}-${range[1]} ${t('syllabusManagement.paginationText')} ${total} ${itemName}`;
								},
							} : {
								total: getCurrentData().length,
								pageSize: 10,
								showSizeChanger: true,
								showQuickJumper: true,
								showTotal: (total, range) => {
									const itemName = currentView === 'chapters' ? t('chapterManagement.chapters') :
													t('lessonManagement.lessons');
									return `${range[0]}-${range[1]} ${t('syllabusManagement.paginationText')} ${total} ${itemName}`;
								},
							}}
							onChange={currentView === 'syllabuses' ? handleTableChange : undefined}
							scroll={{ x: currentView === 'lessons' ? 1200 : 1000 }}
						/>
					</LoadingWithEffect>
				</Card>
			</Card>

			{/* Syllabus Modal */}
			<Modal
				title={
					editingSyllabus
						? t('syllabusManagement.editSyllabus')
						: t('syllabusManagement.addSyllabus')
				}
				open={isModalVisible}
				onCancel={handleModalClose}
				footer={null}
				width={600}
				destroyOnClose
			>
				<SyllabusForm 
					syllabus={editingSyllabus} 
					onClose={handleModalClose}
					onSuccess={handleRefresh}
				/>
			</Modal>


			{/* Delete Confirmation Modal */}
			<Modal
				title={t('syllabusManagement.confirmDelete')}
				open={isDeleteModalVisible}
				onOk={handleDelete}
				onCancel={handleDeleteModalClose}
				okText={t('common.yes')}
				cancelText={t('common.no')}
				okButtonProps={{ danger: true }}>
				<p>{t('syllabusManagement.confirmDeleteMessage')}</p>
				{deleteSyllabus && (
					<p>
						<strong>{deleteSyllabus.name}</strong>
					</p>
				)}
			</Modal>
			</div>
		</ThemedLayout>
	);
};

export default SyllabusList;
