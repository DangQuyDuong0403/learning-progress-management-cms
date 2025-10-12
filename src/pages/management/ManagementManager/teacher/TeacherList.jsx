import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Input, Select, Tag, Tooltip } from 'antd';
import {
	PlusOutlined,
	DeleteOutlined,
	SearchOutlined,
	ReloadOutlined,
	EyeOutlined,
	DownloadOutlined,
	UploadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import TeacherForm from './TeacherForm';
import AssignTeacherToClass from './AssignTeacherToClass';
import './TeacherList.css';
import ThemedLayout from '../../../../component/ThemedLayout';
import LoadingWithEffect from '../../../../component/spinner/LoadingWithEffect';
import { useTheme } from '../../../../contexts/ThemeContext';
import { spaceToast } from '../../../../component/SpaceToastify';

const { Option } = Select;

const TeacherList = () => {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const navigate = useNavigate();

	// Mock data for teachers - replace with actual API calls
	const [teachers, setTeachers] = useState([
		{
			id: 1,
			name: 'Nguyễn Văn An',
			email: 'nguyen.van.an@example.com',
			phone: '0123456789',
			role: 'teacher',
			specialization: 'Mathematics',
			experience: '5 years',
			status: 'active',
			avatar: null,
			createdAt: '2024-01-15',
			classesCount: 3,
		},
		{
			id: 2,
			name: 'Trần Thị Bình',
			email: 'tran.thi.binh@example.com',
			phone: '0987654321',
			role: 'teacher_assistant',
			specialization: 'English',
			experience: '2 years',
			status: 'active',
			avatar: null,
			createdAt: '2024-02-20',
			classesCount: 2,
		},
		{
			id: 3,
			name: 'Lê Văn Cường',
			email: 'le.van.cuong@example.com',
			phone: '0111222333',
			role: 'teacher',
			specialization: 'Physics',
			experience: '8 years',
			status: 'inactive',
			avatar: null,
			createdAt: '2024-03-10',
			classesCount: 0,
		},
	]);

	const [loading, setLoading] = useState(false);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
	const [editingTeacher, setEditingTeacher] = useState(null);
	const [assigningTeacher, setAssigningTeacher] = useState(null);
	const [deleteTeacher, setDeleteTeacher] = useState(null);
	const [searchText, setSearchText] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [roleFilter, setRoleFilter] = useState('all');

	// Mock API calls - replace with actual API calls
	const fetchTeachers = async () => {
		setLoading(true);
		// Simulate API call
		setTimeout(() => {
			setLoading(false);
		}, 1000);
	};

	const deleteTeacherAction = async (teacherId) => {
		setTeachers(teachers.filter((teacher) => teacher.id !== teacherId));
	};

	useEffect(() => {
		fetchTeachers();
	}, []);

	const handleAdd = () => {
		setEditingTeacher(null);
		setIsModalVisible(true);
	};


	const handleViewProfile = (teacher) => {
		navigate(`/manager/teachers/profile/${teacher.id}`);
	};

	const handleAssignToClass = (teacher) => {
		setAssigningTeacher(teacher);
		setIsAssignModalVisible(true);
	};

	const handleDeleteClick = (teacher) => {
		setDeleteTeacher(teacher);
		setIsDeleteModalVisible(true);
	};

	const handleDelete = async () => {
		try {
			await deleteTeacherAction(deleteTeacher.id);
			spaceToast.success(t('teacherManagement.deleteTeacherSuccess'));
			setIsDeleteModalVisible(false);
			setDeleteTeacher(null);
			fetchTeachers();
		} catch (error) {
			spaceToast.error(t('teacherManagement.deleteTeacherError'));
		}
	};

	const handleDeleteModalClose = () => {
		setIsDeleteModalVisible(false);
		setDeleteTeacher(null);
	};

	const handleModalClose = () => {
		setIsModalVisible(false);
		setEditingTeacher(null);
	};

	const handleAssignModalClose = () => {
		setIsAssignModalVisible(false);
		setAssigningTeacher(null);
	};

	const handleRefresh = () => {
		fetchTeachers();
	};

	const handleExport = () => {
		// TODO: Implement export functionality
		spaceToast.success(t('teacherManagement.exportSuccess'));
	};

	const handleImport = () => {
		// TODO: Implement import functionality
		spaceToast.success(t('teacherManagement.importSuccess'));
	};

	// Filter teachers based on search, status, and role
	const filteredTeachers = teachers.filter((teacher) => {
		const matchesSearch =
			teacher.name.toLowerCase().includes(searchText.toLowerCase()) ||
			teacher.email.toLowerCase().includes(searchText.toLowerCase()) ||
			teacher.specialization.toLowerCase().includes(searchText.toLowerCase());
		const matchesStatus =
			statusFilter === 'all' || teacher.status === statusFilter;
		const matchesRole = roleFilter === 'all' || teacher.role === roleFilter;
		return matchesSearch && matchesStatus && matchesRole;
	});

	// Calculate statistics (commented out for now)
	// const totalTeachers = teachers.length;
	// const activeTeachers = teachers.filter(
	// 	(teacher) => teacher.status === 'active'
	// ).length;
	// const inactiveTeachers = teachers.filter(
	// 	(teacher) => teacher.status === 'inactive'
	// ).length;
	// const teacherAssistants = teachers.filter(
	// 	(teacher) => teacher.role === 'teacher_assistant'
	// ).length;

	const columns = [
		{
			title: t('teacherManagement.teacherInfo'),
			dataIndex: 'name',
			key: 'name',
			sorter: (a, b) => a.name.localeCompare(b.name),
			render: (text, record) => (
				<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
					{/* <Avatar 
						size={48} 
						icon={<UserOutlined />} 
						src={record.avatar}
						style={{ backgroundColor: '#1890ff' }}
					/> */}
					<div>
						<div style={{fontSize: '20px' }}>{text}</div>
					</div>
				</div>
			),
		},
		{
			title: t('teacherManagement.role'),
			dataIndex: 'role',
			key: 'role',
			width: 120,
			render: (role) => (
				<Tag color={role === 'teacher' ? 'blue' : 'green'}>
					{role === 'teacher'
						? t('teacherManagement.teacher')
						: t('teacherManagement.teacherAssistant')}
				</Tag>
			),
		},
		{
			title: t('teacherManagement.specialization'),
			dataIndex: 'specialization',
			key: 'specialization',
			width: 120,
			sorter: (a, b) => a.specialization.localeCompare(b.specialization),
		},
		{
			title: t('teacherManagement.experience'),
			dataIndex: 'experience',
			key: 'experience',
			width: 100,
		},
		{
			title: t('teacherManagement.classesCount'),
			dataIndex: 'classesCount',
			key: 'classesCount',
			width: 100,
			render: (count) => `${count} ${t('teacherManagement.classes')}`,
		},
		{
			title: t('teacherManagement.status'),
			dataIndex: 'status',
			key: 'status',
			width: 100,
			render: (status, record) => (
				<Tag color={status === 'active' ? 'green' : 'red'}>{status}</Tag>
			),
		},
		{
			title: t('teacherManagement.createdAt'),
			dataIndex: 'createdAt',
			key: 'createdAt',
			width: 120,
			render: (date) => new Date(date).toLocaleDateString(),
		},
		{
			title: t('teacherManagement.actions'),
			key: 'actions',
			width: 150,
			render: (_, record) => (
				<Space size='small'>
					<Tooltip title={t('teacherManagement.viewProfile')}>
						<Button
							type='text'
							icon={<EyeOutlined style={{ fontSize: '25px' }} />}
							size='small'
							onClick={() => handleViewProfile(record)}
						/>
					</Tooltip>
					{/* <Tooltip title={t('teacherManagement.edit')}>
						<Button
							type='text'
							icon={<EditOutlined style={{ fontSize: '25px' }} />}
							size='small'
							onClick={() => handleEdit(record)}
						/>
					</Tooltip> */}
					<Tooltip title={t('teacherManagement.assignToClass')}>
						<Button
							type='text'
							icon={<PlusOutlined style={{ fontSize: '25px' }} />}
							size='small'
							onClick={() => handleAssignToClass(record)}
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
			<div className={`teacher-page main-content-panel ${theme}-main-panel`}>
				{/* Header Section */}
				<div className={`panel-header ${theme}-panel-header`}>
					<div className='search-section'>
						<Input
							prefix={<SearchOutlined />}
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							className={`search-input ${theme}-search-input`}
							style={{ flex: '1', minWidth: '250px', maxWidth: '400px', width: '350px', height: '40px', fontSize: '16px' }}
							allowClear
						/>
						<Select
							style={{ width: 150, marginLeft: 12, fontSize: '16px' }}
							value={statusFilter}
							onChange={setStatusFilter}
							placeholder={t('teacherManagement.filterByStatus')}
							className={`filter-select ${theme}-filter-select`}>
							<Option value='all'>{t('teacherManagement.allStatuses')}</Option>
							<Option value='active'>{t('teacherManagement.active')}</Option>
							<Option value='inactive'>
								{t('teacherManagement.inactive')}
							</Option>
						</Select>
						<Select
							style={{ width: 150, marginLeft: 12, fontSize: '16px' }}
							value={roleFilter}
							onChange={setRoleFilter}
							placeholder={t('teacherManagement.filterByRole')}
							className={`filter-select ${theme}-filter-select`}>
							<Option value='all'>{t('teacherManagement.allRoles')}</Option>
							<Option value='teacher'>{t('teacherManagement.teacher')}</Option>
							<Option value='teacher_assistant'>
								{t('teacherManagement.teacherAssistant')}
							</Option>
						</Select>
					</div>
					<div className='action-buttons'>
						<Button
							icon={<DownloadOutlined />}
							className={`export-button ${theme}-export-button`}
							onClick={handleExport}>
							{t('teacherManagement.exportData')}
						</Button>
						<Button
							icon={<UploadOutlined />}
							className={`import-button ${theme}-import-button`}
							onClick={handleImport}>
							{t('teacherManagement.importTeachers')}
						</Button>
						<Button
							icon={<ReloadOutlined />}
							onClick={handleRefresh}
							loading={loading}
							className={`refresh-button ${theme}-refresh-button`}>
							{t('teacherManagement.refresh')}
						</Button>
						<Button
							icon={<PlusOutlined />}
							className={`create-button ${theme}-create-button`}
							onClick={handleAdd}>
							{t('teacherManagement.addTeacher')}
						</Button>
					</div>
				</div>

				{/* Table Section */}
				<div className={`table-section ${theme}-table-section`}>
					<LoadingWithEffect
						loading={loading}
						message={t('teacherManagement.loadingTeachers')}>
						<Table
							columns={columns}
							dataSource={filteredTeachers}
							rowKey='id'
							pagination={{
								total: filteredTeachers.length,
								pageSize: 10,
								showSizeChanger: true,
								showQuickJumper: true,
								showTotal: (total, range) =>
									`${range[0]}-${range[1]} of ${total}`,
								className: `${theme}-pagination`,
							}}
							scroll={{ x: 1200 }}
							className={`teacher-table ${theme}-teacher-table`}
						/>
					</LoadingWithEffect>
				</div>
			</div>

			{/* Add/Edit Teacher Modal */}
			<Modal
				title={
					editingTeacher
						? t('teacherManagement.editTeacher')
						: t('teacherManagement.addTeacher')
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
				<TeacherForm teacher={editingTeacher} onClose={handleModalClose} />
			</Modal>

			{/* Assign Teacher to Class Modal */}
			<Modal
				title={t('teacherManagement.assignTeacherToClass')}
				open={isAssignModalVisible}
				onCancel={handleAssignModalClose}
				footer={null}
				width={1200}
				destroyOnClose
				style={{ top: 20 }}
				bodyStyle={{
					maxHeight: '70vh',
					overflowY: 'auto',
					padding: '24px',
				}}>
				<AssignTeacherToClass
					teacher={assigningTeacher}
					onClose={handleAssignModalClose}
				/>
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
						{t('teacherManagement.confirmDelete')}
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
						{t('teacherManagement.confirmDeleteMessage')}
					</p>
					{deleteTeacher && (
						<p
							style={{
								fontSize: '16px',
								color: '#666',
								margin: 0,
								fontWeight: '600',
							}}>
							<strong>{deleteTeacher.name}</strong>
						</p>
					)}
				</div>
			</Modal>
		</ThemedLayout>
	);
};

export default TeacherList;
