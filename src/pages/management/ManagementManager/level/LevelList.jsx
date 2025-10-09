import React, { useState, useEffect } from 'react';
import {
	Table,
	Button,
	Space,
	Modal,
	Input,
	Select,
	Tag,
	Tooltip,
} from 'antd';
import {
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	SearchOutlined,
	ReloadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import LevelForm from './LevelForm';
import './LevelList.css';
import {
	fetchLevels,
	deleteLevel as deleteLevelAction,
} from '../../../../redux/level';
import ThemedLayout from '../../../../component/ThemedLayout';
import LoadingWithEffect from '../../../../component/spinner/LoadingWithEffect';
import { useTheme } from '../../../../contexts/ThemeContext';
import { spaceToast } from '../../../../component/SpaceToastify';

const { Option } = Select;

const LevelList = () => {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const dispatch = useDispatch();
	const { levels, loading } = useSelector((state) => state.level);

	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
	const [editingLevel, setEditingLevel] = useState(null);
	const [deleteLevel, setDeleteLevel] = useState(null);
	const [searchText, setSearchText] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
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

	const handleDeleteClick = (level) => {
		setDeleteLevel(level);
		setIsDeleteModalVisible(true);
	};

	const handleDelete = async () => {
		try {
			await dispatch(deleteLevelAction(deleteLevel.id));
			spaceToast.success(t('levelManagement.deleteLevelSuccess'));
			setIsDeleteModalVisible(false);
			setDeleteLevel(null);
		} catch (error) {
			spaceToast.error(t('levelManagement.deleteLevelError'));
		}
	};

	const handleDeleteModalClose = () => {
		setIsDeleteModalVisible(false);
		setDeleteLevel(null);
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
			render: (difficulty) => `${difficulty}`,
		},
		{
			title: t('levelManagement.status'),
			dataIndex: 'status',
			key: 'status',
			width: 100,
			render: (status, record) => (
				<Tag color={status === 'active' ? 'green' : 'red'}>{status}</Tag>
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
					<Tooltip title={t('accountManagement.edit')}>
						<Button
							type='text'
							icon={<EditOutlined style={{ fontSize: '25px' }} />}
							size='small'
							onClick={() => handleEdit(record)}
						/>
					</Tooltip>
					<Button
						type='text'
						size='small'
						icon={<DeleteOutlined style={{ fontSize: '25px' }} />}
						onClick={() => handleDeleteClick(record)}></Button>
				</Space>
			),
		},
	];

	return (
		<ThemedLayout>
			{/* Main Content Panel */}
			<div className={`main-content-panel ${theme}-main-panel`}>
				{/* Header Section */}
				<div className={`panel-header ${theme}-panel-header`}>
					<div className='search-section'>
						<Input
							placeholder={t('levelManagement.searchPlaceholder')}
							prefix={<SearchOutlined />}
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							className={`search-input ${theme}-search-input`}
							style={{ minWidth: '350px', maxWidth: '500px' }}
							allowClear
						/>
						<Select
							style={{ width: 150, marginLeft: 12 }}
							value={statusFilter}
							onChange={setStatusFilter}
							placeholder={t('levelManagement.filterByStatus')}
							className={`filter-select ${theme}-filter-select`}>
							<Option value='all'>{t('levelManagement.allStatuses')}</Option>
							<Option value='active'>{t('levelManagement.active')}</Option>
							<Option value='inactive'>{t('levelManagement.inactive')}</Option>
						</Select>
						
						{/* Spacer để đẩy action buttons về bên phải */}
						<div style={{ flex: '1' }}></div>
					</div>
					<div className='action-buttons'>
						<Button
							icon={<ReloadOutlined />}
							onClick={handleRefresh}
							loading={loading}
							className={`refresh-button ${theme}-refresh-button`}>
							{t('levelManagement.refresh')}
						</Button>
						<Button
							icon={<PlusOutlined />}
							className={`create-button ${theme}-create-button`}
							onClick={handleAdd}>
							{t('levelManagement.addLevel')}
						</Button>
					</div>
				</div>

				{/* Table Section */}
				<div className={`table-section ${theme}-table-section`}>
					<LoadingWithEffect
						loading={loading}
						message={t('levelManagement.loadingLevels')}>
						<Table
							columns={columns}
							dataSource={filteredLevels}
							rowKey='id'
							pagination={{
								total: filteredLevels.length,
								pageSize: 10,
								showSizeChanger: true,
								showQuickJumper: true,
								showTotal: (total, range) =>
									`${range[0]}-${range[1]} of ${total}`,
								className: `${theme}-pagination`,
							}}
							scroll={{ x: 1200 }}
							className={`level-table ${theme}-level-table`}
						/>
					</LoadingWithEffect>
				</div>
			</div>

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
				width={800}
				destroyOnClose
				style={{ top: 20 }}
				bodyStyle={{
					maxHeight: '70vh',
					overflowY: 'auto',
					padding: '24px',
				}}>
				<LevelForm level={editingLevel} onClose={handleModalClose} />
			</Modal>

			{/* Delete Confirmation Modal */}
			<Modal
				title={
					<div
						style={{
							fontSize: '20px',
							fontWeight: '600',
							color: '#1890ff',
							textAlign: 'center',
							padding: '10px 0',
						}}>
						{t('levelManagement.confirmDelete')}
					</div>
				}
				open={isDeleteModalVisible}
				onOk={handleDelete}
				onCancel={handleDeleteModalClose}
				okText={t('common.confirm')}
				cancelText={t('common.cancel')}
				width={500}
				centered
				bodyStyle={{
					padding: '30px 40px',
					fontSize: '16px',
					lineHeight: '1.6',
					textAlign: 'center',
				}}
				okButtonProps={{
					style: {
						backgroundColor: '#ff4d4f',
						borderColor: '#ff4d4f',
						height: '40px',
						fontSize: '16px',
						fontWeight: '500',
						minWidth: '100px',
					},
				}}
				cancelButtonProps={{
					style: {
						height: '40px',
						fontSize: '16px',
						fontWeight: '500',
						minWidth: '100px',
					},
				}}>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: '20px',
					}}>
					<div
						style={{
							fontSize: '48px',
							color: '#ff4d4f',
							marginBottom: '10px',
						}}>
						⚠️
					</div>
					<p
						style={{
							fontSize: '18px',
							color: '#333',
							margin: 0,
							fontWeight: '500',
						}}>
						{t('levelManagement.confirmDeleteMessage')}
					</p>
					{deleteLevel && (
						<p
							style={{
								fontSize: '16px',
								color: '#666',
								margin: 0,
								fontWeight: '600',
							}}>
							<strong>{deleteLevel.name}</strong>
						</p>
					)}
				</div>
			</Modal>
		</ThemedLayout>
	);
};

export default LevelList;
