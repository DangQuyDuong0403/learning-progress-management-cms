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
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import ChapterForm from './ChapterForm';
import LessonList from './LessonList';
import './SyllabusList.css';
import {
	fetchSyllabuses,
	fetchChaptersBySyllabus,
} from '../../../../redux/syllabus';
import ThemedLayout from '../../../../component/ThemedLayout';
import { useTheme } from '../../../../contexts/ThemeContext';

const ChapterListPage = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { syllabusId } = useParams();
	const { syllabuses, chapters, loading } = useSelector((state) => state.syllabus);
	const { theme } = useTheme();

	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isLessonModalVisible, setIsLessonModalVisible] = useState(false);
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
	const [editingChapter, setEditingChapter] = useState(null);
	const [selectedChapter, setSelectedChapter] = useState(null);
	const [deleteChapter, setDeleteChapter] = useState(null);
	const [searchText, setSearchText] = useState('');

	// Find the current syllabus
	const currentSyllabus = syllabuses.find(s => s.id === parseInt(syllabusId));

	useEffect(() => {
		dispatch(fetchSyllabuses());
		if (syllabusId) {
			console.log('Fetching chapters for syllabusId:', syllabusId);
			dispatch(fetchChaptersBySyllabus(syllabusId));
		}
	}, [dispatch, syllabusId]);

	// Debug log
	useEffect(() => {
		console.log('Chapters data:', chapters);
		console.log('Current syllabus:', currentSyllabus);
		console.log('Current theme:', theme);
	}, [chapters, currentSyllabus, theme]);

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

	const handleModalClose = () => {
		setIsModalVisible(false);
		setEditingChapter(null);
	};

	const handleLessonModalClose = () => {
		setIsLessonModalVisible(false);
		setSelectedChapter(null);
	};

	const handleRefresh = () => {
		if (syllabusId) {
			dispatch(fetchChaptersBySyllabus(syllabusId));
		}
	};

	const handleBackToSyllabuses = () => {
		navigate('/manager/syllabuses');
	};

	// Filter chapters based on search
	const filteredChapters = chapters.filter((chapter) => {
		const matchesSearch =
			chapter.name.toLowerCase().includes(searchText.toLowerCase()) ||
			chapter.description.toLowerCase().includes(searchText.toLowerCase());
		return matchesSearch;
	});


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

	if (!currentSyllabus) {
		return (
			<ThemedLayout>
				<div className="syllabus-list-container">
					<Card>
						<div style={{ textAlign: 'center', padding: '50px' }}>
							<h3>{t('chapterManagement.syllabusNotFound')}</h3>
							<Button type="primary" onClick={handleBackToSyllabuses}>
								{t('chapterManagement.backToSyllabuses')}
							</Button>
						</div>
					</Card>
				</div>
			</ThemedLayout>
		);
	}

	return (
		<ThemedLayout>
			<div className="syllabus-list-container">
				{/* Main Container Card */}
				<Card className="main-container-card">
					{/* Back Button */}
					<div style={{ marginBottom: '16px' }}>
						<Button 
							type="text" 
							icon={<ArrowLeftOutlined />}
							onClick={handleBackToSyllabuses}
							style={{ padding: '4px 8px' }}
						>
							{t('common.back')}
						</Button>
					</div>

					{/* Header */}
					<div style={{ marginBottom: '24px' }}>
						<h2 
							style={{ 
								margin: 0, 
								fontSize: '24px', 
								fontWeight: 'bold',
								color: theme === 'dark' ? '#ffffff' : '#000000'
							}}
						>
							<FileTextOutlined style={{ marginRight: '8px' }} />
							{t('chapterManagement.title')} - {currentSyllabus.name}
						</h2>
					</div>


					{/* Action Bar */}
					<Row gutter={16} align="middle" style={{ marginBottom: '16px' }}>
						<Col flex="auto">
							<Input
								prefix={<SearchOutlined />}
								value={searchText}
								onChange={(e) => setSearchText(e.target.value)}
								className="search-input"
								style={{ minWidth: '350px', maxWidth: '500px', height: '40px', fontSize: '16px' }}
								allowClear
							/>
						</Col>
						<Col>
							<Space>
								<Button
									icon={<ReloadOutlined />}
									className={`refresh-button ${theme}-refresh-button`}
									onClick={handleRefresh}
									loading={loading}
								>
									{t('chapterManagement.refresh')}
								</Button>
								<Button
									icon={<PlusOutlined />}
									className="create-button"
									onClick={handleAdd}
								>
									{t('chapterManagement.addChapter')}
								</Button>
							</Space>
						</Col>
					</Row>

					{/* Table Card */}
					<Card className="table-card">
						
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
								showTotal: (total, range) => {
									return `${range[0]}-${range[1]} ${t('chapterManagement.paginationText')} ${total} ${t('chapterManagement.chapters')}`;
								},
							}}
							scroll={{ x: 1000 }}
						/>
					</Card>
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
						syllabus={currentSyllabus}
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
		</ThemedLayout>
	);
};

export default ChapterListPage;
