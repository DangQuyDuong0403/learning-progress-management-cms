import React, { useState, useEffect, useCallback } from 'react';
import {
	Table,
	Button,
	Space,
	Modal,
	message,
	Input,
	Row,
	Col,
	Typography,
} from 'antd';
import {
	SearchOutlined,
	DragOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import usePageTitle from '../../../../hooks/usePageTitle';
import {
	fetchLessonsByChapter,
} from '../../../../redux/syllabus';
import syllabusManagementApi from '../../../../apis/backend/syllabusManagement';
import './SyllabusList.css';
import ThemedLayout from '../../../../component/ThemedLayout';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useSyllabusMenu } from '../../../../contexts/SyllabusMenuContext';
import LessonForm from './LessonForm';
import LoadingWithEffect from '../../../../component/spinner/LoadingWithEffect';
import BottomActionBar from '../../../../component/BottomActionBar';
import ROUTER_PAGE from '../../../../constants/router';

const LessonListPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { syllabusId, chapterId } = useParams();
	const { theme } = useTheme();
	const { enterSyllabusMenu, exitSyllabusMenu } = useSyllabusMenu();
	const dispatch = useDispatch();
	const { lessons, loading, lessonsPagination } = useSelector((state) => state.syllabus);

	// Set page title
	usePageTitle('Lesson Management');

	// State management
	const [searchText, setSearchText] = useState('');
	const [searchTimeout, setSearchTimeout] = useState(null);
	const [chapterInfo, setChapterInfo] = useState(null);
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);
	const [totalElements, setTotalElements] = useState(0);
	const [isInitialLoading, setIsInitialLoading] = useState(true);

	// Modal states
	const [isBulkDeleteModalVisible, setIsBulkDeleteModalVisible] = useState(false);
	const [isFormModalVisible, setIsFormModalVisible] = useState(false);
	const [editingLesson, setEditingLesson] = useState(null);
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
		const fetchData = async () => {
			setIsInitialLoading(true);
			await Promise.all([
				fetchLessons(1, pagination.pageSize, searchText),
				fetchChapterInfo()
			]);
			setIsInitialLoading(false);
		};
		fetchData();
	}, [fetchLessons, fetchChapterInfo, searchText, pagination.pageSize]);

	// Fetch syllabus info for header and enter syllabus menu
	useEffect(() => {
		const fetchSyllabusInfo = async () => {
			if (!syllabusId || !chapterInfo) return;
			
			try {
				const response = await syllabusManagementApi.getSyllabuses({
					params: { page: 0, size: 100 }
				});
				
				const syllabus = response.data.find(s => s.id === parseInt(syllabusId));
				if (syllabus) {
					enterSyllabusMenu({
						id: syllabus.id,
						name: syllabus.syllabusName,
						description: syllabus.description,
						chapterName: chapterInfo.name,
						backUrl: ROUTER_PAGE.MANAGER_SYLLABUS_CHAPTERS.replace(':syllabusId', String(syllabusId)),
					});
				}
			} catch (error) {
				console.error('Error fetching syllabus info:', error);
			}
		};

		fetchSyllabusInfo();
		
		return () => {
			exitSyllabusMenu();
		};
	}, [syllabusId, chapterInfo, enterSyllabusMenu, exitSyllabusMenu]);

	// Update pagination when Redux state changes
	useEffect(() => {
		if (lessonsPagination) {
			setPagination(prev => ({
				...prev,
				total: lessonsPagination.totalElements || 0,
			}));
			setTotalElements(lessonsPagination.totalElements || 0);
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
			setPagination(prev => ({
				...prev,
				current: 1,
			}));
			fetchLessons(1, pagination.pageSize, value);
		}, 1000);
		
		setSearchTimeout(newTimeout);
	};

	const handleTableChange = (newPagination) => {
		// Update local pagination state
		setPagination(prev => ({
			...prev,
			current: newPagination.current,
			pageSize: newPagination.pageSize,
		}));
		
		// Fetch data with new pagination
		fetchLessons(newPagination.current, newPagination.pageSize, searchText);
	};

	// Checkbox logic
	const handleSelectAll = async (checked) => {
		if (checked) {
			try {
				// Fetch all lesson IDs from API (without pagination)
				const params = {
					page: 0,
					size: totalElements, // Get all items
				};
				
				// Add search parameter if provided
				if (searchText && searchText.trim()) {
					params.searchText = searchText.trim();
				}

				const response = await syllabusManagementApi.getLessonsByChapterId(chapterId, params);

				// Get all IDs from the response
				const allKeys = response.data.map(lesson => lesson.id);
				setSelectedRowKeys(allKeys);
			} catch (error) {
				console.error('Error fetching all lesson IDs:', error);
				message.error('Error selecting all items');
			}
		} else {
			setSelectedRowKeys([]);
		}
	};


	// Bulk actions
	const handleDeleteAll = () => {
		if (selectedRowKeys.length === 0) {
			message.warning(t('lessonManagement.selectItemsToDelete'));
			return;
		}
		setIsBulkDeleteModalVisible(true);
	};

	const handleDeleteAllConfirm = async () => {
		try {
			// TODO: Implement bulk delete API call
			// await syllabusManagementApi.bulkDeleteLessons(selectedRowKeys);
			
			// Update local state
			setSelectedRowKeys([]);
			
			message.success(t('lessonManagement.deleteAllSuccess'));
			setIsBulkDeleteModalVisible(false);
			
			// Refresh the lesson list
			fetchLessons(pagination.current, pagination.pageSize, searchText);
		} catch (error) {
			console.error('Error deleting all lessons:', error);
			message.error(t('lessonManagement.deleteAllError'));
		}
	};

	const handleDeleteAllModalClose = () => {
		setIsBulkDeleteModalVisible(false);
	};

	const handleFormModalClose = () => {
		setIsFormModalVisible(false);
		setEditingLesson(null);
	};

	const handleFormSubmit = async (success, lessonData) => {
		if (success) {
			// TODO: Implement API call to save lesson
			// if (editingLesson) {
			//     await syllabusManagementApi.updateLesson(editingLesson.id, lessonData);
			// } else {
			//     await syllabusManagementApi.createLesson(lessonData);
			// }
			
			// Refresh the lesson list
			fetchLessons(pagination.current, pagination.pageSize, searchText);
		}
		// Always close modal regardless of success or cancel
		handleFormModalClose();
	};


	// Use Redux state for lessons data
	const filteredLessons = lessons;


	const columns = [
		{
			title: t('lessonManagement.stt'),
			key: 'index',
			width: '10%',
			render: (_, __, index) => {
				// Calculate index based on current page and page size
				const currentPage = pagination.current || 1;
				const pageSize = pagination.pageSize || 10;
				return (
					<span style={{ fontSize: '20px' }}>
						{(currentPage - 1) * pageSize + index + 1}
					</span>
				);
			},
		},
		{
			title: <span style={{ textAlign: 'left', display: 'block' }}>{t('lessonManagement.lessonName')}</span>,
			dataIndex: 'name',
			key: 'name',
			width: '20%',
			align: 'left',
			render: (text) => (
				<div style={{ 
					fontSize: '20px',
					textAlign: 'left',
					whiteSpace: 'normal',
					wordWrap: 'break-word',
					overflow: 'visible',
					textOverflow: 'clip'
				}}>
					{text}
				</div>
			),
		},
		{
			title: <span style={{ textAlign: 'left', display: 'block' }}>{t('lessonManagement.content')}</span>,
			dataIndex: 'content',
			key: 'content',
			width: '45%',
			align: 'left',
			render: (content) => (
				<div style={{ 
					textAlign: 'left',
					whiteSpace: 'normal',
					wordWrap: 'break-word',
					overflow: 'visible',
					textOverflow: 'clip'
				}}>
					{content || 'N/A'}
				</div>
			),
		},
	];

	if (!chapterInfo || isInitialLoading) {
		return (
			<ThemedLayout>
				{/* Main Content Panel */}
				<div className={`main-content-panel ${theme}-main-panel`}>
					<div style={{ textAlign: 'center', padding: '50px' }}>
						<LoadingWithEffect
							loading={true}
							message={t('common.loading')}
						>
							<div></div>
						</LoadingWithEffect>
					</div>
				</div>
			</ThemedLayout>
		);
	}

	return (
		<ThemedLayout>
			{/* Main Content Panel */}
			<div className={`main-content-panel ${theme}-main-panel`}>
			{/* Page Title */}
			<div className="page-title-container" style={{ marginBottom: '24px' }}>
				<Typography.Title 
					level={1} 
					className="page-title"
					style={{ margin: 0, textAlign: 'center' }}
				>
					{t('lessonManagement.title')} <span className="student-count">({totalElements})</span>
				</Typography.Title>
			</div>

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
						</Space>
					</Col>
					<Col>
						<Space>
							<Button
								icon={<DragOutlined />}
								onClick={handleEditOrder}
								className="create-button"
							>
								{t('common.edit')}
							</Button>
						</Space>
					</Col>
				</Row>


				{/* Table Section */}
				<div className={`table-section ${theme}-table-section`}>
					<style>
						{`
							.ant-table-thead > tr > th[data-column-key="name"],
							.ant-table-thead > tr > th[data-column-key="content"] {
								text-align: left !important;
							}
							.ant-table-tbody > tr > td[data-column-key="name"],
							.ant-table-tbody > tr > td[data-column-key="content"] {
								text-align: left !important;
								white-space: normal !important;
								word-wrap: break-word !important;
								overflow: visible !important;
								text-overflow: clip !important;
							}
							.ant-table-tbody > tr > td[data-column-key="name"] > div,
							.ant-table-tbody > tr > td[data-column-key="content"] > div {
								max-width: 100% !important;
								overflow: visible !important;
								text-overflow: clip !important;
							}
						`}
					</style>
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
				</div>
			</div>

			{/* Bottom Action Bar */}
			<BottomActionBar
				selectedCount={selectedRowKeys.length}
				onSelectAll={handleSelectAll}
				onDeleteAll={handleDeleteAll}
				onClose={() => setSelectedRowKeys([])}
				selectAllText={t('classManagement.selectAll')}
				deleteAllText={t('classManagement.deleteAll')}
			/>

		{/* Delete All Confirmation Modal */}
		<Modal
			title={
				<div style={{
					fontSize: '28px',
					fontWeight: '600',
					color: 'rgb(24, 144, 255)',
					textAlign: 'center',
					padding: '10px 0'
				}}>
					{t('lessonManagement.confirmDeleteAll')}
				</div>
			}
			open={isBulkDeleteModalVisible}
				onOk={handleDeleteAllConfirm}
				onCancel={handleDeleteAllModalClose}
				okText={t('common.confirm')}
				cancelText={t('common.cancel')}
				width={500}
				centered
				bodyStyle={{
					padding: '30px 40px',
					fontSize: '16px',
					lineHeight: '1.6',
					textAlign: 'center'
				}}
				okButtonProps={{
					style: {
						background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
						borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
						color: theme === 'sun' ? '#000' : '#fff',
						borderRadius: '6px',
						height: '32px',
						fontWeight: '500',
						fontSize: '16px',
						padding: '4px 15px',
						width: '100px',
						transition: 'all 0.3s ease',
						boxShadow: 'none'
					}
				}}
				cancelButtonProps={{
					style: {
						height: '32px',
						fontWeight: '500',
						fontSize: '16px',
						padding: '4px 15px',
						width: '100px'
					}
				}}
			>
				<div style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: '20px'
				}}>
					<div style={{
						fontSize: '48px',
						color: '#ff4d4f',
						marginBottom: '10px'
					}}>
						⚠️
					</div>
					<p style={{
						fontSize: '18px',
						color: '#333',
						margin: 0,
						fontWeight: '500'
					}}>
						{t('lessonManagement.confirmDeleteAllMessage')}
					</p>
					<div style={{
						fontSize: '20px',
						color: '#000',
						margin: 0,
						fontWeight: '400'
					}}>
						<strong>{selectedRowKeys.length} {t('lessonManagement.lessons')}</strong>
					</div>
				</div>
			</Modal>

		{/* Lesson Form Modal */}
		<Modal
			title={
				<div style={{ textAlign: 'center', fontSize: '28px', fontWeight: '600', color: 'rgb(24, 144, 255)' }}>
					{editingLesson
						? t('lessonManagement.editLesson')
						: t('lessonManagement.addLesson')}
				</div>
			}
			open={isFormModalVisible}
			onCancel={handleFormModalClose}
			footer={null}
			width={600}
			destroyOnClose
			bodyStyle={{
				padding: '30px 40px',
				fontSize: '16px',
				lineHeight: '1.6'
			}}
		>
				<LessonForm
					lesson={editingLesson}
					chapter={chapterInfo}
					onClose={handleFormSubmit}
					theme={theme}
				/>
			</Modal>

		{/* Import Modal */}
		</ThemedLayout>
	);
};

export default LessonListPage;
