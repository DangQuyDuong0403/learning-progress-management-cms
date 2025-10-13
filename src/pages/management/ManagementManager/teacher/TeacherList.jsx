import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Modal, Input, Select, Tag, Tooltip } from 'antd';
import {
	PlusOutlined,
	SearchOutlined,
	ReloadOutlined,
	EyeOutlined,
	DownloadOutlined,
	UploadOutlined,
	CheckOutlined,
	StopOutlined,
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
import { teacherManagementApi } from '../../../../apis/apis';

const { Option } = Select;

const TeacherList = () => {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const navigate = useNavigate();

	// State for teachers data
	const [teachers, setTeachers] = useState([]);
	const [loading, setLoading] = useState(true);
	
	// Pagination state
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 10,
		total: 0,
		showSizeChanger: true,
		showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
	});
	
	// Search and filter state
	const [searchText, setSearchText] = useState("");
	const [statusFilter, setStatusFilter] = useState([]);
	const [roleNameFilter, setRoleNameFilter] = useState([]);
	const [searchTimeout, setSearchTimeout] = useState(null);
	
	// Sort state - start with createdAt DESC (newest first)
	const [sortBy, setSortBy] = useState("createdAt");
	const [sortDir, setSortDir] = useState("desc");
	
	// Modal states
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
	const [confirmModal, setConfirmModal] = useState({
		visible: false,
		title: '',
		content: '',
		onConfirm: null
	});
	const [editingTeacher, setEditingTeacher] = useState(null);
	const [assigningTeacher, setAssigningTeacher] = useState(null);

	// Fetch teachers from API
	const fetchTeachers = useCallback(async (page = 1, size = 10, search = '', statusFilter = [], roleNameFilter = [], sortField = 'createdAt', sortDirection = 'desc') => {
		setLoading(true);
		try {
			const params = {
				page: page - 1, // API uses 0-based indexing
				size: size,
			};

			// Add sort parameters
			if (sortField && sortDirection) {
				params.sortBy = sortField;
				params.sortDir = sortDirection;
			}

			// Thêm search text nếu có
			if (search && search.trim()) {
				params.text = search.trim();
			}

			// Thêm status filter nếu có
			if (statusFilter.length > 0) {
				params.status = statusFilter;
			}

			// Thêm roleName filter nếu có
			if (roleNameFilter.length > 0) {
				params.roleName = roleNameFilter;
			}

			console.log('Fetching teachers with params:', params);
			const response = await teacherManagementApi.getTeachers(params);
			
			if (response.success && response.data) {
				setTeachers(response.data);
				setPagination(prev => ({
					...prev,
					current: page,
					pageSize: size,
					total: response.totalElements || response.data.length,
				}));
			} else {
				setTeachers([]);
				setPagination(prev => ({
					...prev,
					current: page,
					pageSize: size,
					total: 0,
				}));
			}
		} catch (error) {
			console.error('Error fetching teachers:', error);
			spaceToast.error(t('teacherManagement.loadTeachersError'));
			setTeachers([]);
			setPagination(prev => ({
				...prev,
				current: page,
				pageSize: size,
				total: 0,
			}));
		} finally {
			setLoading(false);
		}
	}, [t]);

	useEffect(() => {
		fetchTeachers(1, pagination.pageSize, searchText, statusFilter, roleNameFilter, sortBy, sortDir);
	}, [fetchTeachers, searchText, statusFilter, roleNameFilter, sortBy, sortDir, pagination.pageSize]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
		};
	}, [searchTimeout]);

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

	// Handle toggle teacher status (ACTIVE/INACTIVE)
	const handleToggleStatus = (teacherId) => {
		const teacher = teachers.find(t => t.id === teacherId);
		if (!teacher) return;

		const newStatus = teacher.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
		const actionText = newStatus === 'ACTIVE' ? t('teacherManagement.activate') : t('teacherManagement.deactivate');
		const teacherName = `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.userName;
		
		setConfirmModal({
			visible: true,
			title: t('teacherManagement.changeStatus'),
			content: `${t('teacherManagement.confirmStatusChange')} ${actionText} ${t('teacherManagement.teacher')} "${teacherName}"?`,
			onConfirm: async () => {
				try {
					// Call API to update teacher status
					const response = await teacherManagementApi.updateTeacherStatus(teacherId, newStatus);
					
					if (response.success) {
						spaceToast.success(newStatus === 'ACTIVE' 
							? t('teacherManagement.activateTeacherSuccess') 
							: t('teacherManagement.deactivateTeacherSuccess'));
						
						// Close modal
						setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
						
						// Refresh the list
						fetchTeachers(pagination.current, pagination.pageSize, searchText, statusFilter, roleNameFilter, sortBy, sortDir);
					} else {
						throw new Error(response.message || 'Failed to update teacher status');
					}
				} catch (error) {
					console.error('Error updating teacher status:', error);
					setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
					spaceToast.error(error.response?.data?.message || error.message || t('teacherManagement.updateStatusError'));
				}
			}
		});
	};

	const handleConfirmCancel = () => {
		setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
	};

	const handleModalClose = () => {
		setIsModalVisible(false);
		setEditingTeacher(null);
	};

	const handleAssignModalClose = () => {
		setIsAssignModalVisible(false);
		setAssigningTeacher(null);
	};

	// Handle search input change
	const handleSearch = (value) => {
		setSearchText(value);
		
		// Clear existing timeout
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
		
		// Set new timeout for debounced search
		const newTimeout = setTimeout(() => {
			fetchTeachers(1, pagination.pageSize, value, statusFilter, roleNameFilter, sortBy, sortDir);
		}, 500);
		
		setSearchTimeout(newTimeout);
	};

	// Handle table change (pagination, sorting, filtering)
	const handleTableChange = (pagination, filters, sorter) => {
		console.log('Table change:', { pagination, filters, sorter });
		
		// Handle sorting
		if (sorter && sorter.field) {
			let newSortBy = sorter.field;
			let newSortDir = 'asc'; // Default to asc for first click
			
			// Determine sort direction
			if (sorter.order === 'ascend') {
				newSortDir = 'asc';
			} else if (sorter.order === 'descend') {
				newSortDir = 'desc';
			} else if (sorter.order === undefined) {
				// First click on column - start with asc
				newSortDir = 'asc';
			}
			
			// Map column field to API field
			if (sorter.field === 'firstName') {
				newSortBy = 'firstName'; // Sort by firstName for Full Name column
			} else if (sorter.field === 'status') {
				newSortBy = 'status'; // Sort by status
			}
			
			console.log('Setting sort:', { newSortBy, newSortDir });
			setSortBy(newSortBy);
			setSortDir(newSortDir);
			
			// Fetch data with new sorting
			fetchTeachers(pagination.current, pagination.pageSize, searchText, statusFilter, roleNameFilter, newSortBy, newSortDir);
		} else {
			// Handle pagination without sorting change
			fetchTeachers(pagination.current, pagination.pageSize, searchText, statusFilter, roleNameFilter, sortBy, sortDir);
		}
	};

	const handleRefresh = () => {
		fetchTeachers(pagination.current, pagination.pageSize, searchText, statusFilter, roleNameFilter, sortBy, sortDir);
	};

	const handleExport = () => {
		// TODO: Implement export functionality
		spaceToast.success(t('teacherManagement.exportSuccess'));
	};

	const handleImport = () => {
		// TODO: Implement import functionality
		spaceToast.success(t('teacherManagement.importSuccess'));
	};

	// Status options for filter
	const statusOptions = [
		{ key: "ACTIVE", label: t('teacherManagement.active') },
		{ key: "INACTIVE", label: t('teacherManagement.inactive') },
	];

	// Role options for filter
	const roleOptions = [
		{ key: "TEACHER", label: t('teacherManagement.teacher') },
		{ key: "TEACHING_ASSISTANT", label: t('teacherManagement.teacherAssistant') },
	];

	const columns = [
		{
			title: "STT",
			key: "stt",
			width: 60,
			render: (_, __, index) => {
				// Calculate index based on current page and page size
				const currentPage = pagination.current || 1;
				const pageSize = pagination.pageSize || 10;
				return (
					<span className="stt-text">
						{(currentPage - 1) * pageSize + index + 1}
					</span>
				);
			},
		},
		{
			title: "Username",
			dataIndex: "userName",
			key: "userName",
			render: (userName) => (
				<span className="username-text">
					{userName}
				</span>
			),
		},
		{
			title: "Full Name",
			dataIndex: "firstName",
			key: "fullName",
			sorter: true,
			sortDirections: ['ascend', 'descend'],
			render: (_, record) => (
				<span className="fullname-text">
					{`${record.firstName || ''} ${record.lastName || ''}`.trim()}
				</span>
			),
		},
		{
			title: "Email",
			dataIndex: "email",
			key: "email",
			render: (email) => (
				<span className="email-text">
					{email}
				</span>
			),
		},
		{
			title: "Role",
			dataIndex: "roleName",
			key: "roleName",
			render: (roleName) => (
				<span className="role-text">
					{roleName === 'TEACHER'
						? t('teacherManagement.teacher')
						: t('teacherManagement.teacherAssistant')}
				</span>
			),
		},
		{
			title: "Classes",
			dataIndex: "classList",
			key: "classList",
			render: (classList) => (
				<span className="classes-text">
					{classList ? classList.length : 0} {t('teacherManagement.classes')}
				</span>
			),
		},
		{
			title: "Status",
			dataIndex: "status",
			key: "status",
			sorter: true,
			sortDirections: ['ascend', 'descend'],
			render: (status) => {
				const statusConfig = {
					ACTIVE: { color: "green", text: t('teacherManagement.active') },
					INACTIVE: { color: "red", text: t('teacherManagement.inactive') },
				};
				const config = statusConfig[status] || statusConfig.INACTIVE;
				return <Tag color={config.color}>{config.text}</Tag>;
			},
		},
		{
			title: t('teacherManagement.actions'),
			key: "actions",
			width: 150,
			render: (_, record) => (
				<Space size='small'>
					<Tooltip title={t('teacherManagement.viewProfile')}>
						<Button
							type='text'
							icon={<EyeOutlined style={{ fontSize: '25px' }} />}
							size='small'
							onClick={() => handleViewProfile(record)}
							style={{
								color: '#1890ff',
								padding: '8px 12px'
							}}
						/>
					</Tooltip>
					<Tooltip title={t('teacherManagement.assignToClass')}>
						<Button
							type='text'
							icon={<PlusOutlined style={{ fontSize: '25px' }} />}
							size='small'
							onClick={() => handleAssignToClass(record)}
							style={{
								color: '#52c41a',
								padding: '8px 12px'
							}}
						/>
					</Tooltip>
					<Tooltip title={record.status === 'ACTIVE' ? t('teacherManagement.deactivate') : t('teacherManagement.activate')}>
						<Button
							type="text"
							icon={record.status === 'ACTIVE' ? <StopOutlined style={{ fontSize: '25px' }} /> : <CheckOutlined style={{ fontSize: '25px' }} />}
							size="small"
							onClick={() => handleToggleStatus(record.id)}
							style={{
								color: record.status === 'ACTIVE' ? '#ff4d4f' : '#52c41a',
								padding: '8px 12px'
							}}
						/>
					</Tooltip>
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
							onChange={(e) => handleSearch(e.target.value)}
							className={`search-input ${theme}-search-input`}
							style={{ flex: '1', minWidth: '250px', maxWidth: '400px', width: '350px', height: '40px', fontSize: '16px' }}
							allowClear
						/>
						<Select
							mode="multiple"
							style={{ width: 200, marginLeft: 12, fontSize: '16px' }}
							value={statusFilter}
							onChange={setStatusFilter}
							placeholder={t('teacherManagement.filterByStatus')}
							className={`filter-select ${theme}-filter-select`}
							allowClear>
							{statusOptions.map(option => (
								<Option key={option.key} value={option.key}>
									{option.label}
								</Option>
							))}
						</Select>
						<Select
							mode="multiple"
							style={{ width: 200, marginLeft: 12, fontSize: '16px' }}
							value={roleNameFilter}
							onChange={setRoleNameFilter}
							placeholder={t('teacherManagement.filterByRole')}
							className={`filter-select ${theme}-filter-select`}
							allowClear>
							{roleOptions.map(option => (
								<Option key={option.key} value={option.key}>
									{option.label}
								</Option>
							))}
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
							dataSource={teachers}
							rowKey="id"
							pagination={{
								...pagination,
								className: `${theme}-pagination`,
								pageSizeOptions: ['5', '10', '20', '50', '100'],
							}}
							onChange={handleTableChange}
							scroll={{ x: 1200 }}
							className={`teacher-table ${theme}-teacher-table`}
							showSorterTooltip={false}
							sortDirections={['ascend', 'descend']}
							defaultSortOrder={
								sortBy === 'firstName' ? (sortDir === 'asc' ? 'ascend' : 'descend') :
								sortBy === 'status' ? (sortDir === 'asc' ? 'ascend' : 'descend') :
								null
							}
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

			{/* Status Change Confirmation Modal */}
			<Modal
				title={confirmModal.title}
				open={confirmModal.visible}
				onOk={confirmModal.onConfirm}
				onCancel={handleConfirmCancel}
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
						backgroundColor: '#1890ff',
						borderColor: '#1890ff',
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
							color: '#1890ff',
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
						{confirmModal.content}
					</p>
				</div>
			</Modal>
		</ThemedLayout>
	);
};

export default TeacherList;
