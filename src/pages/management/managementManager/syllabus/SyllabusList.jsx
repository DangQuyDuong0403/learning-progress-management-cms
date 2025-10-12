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
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import SyllabusForm from './SyllabusForm';
import ChapterList from './ChapterList';
import './SyllabusList.css';
import {
	fetchSyllabuses,
	updateSyllabusStatus,
} from '../../../../redux/syllabus';
import ThemedLayout from '../../../../component/ThemedLayout';

const { Search } = Input;
const { Option } = Select;

const SyllabusList = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const { syllabuses, loading } = useSelector((state) => state.syllabus);

	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isChapterModalVisible, setIsChapterModalVisible] = useState(false);
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
	const [editingSyllabus, setEditingSyllabus] = useState(null);
	const [selectedSyllabus, setSelectedSyllabus] = useState(null);
	const [deleteSyllabus, setDeleteSyllabus] = useState(null);
	const [searchText, setSearchText] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [levelFilter, setLevelFilter] = useState('all');

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

	// Calculate statistics
	const totalSyllabuses = syllabuses.length;
	const activeSyllabuses = syllabuses.filter(
		(syllabus) => syllabus.status === 'active'
	).length;
	const inactiveSyllabuses = syllabuses.filter(
		(syllabus) => syllabus.status === 'inactive'
	).length;
	const totalChapters = syllabuses.reduce(
		(sum, syllabus) => sum + (syllabus.chapters?.length || 0),
		0
	);

	const columns = [
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

	return (
		<ThemedLayout>
			<div className="syllabus-list-container">
			<div className="syllabus-list-header">
				<h2>
					<BookOutlined style={{ marginRight: '8px' }} />
					{t('syllabusManagement.title')}
				</h2>
			</div>

			{/* Statistics Cards */}
			<Row gutter={16} style={{ marginBottom: '24px' }}>
				<Col span={6}>
					<Card>
						<Statistic
							title={t('syllabusManagement.totalSyllabuses')}
							value={totalSyllabuses}
							prefix={<BookOutlined />}
						/>
					</Card>
				</Col>
				<Col span={6}>
					<Card>
						<Statistic
							title={t('syllabusManagement.activeSyllabuses')}
							value={activeSyllabuses}
							valueStyle={{ color: '#3f8600' }}
							prefix={<BookOutlined />}
						/>
					</Card>
				</Col>
				<Col span={6}>
					<Card>
						<Statistic
							title={t('syllabusManagement.inactiveSyllabuses')}
							value={inactiveSyllabuses}
							valueStyle={{ color: '#cf1322' }}
							prefix={<BookOutlined />}
						/>
					</Card>
				</Col>
				<Col span={6}>
					<Card>
						<Statistic
							title={t('syllabusManagement.totalChapters')}
							value={totalChapters}
							suffix={t('syllabusManagement.chapters')}
							prefix={<FileTextOutlined />}
						/>
					</Card>
				</Col>
			</Row>

			{/* Action Bar */}
			<Card style={{ marginBottom: '16px' }}>
				<Row gutter={16} align="middle">
					<Col flex="auto">
						<Space size="middle">
							<Search
								placeholder={t('syllabusManagement.searchPlaceholder')}
								style={{ width: 300 }}
								value={searchText}
								onChange={(e) => setSearchText(e.target.value)}
								prefix={<SearchOutlined />}
							/>
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
						</Space>
					</Col>
					<Col>
						<Space>
							<Button
								icon={<ReloadOutlined />}
								onClick={handleRefresh}
								loading={loading}
							>
								{t('syllabusManagement.refresh')}
							</Button>
							<Button
								type="primary"
								icon={<PlusOutlined />}
								onClick={handleAdd}
							>
								{t('syllabusManagement.addSyllabus')}
							</Button>
						</Space>
					</Col>
				</Row>
			</Card>

			{/* Table */}
			<Card>
				<Table
					columns={columns}
					dataSource={filteredSyllabuses}
					rowKey="id"
					loading={loading}
					pagination={{
						total: filteredSyllabuses.length,
						pageSize: 10,
						showSizeChanger: true,
						showQuickJumper: true,
						showTotal: (total, range) =>
							`${range[0]}-${range[1]} ${t(
								'syllabusManagement.paginationText'
							)} ${total} ${t('syllabusManagement.syllabuses')}`,
					}}
					scroll={{ x: 1000 }}
				/>
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
