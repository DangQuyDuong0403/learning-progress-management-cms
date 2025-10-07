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
} from 'antd';
import {
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	SearchOutlined,
	ReloadOutlined,
	PlayCircleOutlined,
	ClockCircleOutlined,
	BookOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import LessonForm from './LessonForm';
import {
	fetchLessonsByChapter,
	deleteLesson,
	updateLessonStatus,
} from '../../../../redux/syllabus';

const { Search } = Input;

const LessonList = ({ chapter, onClose }) => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const { lessons, loading } = useSelector((state) => state.syllabus);

	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
	const [editingLesson, setEditingLesson] = useState(null);
	const [deleteLesson, setDeleteLesson] = useState(null);
	const [searchText, setSearchText] = useState('');

	useEffect(() => {
		if (chapter?.id) {
			dispatch(fetchLessonsByChapter(chapter.id));
		}
	}, [dispatch, chapter?.id]);

	const handleAdd = () => {
		setEditingLesson(null);
		setIsModalVisible(true);
	};

	const handleEdit = (lesson) => {
		setEditingLesson(lesson);
		setIsModalVisible(true);
	};

	const handleDeleteClick = (lesson) => {
		setDeleteLesson(lesson);
		setIsDeleteModalVisible(true);
	};

	const handleDelete = async () => {
		try {
			await dispatch(deleteLesson(deleteLesson.id));
			message.success(t('lessonManagement.deleteLessonSuccess'));
			setIsDeleteModalVisible(false);
			setDeleteLesson(null);
		} catch (error) {
			message.error(t('lessonManagement.deleteLessonError'));
		}
	};

	const handleDeleteModalClose = () => {
		setIsDeleteModalVisible(false);
		setDeleteLesson(null);
	};

	const handleStatusChange = async (id, status) => {
		try {
			await dispatch(updateLessonStatus({ id, status }));
			message.success(t('lessonManagement.updateLessonSuccess'));
		} catch (error) {
			message.error(t('lessonManagement.updateLessonError'));
		}
	};

	const handleModalClose = () => {
		setIsModalVisible(false);
		setEditingLesson(null);
	};

	const handleRefresh = () => {
		dispatch(fetchLessonsByChapter(chapter.id));
	};

	// Filter lessons based on search
	const filteredLessons = lessons.filter((lesson) => {
		const matchesSearch =
			lesson.name.toLowerCase().includes(searchText.toLowerCase()) ||
			lesson.description.toLowerCase().includes(searchText.toLowerCase());
		return matchesSearch;
	});

	// Calculate statistics
	const totalLessons = lessons.length;
	const totalDuration = lessons.reduce((sum, lesson) => sum + lesson.duration, 0);
	const averageDuration = totalLessons > 0 ? (totalDuration / totalLessons).toFixed(1) : 0;

	const columns = [
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
		{
			title: t('lessonManagement.actions'),
			key: 'actions',
			width: 150,
			render: (_, record) => (
				<Space size="small">
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
		<div className="lesson-list-container">
			<div className="lesson-list-header">
				<h3>
					<PlayCircleOutlined style={{ marginRight: '8px' }} />
					{t('lessonManagement.title')} - {chapter?.name}
				</h3>
			</div>

			{/* Statistics Cards */}
			<Row gutter={16} style={{ marginBottom: '24px' }}>
				<Col span={8}>
					<Card>
						<Statistic
							title={t('lessonManagement.totalLessons')}
							value={totalLessons}
							prefix={<PlayCircleOutlined />}
						/>
					</Card>
				</Col>
				<Col span={8}>
					<Card>
						<Statistic
							title={t('lessonManagement.totalDuration')}
							value={totalDuration}
							suffix={t('lessonManagement.hours')}
							prefix={<ClockCircleOutlined />}
						/>
					</Card>
				</Col>
				<Col span={8}>
					<Card>
						<Statistic
							title={t('lessonManagement.averageDuration')}
							value={averageDuration}
							suffix={t('lessonManagement.hours')}
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
							placeholder={t('lessonManagement.searchPlaceholder')}
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
								{t('lessonManagement.refresh')}
							</Button>
							<Button
								type="primary"
								icon={<PlusOutlined />}
								onClick={handleAdd}
							>
								{t('lessonManagement.addLesson')}
							</Button>
						</Space>
					</Col>
				</Row>
			</Card>

			{/* Table */}
			<Card>
				<Table
					columns={columns}
					dataSource={filteredLessons}
					rowKey="id"
					loading={loading}
					pagination={{
						total: filteredLessons.length,
						pageSize: 10,
						showSizeChanger: true,
						showQuickJumper: true,
						showTotal: (total, range) =>
							`${range[0]}-${range[1]} ${t(
								'lessonManagement.paginationText'
							)} ${total} ${t('lessonManagement.lessons')}`,
					}}
					scroll={{ x: 800 }}
				/>
			</Card>

			{/* Lesson Modal */}
			<Modal
				title={
					editingLesson
						? t('lessonManagement.editLesson')
						: t('lessonManagement.addLesson')
				}
				open={isModalVisible}
				onCancel={handleModalClose}
				footer={null}
				width={600}
				destroyOnClose
			>
				<LessonForm
					lesson={editingLesson}
					chapter={chapter}
					onClose={handleModalClose}
				/>
			</Modal>

			{/* Delete Confirmation Modal */}
			<Modal
				title={t('lessonManagement.confirmDelete')}
				open={isDeleteModalVisible}
				onOk={handleDelete}
				onCancel={handleDeleteModalClose}
				okText={t('common.yes')}
				cancelText={t('common.no')}
				okButtonProps={{ danger: true }}>
				<p>{t('lessonManagement.confirmDeleteMessage')}</p>
				{deleteLesson && (
					<p>
						<strong>{deleteLesson.name}</strong>
					</p>
				)}
			</Modal>
		</div>
	);
};

export default LessonList;
