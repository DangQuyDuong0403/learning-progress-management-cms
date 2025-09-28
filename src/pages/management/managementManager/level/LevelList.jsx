import React, { useState, useEffect } from 'react';
import {
	Table,
	Button,
	Space,
	Modal,
	message,
	Input,
	Select,
	Popconfirm,
	Tag,
	Card,
	Row,
	Col,
	Statistic,
} from 'antd';
import {
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	SearchOutlined,
	ReloadOutlined,
	BookOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import LevelForm from './LevelForm';
import './LevelList.css';
import {
	fetchLevels,
	deleteLevel,
	updateLevelStatus,
} from '../../../../redux/level';
import Layout from '../../../../component/Layout';


const { Search } = Input;
const { Option } = Select;

const LevelList = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const { levels, loading, error } = useSelector((state) => state.level);

	const [isModalVisible, setIsModalVisible] = useState(false);
	const [editingLevel, setEditingLevel] = useState(null);
	const [searchText, setSearchText] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);

	useEffect(() => {
		dispatch(fetchLevels());
	}, [dispatch]);

	const handleAdd = () => {
		setEditingLevel(null);
		setIsModalVisible(true);
	};

	const handleEdit = (level) => {
		setEditingLevel(level);
		setIsModalVisible(true);
	};

	const handleDelete = async (id) => {
		try {
			await dispatch(deleteLevel(id));
			message.success(t('levelManagement.deleteLevelSuccess'));
		} catch (error) {
			message.error(t('levelManagement.deleteLevelError'));
		}
	};

	const handleStatusChange = async (id, status) => {
		try {
			await dispatch(updateLevelStatus({ id, status }));
			message.success(t('levelManagement.updateLevelSuccess'));
		} catch (error) {
			message.error(t('levelManagement.updateLevelError'));
		}
	};

	const handleModalClose = () => {
		setIsModalVisible(false);
		setEditingLevel(null);
	};

	const handleRefresh = () => {
		dispatch(fetchLevels());
	};

	// Filter levels based on search and status
	const filteredLevels = levels.filter((level) => {
		const matchesSearch =
			level.name.toLowerCase().includes(searchText.toLowerCase()) ||
			level.description.toLowerCase().includes(searchText.toLowerCase());
		const matchesStatus =
			statusFilter === 'all' || level.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	// Calculate statistics
	const totalLevels = levels.length;
	const activeLevels = levels.filter(
		(level) => level.status === 'active'
	).length;
	const inactiveLevels = levels.filter(
		(level) => level.status === 'inactive'
	).length;

	const columns = [
		{
			title: t('levelManagement.levelName'),
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
			title: t('levelManagement.levelCode'),
			dataIndex: 'code',
			key: 'code',
			width: 120,
			sorter: (a, b) => a.code.localeCompare(b.code),
		},
		{
			title: t('levelManagement.difficulty'),
			dataIndex: 'difficulty',
			key: 'difficulty',
			width: 120,
			render: (difficulty) => (
				<Tag
					color={
						difficulty === 'beginner'
							? 'green'
							: difficulty === 'intermediate'
							? 'orange'
							: 'red'
					}>
					{difficulty}
				</Tag>
			),
		},
		{
			title: t('levelManagement.status'),
			dataIndex: 'status',
			key: 'status',
			width: 100,
			render: (status, record) => (
				<Tag color={status === 'active' ? 'green' : 'red'}>
					{status}
				</Tag>
			),
		},
		{
			title: t('levelManagement.duration'),
			dataIndex: 'duration',
			key: 'duration',
			width: 100,
			render: (duration) => `${duration} week`,
		},
		{
			title: t('levelManagement.createdAt'),
			dataIndex: 'createdAt',
			key: 'createdAt',
			width: 120,
			render: (date) => new Date(date).toLocaleDateString(),
		},
		{
			title: t('levelManagement.actions'),
			key: 'actions',
			width: 150,
			render: (_, record) => (
				<Space size='small'>
					<Button
						type='primary'
						size='small'
						icon={<EditOutlined />}
						onClick={() => handleEdit(record)}>
						{t('common.edit')}
					</Button>
					<Popconfirm
						title={t('levelManagement.confirmDelete')}
						description={t('levelManagement.confirmDeleteMessage')}
						onConfirm={() => handleDelete(record.id)}
						okText={t('common.yes')}
						cancelText={t('common.no')}>
						<Button
							type='primary'
							danger
							size='small'
							icon={<DeleteOutlined />}>
							{t('common.delete')}
						</Button>
					</Popconfirm>
				</Space>
			),
		},
	];

	const rowSelection = {
		selectedRowKeys,
		onChange: setSelectedRowKeys,
	};

	return (
		<Layout>
			<div className='level-list-container'>
				<div className='level-list-header'>
					<h2>
						<BookOutlined style={{ marginRight: '8px' }} />
						{t('levelManagement.title')}
					</h2>
				</div>

				{/* Statistics Cards */}
				<Row gutter={16} style={{ marginBottom: '24px' }}>
					<Col span={6}>
						<Card>
							<Statistic
								title={t('levelManagement.totalLevels')}
								value={totalLevels}
								prefix={<BookOutlined />}
							/>
						</Card>
					</Col>
					<Col span={6}>
						<Card>
							<Statistic
								title={t('levelManagement.activeLevels')}
								value={activeLevels}
								valueStyle={{ color: '#3f8600' }}
								prefix={<BookOutlined />}
							/>
						</Card>
					</Col>
					<Col span={6}>
						<Card>
							<Statistic
								title={t('levelManagement.inactiveLevels')}
								value={inactiveLevels}
								valueStyle={{ color: '#cf1322' }}
								prefix={<BookOutlined />}
							/>
						</Card>
					</Col>
					<Col span={6}>
						<Card>
							<Statistic
								title={t('levelManagement.averageDuration')}
								value={
									levels.length > 0
										? Math.round(
												levels.reduce((sum, level) => sum + level.duration, 0) /
													levels.length
										  )
										: 0
								}
								suffix={t('levelManagement.weeks')}
								prefix={<BookOutlined />}
							/>
						</Card>
					</Col>
				</Row>

				{/* Action Bar */}
				<Card style={{ marginBottom: '16px' }}>
					<Row gutter={16} align='middle'>
						<Col flex='auto'>
							<Space size='middle'>
								<Search
									placeholder={t('levelManagement.searchPlaceholder')}
									style={{ width: 300 }}
									value={searchText}
									onChange={(e) => setSearchText(e.target.value)}
									prefix={<SearchOutlined />}
								/>
								<Select
									style={{ width: 150 }}
									value={statusFilter}
									onChange={setStatusFilter}
									placeholder={t('levelManagement.filterByStatus')}>
									<Option value='all'>
										{t('levelManagement.allStatuses')}
									</Option>
									<Option value='active'>{t('levelManagement.active')}</Option>
									<Option value='inactive'>
										{t('levelManagement.inactive')}
									</Option>
								</Select>
							</Space>
						</Col>
						<Col>
							<Space>
								<Button
									icon={<ReloadOutlined />}
									onClick={handleRefresh}
									loading={loading}>
									{t('levelManagement.refresh')}
								</Button>
								<Button
									type='primary'
									icon={<PlusOutlined />}
									onClick={handleAdd}>
									{t('levelManagement.addLevel')}
								</Button>
							</Space>
						</Col>
					</Row>
				</Card>

				{/* Table */}
				<Card>
					<Table
						columns={columns}
						dataSource={filteredLevels}
						rowKey='id'
						loading={loading}
						pagination={{
							total: filteredLevels.length,
							pageSize: 10,
							showSizeChanger: true,
							showQuickJumper: true,
							showTotal: (total, range) =>
								`${range[0]}-${range[1]} ${t(
									'levelManagement.paginationText'
								)} ${total} ${t('levelManagement.levels')}`,
						}}
						scroll={{ x: 800 }}
					/>
				</Card>

				{/* Modal */}
				<Modal
					title={
						editingLevel
							? t('levelManagement.editLevel')
							: t('levelManagement.addLevel')
					}
					open={isModalVisible}
					onCancel={handleModalClose}
					footer={null}
					width={600}
					destroyOnClose>
					<LevelForm level={editingLevel} onClose={handleModalClose} />
				</Modal>
			</div>
		</Layout>
	);
};

export default LevelList;
