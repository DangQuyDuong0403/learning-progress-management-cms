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
	Tooltip,
} from 'antd';
import {
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	SearchOutlined,
	ReloadOutlined,
	EyeOutlined,
	FileTextOutlined,
	PlayCircleOutlined,
	ArrowLeftOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import ChapterForm from './ChapterForm';
import LessonList from './LessonList';
import './SyllabusList.css';
import ThemedLayout from '../../../../component/ThemedLayout';
import { useTheme } from '../../../../contexts/ThemeContext';
import syllabusManagementApi from '../../../../apis/backend/syllabusManagement';

const ChapterListPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { syllabusId } = useParams();
	const { theme } = useTheme();

	// State management
	const [loading, setLoading] = useState(false);
	const [chapters, setChapters] = useState([]);
	const [syllabusInfo, setSyllabusInfo] = useState(null);
	const [searchText, setSearchText] = useState('');
	const [searchTimeout, setSearchTimeout] = useState(null);

	// Modal states
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isLessonModalVisible, setIsLessonModalVisible] = useState(false);
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
	const [editingChapter, setEditingChapter] = useState(null);
	const [selectedChapter, setSelectedChapter] = useState(null);
	const [deleteChapter, setDeleteChapter] = useState(null);

	// Pagination state
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 10,
		total: 0,
		showSizeChanger: true,
		showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
	});

	// Fetch chapters from API
	const fetchChapters = useCallback(async (page = 1, size = 10, search = '') => {
		if (!syllabusId) return;
		
		setLoading(true);
		try {
			const params = {
				page: page - 1, // API uses 0-based indexing
				size: size,
			};
			
			// Add search parameter if provided
			if (search && search.trim()) {
				params.searchText = search.trim();
			}

			const response = await syllabusManagementApi.getChaptersBySyllabusId(syllabusId, params);

			// Map API response to component format
			const mappedChapters = response.data.map((chapter) => ({
				id: chapter.id,
				name: chapter.chapterName,
				description: chapter.description,
				order: chapter.orderNumber,
				status: chapter.status,
				createdBy: chapter.createdBy || chapter.createdByUser || 'N/A',
				createdAt: chapter.createdAt,
			}));

			setChapters(mappedChapters);
			setPagination(prev => ({
				...prev,
				current: page,
				pageSize: size,
				total: response.totalElements || response.data.length,
			}));
			setLoading(false);
		} catch (error) {
			console.error('Error fetching chapters:', error);
			message.error(t('chapterManagement.loadChaptersError'));
			setLoading(false);
		}
	}, [syllabusId, t]);

	// Fetch syllabus info
	const fetchSyllabusInfo = useCallback(async () => {
		if (!syllabusId) return;
		
		try {
			const response = await syllabusManagementApi.getSyllabuses({
				params: { page: 0, size: 100 }
			});
			
			// Find the specific syllabus
			const syllabus = response.data.find(s => s.id === parseInt(syllabusId));
			if (syllabus) {
				setSyllabusInfo({
					id: syllabus.id,
					name: syllabus.syllabusName,
					description: syllabus.description,
				});
			}
		} catch (error) {
			console.error('Error fetching syllabus info:', error);
		}
	}, [syllabusId]);

	useEffect(() => {
		fetchChapters(1, pagination.pageSize, searchText);
		fetchSyllabusInfo();
	}, [fetchChapters, fetchSyllabusInfo, searchText, pagination.pageSize]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
		};
	}, [searchTimeout]);

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
			// TODO: Implement delete chapter API call
			// await syllabusManagementApi.deleteChapter(deleteChapter.id);
			
			// Update local state
			setChapters(chapters.filter(c => c.id !== deleteChapter.id));
			
			message.success(t('chapterManagement.deleteChapterSuccess'));
			setIsDeleteModalVisible(false);
			setDeleteChapter(null);
		} catch (error) {
			console.error('Error deleting chapter:', error);
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
		fetchChapters(pagination.current, pagination.pageSize, searchText);
	};

	const handleBackToSyllabuses = () => {
		navigate('/manager/syllabuses');
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
			fetchChapters(1, pagination.pageSize, value);
		}, 1000);
		
		setSearchTimeout(newTimeout);
	};

	const handleTableChange = (pagination) => {
		fetchChapters(pagination.current, pagination.pageSize, searchText);
	};

	// No need for client-side filtering since API handles filtering
	const filteredChapters = chapters;


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
			title: t('chapterManagement.chapterName'),
			dataIndex: 'name',
			key: 'name',
			width: '20%',
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
			title: t('chapterManagement.createdBy'),
			dataIndex: 'createdBy',
			key: 'createdBy',
			width: '20%',
			render: (createdBy) => createdBy || 'N/A',
		},
		
		{
			title: t('chapterManagement.createdAt'),
			dataIndex: 'createdAt',
			key: 'createdAt',
			width: '20%',
			render: (date) => new Date(date).toLocaleDateString(),
		},
		{
			title: t('chapterManagement.actions'),
			key: 'actions',
			width: '20%',
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

	if (!syllabusInfo) {
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
								color: theme === 'space' ? '#ffffff' : '#000000'
							}}
						>
							<FileTextOutlined style={{ marginRight: '8px' }} />
							{t('chapterManagement.title')} - {syllabusInfo.name}
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
								placeholder={t('chapterManagement.searchChapters')}
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
								...pagination,
								showQuickJumper: true,
								showTotal: (total, range) => {
									return `${range[0]}-${range[1]} ${t('chapterManagement.paginationText')} ${total} ${t('chapterManagement.chapters')}`;
								},
							}}
							onChange={handleTableChange}
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
						syllabus={syllabusInfo}
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
