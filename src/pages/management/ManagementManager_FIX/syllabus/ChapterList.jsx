import React, { useState, useEffect } from 'react';
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
	Statistic,
	Tooltip,
	Collapse,
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
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import ChapterForm from './ChapterForm';
import LessonList from './LessonList';
import {
	fetchChaptersBySyllabus,
	deleteChapter,
	updateChapterStatus,
} from '../../../../redux/syllabus';

const { Search } = Input;
const { Panel } = Collapse;

const ChapterList = ({ syllabus, onClose }) => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const { chapters, loading } = useSelector((state) => state.syllabus);

	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isLessonModalVisible, setIsLessonModalVisible] = useState(false);
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
	const [editingChapter, setEditingChapter] = useState(null);
	const [selectedChapter, setSelectedChapter] = useState(null);
	const [deleteChapter, setDeleteChapter] = useState(null);
	const [searchText, setSearchText] = useState('');

	useEffect(() => {
		if (syllabus?.id) {
			dispatch(fetchChaptersBySyllabus(syllabus.id));
		}
	}, [dispatch, syllabus?.id]);

	const handleAdd = () => {
		setEditingChapter(null);
		setIsModalVisible(true);
	};

	const handleEdit = (chapter) => {
		setEditingChapter(chapter);
		setIsModalVisible(true);
	};

	const handleDeleteClick = (chapter) => {
		setDeleteChapter(chapter);
		setIsDeleteModalVisible(true);
	};

	const handleDelete = async () => {
		try {
			await dispatch(deleteChapter(deleteChapter.id));
			message.success(t('chapterManagement.deleteChapterSuccess'));
			setIsDeleteModalVisible(false);
			setDeleteChapter(null);
		} catch (error) {
			message.error(t('chapterManagement.deleteChapterError'));
		}
	};

	const handleDeleteModalClose = () => {
		setIsDeleteModalVisible(false);
		setDeleteChapter(null);
	};

	const handleViewLessons = (chapter) => {
		setSelectedChapter(chapter);
		setIsLessonModalVisible(true);
	};

	const handleStatusChange = async (id, status) => {
		try {
			await dispatch(updateChapterStatus({ id, status }));
			message.success(t('chapterManagement.updateChapterSuccess'));
		} catch (error) {
			message.error(t('chapterManagement.updateChapterError'));
		}
	};

	const handleModalClose = () => {
		setIsModalVisible(false);
		setEditingChapter(null);
	};

	const handleLessonModalClose = () => {
		setIsLessonModalVisible(false);
		setSelectedChapter(null);
	};

	const handleRefresh = () => {
		dispatch(fetchChaptersBySyllabus(syllabus.id));
	};

	// Filter chapters based on search
	const filteredChapters = chapters.filter((chapter) => {
		const matchesSearch =
			chapter.name.toLowerCase().includes(searchText.toLowerCase()) ||
			chapter.description.toLowerCase().includes(searchText.toLowerCase());
		return matchesSearch;
	});

	// Calculate statistics
	const totalChapters = chapters.length;
	const totalLessons = chapters.reduce(
		(sum, chapter) => sum + (chapter.lessons?.length || 0),
		0
	);
	const averageLessonsPerChapter =
		totalChapters > 0 ? Math.round(totalLessons / totalChapters) : 0;

	const columns = [
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
		{
			title: t('chapterManagement.actions'),
			key: 'actions',
			width: 200,
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

	return (
		<div className="chapter-list-container">
			<div className="chapter-list-header">
				<h3>
					<FileTextOutlined style={{ marginRight: '8px' }} />
					{t('chapterManagement.title')} - {syllabus?.name}
				</h3>
			</div>

			{/* Statistics Cards */}
			<Row gutter={16} style={{ marginBottom: '24px' }}>
				<Col span={8}>
					<Card>
						<Statistic
							title={t('chapterManagement.totalChapters')}
							value={totalChapters}
							prefix={<FileTextOutlined />}
						/>
					</Card>
				</Col>
				<Col span={8}>
					<Card>
						<Statistic
							title={t('chapterManagement.totalLessons')}
							value={totalLessons}
							prefix={<PlayCircleOutlined />}
						/>
					</Card>
				</Col>
				<Col span={8}>
					<Card>
						<Statistic
							title={t('chapterManagement.averageLessonsPerChapter')}
							value={averageLessonsPerChapter}
							suffix={t('chapterManagement.lessons')}
							prefix={<BookOutlined />}
						/>
					</Card>
				</Col>
			</Row>

			{/* Action Bar */}
			<Card style={{ marginBottom: '16px' }}>
				<Row gutter={16} align="middle">
					<Col flex="auto">
						<Search
							placeholder={t('chapterManagement.searchPlaceholder')}
							style={{ width: 300 }}
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							prefix={<SearchOutlined />}
						/>
					</Col>
					<Col>
						<Space>
							<Button
								icon={<ReloadOutlined />}
								onClick={handleRefresh}
								loading={loading}
							>
								{t('chapterManagement.refresh')}
							</Button>
							<Button
								type="primary"
								icon={<PlusOutlined />}
								onClick={handleAdd}
							>
								{t('chapterManagement.addChapter')}
							</Button>
						</Space>
					</Col>
				</Row>
			</Card>

			{/* Table */}
			<Card>
				<Table
					columns={columns}
					dataSource={filteredChapters}
					rowKey="id"
					loading={loading}
					pagination={{
						total: filteredChapters.length,
						pageSize: 10,
						showSizeChanger: true,
						showQuickJumper: true,
						showTotal: (total, range) =>
							`${range[0]}-${range[1]} ${t(
								'chapterManagement.paginationText'
							)} ${total} ${t('chapterManagement.chapters')}`,
					}}
					scroll={{ x: 800 }}
				/>
			</Card>

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
					syllabus={syllabus}
					onClose={handleModalClose}
				/>
			</Modal>

			{/* Lesson Modal */}
			<Modal
				title={`${t('lessonManagement.lessons')} - ${selectedChapter?.name}`}
				open={isLessonModalVisible}
				onCancel={handleLessonModalClose}
				footer={null}
				width={1200}
				destroyOnClose
			>
				{selectedChapter && (
					<LessonList
						chapter={selectedChapter}
						onClose={handleLessonModalClose}
					/>
				)}
			</Modal>

			{/* Delete Confirmation Modal */}
			<Modal
				title={t('chapterManagement.confirmDelete')}
				open={isDeleteModalVisible}
				onOk={handleDelete}
				onCancel={handleDeleteModalClose}
				okText={t('common.yes')}
				cancelText={t('common.no')}
				okButtonProps={{ danger: true }}>
				<p>{t('chapterManagement.confirmDeleteMessage')}</p>
				{deleteChapter && (
					<p>
						<strong>{deleteChapter.name}</strong>
					</p>
				)}
			</Modal>
		</div>
	);
};

export default ChapterList;
