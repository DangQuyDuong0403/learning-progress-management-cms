import React, { useState, useEffect } from 'react';
import {
	Table,
	Button,
	Space,
	Modal,
	message,
	Input,
	Select,
	Tag,
	Card,
	Row,
	Col,
	Tooltip,
	Statistic,
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
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import SyllabusForm from './SyllabusForm';
import ChapterList from './ChapterList';
import './SyllabusList.css';
import {
	fetchSyllabuses,
} from '../../../../redux/syllabus';
import ThemedLayout from '../../../../component/ThemedLayout';
import { useTheme } from '../../../../contexts/ThemeContext';

const { Option } = Select;

const SyllabusList = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const { syllabuses, loading } = useSelector((state) => state.syllabus);
	const { theme } = useTheme();

	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isChapterModalVisible, setIsChapterModalVisible] = useState(false);
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
	const [editingSyllabus, setEditingSyllabus] = useState(null);
	const [selectedSyllabus, setSelectedSyllabus] = useState(null);
	const [deleteSyllabus, setDeleteSyllabus] = useState(null);
	const [searchText, setSearchText] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [levelFilter, setLevelFilter] = useState('all');
	const [currentView, setCurrentView] = useState('syllabuses'); // 'syllabuses', 'chapters', 'lessons'

	useEffect(() => {
		dispatch(fetchSyllabuses());
	}, [dispatch]);

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
			await dispatch(deleteSyllabus(deleteSyllabus.id));
			message.success(t('syllabusManagement.deleteSyllabusSuccess'));
			setIsDeleteModalVisible(false);
			setDeleteSyllabus(null);
		} catch (error) {
			message.error(t('syllabusManagement.deleteSyllabusError'));
		}
	};

	const handleDeleteModalClose = () => {
		setIsDeleteModalVisible(false);
		setDeleteSyllabus(null);
	};

	const handleViewChapters = (syllabus) => {
		setSelectedSyllabus(syllabus);
		setIsChapterModalVisible(true);
	};


	const handleModalClose = () => {
		setIsModalVisible(false);
		setEditingSyllabus(null);
	};

	const handleChapterModalClose = () => {
		setIsChapterModalVisible(false);
		setSelectedSyllabus(null);
	};

	const handleRefresh = () => {
		dispatch(fetchSyllabuses());
	};

	const handleExport = () => {
		// TODO: Implement export functionality
		message.success(t('syllabusManagement.exportSuccess'));
	};

	const handleImport = () => {
		// TODO: Implement import functionality
		message.success(t('syllabusManagement.importSuccess'));
	};

	// Filter syllabuses based on search, status, and level
	const filteredSyllabuses = syllabuses.filter((syllabus) => {
		const matchesSearch =
			syllabus.name.toLowerCase().includes(searchText.toLowerCase()) ||
			syllabus.description.toLowerCase().includes(searchText.toLowerCase());
		const matchesStatus =
			statusFilter === 'all' || syllabus.status === statusFilter;
		const matchesLevel =
			levelFilter === 'all' || syllabus.levelId === parseInt(levelFilter);
		return matchesSearch && matchesStatus && matchesLevel;
	});

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
			title: t('syllabusManagement.syllabusName'),
			dataIndex: 'name',
			key: 'name',
			sorter: (a, b) => a.name.localeCompare(b.name),
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
			dataIndex: 'level',
			key: 'level',
			width: 120,
			render: (level) => (
				<Tag color="blue">{level?.name || 'N/A'}</Tag>
			),
		},
		{
			title: t('syllabusManagement.chapters'),
			dataIndex: 'chapters',
			key: 'chapters',
			width: 100,
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
			width: 100,
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
			width: 100,
			render: (duration) => `${duration} ${t('syllabusManagement.weeks')}`,
		},
		{
			title: t('syllabusManagement.status'),
			dataIndex: 'status',
			key: 'status',
			width: 100,
			render: (status) => (
				<Tag color={status === 'active' ? 'green' : 'red'}>
					{t(`syllabusManagement.${status}`)}
				</Tag>
			),
		},
		{
			title: t('syllabusManagement.createdAt'),
			dataIndex: 'createdAt',
			key: 'createdAt',
			width: 120,
			render: (date) => new Date(date).toLocaleDateString(),
		},
		{
			title: t('syllabusManagement.actions'),
			key: 'actions',
			width: 200,
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
			sorter: (a, b) => a.name.localeCompare(b.name),
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
			title: t('syllabusManagement.syllabusName'),
			dataIndex: 'syllabusName',
			key: 'syllabusName',
			width: 150,
			render: (syllabusName) => (
				<Tag color="purple">{syllabusName}</Tag>
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
			sorter: (a, b) => a.name.localeCompare(b.name),
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
			title: t('chapterManagement.chapterName'),
			dataIndex: 'chapterName',
			key: 'chapterName',
			width: 120,
			render: (chapterName) => (
				<Tag color="blue">{chapterName}</Tag>
			),
		},
		{
			title: t('syllabusManagement.syllabusName'),
			dataIndex: 'syllabusName',
			key: 'syllabusName',
			width: 120,
			render: (syllabusName) => (
				<Tag color="purple">{syllabusName}</Tag>
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
				<Tag color={type === 'theory' ? 'blue' : type === 'practice' ? 'green' : 'orange'}>
					{t(`lessonManagement.${type}`)}
				</Tag>
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

	const getStatistics = () => {
		switch (currentView) {
			case 'syllabuses':
				return {
					total: syllabuses.length,
					totalChapters: syllabuses.reduce((sum, s) => sum + (s.chapters?.length || 0), 0),
					totalLessons: syllabuses.reduce((sum, s) => 
						sum + s.chapters?.reduce((chSum, ch) => chSum + (ch.lessons?.length || 0), 0) || 0, 0)
				};
			case 'chapters':
				return {
					total: allChapters.length,
					totalLessons: allChapters.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0),
					averageLessons: allChapters.length > 0 ? 
						Math.round(allChapters.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0) / allChapters.length) : 0
				};
			case 'lessons':
				return {
					total: allLessons.length,
					totalDuration: allLessons.reduce((sum, l) => sum + l.duration, 0),
					averageDuration: allLessons.length > 0 ? 
						(allLessons.reduce((sum, l) => sum + l.duration, 0) / allLessons.length).toFixed(1) : 0
				};
			default:
				return { total: 0, totalChapters: 0, totalLessons: 0 };
		}
	};

	const stats = getStatistics();

	return (
		<ThemedLayout>
			<div className="syllabus-list-container">

			{/* Main Container Card */}
			<Card className="main-container-card">
				{/* View Toggle Buttons */}
				<Row gutter={16} align="middle" style={{ marginBottom: '16px' }}>
					<Col flex="auto">
						<Space size="middle">
							<Button.Group>
								<Button
									type={currentView === 'syllabuses' ? 'primary' : 'default'}
									icon={<BookOutlined />}
									onClick={() => setCurrentView('syllabuses')}
									className="view-toggle-button"
								>
									{t('syllabusManagement.syllabuses')}
								</Button>
								<Button
									type={currentView === 'chapters' ? 'primary' : 'default'}
									icon={<FileTextOutlined />}
									onClick={() => setCurrentView('chapters')}
									className="view-toggle-button"
								>
									{t('chapterManagement.chapters')}
								</Button>
								<Button
									type={currentView === 'lessons' ? 'primary' : 'default'}
									icon={<PlayCircleOutlined />}
									onClick={() => setCurrentView('lessons')}
									className="view-toggle-button"
								>
									{t('lessonManagement.lessons')}
								</Button>
							</Button.Group>
						</Space>
					</Col>
				</Row>

				{/* Statistics Cards */}
				{currentView === 'syllabuses' && (
					<Row gutter={16} style={{ marginBottom: '24px' }}>
						<Col span={8}>
							<Card>
								<Statistic
									title={t('syllabusManagement.totalSyllabuses')}
									value={stats.total}
									prefix={<BookOutlined />}
								/>
							</Card>
						</Col>
						<Col span={8}>
							<Card>
								<Statistic
									title={t('syllabusManagement.totalChapters')}
									value={stats.totalChapters}
									prefix={<FileTextOutlined />}
								/>
							</Card>
						</Col>
						<Col span={8}>
							<Card>
								<Statistic
									title={t('syllabusManagement.totalLessons')}
									value={stats.totalLessons}
									prefix={<PlayCircleOutlined />}
								/>
							</Card>
						</Col>
					</Row>
				)}

				{currentView === 'chapters' && (
					<Row gutter={16} style={{ marginBottom: '24px' }}>
						<Col span={8}>
							<Card>
								<Statistic
									title={t('chapterManagement.totalChapters')}
									value={stats.total}
									prefix={<FileTextOutlined />}
								/>
							</Card>
						</Col>
						<Col span={8}>
							<Card>
								<Statistic
									title={t('chapterManagement.totalLessons')}
									value={stats.totalLessons}
									prefix={<PlayCircleOutlined />}
								/>
							</Card>
						</Col>
						<Col span={8}>
							<Card>
								<Statistic
									title={t('chapterManagement.averageLessonsPerChapter')}
									value={stats.averageLessons}
									suffix={t('chapterManagement.lessons')}
									prefix={<BookOutlined />}
								/>
							</Card>
						</Col>
					</Row>
				)}

				{currentView === 'lessons' && (
					<Row gutter={16} style={{ marginBottom: '24px' }}>
						<Col span={8}>
							<Card>
								<Statistic
									title={t('lessonManagement.totalLessons')}
									value={stats.total}
									prefix={<PlayCircleOutlined />}
								/>
							</Card>
						</Col>
						<Col span={8}>
							<Card>
								<Statistic
									title={t('lessonManagement.totalDuration')}
									value={stats.totalDuration}
									suffix={t('lessonManagement.hours')}
									prefix={<ClockCircleOutlined />}
								/>
							</Card>
						</Col>
						<Col span={8}>
							<Card>
								<Statistic
									title={t('lessonManagement.averageDuration')}
									value={stats.averageDuration}
									suffix={t('lessonManagement.hours')}
									prefix={<BookOutlined />}
								/>
							</Card>
						</Col>
					</Row>
				)}

				{/* Action Bar */}
				<Row gutter={16} align="middle" style={{ marginBottom: '16px' }}>
					<Col flex="auto">
						<Space size="middle">
							<Input
								prefix={<SearchOutlined />}
								value={searchText}
								onChange={(e) => setSearchText(e.target.value)}
								className="search-input"
								style={{ minWidth: '350px', maxWidth: '500px', height: '40px', fontSize: '16px' }}
								allowClear
								placeholder={
									currentView === 'syllabuses' ? t('syllabusManagement.searchPlaceholder') :
									currentView === 'chapters' ? t('chapterManagement.searchPlaceholder') :
									t('lessonManagement.searchPlaceholder')
								}
							/>
							{currentView === 'syllabuses' && (
								<>
									<Select
										style={{ width: 150 }}
										value={statusFilter}
										onChange={setStatusFilter}
										placeholder={t('syllabusManagement.filterByStatus')}
									>
										<Option value="all">{t('syllabusManagement.allStatuses')}</Option>
										<Option value="active">{t('syllabusManagement.active')}</Option>
										<Option value="inactive">{t('syllabusManagement.inactive')}</Option>
									</Select>
									<Select
										style={{ width: 150 }}
										value={levelFilter}
										onChange={setLevelFilter}
										placeholder={t('syllabusManagement.filterByLevel')}
									>
										<Option value="all">{t('syllabusManagement.allLevels')}</Option>
										{/* This will be populated with actual levels from Redux */}
									</Select>
								</>
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
					<Table
						columns={getCurrentColumns()}
						dataSource={getCurrentData()}
						rowKey="id"
						loading={loading}
						pagination={{
							total: getCurrentData().length,
							pageSize: 10,
							showSizeChanger: true,
							showQuickJumper: true,
							showTotal: (total, range) => {
								const itemName = currentView === 'syllabuses' ? t('syllabusManagement.syllabuses') :
												currentView === 'chapters' ? t('chapterManagement.chapters') :
												t('lessonManagement.lessons');
								return `${range[0]}-${range[1]} ${t('syllabusManagement.paginationText')} ${total} ${itemName}`;
							},
						}}
						scroll={{ x: currentView === 'lessons' ? 1200 : 1000 }}
					/>
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
				<SyllabusForm syllabus={editingSyllabus} onClose={handleModalClose} />
			</Modal>

			{/* Chapter Modal */}
			<Modal
				title={`${t('syllabusManagement.chapters')} - ${selectedSyllabus?.name}`}
				open={isChapterModalVisible}
				onCancel={handleChapterModalClose}
				footer={null}
				width={1200}
				destroyOnClose
			>
				{selectedSyllabus && (
					<ChapterList
						syllabus={selectedSyllabus}
						onClose={handleChapterModalClose}
					/>
				)}
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
