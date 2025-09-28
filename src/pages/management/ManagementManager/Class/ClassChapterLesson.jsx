import React, { useState, useEffect, useCallback } from 'react';
import {
	Table,
	Button,
	Space,
	Modal,
	Input,
	Tag,
	Card,
	Row,
	Col,
	Statistic,
	Tooltip,
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
	PlayCircleOutlined,
	ArrowLeftOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../../../component/Layout';
import LoadingWithEffect from '../../../../component/spinner/LoadingWithEffect';
import { spaceToast } from '../../../../component/SpaceToastify';
import ChapterForm from '../syllabus/ChapterForm';
import LessonList from '../syllabus/LessonList';
const { Search } = Input;

// Mock class data
const mockClassData = {
	id: 1,
	name: "Rising star 1",
	studentCount: 3,
	color: "#00d4ff",
	status: "active",
	createdAt: "2024-01-15",
	teacher: "Nguyễn Văn A",
	syllabus: {
		id: 1,
		name: "Beginner English Course",
		level: "Beginner",
	},
};

// Mock chapters data
const mockChapters = [
	{
		id: 1,
		order: 1,
		name: "Chapter 1: Introduction to English",
		description: "Basic introduction to English language",
		duration: 2,
		status: "active",
		createdAt: "2024-01-15",
		lessons: [
			{
				id: 1,
				order: 1,
				name: "Lesson 1: Alphabet and Numbers",
				description: "Learning the English alphabet and numbers",
				duration: 1,
				type: "theory",
				status: "active",
				createdAt: "2024-01-15",
			},
			{
				id: 2,
				order: 2,
				name: "Lesson 2: Basic Greetings",
				description: "Common greetings and polite expressions",
				duration: 1.5,
				type: "practice",
				status: "active",
				createdAt: "2024-01-15",
			},
		],
	},
	{
		id: 2,
		order: 2,
		name: "Chapter 2: Family and Friends",
		description: "Vocabulary and expressions about family and friends",
		duration: 3,
		status: "active",
		createdAt: "2024-01-16",
		lessons: [
			{
				id: 3,
				order: 1,
				name: "Lesson 1: Family Members",
				description: "Names and relationships of family members",
				duration: 1,
				type: "theory",
				status: "active",
				createdAt: "2024-01-16",
			},
			{
				id: 4,
				order: 2,
				name: "Lesson 2: Describing People",
				description: "Adjectives to describe physical appearance",
				duration: 1.5,
				type: "mixed",
				status: "active",
				createdAt: "2024-01-16",
			},
		],
	},
];

const ClassChapterLesson = () => {
	const { t } = useTranslation();
	const { id } = useParams();
	const navigate = useNavigate();

	const [classData, setClassData] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [searchText, setSearchText] = useState('');
	const [isChapterModalVisible, setIsChapterModalVisible] = useState(false);
	const [isViewLessonsModalVisible, setIsViewLessonsModalVisible] = useState(false);
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
	const [editingChapter, setEditingChapter] = useState(null);
	const [selectedChapter, setSelectedChapter] = useState(null);
	const [deleteItem, setDeleteItem] = useState(null);

	const fetchClassData = useCallback(async () => {
		setIsLoading(true);
		try {
			// Simulate API call
			setTimeout(() => {
				setClassData(mockClassData);
				setIsLoading(false);
			}, 1000);
		} catch (error) {
			spaceToast.error(t('classChapterLesson.loadingClassInfo'));
			setIsLoading(false);
		}
	}, [t]);

	const fetchChaptersData = useCallback(async () => {
		try {
			// Simulate API call - in real app, this would fetch chapters for the class's syllabus
			// dispatch(fetchChaptersBySyllabus(classData?.syllabus?.id));
		} catch (error) {
			spaceToast.error(t('classChapterLesson.loadingChapters'));
		}
	}, [t]);

	useEffect(() => {
		fetchClassData();
		fetchChaptersData();
	}, [id, fetchClassData, fetchChaptersData]);

	const handleAddChapter = () => {
		setEditingChapter(null);
		setIsChapterModalVisible(true);
	};

	const handleEditChapter = (chapter) => {
		setEditingChapter(chapter);
		setIsChapterModalVisible(true);
	};

	const handleDeleteChapterClick = (chapter) => {
		setDeleteItem(chapter);
		setIsDeleteModalVisible(true);
	};

	const handleDeleteChapter = async () => {
		try {
			// await dispatch(deleteChapter(deleteItem.id));
			spaceToast.success(t('classChapterLesson.deleteChapterSuccess'));
			setIsDeleteModalVisible(false);
			setDeleteItem(null);
		} catch (error) {
			spaceToast.error(t('classChapterLesson.deleteChapterError'));
		}
	};

	const handleViewLessons = (chapter) => {
		setSelectedChapter(chapter);
		setIsViewLessonsModalVisible(true);
	};



	const handleModalClose = () => {
		setIsChapterModalVisible(false);
		setIsViewLessonsModalVisible(false);
		setEditingChapter(null);
		setSelectedChapter(null);
	};

	const handleDeleteModalClose = () => {
		setIsDeleteModalVisible(false);
		setDeleteItem(null);
	};

	const handleRefresh = () => {
		fetchChaptersData();
	};

	// Filter chapters based on search
	const filteredChapters = mockChapters.filter((chapter) => {
		const matchesSearch =
			chapter.name.toLowerCase().includes(searchText.toLowerCase()) ||
			chapter.description.toLowerCase().includes(searchText.toLowerCase());
		return matchesSearch;
	});


	// Calculate statistics
	const totalChapters = mockChapters.length;
	const totalLessons = mockChapters.reduce(
		(sum, chapter) => sum + (chapter.lessons?.length || 0),
		0
	);
	const averageLessonsPerChapter =
		totalChapters > 0 ? Math.round(totalLessons / totalChapters) : 0;


	const chapterColumns = [
		{
			title: t('classChapterLesson.chapterNumber'),
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
			title: t('classChapterLesson.chapterName'),
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
			title: t('classChapterLesson.lessons'),
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
			title: t('classChapterLesson.duration'),
			dataIndex: 'duration',
			key: 'duration',
			width: 100,
			render: (duration) => `${duration} ${t('classChapterLesson.hours')}`,
		},
		{
			title: t('classChapterLesson.status'),
			dataIndex: 'status',
			key: 'status',
			width: 100,
			render: (status) => (
				<Tag color={status === 'active' ? 'green' : 'red'}>
					{t(`classChapterLesson.${status}`)}
				</Tag>
			),
		},
		{
			title: t('classChapterLesson.actions'),
			key: 'actions',
			width: 200,
			render: (_, record) => (
				<Space size="small">
					<Tooltip title={t('classChapterLesson.viewLessons')}>
						<Button
							type="text"
							size="small"
							icon={<EyeOutlined style={{ fontSize: '25px' }} />}
							onClick={() => handleViewLessons(record)}
						/>
					</Tooltip>
					<Tooltip title={t('common.edit')}>
						<Button
							type="text"
							size="small"
							icon={<EditOutlined style={{ fontSize: '25px' }} />}
							onClick={() => handleEditChapter(record)}
						/>
					</Tooltip>
					<Button
						type="text"
						size="small"
						icon={<DeleteOutlined style={{ fontSize: '25px' }} />}
						onClick={() => handleDeleteChapterClick(record)}
					/>
				</Space>
			),
		},
	];


	if (isLoading) {
		return (
			<Layout>
				<div className="class-chapter-lesson-container">
					<LoadingWithEffect loading={true} message={t('classChapterLesson.loadingClassInfo')} />
				</div>
			</Layout>
		);
	}

	return (
		<Layout>
			<div className="class-chapter-lesson-container">
				{/* Header */}
				<Card className="header-card">
					<div className="header-content">
						<div className="header-left">
							<Button
								icon={<ArrowLeftOutlined />}
								onClick={() => navigate(`/manager/classes/student/${id}`)}
								className="back-button"
							>
								{t('common.back')}
							</Button>
						</div>
						
						<div className="header-center">
							<h2 className="class-title">
								{classData?.name} - {t('classChapterLesson.chaptersLessons')}
							</h2>
							<p className="class-subtitle">
								{t('classChapterLesson.syllabus')}: {classData?.syllabus?.name}
							</p>
						</div>
						
						<div className="header-right">
							<Space>
								<Button
									icon={<ReloadOutlined />}
									onClick={handleRefresh}
									className="refresh-button"
								>
									{t('classChapterLesson.refresh')}
								</Button>
								<Button
									type="primary"
									icon={<PlusOutlined />}
									onClick={handleAddChapter}
									className="add-button"
								>
									{t('classChapterLesson.addChapter')}
								</Button>
							</Space>
						</div>
					</div>
				</Card>

				{/* Statistics Cards */}
				<Row gutter={16} style={{ marginBottom: '24px' }}>
					<Col span={8}>
						<Card>
							<Statistic
								title={t('classChapterLesson.totalChapters')}
								value={totalChapters}
								prefix={<FileTextOutlined />}
							/>
						</Card>
					</Col>
					<Col span={8}>
						<Card>
							<Statistic
								title={t('classChapterLesson.totalLessons')}
								value={totalLessons}
								prefix={<PlayCircleOutlined />}
							/>
						</Card>
					</Col>
					<Col span={8}>
						<Card>
							<Statistic
								title={t('classChapterLesson.averageLessonsPerChapter')}
								value={averageLessonsPerChapter}
								suffix={t('classChapterLesson.lessons')}
								prefix={<BookOutlined />}
							/>
						</Card>
					</Col>
				</Row>

				{/* Chapters Content */}
				<Card className="main-content-card">
					{/* Search Bar */}
					<Card style={{ marginBottom: '16px' }}>
						<Row gutter={16} align="middle">
							<Col flex="auto">
								<Search
									placeholder={t('classChapterLesson.searchChapters')}
									style={{ width: 300 }}
									value={searchText}
									onChange={(e) => setSearchText(e.target.value)}
									prefix={<SearchOutlined />}
								/>
							</Col>
						</Row>
					</Card>

					{/* Chapters Table */}
					<Card>
						<Table
							columns={chapterColumns}
							dataSource={filteredChapters}
							rowKey="id"
							loading={false}
							pagination={{
								total: filteredChapters.length,
								pageSize: 10,
								showSizeChanger: true,
								showQuickJumper: true,
								showTotal: (total, range) =>
									`${range[0]}-${range[1]} ${t(
										'classChapterLesson.paginationText'
									)} ${total} ${t('classChapterLesson.chapters')}`,
							}}
							scroll={{ x: 800 }}
						/>
					</Card>
				</Card>

				{/* Chapter Modal */}
				<Modal
					title={
						editingChapter
							? t('classChapterLesson.editChapter')
							: t('classChapterLesson.addChapter')
					}
					open={isChapterModalVisible}
					onCancel={handleModalClose}
					footer={null}
					width={600}
					destroyOnClose
				>
					<ChapterForm
						chapter={editingChapter}
						syllabus={classData?.syllabus}
						onClose={handleModalClose}
					/>
				</Modal>


				{/* View Lessons Modal */}
				<Modal
					title={`${t('classChapterLesson.lessons')} - ${selectedChapter?.name}`}
					open={isViewLessonsModalVisible}
					onCancel={handleModalClose}
					footer={null}
					width={1200}
					destroyOnClose
				>
					{selectedChapter && (
						<LessonList
							chapter={selectedChapter}
							onClose={handleModalClose}
						/>
					)}
				</Modal>

				{/* Delete Confirmation Modal */}
				<Modal
					title={t('classChapterLesson.confirmDelete')}
					open={isDeleteModalVisible}
					onOk={handleDeleteChapter}
					onCancel={handleDeleteModalClose}
					okText={t('common.yes')}
					cancelText={t('common.no')}
					okButtonProps={{ danger: true }}
				>
					<p>
						{t('classChapterLesson.confirmDeleteMessage')} 
						{t('classChapterLesson.chapter')}?
					</p>
					{deleteItem && (
						<p>
							<strong>{deleteItem.name}</strong>
						</p>
					)}
				</Modal>
			</div>
		</Layout>
	);
};

export default ClassChapterLesson;
