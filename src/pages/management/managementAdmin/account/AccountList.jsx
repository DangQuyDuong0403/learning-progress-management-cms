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

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { Dragger } = Upload;

// Mock data - thay thế bằng API call thực tế
const mockAccounts = [
	{
		id: 1,
		username: 'admin001',
		email: 'admin001@example.com',
		fullName: 'Nguyễn Văn Admin',
		phone: '0123456789',
		role: 'Admin',
		status: 'active',
		createdAt: '2024-01-15',
		lastLogin: '2024-01-20 10:30:00',
		avatar: null,
	},
	{
		id: 2,
		username: 'teacher001',
		email: 'teacher001@example.com',
		fullName: 'Trần Thị Giáo Viên',
		phone: '0987654321',
		role: 'Teacher',
		status: 'active',
		createdAt: '2024-01-16',
		lastLogin: '2024-01-19 15:45:00',
		avatar: null,
	},
	{
		id: 3,
		username: 'student001',
		email: 'student001@example.com',
		fullName: 'Lê Văn Học Sinh',
		phone: '0369852147',
		role: 'Student',
		status: 'inactive',
		createdAt: '2024-01-17',
		lastLogin: '2024-01-18 09:20:00',
		avatar: null,
	},
	{
		id: 4,
		username: 'manager001',
		email: 'manager001@example.com',
		fullName: 'Phạm Thị Quản Lý',
		phone: '0741852963',
		role: 'Manager',
		status: 'active',
		createdAt: '2024-01-18',
		lastLogin: '2024-01-20 14:15:00',
		avatar: null,
	},
];

const AccountList = () => {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const [loading, setLoading] = useState(false);
	const [accounts, setAccounts] = useState([]);
	const [searchText, setSearchText] = useState('');
	const [statusFilter] = useState('all');
	const [roleFilter] = useState('all');
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

	const fetchAccounts = useCallback(async () => {
		setLoading(true);
		try {
			// Simulate API call
			setTimeout(() => {
				setAccounts(mockAccounts);
				setLoading(false);
			}, 1000);
		} catch (error) {
			message.error(t('accountManagement.loadAccountsError'));
			setLoading(false);
		}
	}, [t]);

	useEffect(() => {
		fetchAccounts();
	}, [fetchAccounts]);

	const handleSearch = (value) => {
		setSearchText(value);
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
			const newStatus = account.status === 'active' ? 'inactive' : 'active';
			const actionText =
				newStatus === 'active'
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
				onConfirm: () => {
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
					if (newStatus === 'active') {
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
			active: { color: 'green', text: t('accountManagement.active') },
			inactive: { color: 'red', text: t('accountManagement.inactive') },
			pending: { color: 'orange', text: t('accountManagement.pending') },
		};

		const config = statusConfig[status] || statusConfig.inactive;
		return <Tag color={config.color}>{config.text}</Tag>;
	};

	const getRoleTag = (role) => {
		const roleConfig = {
			Admin: { color: 'purple' },
			Teacher: { color: 'blue' },
			Student: { color: 'cyan' },
			Manager: { color: 'gold' },
		};

		const config = roleConfig[role] || { color: 'default' };
		const roleTranslations = {
			Admin: t('accountManagement.admin'),
			Teacher: t('accountManagement.teacher'),
			Student: t('accountManagement.student'),
			Manager: t('accountManagement.manager'),
		};

		return roleTranslations[role] || role;
	};

	// Filter data based on search and filters
	const filteredAccounts = accounts.filter((account) => {
		const matchesSearch =
			searchText === '' ||
			account.username.toLowerCase().includes(searchText.toLowerCase()) ||
			account.email.toLowerCase().includes(searchText.toLowerCase()) ||
			account.fullName.toLowerCase().includes(searchText.toLowerCase());

		const matchesStatus =
			statusFilter === 'all' || account.status === statusFilter;
		const matchesRole = roleFilter === 'all' || account.role === roleFilter;

		return matchesSearch && matchesStatus && matchesRole;
	});

	const columns = [
		{
			title: t('accountManagement.username'),
			dataIndex: 'username',
			key: 'username',
			sorter: (a, b) => a.username.localeCompare(b.username),
		},
		{
			title: t('accountManagement.fullName'),
			dataIndex: 'fullName',
			key: 'fullName',
			sorter: (a, b) => a.fullName.localeCompare(b.fullName),
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
			filters: [
				{ text: t('accountManagement.admin'), value: 'Admin' },
				{ text: t('accountManagement.teacher'), value: 'Teacher' },
				{ text: t('accountManagement.student'), value: 'Student' },
				{ text: t('accountManagement.manager'), value: 'Manager' },
			],
			onFilter: (value, record) => record.role === value,
		},
		{
			title: t('accountManagement.status'),
			dataIndex: 'status',
			key: 'status',
			render: (status) => getStatusTag(status),
			filters: [
				{ text: t('accountManagement.active'), value: 'active' },
				{ text: t('accountManagement.inactive'), value: 'inactive' },
				{ text: t('accountManagement.pending'), value: 'pending' },
			],
			onFilter: (value, record) => record.status === value,
		},
		{
			title: t('accountManagement.createdAt'),
			dataIndex: 'createdAt',
			key: 'createdAt',
			sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
		},
		{
			title: t('accountManagement.lastLogin'),
			dataIndex: 'lastLogin',
			key: 'lastLogin',
			render: (lastLogin) => lastLogin || t('accountManagement.neverLoggedIn'),
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
							record.status === 'active'
								? t('accountManagement.deactivate')
								: t('accountManagement.activate')
						}>
						<Button
							type='text'
							icon={
								record.status === 'active' ? (
									<StopOutlined style={{ fontSize: '25px' }} />
								) : (
									<CheckOutlined style={{ fontSize: '25px' }} />
								)
							}
							size='small'
							onClick={() => handleToggleStatus(record.id)}
							style={{
								color: record.status === 'active' ? '#ff4d4f' : '#52c41a',
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
			<div className={`account-page main-content-panel ${theme}-main-panel`}>
				{/* Header Section */}
				<div className={`panel-header ${theme}-panel-header`}>
					<div className='search-section'>
						<Input
							placeholder='Search...'
							prefix={<SearchOutlined />}
							value={searchText}
							onChange={(e) => handleSearch(e.target.value)}
							className={`search-input ${theme}-search-input`}
							allowClear
						/>
						<div style={{width: 500}}></div>
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
							dataSource={filteredAccounts}
							rowKey='id'
							pagination={{
								total: filteredAccounts.length,
								pageSize: 10,
								showSizeChanger: true,
								showQuickJumper: true,
								showTotal: (total, range) =>
									`${range[0]}-${range[1]} of ${total}`,
								className: `${theme}-pagination`,
							}}
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
						status: 'active',
						role: 'Student',
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
									<Option value='Admin'>{t('accountManagement.admin')}</Option>
									<Option value='Teacher'>
										{t('accountManagement.teacher')}
									</Option>
									<Option value='Student'>
										{t('accountManagement.student')}
									</Option>
									<Option value='Manager'>
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
									<Option value='active'>
										{t('accountManagement.active')}
									</Option>
									<Option value='inactive'>
										{t('accountManagement.inactive')}
									</Option>
									<Option value='pending'>
										{t('accountManagement.pending')}
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
