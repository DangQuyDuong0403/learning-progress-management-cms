import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import usePageTitle from '../../../../hooks/usePageTitle';
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
	EyeOutlined,
	DeleteOutlined,
} from '@ant-design/icons';
import ThemedLayout from '../../../../component/ThemedLayout';
import LoadingWithEffect from '../../../../component/spinner/LoadingWithEffect';
import { useTheme } from '../../../../contexts/ThemeContext';
import './AccountList.css';
import { spaceToast } from '../../../../component/SpaceToastify';
import accountManagementApi from '../../../../apis/backend/accountManagement';
import { useSelector } from 'react-redux';

const { Option } = Select;

const renderRequiredLabel = (label) => (
	<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
		<span>{label}</span>
		<span style={{ color: '#ef4444' }}>*</span>
	</span>
);

const AccountList = () => {
	const { t } = useTranslation();
	const { theme } = useTheme();
	
	// Set page title
	usePageTitle('Account Management');
	// Get current user info from Redux store
	const currentUser = useSelector(state => state.auth.user);
	const currentUserId = currentUser?.id;
	
	const [loading, setLoading] = useState(false);
	const [accounts, setAccounts] = useState([]);
	const [totalElements, setTotalElements] = useState(0);
	const [searchText, setSearchText] = useState('');
	const [searchValue, setSearchValue] = useState(''); // Actual search value used for API calls
	const [statusFilter, setStatusFilter] = useState([]);
	const [roleFilter, setRoleFilter] = useState([]);
	const [searchTimeout, setSearchTimeout] = useState(null);
	const [sortBy, setSortBy] = useState('createdAt');
	const [sortDir, setSortDir] = useState('desc');
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [editingAccount, setEditingAccount] = useState(null);
	const [form] = Form.useForm();
	const [isButtonDisabled, setIsButtonDisabled] = useState(false);
	const [viewDetailModal, setViewDetailModal] = useState({
		visible: false,
		account: null,
		loading: false,
	});
	const [confirmModal, setConfirmModal] = useState({
		visible: false,
		title: '',
		content: '',
		onConfirm: null,
	});
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
	const [deleteAccount, setDeleteAccount] = useState(null);

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
				setTotalElements(response.totalElements);
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

	// Initial load effect - only runs on mount and when non-search dependencies change
	useEffect(() => {
		fetchAccounts(
			currentPage,
			pageSize,
			searchValue,
			roleFilter,
			statusFilter,
			sortBy,
			sortDir
		);
	}, [
		fetchAccounts,
		searchValue,
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

	const emailRules = useMemo(
		() => [
			{ required: true, message: t('accountManagement.emailRequired') },
			{ type: 'email', message: t('accountManagement.emailInvalid') },
			{
				validator: (_, value) => {
					if (!value) return Promise.resolve();
					const normalized = value.trim().toLowerCase();
					if (normalized.endsWith('.com.com')) {
						return Promise.reject(new Error(t('accountManagement.emailInvalid')));
					}
					return Promise.resolve();
				},
			},
		],
		[t]
	);

	const handleSearch = (value) => {
		setSearchText(value);

		// Clear existing timeout
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		// Set new timeout for 2 second delay
		const newTimeout = setTimeout(() => {
			// Update searchValue which will trigger useEffect
			setSearchValue(value);
			// Reset to first page when searching
			setPagination(prev => ({
				...prev,
				current: 1,
			}));
		}, 1000);

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

	const handleViewAccountDetails = async (record) => {
		setViewDetailModal({
			visible: true,
			account: null,
			loading: true,
		});

		try {
			// Call API to get account details
			const response = await accountManagementApi.getAccountById(record.id);
			
			setViewDetailModal({
				visible: true,
				account: response.data,
				loading: false,
			});
		} catch (error) {
			console.error('Error fetching account details:', error);
			
			// Handle error messages from backend
			if (error.response) {
				const errorMessage = error.response.data.error || error.response.data.message;
				spaceToast.error(errorMessage);
			} else {
				message.error(t('accountManagement.loadAccountDetailsError'));
			}
			
			setViewDetailModal({
				visible: false,
				account: null,
				loading: false,
			});
		}
	};

	const handleCloseViewDetailModal = () => {
		setViewDetailModal({
			visible: false,
			account: null,
			loading: false,
		});
	};

	const handleDeleteAccount = (record) => {
		setDeleteAccount(record);
		setIsDeleteModalVisible(true);
	};

	const handleDeleteConfirm = async () => {
		try {
			// Call delete account API
			const response = await accountManagementApi.deleteAccount(deleteAccount.id);
			
			// Update local state
			setAccounts(accounts.filter(account => account.id !== deleteAccount.id));
			setTotalElements(prev => prev - 1);
			
			// Use backend message if available, otherwise fallback to translation
			const successMessage = response.message;
			spaceToast.success(successMessage);
			
			setIsDeleteModalVisible(false);
			setDeleteAccount(null);
		} catch (error) {
			console.error('Error deleting account:', error);
			
			// Handle error message from backend
			let errorMessage = error.response?.data?.error || 
				error.response?.data?.message || 
				error.message ||
				t('accountManagement.deleteAccountError');
			
			spaceToast.error(errorMessage);
		}
	};

	const handleDeleteModalClose = () => {
		setIsDeleteModalVisible(false);
		setDeleteAccount(null);
	};

	const handleToggleStatus = (id) => {
		const account = accounts.find((a) => a.id === id);
		if (account) {
			// Check if trying to deactivate admin accounts
			if (account.role === 'ADMIN') {
				// Prevent deactivating own account
				if (account.id === currentUserId) {
					spaceToast.error(t('accountManagement.cannotDeactivateSelf'));
					return;
				}
				// Prevent deactivating other admin accounts
				spaceToast.error(t('accountManagement.cannotDeactivateAdmin'));
				return;
			}
			
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
		if (isButtonDisabled) return; // Prevent multiple submissions
		
		setIsButtonDisabled(true);
		
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
					searchValue,
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
					searchValue,
					roleFilter,
					statusFilter,
					sortBy,
					sortDir
				);

				// Mở modal view detail của tài khoản vừa tạo
				if (response.data && response.data.id) {
					setTimeout(() => {
						handleViewAccountDetails(response.data);
					}, 500); // Delay để đảm bảo toast message hiển thị trước
				}
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
		} finally {
			// Re-enable button after 0.5 seconds
			setTimeout(() => {
				setIsButtonDisabled(false);
			}, 500);
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
				
				// Check if switch should be disabled
				const isDisabled = record.role === 'ADMIN';
				
				return (
					<Switch
						checked={status === 'ACTIVE'}
						onChange={() => handleToggleStatus(record.id)}
						size="large"
						disabled={isDisabled}
						style={{
							transform: 'scale(1.2)',
							opacity: isDisabled ? 0.5 : 1,
						}}
					/>
				);
			},
		},
		{
			title: t('accountManagement.actions'),
			key: 'actions',
			width: 160,
			align: 'center',
			render: (_, record) => (
				<div style={{ 
					display: 'flex', 
					alignItems: 'center', 
					justifyContent: 'center',
					gap: '8px'
				}}>
					{/* View details button - always visible */}
					<Tooltip title={t('accountManagement.viewDetails')}>
						<Button
							type='text'
							icon={<EyeOutlined style={{ fontSize: '26px' }} />}
							size='large'
							onClick={() => handleViewAccountDetails(record)}
							style={{
								width: '32px',
								height: '32px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center'
							}}
						/>
					</Tooltip>
					{/* Only show edit button for MANAGER/ADMIN roles and PENDING status */}
					{(record.role === 'MANAGER' || record.role === 'ADMIN') && record.status === 'PENDING' ? (
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
					) : (
						<div style={{ width: '32px', height: '32px' }}></div>
					)}
					{/* Show delete button for PENDING status */}
					{record.status === 'PENDING' ? (
						<Tooltip title={t('accountManagement.delete')}>
							<Button
								type='text'
								icon={<DeleteOutlined style={{ fontSize: '26px', color: '#ff4d4f' }} />}
								size='large'
								onClick={() => handleDeleteAccount(record)}
								style={{
									width: '32px',
									height: '32px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center'
								}}
							/>
						</Tooltip>
					) : (
						<div style={{ width: '32px', height: '32px' }}></div>
					)}
				</div>
			),
		},
	];

	return (
		<ThemedLayout>
			{/* Main Content Panel */}
			<div className={`account-page ${theme}-theme main-content-panel`}>
				{/* Page Title */}
				<div className="page-title-container">
					<Typography.Title 
						level={1} 
						className="page-title"
					>
						{t('accountManagement.title')} <span className="student-count">({totalElements})</span>
					</Typography.Title>
				</div>
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
						message={t('common.loading')}>
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
							fontSize: '28px',
							fontWeight: '600',
							color: 'rgb(24, 144, 255)',
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
							fontSize: '16px',
							padding: '4px 15px',
							width: '100px'
						}}>
						{t('common.cancel')}
					</Button>,
					<Button 
						key="save" 
						type="primary" 
						onClick={handleModalOk}
						disabled={isButtonDisabled}
						style={{
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
						}}
						onMouseEnter={(e) => {
							if (theme === 'sun') {
								e.target.style.background = 'rgb(95, 160, 240)';
								e.target.style.borderColor = 'rgb(95, 160, 240)';
								e.target.style.transform = 'translateY(-1px)';
								e.target.style.boxShadow = '0 4px 12px rgba(113, 179, 253, 0.4)';
							} else {
								e.target.style.background = 'linear-gradient(135deg, #5a1fb8 0%, #8a7aff 100%)';
								e.target.style.borderColor = '#5a1fb8';
								e.target.style.transform = 'translateY(-1px)';
								e.target.style.boxShadow = '0 4px 12px rgba(114, 40, 217, 0.4)';
							}
						}}
						onMouseLeave={(e) => {
							if (theme === 'sun') {
								e.target.style.background = 'rgb(113, 179, 253)';
								e.target.style.borderColor = 'rgb(113, 179, 253)';
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
										label={renderRequiredLabel(t('accountManagement.email'))}
										name='email'
										rules={emailRules}
										required
									>
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
											label={renderRequiredLabel(t('accountManagement.firstName'))}
											name='firstName'
											rules={[{ required: true, message: t('accountManagement.firstNameRequired') }]}
											required
										>
											<Input
												placeholder={t('accountManagement.firstNamePlaceholder')}
											/>
										</Form.Item>
									</Col>
									<Col span={12}>
										<Form.Item
											label={renderRequiredLabel(t('accountManagement.lastName'))}
											name='lastName'
											rules={[{ required: true, message: t('accountManagement.lastNameRequired') }]}
											required
										>
											<Input
												placeholder={t('accountManagement.lastNamePlaceholder')}
											/>
										</Form.Item>
									</Col>
								</Row>

								<Row gutter={16}>
									<Col span={12}>
										<Form.Item
											label={renderRequiredLabel(t('accountManagement.email'))}
											name='email'
											rules={emailRules}
											required
										>
											<Input placeholder={t('accountManagement.emailPlaceholder')} />
										</Form.Item>
									</Col>
									<Col span={12}>
										<Form.Item
											label={renderRequiredLabel(t('accountManagement.role'))}
											name='roleName'
											rules={[{ required: true, message: t('accountManagement.roleRequired') }]}
											required
										>
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
									label={renderRequiredLabel(t('accountManagement.email'))}
									name='email'
									rules={emailRules}
									required
								>
									<Input placeholder={t('accountManagement.emailPlaceholder')} />
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item
									label={renderRequiredLabel(t('accountManagement.role'))}
									name='roleName'
									rules={[{ required: true, message: t('accountManagement.roleRequired') }]}
									required
								>
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
							fontSize: '28px',
							fontWeight: '600',
							color: 'rgb(24, 144, 255)',
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
							height: '32px',
							fontWeight: '500',
							fontSize: '16px',
							padding: '4px 15px',
							width: '100px'
						}}>
						{t('common.cancel')}
					</Button>,
					<Button 
						key="confirm" 
						type="primary" 
						onClick={confirmModal.onConfirm}
						style={{
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
						}}
						onMouseEnter={(e) => {
							if (theme === 'sun') {
								e.target.style.background = 'rgb(95, 160, 240)';
								e.target.style.borderColor = 'rgb(95, 160, 240)';
								e.target.style.transform = 'translateY(-1px)';
								e.target.style.boxShadow = '0 4px 12px rgba(113, 179, 253, 0.4)';
							} else {
								e.target.style.background = 'linear-gradient(135deg, #5a1fb8 0%, #8a7aff 100%)';
								e.target.style.borderColor = '#5a1fb8';
								e.target.style.transform = 'translateY(-1px)';
								e.target.style.boxShadow = '0 4px 12px rgba(114, 40, 217, 0.4)';
							}
						}}
						onMouseLeave={(e) => {
							if (theme === 'sun') {
								e.target.style.background = 'rgb(113, 179, 253)';
								e.target.style.borderColor = 'rgb(113, 179, 253)';
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

			{/* View Detail Modal */}
			<Modal
				title={
					<div
						style={{
							fontSize: '28px',
							fontWeight: '600',
							color: 'rgb(24, 144, 255)',
							textAlign: 'center',
							padding: '10px 0',
						}}>
						{t('accountManagement.viewAccountDetails')}
					</div>
				}
				open={viewDetailModal.visible}
				onCancel={handleCloseViewDetailModal}
				width={700}
				footer={[
					<Button 
						key="close" 
						type="primary" 
						onClick={handleCloseViewDetailModal}
						style={{
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
						}}
						onMouseEnter={(e) => {
							if (theme === 'sun') {
								e.target.style.background = 'rgb(95, 160, 240)';
								e.target.style.borderColor = 'rgb(95, 160, 240)';
								e.target.style.transform = 'translateY(-1px)';
								e.target.style.boxShadow = '0 4px 12px rgba(113, 179, 253, 0.4)';
							} else {
								e.target.style.background = 'linear-gradient(135deg, #5a1fb8 0%, #8a7aff 100%)';
								e.target.style.borderColor = '#5a1fb8';
								e.target.style.transform = 'translateY(-1px)';
								e.target.style.boxShadow = '0 4px 12px rgba(114, 40, 217, 0.4)';
							}
						}}
						onMouseLeave={(e) => {
							if (theme === 'sun') {
								e.target.style.background = 'rgb(113, 179, 253)';
								e.target.style.borderColor = 'rgb(113, 179, 253)';
								e.target.style.transform = 'translateY(0)';
								e.target.style.boxShadow = 'none';
							} else {
								e.target.style.background = 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)';
								e.target.style.borderColor = '#7228d9';
								e.target.style.transform = 'translateY(0)';
								e.target.style.boxShadow = 'none';
							}
						}}>
						{t('common.close')}
					</Button>
				]}>
				{viewDetailModal.loading ? (
					<div style={{ textAlign: 'center', padding: '40px' }}>
						<LoadingWithEffect
							loading={true}
							message={t('common.loading')}
						/>
					</div>
				) : viewDetailModal.account ? (
					<div style={{ padding: '20px 0' }}>
						<Row gutter={[24, 16]}>
							<Col span={12}>
								<div style={{ marginBottom: '16px' }}>
									<Typography.Text strong style={{ fontSize: '16px', color: '#666' }}>
										{t('accountManagement.username')}:
									</Typography.Text>
									<div style={{ fontSize: '18px', marginTop: '4px' }}>
										{viewDetailModal.account.userName || 'N/A'}
									</div>
								</div>
							</Col>
							<Col span={12}>
								<div style={{ marginBottom: '16px' }}>
									<Typography.Text strong style={{ fontSize: '16px', color: '#666' }}>
										{t('accountManagement.email')}:
									</Typography.Text>
									<div style={{ fontSize: '18px', marginTop: '4px' }}>
										{viewDetailModal.account.email || 'N/A'}
									</div>
								</div>
							</Col>
							<Col span={12}>
								<div style={{ marginBottom: '16px' }}>
									<Typography.Text strong style={{ fontSize: '16px', color: '#666' }}>
										{t('accountManagement.role')}:
									</Typography.Text>
									<div style={{ fontSize: '18px', marginTop: '4px' }}>
										{getRoleTag(viewDetailModal.account.roleName)}
									</div>
								</div>
							</Col>
							<Col span={12}>
								<div style={{ marginBottom: '16px' }}>
									<Typography.Text strong style={{ fontSize: '16px', color: '#666' }}>
										{t('accountManagement.status')}:
									</Typography.Text>
									<div style={{ fontSize: '18px', marginTop: '4px' }}>
										{viewDetailModal.account.status === 'ACTIVE' && (
											<span style={{ color: '#52c41a' }}>{t('accountManagement.active')}</span>
										)}
										{viewDetailModal.account.status === 'INACTIVE' && (
											<span style={{ color: '#ff4d4f' }}>{t('accountManagement.inactive')}</span>
										)}
										{viewDetailModal.account.status === 'PENDING' && (
											<span style={{ color: '#faad14' }}>{t('accountManagement.pending')}</span>
										)}
									</div>
								</div>
							</Col>
							<Col span={12}>
								<div style={{ marginBottom: '16px' }}>
									<Typography.Text strong style={{ fontSize: '16px', color: '#666' }}>
										{t('accountManagement.createdAt')}:
									</Typography.Text>
									<div style={{ fontSize: '18px', marginTop: '4px' }}>
										{viewDetailModal.account.createAt ? 
											new Date(viewDetailModal.account.createAt).toLocaleDateString() : 'N/A'}
									</div>
								</div>
							</Col>
						</Row>
					</div>
				) : (
					<div style={{ textAlign: 'center', padding: '40px' }}>
						<Typography.Text type="secondary">
							{t('accountManagement.noAccountData')}
						</Typography.Text>
					</div>
				)}
			</Modal>

			{/* Delete Confirmation Modal */}
			<Modal
				title={
					<div style={{ 
						fontSize: '28px', 
						fontWeight: '600', 
						color: 'rgb(24, 144, 255)',
						textAlign: 'center',
						padding: '10px 0'
					}}>
						{t('accountManagement.confirmDelete')}
					</div>
				}
				open={isDeleteModalVisible}
				onOk={handleDeleteConfirm}
				onCancel={handleDeleteModalClose}
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
						backgroundColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
						background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
						borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'transparent',
						color: theme === 'sun' ? '#000000' : '#ffffff',
						height: '40px',
						fontSize: '16px',
						fontWeight: '500',
						minWidth: '100px'
					}
				}}
				cancelButtonProps={{
					style: {
						height: '40px',
						fontSize: '16px',
						fontWeight: '500',
						minWidth: '100px'
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
						{t('accountManagement.confirmDeleteMessage')}
					</p>
					{deleteAccount && (
						<p style={{
							fontSize: '20px',
							color: '#000',
							margin: 0,
							fontWeight: '400'
						}}>
							<strong>{deleteAccount.username}</strong>
						</p>
					)}
				</div>
			</Modal>

		</ThemedLayout>
	);
};

export default AccountList;
