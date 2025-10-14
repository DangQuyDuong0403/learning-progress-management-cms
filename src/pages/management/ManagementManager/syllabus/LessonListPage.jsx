import React, { useState, useEffect, useCallback } from 'react';
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
	ArrowLeftOutlined,
	SwapOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
	fetchLessonsByChapter,
	updateLessonStatus,
	createLesson,
	updateLesson,
	deleteLesson,
} from '../../../../redux/syllabus';
import syllabusManagementApi from '../../../../apis/backend/syllabusManagement';
import './SyllabusList.css';
import ThemedLayout from '../../../../component/ThemedLayout';
import { useTheme } from '../../../../contexts/ThemeContext';

const LessonListPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { syllabusId, chapterId } = useParams();
	const { theme } = useTheme();
	const dispatch = useDispatch();
	const { lessons, loading, lessonsPagination } = useSelector((state) => state.syllabus);

	// State management
	const [searchText, setSearchText] = useState('');
	const [searchTimeout, setSearchTimeout] = useState(null);
	const [chapterInfo, setChapterInfo] = useState(null);

	// Modal states
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
	const [deleteLesson, setDeleteLesson] = useState(null);

	// Pagination state
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 10,
		total: 0,
		showSizeChanger: true,
		showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
	});

	// Fetch lessons from API using Redux
	const fetchLessons = useCallback(async (page = 1, size = 10, search = '') => {
		if (!chapterId) return;
		
		const params = {
			page: page - 1, // API uses 0-based indexing
			size: size,
		};
		
		// Add search parameter if provided
		if (search && search.trim()) {
			params.searchText = search.trim();
		}

		dispatch(fetchLessonsByChapter({ chapterId: parseInt(chapterId), params }));
	}, [chapterId, dispatch]);

	// Fetch chapter info
	const fetchChapterInfo = useCallback(async () => {
		if (!chapterId || !syllabusId) return;
		
		try {
			const response = await syllabusManagementApi.getChaptersBySyllabusId(syllabusId, {
				params: { page: 0, size: 100 }
			});
			
			// Find the specific chapter
			const chapter = response.data.find(c => c.id === parseInt(chapterId));
			if (chapter) {
				setChapterInfo({
					id: chapter.id,
					name: chapter.chapterName,
					description: chapter.description,
				});
			}
		} catch (error) {
			console.error('Error fetching chapter info:', error);
		}
	}, [chapterId, syllabusId]);

	useEffect(() => {
		fetchLessons(1, pagination.pageSize, searchText);
		fetchChapterInfo();
	}, [fetchLessons, fetchChapterInfo, searchText, pagination.pageSize]);

	// Update pagination when Redux state changes
	useEffect(() => {
		if (lessonsPagination) {
			setPagination(prev => ({
				...prev,
				total: lessonsPagination.totalElements || 0,
			}));
		}
	}, [lessonsPagination]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
		};
	}, [searchTimeout]);

	const handleAdd = () => {
		navigate(`/manager/syllabuses/${syllabusId}/chapters/${chapterId}/lessons/form`);
	};

	const handleEdit = (lesson) => {
		navigate(`/manager/syllabuses/${syllabusId}/chapters/${chapterId}/lessons/${lesson.id}/edit`);
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
			// Refresh the list
			fetchLessons(pagination.current, pagination.pageSize, searchText);
		} catch (error) {
			console.error('Error deleting lesson:', error);
			message.error(t('lessonManagement.deleteLessonError'));
		}
	};

	const handleDeleteModalClose = () => {
		setIsDeleteModalVisible(false);
		setDeleteLesson(null);
	};


	const handleRefresh = () => {
		fetchLessons(pagination.current, pagination.pageSize, searchText);
	};

	const handleBackToChapters = () => {
		navigate(`/manager/syllabuses/${syllabusId}/chapters`);
	};

	const handleEditOrder = () => {
		navigate(`/manager/syllabuses/${syllabusId}/chapters/${chapterId}/lessons/edit-order`);
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
			fetchLessons(1, pagination.pageSize, value);
		}, 1000);
		
		setSearchTimeout(newTimeout);
	};

	const handleTableChange = (pagination) => {
		fetchLessons(pagination.current, pagination.pageSize, searchText);
	};

	// Use Redux state for lessons data
	const filteredLessons = lessons;

	// Calculate statistics
	const totalLessons = lessons.length;
	const totalDuration = lessons.reduce((sum, lesson) => sum + lesson.duration, 0);
	const averageDuration = totalLessons > 0 ? (totalDuration / totalLessons).toFixed(1) : 0;

	const columns = [
		{
			title: 'No',
			key: 'index',
			width: '10%',
			render: (_, __, index) => {
				// Calculate index based on current page and page size
				const currentPage = pagination.current || 1;
				const pageSize = pagination.pageSize || 10;
				return (currentPage - 1) * pageSize + index + 1;
			},
		},
		{
			title: t('lessonManagement.lessonName'),
			dataIndex: 'name',
			key: 'name',
			width: '30%',
			sorter: (a, b) => a.name.localeCompare(b.name),
			render: (text) => (
				<div style={{ fontWeight: 'bold', fontSize: '16px' }}>
					{text}
				</div>
			),
		},
		{
			title: t('lessonManagement.content'),
			dataIndex: 'content',
			key: 'content',
			width: '35%',
			render: (content) => (
				<div style={{ 
					maxWidth: '300px',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					whiteSpace: 'nowrap'
				}}>
					{content || 'N/A'}
				</div>
			),
		},
		{
			title: t('lessonManagement.createdBy'),
			dataIndex: 'createdBy',
			key: 'createdBy',
			width: '15%',
			render: (createdBy) => (
				<div style={{ fontWeight: '500' }}>
					{createdBy || 'N/A'}
				</div>
			),
		},
		{
			title: t('lessonManagement.createdAt'),
			dataIndex: 'createdAt',
			key: 'createdAt',
			width: '15%',
			render: (date) => (
				<div>
					{new Date(date).toLocaleDateString()}
				</div>
			),
		},
		{
			title: t('lessonManagement.actions'),
			key: 'actions',
			width: '10%',
			render: (_, record) => (
				<Space size="small">
					<Tooltip title={t('common.edit')}>
						<Button
							type="text"
							size="small"
							icon={<EditOutlined style={{ fontSize: '20px' }} />}
							onClick={() => handleEdit(record)}
						/>
					</Tooltip>
					<Tooltip title={t('common.delete')}>
						<Button
							type="text"
							size="small"
							icon={<DeleteOutlined style={{ fontSize: '20px' }} />}
							onClick={() => handleDeleteClick(record)}
						/>
					</Tooltip>
				</Space>
			),
		},
	];

	if (!chapterInfo) {
		return (
			<ThemedLayout>
				<div className="lesson-list-container">
					<Card>
						<div style={{ textAlign: 'center', padding: '50px' }}>
							<h3>{t('lessonManagement.chapterNotFound')}</h3>
							<Button type="primary" onClick={handleBackToChapters}>
								{t('lessonManagement.backToChapters')}
							</Button>
						</div>
					</Card>
				</div>
			</ThemedLayout>
		);
	}

	return (
		<ThemedLayout>
			<div className="lesson-list-container">
				{/* Main Container Card */}
				<Card className="main-container-card">
					{/* Back Button */}
					<div style={{ marginBottom: '16px' }}>
						<Button 
							type="text" 
							icon={<ArrowLeftOutlined />}
							onClick={handleBackToChapters}
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
								color: theme === 'space' ? '#ffffff' : '#000000'
							}}
						>
							<PlayCircleOutlined style={{ marginRight: '8px' }} />
							{t('lessonManagement.title')} - {chapterInfo.name}
						</h2>
					</div>

					

					{/* Action Bar */}
					<Row gutter={16} align="middle" style={{ marginBottom: '16px' }}>
						<Col flex="auto">
							<Input
								prefix={<SearchOutlined />}
								value={searchText}
								onChange={(e) => handleSearch(e.target.value)}
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
									{t('lessonManagement.refresh')}
								</Button>
								<Button
									icon={<SwapOutlined rotate={90} />}
									onClick={handleEditOrder}
									style={{
										background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
										color: '#ffffff',
										border: 'none',
										fontWeight: 500,
									}}
								>
									{t('lessonManagement.editOrder')}
								</Button>
								<Button
									icon={<PlusOutlined />}
									className="create-button"
									onClick={handleAdd}
								>
									{t('lessonManagement.addLesson')}
								</Button>
							</Space>
						</Col>
					</Row>

					{/* Table Card */}
					<Card className="table-card">
						<Table
							columns={columns}
							dataSource={filteredLessons}
							rowKey="id"
							loading={loading}
							pagination={{
								...pagination,
								showQuickJumper: true,
								showTotal: (total, range) => {
									return `${range[0]}-${range[1]} ${t('lessonManagement.paginationText')} ${total} ${t('lessonManagement.lessons')}`;
								},
							}}
							onChange={handleTableChange}
							scroll={{ x: 1000 }}
						/>
					</Card>
				</Card>

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
		</ThemedLayout>
	);
};

export default LessonListPage;
