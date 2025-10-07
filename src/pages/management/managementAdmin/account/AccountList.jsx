import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
	Table,
	Button,
	Input,
	Space,
	Tag,
	message,
	Row,
	Col,
	Select,
	Tooltip,
	Modal,
	Form,
	Upload,
	Typography,
	Divider,
} from 'antd';
import {
	PlusOutlined,
	EditOutlined,
	SearchOutlined,
	MailOutlined,
	PhoneOutlined,
	CheckOutlined,
	StopOutlined,
	DownloadOutlined,
	UploadOutlined,
} from '@ant-design/icons';
import ThemedLayout from '../../../../component/ThemedLayout';
import LoadingWithEffect from '../../../../component/spinner/LoadingWithEffect';
import { useTheme } from '../../../../contexts/ThemeContext';
import './AccountList.css';
import { spaceToast } from '../../../../component/SpaceToastify';
import accountManagementApi from '../../../../apis/backend/accountManagement';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { Dragger } = Upload;


const AccountList = () => {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const [loading, setLoading] = useState(false);
	const [accounts, setAccounts] = useState([]);
	const [searchText, setSearchText] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [roleFilter, setRoleFilter] = useState('all');
	const [searchTimeout, setSearchTimeout] = useState(null);
	const [sortBy, setSortBy] = useState('createdAt');
	const [sortDir, setSortDir] = useState('asc');
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [editingAccount, setEditingAccount] = useState(null);
	const [form] = Form.useForm();
	const [confirmModal, setConfirmModal] = useState({
		visible: false,
		title: '',
		content: '',
		onConfirm: null,
	});
	const [importModal, setImportModal] = useState({
		visible: false,
		fileList: [],
		uploading: false,
	});
	// Pagination state
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 10,
		total: 0,
		showSizeChanger: true,
		showQuickJumper: true,
		showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
	});

	const fetchAccounts = useCallback(async (page = 1, size = 10, search = '', roleFilter = 'all', statusFilter = 'all', sortField = 'createdAt', sortDirection = 'asc') => {
		setLoading(true);
		try {
			const params = {
				page: page - 1, // API uses 0-based indexing
				size: size,
				sortBy: sortField,
				sortDir: sortDirection,
			};
			
			// Add search parameter if provided (API uses 'text' parameter)
			if (search && search.trim()) {
				params.text = search.trim();
			}

			// Add roleName filter if not 'all' (API expects array of strings)
			if (roleFilter && roleFilter !== 'all') {
				params.roleName = [roleFilter];
			}

			// Add status filter if not 'all' (API expects array of strings)
			if (statusFilter && statusFilter !== 'all') {
				params.status = [statusFilter];
			}

			const response = await accountManagementApi.getAccounts({
				params: params,
			});

			// Map API response to component format
			const mappedAccounts = response.data.map((account) => ({
				id: account.id,
				username: account.userName,
				email: account.email,
				fullName: account.fullName,
				phone: account.phone || 'N/A', // API doesn't include phone, so we'll show N/A
				role: account.roleName,
				status: account.status, // Keep status in uppercase format (ACTIVE/INACTIVE)
				createdAt: new Date(account.createAt).toLocaleDateString(),
				lastLogin: account.lastLogin || null,
				avatar: null,
				mustChangePassword: account.mustChangePassword,
				requestResetPasswordByTeacher: account.requestResetPasswordByTeacher,
			}));

			setAccounts(mappedAccounts);
			setPagination(prev => ({
				...prev,
				current: page,
				pageSize: size,
				total: response.totalElements,
			}));
			setLoading(false);
		} catch (error) {
			console.error('Error fetching accounts:', error);
			message.error(t('accountManagement.loadAccountsError'));
			setLoading(false);
		}
	}, [t]);

	useEffect(() => {
		fetchAccounts(1, pagination.pageSize, searchText, roleFilter, statusFilter, sortBy, sortDir);
	}, [fetchAccounts, searchText, roleFilter, statusFilter, sortBy, sortDir, pagination.pageSize]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
		};
	}, [searchTimeout]);

	const handleSearch = (value) => {
		setSearchText(value);
		
		// Clear existing timeout
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
		
		// Set new timeout for 1 second delay
		const newTimeout = setTimeout(() => {
			// Reset to first page when searching
			fetchAccounts(1, pagination.pageSize, value, roleFilter, statusFilter, sortBy, sortDir);
		}, 1000);
		
		setSearchTimeout(newTimeout);
	};

	const handleRoleFilterChange = (value) => {
		setRoleFilter(value);
		// Reset to first page when filtering
		fetchAccounts(1, pagination.pageSize, searchText, value, statusFilter, sortBy, sortDir);
	};

	const handleStatusFilterChange = (value) => {
		setStatusFilter(value);
		// Reset to first page when filtering
		fetchAccounts(1, pagination.pageSize, searchText, roleFilter, value, sortBy, sortDir);
	};

	const handleTableChange = (pagination, filters, sorter) => {
		// Handle sorting
		if (sorter && sorter.field) {
			const newSortBy = sorter.field;
			const newSortDir = sorter.order === 'ascend' ? 'asc' : 'desc';
			
			setSortBy(newSortBy);
			setSortDir(newSortDir);
			
			// Fetch data with new sorting
			fetchAccounts(pagination.current, pagination.pageSize, searchText, roleFilter, statusFilter, newSortBy, newSortDir);
		} else {
			// Handle pagination without sorting change
			fetchAccounts(pagination.current, pagination.pageSize, searchText, roleFilter, statusFilter, sortBy, sortDir);
		}
	};

	const handleAddAccount = () => {
		setEditingAccount(null);
		form.resetFields();
		setIsModalVisible(true);
	};

	const handleEditAccount = (record) => {
		setEditingAccount(record);
		form.setFieldsValue(record);
		setIsModalVisible(true);
	};

	const handleToggleStatus = (id) => {
		const account = accounts.find((a) => a.id === id);
		if (account) {
			const newStatus = account.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
			const actionText =
				newStatus === 'ACTIVE'
					? t('accountManagement.active')
					: t('accountManagement.inactive');

			setConfirmModal({
				visible: true,
				title: t('accountManagement.changeStatus'),
				content: `${t(
					'accountManagement.confirmStatusChange'
				)} ${actionText} ${t('accountManagement.account')} "${
					account.username
				}"?`,
				onConfirm: async () => {
					try {
						// Call API to update status
						await accountManagementApi.updateAccountStatus(id, newStatus);
						
						// Update local state
						setAccounts(
							accounts.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
						);
						
						setConfirmModal({
							visible: false,
							title: '',
							content: '',
							onConfirm: null,
						});

						// Show success message
						if (newStatus === 'ACTIVE') {
							spaceToast.success(
								`${t('accountManagement.activateAccountSuccess')} "${
									account.username
								}" ${t('accountManagement.success')}`
							);
						} else {
							spaceToast.success(
								`${t('accountManagement.deactivateAccountSuccess')} "${
									account.username
								}" ${t('accountManagement.success')}`
							);
						}
					} catch (error) {
						console.error('Error updating account status:', error);
						message.error(t('accountManagement.updateStatusError'));
						setConfirmModal({
							visible: false,
							title: '',
							content: '',
							onConfirm: null,
						});
					}
				},
			});
		}
	};

	const handleConfirmCancel = () => {
		setConfirmModal({
			visible: false,
			title: '',
			content: '',
			onConfirm: null,
		});
	};

	const handleImportAccount = () => {
		setImportModal({ visible: true, fileList: [], uploading: false });
	};

	const handleImportCancel = () => {
		setImportModal({ visible: false, fileList: [], uploading: false });
	};

	const handleImportOk = async () => {
		if (importModal.fileList.length === 0) {
			message.warning(t('accountManagement.selectFileToImport'));
			return;
		}

		setImportModal((prev) => ({ ...prev, uploading: true }));

		try {
			// Simulate file processing
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// Mock successful import
			const newAccounts = [
				{
					id: Date.now() + 1,
					username: 'imported001',
					email: 'imported001@example.com',
					fullName: 'Account Imported 1',
					phone: '0123456789',
					role: 'Student',
					status: 'active',
					createdAt: new Date().toISOString().split('T')[0],
					lastLogin: null,
					avatar: null,
				},
				{
					id: Date.now() + 2,
					username: 'imported002',
					email: 'imported002@example.com',
					fullName: 'Account Imported 2',
					phone: '0987654321',
					role: 'Teacher',
					status: 'active',
					createdAt: new Date().toISOString().split('T')[0],
					lastLogin: null,
					avatar: null,
				},
			];

			setAccounts([...newAccounts, ...accounts]);
			spaceToast.success(
				`${t('accountManagement.importSuccess')} ${newAccounts.length} ${t(
					'accountManagement.accounts'
				)}`
			);

			setImportModal({ visible: false, fileList: [], uploading: false });
		} catch (error) {
			message.error(t('accountManagement.importError'));
			setImportModal((prev) => ({ ...prev, uploading: false }));
		}
	};

	const handleModalOk = async () => {
		try {
			const values = await form.validateFields();

			if (editingAccount) {
				// Update existing account
				setAccounts(
					accounts.map((account) =>
						account.id === editingAccount.id
							? { ...account, ...values }
							: account
					)
				);
				message.success(t('accountManagement.updateAccountSuccess'));
			} else {
				// Add new account
				const newAccount = {
					id: Date.now(),
					...values,
					createdAt: new Date().toISOString().split('T')[0],
					lastLogin: null,
				};
				setAccounts([newAccount, ...accounts]);
				message.success(t('accountManagement.addAccountSuccess'));
			}

			setIsModalVisible(false);
			form.resetFields();
		} catch (error) {
			message.error(t('accountManagement.checkInfoError'));
		}
	};

	const handleModalCancel = () => {
		setIsModalVisible(false);
		form.resetFields();
	};

	const getStatusTag = (status) => {
		const statusConfig = {
			ACTIVE: { color: 'green', text: t('accountManagement.active') },
			INACTIVE: { color: 'red', text: t('accountManagement.inactive') },
		};

		const config = statusConfig[status] || statusConfig.INACTIVE;
		return <Tag color={config.color}>{config.text}</Tag>;
	};

	const getRoleTag = (role) => {
		const roleTranslations = {
			ADMIN: t('accountManagement.admin'),
			TEACHER: t('accountManagement.teacher'),
			STUDENT: t('accountManagement.student'),
			MANAGER: t('accountManagement.manager'),
			TEACHING_ASSISTANT: t('accountManagement.teacherAssistant'),
			TEST_TAKER: t('accountManagement.testTaker'),
		};

		return roleTranslations[role] || role;
	};
	console.log(theme);
	
	// No need for client-side filtering since API handles filtering

	const columns = [
		{
			title: 'No',
			key: 'index',
			width: 60,
			render: (_, __, index) => {
				// Calculate index based on current page and page size
				const currentPage = pagination.current || 1;
				const pageSize = pagination.pageSize || 10;
				return (currentPage - 1) * pageSize + index + 1;
			},
		},
		{
			title: t('accountManagement.username'),
			dataIndex: 'username',
			key: 'username',
			sorter: true,
		},
		{
			title: t('accountManagement.fullName'),
			dataIndex: 'fullName',
			key: 'fullName',
			sorter: true,
		},
		{
			title: t('accountManagement.email'),
			dataIndex: 'email',
			key: 'email',
			render: (email) => (
				<Space>
					<MailOutlined />
					{email}
				</Space>
			),
		},
		{
			title: t('accountManagement.phone'),
			dataIndex: 'phone',
			key: 'phone',
			render: (phone) => (
				<Space>
					<PhoneOutlined />
					{phone}
				</Space>
			),
		},
		{
			title: t('accountManagement.role'),
			dataIndex: 'role',
			key: 'role',
			render: (role) => getRoleTag(role),
		},
		{
			title: t('accountManagement.status'),
			dataIndex: 'status',
			key: 'status',
			render: (status) => getStatusTag(status),
		},
		{
			title: t('accountManagement.createdAt'),
			dataIndex: 'createdAt',
			key: 'createdAt',
			sorter: true,
			defaultSortOrder: 'ascend',
		},
		{
			title: t('accountManagement.actions'),
			key: 'actions',
			width: 180,
			render: (_, record) => (
				<Space size='small'>
					<Tooltip title={t('accountManagement.edit')}>
						<Button
							type='text'
							icon={<EditOutlined style={{ fontSize: '25px' }} />}
							size='small'
							onClick={() => handleEditAccount(record)}
						/>
					</Tooltip>
					<Tooltip
						title={
							record.status === 'ACTIVE'
								? t('accountManagement.deactivate')
								: t('accountManagement.activate')
						}>
						<Button
							type='text'
							icon={
								record.status === 'ACTIVE' ? (
									<StopOutlined style={{ fontSize: '25px' }} />
								) : (
									<CheckOutlined style={{ fontSize: '25px' }} />
								)
							}
							size='small'
							onClick={() => handleToggleStatus(record.id)}
							style={{
								color: record.status === 'ACTIVE' ? '#ff4d4f' : '#52c41a',
								padding: '4px 8px',
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
			<div className={`account-page ${theme}-theme main-content-panel`}>
				{/* Header Section */}
				<div className={`panel-header ${theme}-panel-header`}>
					<div className='search-section'>
						<Input
							placeholder='Search...'
							prefix={<SearchOutlined />}
							value={searchText}
							onChange={(e) => handleSearch(e.target.value)}
							className={`search-input ${theme}-search-input`}
							style={{ flex: '1', minWidth: '250px', maxWidth: '400px', width: '350px' }}
							allowClear
						/>
						
						{/* Role Filter */}
						<Select
							placeholder={t('accountManagement.filterByRole')}
							value={roleFilter}
							onChange={handleRoleFilterChange}
							className={`filter-select ${theme}-filter-select`}
							style={{ width: 150, marginLeft: '12px' }}
							allowClear>
							<Option value='all'>{t('accountManagement.allRoles')}</Option>
							<Option value='ADMIN'>{t('accountManagement.admin')}</Option>
							<Option value='TEACHER'>{t('accountManagement.teacher')}</Option>
							<Option value='STUDENT'>{t('accountManagement.student')}</Option>
							<Option value='MANAGER'>{t('accountManagement.manager')}</Option>
							<Option value='TEACHING_ASSISTANT'>{t('accountManagement.teacherAssistant')}</Option>
							<Option value='TEST_TAKER'>{t('accountManagement.testTaker')}</Option>
						</Select>

						{/* Status Filter */}
						<Select
							placeholder={t('accountManagement.filterByStatus')}
							value={statusFilter}
							onChange={handleStatusFilterChange}
							className={`filter-select ${theme}-filter-select`}
							style={{ width: 150, marginLeft: '12px' }}
							allowClear>
							<Option value='all'>{t('accountManagement.allStatuses')}</Option>
							<Option value='ACTIVE'>{t('accountManagement.active')}</Option>
							<Option value='INACTIVE'>{t('accountManagement.inactive')}</Option>
						</Select>

						{/* Spacer để đẩy action buttons về bên phải */}
						<div style={{ flex: '1' }}></div>
					</div>
					<div className='action-buttons'>
						<Button
							icon={<UploadOutlined />}
							className={`export-button ${theme}-export-button`}>
							Export Data
						</Button>
						<Button
							icon={<DownloadOutlined />}
							className={`import-button ${theme}-import-button`}
							onClick={handleImportAccount}>
							Import Account
						</Button>
						<Button
							icon={<PlusOutlined />}
							className={`create-button ${theme}-create-button`}
							onClick={handleAddAccount}>
							Create Account
						</Button>
					</div>
				</div>

				{/* Table Section */}
				<div className={`table-section ${theme}-table-section`}>
					<LoadingWithEffect
						loading={loading}
						message={t('accountManagement.loadingAccounts')}>
						<Table
							columns={columns}
							dataSource={accounts}
							rowKey='id'
							pagination={{
								...pagination,
								className: `${theme}-pagination`,
							}}
							onChange={handleTableChange}
							scroll={{ x: 1200 }}
							className={`account-table ${theme}-account-table`}
						/>
					</LoadingWithEffect>
				</div>
			</div>

			{/* Add/Edit Modal */}
			<Modal
				title={
					<div
						style={{
							fontSize: '26px',
							fontWeight: '600',
							color: '#000000ff',
							textAlign: 'center',
							padding: '10px 0',
						}}>
						{editingAccount
							? t('accountManagement.editAccount')
							: t('accountManagement.addNewAccount')}
					</div>
				}
				open={isModalVisible}
				onOk={handleModalOk}
				onCancel={handleModalCancel}
				width={600}
				okText={t('common.save')}
				cancelText={t('common.cancel')}>
				<Form
					form={form}
					layout='vertical'
					initialValues={{
						status: 'ACTIVE',
						role: 'STUDENT',
					}}>
					<Row gutter={16}>
						<Col span={12}>
							<Form.Item
								label={
									<span>
										{t('accountManagement.username')}
										<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
									</span>
								}
								name='username'
								rules={[
									{
										required: true,
										message: t('accountManagement.usernameRequired'),
									},
									{
										min: 3,
										message: t('accountManagement.usernameMinLength'),
									},
								]}
								required={false}>
								<Input
									placeholder={t('accountManagement.usernamePlaceholder')}
								/>
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item
								label={
									<span>
										{t('accountManagement.email')}
										<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
									</span>
								}
								name='email'
								rules={[
									{
										required: true,
										message: t('accountManagement.emailRequired'),
									},
									{
										type: 'email',
										message: t('accountManagement.emailInvalid'),
									},
								]}
								required={false}>
								<Input placeholder={t('accountManagement.emailPlaceholder')} />
							</Form.Item>
						</Col>
					</Row>

					<Row gutter={16}>
						<Col span={12}>
							<Form.Item
								label={
									<span>
										{t('accountManagement.fullName')}
										<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
									</span>
								}
								name='fullName'
								rules={[
									{
										required: true,
										message: t('accountManagement.fullNameRequired'),
									},
								]}
								required={false}>
								<Input
									placeholder={t('accountManagement.fullNamePlaceholder')}
								/>
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item
								label={
									<span>
										{t('accountManagement.phone')}
										<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
									</span>
								}
								name='phone'
								rules={[
									{
										required: true,
										message: t('accountManagement.phoneRequired'),
									},
									{
										pattern: /^[0-9]{10,11}$/,
										message: t('accountManagement.phoneInvalid'),
									},
								]}
								required={false}>
								<Input placeholder={t('accountManagement.phonePlaceholder')} />
							</Form.Item>
						</Col>
					</Row>

					<Row gutter={16}>
						<Col span={12}>
							<Form.Item
								label={
									<span>
										{t('accountManagement.role')}
										<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
									</span>
								}
								name='role'
								rules={[
									{
										required: true,
										message: t('accountManagement.roleRequired'),
									},
								]}
								required={false}>
								<Select placeholder={t('accountManagement.selectRole')}>
									<Option value='ADMIN'>{t('accountManagement.admin')}</Option>
									<Option value='TEACHER'>
										{t('accountManagement.teacher')}
									</Option>
									<Option value='STUDENT'>
										{t('accountManagement.student')}
									</Option>
									<Option value='MANAGER'>
										{t('accountManagement.manager')}
									</Option>
								</Select>
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item
								label={
									<span>
										{t('accountManagement.status')}
										<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
									</span>
								}
								name='status'
								rules={[
									{
										required: true,
										message: t('accountManagement.statusRequired'),
									},
								]}
								required={false}>
								<Select placeholder={t('accountManagement.selectStatus')}>
									<Option value='ACTIVE'>
										{t('accountManagement.active')}
									</Option>
									<Option value='INACTIVE'>
										{t('accountManagement.inactive')}
									</Option>
								</Select>
							</Form.Item>
						</Col>
					</Row>

					{!editingAccount && (
						<Form.Item
							label={
								<span>
									{t('accountManagement.password')}
									<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
								</span>
							}
							name='password'
							rules={[
								{
									required: true,
									message: t('accountManagement.passwordRequired'),
								},
								{ min: 6, message: t('accountManagement.passwordMinLength') },
							]}
							required={false}>
							<Input.Password
								placeholder={t('accountManagement.passwordPlaceholder')}
							/>
						</Form.Item>
					)}

					<Form.Item label={t('accountManagement.note')} name='note'>
						<TextArea
							rows={3}
							placeholder={t('accountManagement.notePlaceholder')}
						/>
					</Form.Item>
				</Form>
			</Modal>

			{/* Confirmation Modal */}
			<Modal
				title={
					<div
						style={{
							fontSize: '26px',
							fontWeight: '600',
							color: '#000000ff',
							textAlign: 'center',
							padding: '10px 0',
						}}>
						{confirmModal.title}
					</div>
				}
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
						{confirmModal.content}
					</p>
				</div>
			</Modal>

			{/* Import Modal */}
			<Modal
				title={
					<div
						style={{
							fontSize: '20px',
							fontWeight: '600',
							color: '#1890ff',
							textAlign: 'center',
							padding: '10px 0',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '10px',
						}}>
						<UploadOutlined />
						{t('accountManagement.importAccounts')}
					</div>
				}
				open={importModal.visible}
				onOk={handleImportOk}
				onCancel={handleImportCancel}
				okText={t('accountManagement.import')}
				cancelText={t('common.cancel')}
				width={600}
				centered
				confirmLoading={importModal.uploading}
				okButtonProps={{
					disabled: importModal.fileList.length === 0,
					style: {
						backgroundColor: '#52c41a',
						borderColor: '#52c41a',
						height: '40px',
						fontSize: '16px',
						fontWeight: '500',
						minWidth: '120px',
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
				<div style={{ padding: '20px 0' }}>
					<Title
						level={5}
						style={{
							textAlign: 'center',
							marginBottom: '20px',
							color: '#666',
						}}>
						{t('accountManagement.importInstructions')}
					</Title>

					<Dragger
						multiple={false}
						accept='.xlsx,.xls,.csv'
						fileList={importModal.fileList}
						onChange={({ fileList }) => {
							setImportModal((prev) => ({ ...prev, fileList }));
						}}
						beforeUpload={() => false} // Prevent auto upload
						style={{
							marginBottom: '20px',
							border: '2px dashed #d9d9d9',
							borderRadius: '8px',
							background: '#fafafa',
						}}>
						<p
							className='ant-upload-drag-icon'
							style={{ fontSize: '48px', color: '#1890ff' }}>
							<UploadOutlined />
						</p>
						<p
							className='ant-upload-text'
							style={{ fontSize: '16px', fontWeight: '500' }}>
							{t('accountManagement.clickOrDragFile')}
						</p>
						<p className='ant-upload-hint' style={{ color: '#999' }}>
							{t('accountManagement.supportedFormats')}: Excel (.xlsx, .xls),
							CSV (.csv)
						</p>
					</Dragger>

					<Divider />

					<div
						style={{
							background: '#f6f8fa',
							padding: '16px',
							borderRadius: '8px',
							border: '1px solid #e1e4e8',
						}}>
						<Title level={5} style={{ marginBottom: '12px', color: '#24292e' }}>
							📋 {t('accountManagement.fileFormat')}
						</Title>
						<Text
							style={{ color: '#586069', fontSize: '14px', lineHeight: '1.6' }}>
							{t('accountManagement.fileFormatDescription')}
						</Text>

						<div
							style={{ marginTop: '12px', fontSize: '13px', color: '#6a737d' }}>
							<div>
								<strong>{t('accountManagement.requiredColumns')}:</strong>
							</div>
							<div>• username, email, fullName, phone, role, status</div>
							<div>
								<strong>{t('accountManagement.optionalColumns')}:</strong>
							</div>
							<div>• password (nếu không có sẽ tự động tạo)</div>
							<div>• note (ghi chú)</div>
						</div>
					</div>

					{importModal.fileList.length > 0 && (
						<div
							style={{
								marginTop: '16px',
								padding: '12px',
								background: '#e6f7ff',
								border: '1px solid #91d5ff',
								borderRadius: '6px',
							}}>
							<Text style={{ color: '#1890ff', fontWeight: '500' }}>
								✅ {t('accountManagement.fileSelected')}:{' '}
								{importModal.fileList[0].name}
							</Text>
						</div>
					)}
				</div>
			</Modal>
		</ThemedLayout>
	);
};

export default AccountList;
