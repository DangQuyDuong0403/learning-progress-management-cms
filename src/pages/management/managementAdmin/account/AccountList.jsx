import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  message,
  Card,
  Row,
  Col,
  Select,
  Tooltip,
  Modal,
  Form,
  Avatar,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  ImportOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CheckOutlined,
  StopOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import { useTheme } from "../../../../contexts/ThemeContext";
import "./AccountList.css";
import { spaceToast } from "../../../../component/SpaceToastify";

const { Option } = Select;
const { TextArea } = Input;

// Mock data - thay thế bằng API call thực tế
const mockAccounts = [
  {
    id: 1,
    username: "admin001",
    email: "admin001@example.com",
    fullName: "Nguyễn Văn Admin",
    phone: "0123456789",
    role: "Admin",
    status: "active",
    createdAt: "2024-01-15",
    lastLogin: "2024-01-20 10:30:00",
    avatar: null,
  },
  {
    id: 2,
    username: "teacher001",
    email: "teacher001@example.com",
    fullName: "Trần Thị Giáo Viên",
    phone: "0987654321",
    role: "Teacher",
    status: "active",
    createdAt: "2024-01-16",
    lastLogin: "2024-01-19 15:45:00",
    avatar: null,
  },
  {
    id: 3,
    username: "student001",
    email: "student001@example.com",
    fullName: "Lê Văn Học Sinh",
    phone: "0369852147",
    role: "Student",
    status: "inactive",
    createdAt: "2024-01-17",
    lastLogin: "2024-01-18 09:20:00",
    avatar: null,
  },
  {
    id: 4,
    username: "manager001",
    email: "manager001@example.com",
    fullName: "Phạm Thị Quản Lý",
    phone: "0741852963",
    role: "Manager",
    status: "active",
    createdAt: "2024-01-18",
    lastLogin: "2024-01-20 14:15:00",
    avatar: null,
  },
];

