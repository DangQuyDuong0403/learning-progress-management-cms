import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
	Table,
	Button,
	Input,
	Space,
	message,
	Row,
	Col,
	Select,
	Tooltip,
	Modal,
	Form,
	Typography,
	Switch,
} from 'antd';
import {
	PlusOutlined,
	EditOutlined,
	SearchOutlined,
	MailOutlined,
	FilterOutlined,
} from '@ant-design/icons';
import ThemedLayout from '../../../../component/ThemedLayout';
import LoadingWithEffect from '../../../../component/spinner/LoadingWithEffect';
import { useTheme } from '../../../../contexts/ThemeContext';
import './AccountList.css';
import { spaceToast } from '../../../../component/SpaceToastify';
import accountManagementApi from '../../../../apis/backend/accountManagement';

const { Option } = Select;

const AccountList = () => {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const [loading, setLoading] = useState(false);
	const [accounts, setAccounts] = useState([]);
	const [searchText, setSearchText] = useState('');
	const [statusFilter, setStatusFilter] = useState([]);
	const [roleFilter, setRoleFilter] = useState([]);
	const [searchTimeout, setSearchTimeout] = useState(null);
	const [sortBy, setSortBy] = useState('createdAt');
	const [sortDir, setSortDir] = useState('desc');
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [editingAccount, setEditingAccount] = useState(null);
	const [form] = Form.useForm();
	const [confirmModal, setConfirmModal] = useState({
		visible: false,
		title: '',
		content: '',
		onConfirm: null,
	});

	// Filter dropdown state
	const [filterDropdown, setFilterDropdown] = useState({
		visible: false,
		selectedRoles: [],
		selectedStatuses: [],
	});

	// Refs for click outside detection
	const filterContainerRef = useRef(null);

	// Pagination state
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 10,
		total: 0,
		showSizeChanger: true,
		showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
	});
	
	// Separate pagination values for useEffect dependencies
	const currentPage = pagination.current;
	const pageSize = pagination.pageSize;

	const fetchAccounts = useCallback(
		async (
			page = 1,
			size = 10,
			search = '',
			roleFilter = [],
			statusFilter = [],
			sortField = 'createdAt',
			sortDirection = 'asc'
		) => {
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

				// Add roleName filter if provided (API expects array of strings)
				if (roleFilter && roleFilter.length > 0) {
					params.roleName = roleFilter;
				}

				// Add status filter if provided (API expects array of strings)
				if (statusFilter && statusFilter.length > 0) {
					params.status = statusFilter;
				}

				const response = await accountManagementApi.getAccounts({
					params: params,
				});

				// Map API response to component format
				const mappedAccounts = response.data.map((account) => ({
					id: account.id,
					username: account.userName,
					email: account.email,
					fullName: `${account.firstName} ${account.lastName}`.trim(),
					firstName: account.firstName,
					lastName: account.lastName,
					phone: account.phone || 'N/A',
					role: account.roleName,
					status: account.status,
					createdAt: new Date(account.createAt).toLocaleDateString(),
					lastLogin: account.lastLogin || null,
					avatar: null,
					mustChangePassword: account.mustChangePassword,
					requestResetPasswordByTeacher: account.requestResetPasswordByTeacher,
				}));

				setAccounts(mappedAccounts);
				setPagination((prev) => ({
					...prev,
					current: page,
					pageSize: size,
					total: response.totalElements,
				}));
				setLoading(false);
			} catch (error) {
				console.error('Error fetching accounts:', error);
				
				// Handle error messages from backend like LoginTeacher.jsx
				if (error.response) {
					const errorMessage = error.response.data.error || error.response.data.message;
					spaceToast.error(errorMessage);
				} else {
					message.error(t('accountManagement.loadAccountsError'));
				}
				setLoading(false);
			}
		},
		[t]
	);

	useEffect(() => {
		fetchAccounts(
			currentPage,
			pageSize,
			searchText,
			roleFilter,
			statusFilter,
			sortBy,
			sortDir
		);
	}, [
		fetchAccounts,
		searchText,
		roleFilter,
		statusFilter,
		sortBy,
		sortDir,
		currentPage,
		pageSize,
	]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
		};
	}, [searchTimeout]);

	// Handle click outside to close filter dropdown
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (filterDropdown.visible && filterContainerRef.current) {
				// Check if click is outside the filter container
				if (!filterContainerRef.current.contains(event.target)) {
					setFilterDropdown((prev) => ({
						...prev,
						visible: false,
					}));
				}
			}
		};

		// Add event listener when dropdown is visible
		if (filterDropdown.visible) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		// Cleanup event listener
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [filterDropdown.visible]);

	const handleSearch = (value) => {
		setSearchText(value);

		// Clear existing timeout
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		// Set new timeout for 2 second delay
		const newTimeout = setTimeout(() => {
			// Reset to first page when searching
			fetchAccounts(
				1,
				pagination.pageSize,
				value,
				roleFilter,
				statusFilter,
				sortBy,
				sortDir
			);
		}, 2000);

		setSearchTimeout(newTimeout);
	};

	// Handle filter dropdown toggle
	const handleFilterToggle = () => {
		setFilterDropdown((prev) => ({
			...prev,
			visible: !prev.visible,
			selectedRoles: prev.visible ? prev.selectedRoles : [...roleFilter],
			selectedStatuses: prev.visible
				? prev.selectedStatuses
				: [...statusFilter],
		}));
	};

	// Handle filter submission
	const handleFilterSubmit = () => {
		setRoleFilter(filterDropdown.selectedRoles);
		setStatusFilter(filterDropdown.selectedStatuses);
		setFilterDropdown((prev) => ({
			...prev,
			visible: false,
		}));
		// Reset to first page when applying filters
		setPagination(prev => ({
			...prev,
			current: 1,
		}));
	};

	// Handle filter reset
	const handleFilterReset = () => {
		setFilterDropdown((prev) => ({
			...prev,
			selectedRoles: [],
			selectedStatuses: [],
		}));
	};

	const handleTableChange = (pagination, filters, sorter) => {
		console.log('handleTableChange called:', { pagination, filters, sorter });
		console.log('Current sortBy:', sortBy, 'Current sortDir:', sortDir);
		
		// Handle sorting
		if (sorter && sorter.field) {
			// Map frontend field names to backend field names
			const fieldMapping = {
				'username': 'userName', // Keep original field name
				'email': 'email',
				'role': 'role',
				'status': 'status',
				'createdAt': 'createdAt'
			};
			
			const backendField = fieldMapping[sorter.field] || sorter.field;
			
			// Handle sorting direction - force toggle if same field
			let newSortDir;
			if (backendField === sortBy) {
				// Same field - toggle direction
				newSortDir = sortDir === 'asc' ? 'desc' : 'asc';
				console.log('Same field clicked, toggling from', sortDir, 'to', newSortDir);
			} else {
				// Different field - start with asc
				newSortDir = 'asc';
				console.log('Different field clicked, starting with asc');
			}

			console.log('Sorting:', {
				frontendField: sorter.field,
				backendField: backendField,
				direction: newSortDir,
				order: sorter.order
			});

			// Update state - useEffect will handle the API call
			setSortBy(backendField);
			setSortDir(newSortDir);
		} else {
			// Handle pagination without sorting change
			console.log('Pagination only, no sorting change');
			// Update pagination state - useEffect will handle the API call
			setPagination(prev => ({
				...prev,
				current: pagination.current,
				pageSize: pagination.pageSize,
			}));
		}
	};

	const handleAddAccount = () => {
		setEditingAccount(null);
		form.resetFields();
		setIsModalVisible(true);
	};

	const handleEditAccount = (record) => {
		setEditingAccount(record);

		// Set form values trực tiếp từ record
		form.setFieldsValue({
			firstName: record.firstName || '',
			lastName: record.lastName || '',
			email: record.email,
			roleName: record.role,
		});

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
						const response = await accountManagementApi.updateAccountStatus(id, newStatus);

						// Update local state
						setAccounts(
							accounts.map((a) =>
								a.id === id ? { ...a, status: newStatus } : a
							)
						);

						setConfirmModal({
							visible: false,
							title: '',
							content: '',
							onConfirm: null,
						});

						// Use backend message if available, otherwise fallback to translation
						const successMessage = response.message || 
							(newStatus === 'ACTIVE' 
								? `${t('accountManagement.activateAccountSuccess')} "${account.username}" ${t('accountManagement.success')}`
								: `${t('accountManagement.deactivateAccountSuccess')} "${account.username}" ${t('accountManagement.success')}`
							);
						spaceToast.success(successMessage);
					} catch (error) {
						console.error('Error updating account status:', error);
						
						// Handle error messages from backend like LoginTeacher.jsx
						if (error.response) {
							const errorMessage = error.response.data.error || error.response.data.message;
							spaceToast.error(errorMessage);
						} else {
							message.error(t('accountManagement.updateStatusError'));
						}
						
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


	const handleModalOk = async () => {
		try {
			const values = await form.validateFields();

			if (editingAccount) {
				// Update existing account - conditional data based on status
				let updateData;
				
				if (editingAccount.status === 'PENDING') {
					// PENDING status - only update email
					updateData = {
						email: values.email,
					};
				} else {
					// Non-PENDING status - update all fields
					updateData = {
						firstName: values.firstName,
						lastName: values.lastName,
						email: values.email,
						roleName: values.roleName || 'MANAGER',
					};
				}

				console.log('Updating account with data:', updateData);

				// Gọi API update account với params
				const response = await accountManagementApi.updateAccount(
					editingAccount.id,
					updateData
				);
				console.log('Update account response:', response);

				// Use backend message if available, otherwise fallback to translation
				const successMessage = response.message || t('accountManagement.updateAccountSuccess');
				spaceToast.success(successMessage);

				// Đồng bộ lại dữ liệu sau khi cập nhật
				fetchAccounts(
					pagination.current,
					pagination.pageSize,
					searchText,
					roleFilter,
					statusFilter,
					sortBy,
					sortDir
				);
			} else {
				// Create new account - chỉ cần email và roleName
				const accountData = {
					email: values.email,
					roleName: values.roleName,
				};

				console.log('Creating account with data:', accountData);

				// Gọi API create account
				const response = await accountManagementApi.createAccount(accountData);
				console.log('Create account response:', response);

				// Use backend message if available, otherwise fallback to translation
				const successMessage = response.message || t('accountManagement.addAccountSuccess');
				spaceToast.success(successMessage);

				// Đồng bộ lại dữ liệu sau khi thêm mới
				fetchAccounts(
					pagination.current,
					pagination.pageSize,
					searchText,
					roleFilter,
					statusFilter,
					sortBy,
					sortDir
				);
			}

			setIsModalVisible(false);
			form.resetFields();
		} catch (error) {
			console.error('Error saving account:', error);
			
			// Handle error messages from backend like LoginTeacher.jsx
			if (error.response) {
				const errorMessage = error.response.data.error || error.response.data.message;
				spaceToast.error(errorMessage);
			} else {
				message.error(t('accountManagement.checkInfoError'));
			}
		}
	};

	const handleModalCancel = () => {
		setIsModalVisible(false);
		form.resetFields();
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

	// Status options for filter
	const statusOptions = [
		{ key: 'ACTIVE', label: t('accountManagement.active') },
		{ key: 'INACTIVE', label: t('accountManagement.inactive') },
		{ key: 'PENDING', label: t('accountManagement.pending') },
	];

	// Role options for filter
	const roleOptions = [
		{ key: 'ADMIN', label: t('accountManagement.admin') },
		{ key: 'TEACHER', label: t('accountManagement.teacher') },
		{ key: 'STUDENT', label: t('accountManagement.student') },
		{ key: 'MANAGER', label: t('accountManagement.manager') },
		{
			key: 'TEACHING_ASSISTANT',
			label: t('accountManagement.teacherAssistant'),
		},
		{ key: 'TEST_TAKER', label: t('accountManagement.testTaker') },
	];
	console.log(theme);

	// No need for client-side filtering since API handles filtering

	const columns = [
		{
			title: t('accountManagement.stt'),
			key: 'index',
			width: 80,
			align: 'center',
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
			width: 150,
			sorter: true,
		},
		{
			title: t('accountManagement.email'),
			dataIndex: 'email',
			key: 'email',
			width: 250,
			render: (email) => (
				<Space>
					<MailOutlined />
					<span style={{ wordBreak: 'break-all' }}>{email}</span>
				</Space>
			),
		},
		{
			title: t('accountManagement.role'),
			dataIndex: 'role',
			key: 'role',
			width: 120,
			align: 'center',
			render: (role) => getRoleTag(role),
		},
		{
			title: t('accountManagement.status'),
			dataIndex: 'status',
			key: 'status',
			width: 150,
			align: 'center',
			render: (status, record) => {
				if (status === 'PENDING') {
					return <span style={{ color: '#000' }}>{t('accountManagement.pending')}</span>;
				}
				return (
					<Switch
						checked={status === 'ACTIVE'}
						onChange={() => handleToggleStatus(record.id)}
						checkedChildren={t('accountManagement.active')}
						unCheckedChildren={t('accountManagement.inactive')}
						size="large"
						style={{
							backgroundColor: status === 'ACTIVE' ? '#52c41a' : '#ff4d4f',
							transform: 'scale(1.2)',
						}}
					/>
				);
			},
		},
		{
			title: t('accountManagement.actions'),
			key: 'actions',
			width: 120,
			align: 'center',
			render: (_, record) => (
				<Space size='small'>
					{/* Only show edit button for MANAGER/ADMIN roles and PENDING status */}
					{(record.role === 'MANAGER' || record.role === 'ADMIN') && record.status === 'PENDING' && (
						<Tooltip title={t('accountManagement.edit')}>
							<Button
								type='text'
								icon={<EditOutlined style={{ fontSize: '26px' }} />}
								size='large'
								onClick={() => handleEditAccount(record)}
								style={{
									width: '32px',
									height: '32px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center'
								}}
							/>
						</Tooltip>
					)}
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
					<div
						className='search-section'
						style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
						<Input
							prefix={<SearchOutlined />}
							value={searchText}
							onChange={(e) => handleSearch(e.target.value)}
							className={`search-input ${theme}-search-input`}
							style={{
								flex: '1',
								minWidth: '200px',
								maxWidth: '320px',
								width: '280px',
								height: '36px',
								fontSize: '14px',
							}}
							allowClear
						/>
						<div ref={filterContainerRef} style={{ position: 'relative' }}>
							<Button
								icon={<FilterOutlined />}
								onClick={handleFilterToggle}
								className={`filter-button ${theme}-filter-button ${
									filterDropdown.visible ? 'active' : ''
								} ${
									statusFilter.length > 0 || roleFilter.length > 0
										? 'has-filters'
										: ''
								}`}>
								{t('accountManagement.filter')}
							</Button>

							{/* Filter Dropdown Panel */}
							{filterDropdown.visible && (
								<div
									className={`filter-dropdown-panel ${theme}-filter-dropdown`}>
									<div style={{ padding: '16px' }}>
										{/* Role and Status Filters in same row */}
										<div
											style={{
												display: 'flex',
												gap: '16px',
												marginBottom: '16px',
											}}>
											{/* Role Filter */}
											<div style={{ flex: 1 }}>
												<Typography.Title
													level={5}
													style={{
														marginBottom: '10px',
														fontSize: '15px',
													}}>
													{t('accountManagement.role')}
												</Typography.Title>
												<div
													style={{
														display: 'flex',
														flexWrap: 'wrap',
														gap: '8px',
													}}>
													{roleOptions.map((option) => (
														<Button
															key={option.key}
															onClick={() => {
																const newRoles =
																	filterDropdown.selectedRoles.includes(
																		option.key
																	)
																		? filterDropdown.selectedRoles.filter(
																				(role) => role !== option.key
																		  )
																		: [
																				...filterDropdown.selectedRoles,
																				option.key,
																		  ];
																setFilterDropdown((prev) => ({
																	...prev,
																	selectedRoles: newRoles,
																}));
															}}
															className={`filter-option ${
																filterDropdown.selectedRoles.includes(
																	option.key
																)
																	? 'selected'
																	: ''
															}`}>
															{option.label}
														</Button>
													))}
												</div>
											</div>

											{/* Status Filter */}
											<div style={{ flex: 1 }}>
												<Typography.Title
													level={5}
													style={{
														marginBottom: '10px',
														fontSize: '15px',
													}}>
													{t('accountManagement.status')}
												</Typography.Title>
												<div
													style={{
														display: 'flex',
														flexWrap: 'wrap',
														gap: '8px',
													}}>
													{statusOptions.map((option) => (
														<Button
															key={option.key}
															onClick={() => {
																const newStatuses =
																	filterDropdown.selectedStatuses.includes(
																		option.key
																	)
																		? filterDropdown.selectedStatuses.filter(
																				(status) => status !== option.key
																		  )
																		: [
																				...filterDropdown.selectedStatuses,
																				option.key,
																		  ];
																setFilterDropdown((prev) => ({
																	...prev,
																	selectedStatuses: newStatuses,
																}));
															}}
															className={`filter-option ${
																filterDropdown.selectedStatuses.includes(
																	option.key
																)
																	? 'selected'
																	: ''
															}`}>
															{option.label}
														</Button>
													))}
												</div>
											</div>
										</div>

										{/* Action Buttons */}
										<div
											style={{
												display: 'flex',
												justifyContent: 'space-between',
												marginTop: '16px',
												paddingTop: '12px',
												borderTop: '1px solid #f0f0f0',
											}}>
											<Button
												onClick={handleFilterReset}
												className='filter-reset-button'>
												{t('accountManagement.reset')}
											</Button>
											<Button
												type='primary'
												onClick={handleFilterSubmit}
												className='filter-submit-button'>
												{t('accountManagement.viewResults')}
											</Button>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
					<div className='action-buttons'>
						<Button
							icon={<PlusOutlined />}
							className={`create-button ${theme}-create-button`}
							onClick={handleAddAccount}>
							{t('accountManagement.createAccount')}
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
							scroll={{ x: 1000 }}
							className={`account-table ${theme}-account-table`}
							sortDirections={['ascend', 'descend']}
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
							? editingAccount.status === 'PENDING'
								? t('accountManagement.editPendingAccount')
								: t('accountManagement.editAccount')
							: t('accountManagement.addNewAccount')}
					</div>
				}
				open={isModalVisible}
				onCancel={handleModalCancel}
				width={600}
				footer={[
					<Button 
						key="cancel" 
						onClick={handleModalCancel}
						style={{
							height: '32px',
							fontWeight: '500',
							fontSize: '14px',
							padding: '4px 15px',
							width: '100px'
						}}>
						{t('common.cancel')}
					</Button>,
					<Button 
						key="save" 
						type="primary" 
						onClick={handleModalOk}
						style={{
							background: theme === 'sun' ? '#298EFE' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
							borderColor: theme === 'sun' ? '#298EFE' : '#7228d9',
							color: '#fff',
							borderRadius: '6px',
							height: '32px',
							fontWeight: '500',
							fontSize: '14px',
							padding: '4px 15px',
							width: '100px',
							transition: 'all 0.3s ease',
							boxShadow: 'none'
						}}
						onMouseEnter={(e) => {
							if (theme === 'sun') {
								e.target.style.background = '#1a7ce8';
								e.target.style.borderColor = '#1a7ce8';
								e.target.style.transform = 'translateY(-1px)';
								e.target.style.boxShadow = '0 4px 12px rgba(41, 142, 254, 0.4)';
							} else {
								e.target.style.background = 'linear-gradient(135deg, #5a1fb8 0%, #8a7aff 100%)';
								e.target.style.borderColor = '#5a1fb8';
								e.target.style.transform = 'translateY(-1px)';
								e.target.style.boxShadow = '0 4px 12px rgba(114, 40, 217, 0.4)';
							}
						}}
						onMouseLeave={(e) => {
							if (theme === 'sun') {
								e.target.style.background = '#298EFE';
								e.target.style.borderColor = '#298EFE';
								e.target.style.transform = 'translateY(0)';
								e.target.style.boxShadow = 'none';
							} else {
								e.target.style.background = 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)';
								e.target.style.borderColor = '#7228d9';
								e.target.style.transform = 'translateY(0)';
								e.target.style.boxShadow = 'none';
							}
						}}>
						{t('common.save')}
					</Button>
				]}>
				<Form
					form={form}
					layout='vertical'
					initialValues={{
						roleName: editingAccount ? editingAccount.role : undefined,
					}}>
					{editingAccount ? (
						// Edit mode - conditional fields based on status
						editingAccount.status === 'PENDING' ? (
							// PENDING status - only show email field
							<Row gutter={16}>
								<Col span={24}>
									<Form.Item
										label={t('accountManagement.email')}
										name='email'>
										<Input placeholder={t('accountManagement.emailPlaceholder')} />
									</Form.Item>
								</Col>
							</Row>
						) : (
							// Non-PENDING status - show all fields
							<>
								<Row gutter={16}>
									<Col span={12}>
										<Form.Item
											label={t('accountManagement.firstName')}
											name='firstName'>
											<Input
												placeholder={t('accountManagement.firstNamePlaceholder')}
											/>
										</Form.Item>
									</Col>
									<Col span={12}>
										<Form.Item
											label={t('accountManagement.lastName')}
											name='lastName'>
											<Input
												placeholder={t('accountManagement.lastNamePlaceholder')}
											/>
										</Form.Item>
									</Col>
								</Row>

								<Row gutter={16}>
									<Col span={12}>
										<Form.Item
											label={t('accountManagement.email')}
											name='email'>
											<Input placeholder={t('accountManagement.emailPlaceholder')} />
										</Form.Item>
									</Col>
									<Col span={12}>
										<Form.Item
											label={t('accountManagement.role')}
											name='roleName'>
											<Select value='MANAGER' disabled style={{ color: '#666' }}>
												<Option value='MANAGER'>
													{t('accountManagement.manager')}
												</Option>
											</Select>
										</Form.Item>
									</Col>
								</Row>
							</>
						)
					) : (
						// Create mode - only email and roleName
						<Row gutter={16}>
							<Col span={12}>
								<Form.Item
									label={t('accountManagement.email')}
									name='email'>
									<Input placeholder={t('accountManagement.emailPlaceholder')} />
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item
									label={t('accountManagement.role')}
									name='roleName'>
									<Select placeholder={t('accountManagement.selectRole')}>
										<Option value='ADMIN'>
											{t('accountManagement.admin')}
										</Option>
										<Option value='MANAGER'>
											{t('accountManagement.manager')}
										</Option>
									</Select>
								</Form.Item>
							</Col>
						</Row>
					)}
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
				onCancel={handleConfirmCancel}
				width={400}
				centered
				bodyStyle={{
					padding: '24px 32px',
					fontSize: '14px',
					lineHeight: '1.6',
					textAlign: 'center',
				}}
				footer={[
					<Button 
						key="cancel" 
						onClick={handleConfirmCancel}
						style={{
							height: '28px',
							fontWeight: '500',
							fontSize: '13px',
							padding: '4px 12px',
							width: '80px'
						}}>
						{t('common.cancel')}
					</Button>,
					<Button 
						key="confirm" 
						type="primary" 
						onClick={confirmModal.onConfirm}
						style={{
							background: theme === 'sun' ? '#298EFE' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
							borderColor: theme === 'sun' ? '#298EFE' : '#7228d9',
							color: '#fff',
							borderRadius: '5px',
							height: '28px',
							fontWeight: '500',
							fontSize: '13px',
							padding: '4px 12px',
							width: '80px',
							transition: 'all 0.3s ease',
							boxShadow: 'none'
						}}
						onMouseEnter={(e) => {
							if (theme === 'sun') {
								e.target.style.background = '#1a7ce8';
								e.target.style.borderColor = '#1a7ce8';
								e.target.style.transform = 'translateY(-1px)';
								e.target.style.boxShadow = '0 4px 12px rgba(41, 142, 254, 0.4)';
							} else {
								e.target.style.background = 'linear-gradient(135deg, #5a1fb8 0%, #8a7aff 100%)';
								e.target.style.borderColor = '#5a1fb8';
								e.target.style.transform = 'translateY(-1px)';
								e.target.style.boxShadow = '0 4px 12px rgba(114, 40, 217, 0.4)';
							}
						}}
						onMouseLeave={(e) => {
							if (theme === 'sun') {
								e.target.style.background = '#298EFE';
								e.target.style.borderColor = '#298EFE';
								e.target.style.transform = 'translateY(0)';
								e.target.style.boxShadow = 'none';
							} else {
								e.target.style.background = 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)';
								e.target.style.borderColor = '#7228d9';
								e.target.style.transform = 'translateY(0)';
								e.target.style.boxShadow = 'none';
							}
						}}>
						{t('common.confirm')}
					</Button>
				]}>
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

		</ThemedLayout>
	);
};

export default AccountList;