const AccountList = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [form] = Form.useForm();
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    content: '',
    onConfirm: null
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

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
  };

  const handleRoleFilter = (value) => {
    setRoleFilter(value);
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
    const account = accounts.find(a => a.id === id);
    if (account) {
      const newStatus = account.status === 'active' ? 'inactive' : 'active';
      const actionText = newStatus === 'active' ? t('accountManagement.active') : t('accountManagement.inactive');
      
      setConfirmModal({
        visible: true,
        title: t('accountManagement.changeStatus'),
        content: `${t('accountManagement.confirmStatusChange')} ${actionText} ${t('accountManagement.account')} "${account.username}"?`,
        onConfirm: () => {
          setAccounts(accounts.map(a => 
            a.id === id ? { ...a, status: newStatus } : a
          ));
          setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
          
          // Show success message
          if (newStatus === 'active') {
            spaceToast.success(`${t('accountManagement.activateAccountSuccess')} "${account.username}" ${t('accountManagement.success')}`);
          } else {
            spaceToast.success(`${t('accountManagement.deactivateAccountSuccess')} "${account.username}" ${t('accountManagement.success')}`);
          }
        }
      });
    }
  };

  const handleConfirmCancel = () => {
    setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning(t('accountManagement.selectAccountsToDelete'));
      return;
    }

    Modal.confirm({
      title: t('accountManagement.confirmDelete'),
      content: `${t('accountManagement.confirmDeleteMessage')} ${selectedRowKeys.length} ${t('accountManagement.selectedAccounts')}`,
      onOk: () => {
        setAccounts(
          accounts.filter((account) => !selectedRowKeys.includes(account.id))
        );
        setSelectedRowKeys([]);
        message.success(t('accountManagement.deleteAccountSuccess'));
      },
    });
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
          createdAt: new Date().toISOString().split("T")[0],
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
      active: { color: "green", text: t('accountManagement.active') },
      inactive: { color: "red", text: t('accountManagement.inactive') },
      pending: { color: "orange", text: t('accountManagement.pending') },
    };

    const config = statusConfig[status] || statusConfig.inactive;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getRoleTag = (role) => {
    const roleConfig = {
      Admin: { color: "purple" },
      Teacher: { color: "blue" },
      Student: { color: "cyan" },
      Manager: { color: "gold" },
    };

    const config = roleConfig[role] || { color: "default" };
    const roleTranslations = {
      Admin: t('accountManagement.admin'),
      Teacher: t('accountManagement.teacher'),
      Student: t('accountManagement.student'),
      Manager: t('accountManagement.manager'),
    };
    
    return <Tag color={config.color}>{roleTranslations[role] || role}</Tag>;
  };

  // Filter data based on search and filters
  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      searchText === "" ||
      account.username.toLowerCase().includes(searchText.toLowerCase()) ||
      account.email.toLowerCase().includes(searchText.toLowerCase()) ||
      account.fullName.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || account.status === statusFilter;
    const matchesRole = roleFilter === "all" || account.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const columns = [
    {
      title: t('accountManagement.username'),
      dataIndex: "username",
      key: "username",
      sorter: (a, b) => a.username.localeCompare(b.username),
    },
    {
      title: t('accountManagement.fullName'),
      dataIndex: "fullName",
      key: "fullName",
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
    },
    {
      title: t('accountManagement.email'),
      dataIndex: "email",
      key: "email",
      render: (email) => (
        <Space>
          <MailOutlined />
          {email}
        </Space>
      ),
    },
    {
      title: t('accountManagement.phone'),
      dataIndex: "phone",
      key: "phone",
      render: (phone) => (
        <Space>
          <PhoneOutlined />
          {phone}
        </Space>
      ),
    },
    {
      title: t('accountManagement.role'),
      dataIndex: "role",
      key: "role",
      render: (role) => getRoleTag(role),
      filters: [
        { text: t('accountManagement.admin'), value: "Admin" },
        { text: t('accountManagement.teacher'), value: "Teacher" },
        { text: t('accountManagement.student'), value: "Student" },
        { text: t('accountManagement.manager'), value: "Manager" },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: t('accountManagement.status'),
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status),
      filters: [
        { text: t('accountManagement.active'), value: "active" },
        { text: t('accountManagement.inactive'), value: "inactive" },
        { text: t('accountManagement.pending'), value: "pending" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: t('accountManagement.createdAt'),
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: t('accountManagement.lastLogin'),
      dataIndex: "lastLogin",
      key: "lastLogin",
      render: (lastLogin) => lastLogin || t('accountManagement.neverLoggedIn'),
    },
    {
      title: t('accountManagement.actions'),
      key: "actions",
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('accountManagement.edit')}>
            <Button
              type="text"
              icon={<EditOutlined style={{ fontSize: '25px' }} />}
              size="small"
              onClick={() => handleEditAccount(record)}
            />
          </Tooltip>
          <Tooltip title={record.status === 'active' ? t('accountManagement.deactivate') : t('accountManagement.activate')}>
            <Button
              type="text"
              icon={record.status === 'active' ? <StopOutlined style={{ fontSize: '25px' }} /> : <CheckOutlined style={{ fontSize: '25px' }} />}
              size="small"
              onClick={() => handleToggleStatus(record.id)}
              style={{
                color: record.status === 'active' ? '#ff4d4f' : '#52c41a',
                padding: '4px 8px'
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <ThemedLayout>
        {/* Main Content Panel */}
        <div className={`main-content-panel ${theme}-main-panel`}>
          {/* Header Section */}
          <div className={`panel-header ${theme}-panel-header`}>
            <div className="search-section">
              <Input
                placeholder="Search..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                className={`search-input ${theme}-search-input`}
                allowClear
              />
            </div>
            <div className="action-buttons">
              <Button 
                icon={<DownloadOutlined />}
                className={`export-button ${theme}-export-button`}
              >
                Export Data
              </Button>
              <Button 
                icon={<PlusOutlined />}
                className={`create-button ${theme}-create-button`}
                onClick={handleAddAccount}
              >
                Create Account
              </Button>
            </div>
          </div>

          {/* Table Section */}
          <div className={`table-section ${theme}-table-section`}>
            <LoadingWithEffect loading={loading} message={t('accountManagement.loadingAccounts')}>
              <Table
                columns={columns}
                dataSource={filteredAccounts}
                rowKey="id"
                pagination={{
                  total: filteredAccounts.length,
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total}`,
                  className: `${theme}-pagination`
                }}
                scroll={{ x: 1200 }}
                className={`account-table ${theme}-account-table`}
              />
            </LoadingWithEffect>
          </div>
        </div>


        {/* Add/Edit Modal */}
        <Modal
          title={editingAccount ? t('accountManagement.editAccount') : t('accountManagement.addNewAccount')}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={600}
          okText={t('common.save')}
          cancelText={t('common.cancel')}
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              status: "active",
              role: "Student",
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={t('accountManagement.username')}
                  name="username"
                  rules={[
                    { required: true, message: t('accountManagement.usernameRequired') },
                    {
                      min: 3,
                      message: t('accountManagement.usernameMinLength'),
                    },
                  ]}
                >
                  <Input placeholder={t('accountManagement.usernamePlaceholder')} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={t('accountManagement.email')}
                  name="email"
                  rules={[
                    { required: true, message: t('accountManagement.emailRequired') },
                    { type: "email", message: t('accountManagement.emailInvalid') },
                  ]}
                >
                  <Input placeholder={t('accountManagement.emailPlaceholder')} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={t('accountManagement.fullName')}
                  name="fullName"
                  rules={[
                    { required: true, message: t('accountManagement.fullNameRequired') },
                  ]}
                >
                  <Input placeholder={t('accountManagement.fullNamePlaceholder')} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={t('accountManagement.phone')}
                  name="phone"
                  rules={[
                    { required: true, message: t('accountManagement.phoneRequired') },
                    {
                      pattern: /^[0-9]{10,11}$/,
                      message: t('accountManagement.phoneInvalid'),
                    },
                  ]}
                >
                  <Input placeholder={t('accountManagement.phonePlaceholder')} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={t('accountManagement.role')}
                  name="role"
                  rules={[
                    { required: true, message: t('accountManagement.roleRequired') },
                  ]}
                >
                  <Select placeholder={t('accountManagement.selectRole')}>
                    <Option value="Admin">{t('accountManagement.admin')}</Option>
                    <Option value="Teacher">{t('accountManagement.teacher')}</Option>
                    <Option value="Student">{t('accountManagement.student')}</Option>
                    <Option value="Manager">{t('accountManagement.manager')}</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={t('accountManagement.status')}
                  name="status"
                  rules={[
                    { required: true, message: t('accountManagement.statusRequired') },
                  ]}
                >
                  <Select placeholder={t('accountManagement.selectStatus')}>
                    <Option value="active">{t('accountManagement.active')}</Option>
                    <Option value="inactive">{t('accountManagement.inactive')}</Option>
                    <Option value="pending">{t('accountManagement.pending')}</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {!editingAccount && (
              <Form.Item
                label={t('accountManagement.password')}
                name="password"
                rules={[
                  { required: true, message: t('accountManagement.passwordRequired') },
                  { min: 6, message: t('accountManagement.passwordMinLength') },
                ]}
              >
                <Input.Password placeholder={t('accountManagement.passwordPlaceholder')} />
              </Form.Item>
            )}

            <Form.Item label={t('accountManagement.note')} name="note">
              <TextArea rows={3} placeholder={t('accountManagement.notePlaceholder')} />
            </Form.Item>
          </Form>
        </Modal>

        {/* Confirmation Modal */}
        <Modal
          title={
            <div style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#1890ff',
              textAlign: 'center',
              padding: '10px 0'
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
            textAlign: 'center'
          }}
          okButtonProps={{
            style: {
              backgroundColor: '#ff4d4f',
              borderColor: '#ff4d4f',
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
              {confirmModal.content}
            </p>
       
          </div>
        </Modal>
    </ThemedLayout>
  );
};

export default AccountList;
