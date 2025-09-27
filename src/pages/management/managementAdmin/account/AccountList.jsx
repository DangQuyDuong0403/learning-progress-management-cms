import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
  Select,
  Tooltip,
  Modal,
  Form,
  Avatar
} from 'antd';
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
  EyeOutlined
} from '@ant-design/icons';
import Layout from '../../../../component/Layout';
import './AccountList.css';

const { Option } = Select;
const { TextArea } = Input;

const AccountList = () => {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [form] = Form.useForm();

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
      avatar: null
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
      avatar: null
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
      avatar: null
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
      avatar: null
    }
  ];

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setAccounts(mockAccounts);
        setLoading(false);
      }, 1000);
    } catch (error) {
      message.error('Lỗi khi tải danh sách tài khoản');
      setLoading(false);
    }
  };

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

  const handleDeleteAccount = async (id) => {
    try {
      // API call để xóa tài khoản
      setAccounts(accounts.filter(account => account.id !== id));
      message.success('Xóa tài khoản thành công');
    } catch (error) {
      message.error('Lỗi khi xóa tài khoản');
    }
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Vui lòng chọn tài khoản cần xóa');
      return;
    }
    
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa ${selectedRowKeys.length} tài khoản đã chọn?`,
      onOk: () => {
        setAccounts(accounts.filter(account => !selectedRowKeys.includes(account.id)));
        setSelectedRowKeys([]);
        message.success('Xóa tài khoản thành công');
      }
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingAccount) {
        // Update existing account
        setAccounts(accounts.map(account => 
          account.id === editingAccount.id ? { ...account, ...values } : account
        ));
        message.success('Cập nhật tài khoản thành công');
      } else {
        // Add new account
        const newAccount = {
          id: Date.now(),
          ...values,
          createdAt: new Date().toISOString().split('T')[0],
          lastLogin: null
        };
        setAccounts([newAccount, ...accounts]);
        message.success('Thêm tài khoản thành công');
      }
      
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Vui lòng kiểm tra lại thông tin');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      active: { color: 'green', text: 'Hoạt động' },
      inactive: { color: 'red', text: 'Không hoạt động' },
      pending: { color: 'orange', text: 'Chờ duyệt' }
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getRoleTag = (role) => {
    const roleConfig = {
      Admin: { color: 'purple' },
      Teacher: { color: 'blue' },
      Student: { color: 'cyan' },
      Manager: { color: 'gold' }
    };
    
    const config = roleConfig[role] || { color: 'default' };
    return <Tag color={config.color}>{role}</Tag>;
  };

  // Filter data based on search and filters
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = searchText === '' || 
      account.username.toLowerCase().includes(searchText.toLowerCase()) ||
      account.email.toLowerCase().includes(searchText.toLowerCase()) ||
      account.fullName.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
    const matchesRole = roleFilter === 'all' || account.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const columns = [
    {
      title: 'Avatar',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (avatar, record) => (
        <Avatar 
          size={40} 
          icon={<UserOutlined />} 
          src={avatar}
          style={{ backgroundColor: '#1890ff' }}
        />
      )
    },
    {
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      key: 'username',
      sorter: (a, b) => a.username.localeCompare(b.username),
    },
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      key: 'fullName',
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => (
        <Space>
          <MailOutlined />
          {email}
        </Space>
      )
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => (
        <Space>
          <PhoneOutlined />
          {phone}
        </Space>
      )
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => getRoleTag(role),
      filters: [
        { text: 'Admin', value: 'Admin' },
        { text: 'Teacher', value: 'Teacher' },
        { text: 'Student', value: 'Student' },
        { text: 'Manager', value: 'Manager' }
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      filters: [
        { text: 'Hoạt động', value: 'active' },
        { text: 'Không hoạt động', value: 'inactive' },
        { text: 'Chờ duyệt', value: 'pending' }
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Đăng nhập cuối',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (lastLogin) => lastLogin || 'Chưa đăng nhập',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          {/* <Tooltip title="Xem chi tiết">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
            />
          </Tooltip> */}
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => handleEditAccount(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            {/* <Popconfirm
              title="Xác nhận xóa"
              description="Bạn có chắc chắn muốn xóa tài khoản này?"
              onConfirm={() => handleDeleteAccount(record.id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />} 
                size="small"
              />
            </Popconfirm> */}
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
    <Layout>
      <div className="account-list-container">
        {/* Header */}
        <Card className="header-card">
          <Row justify="space-between" align="middle">
            <Col>
              <h2 style={{ margin: 0, color: '#1890ff' }}>Quản lý tài khoản</h2>
              <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                Tổng cộng: {filteredAccounts.length} tài khoản
              </p>
            </Col>
            <Col>
              <Space>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={handleAddAccount}
                >
                  Thêm tài khoản
                </Button>
                <Button icon={<ExportOutlined />}>
                  Xuất Excel
                </Button>
                <Button icon={<ImportOutlined />}>
                  Nhập Excel
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Filters */}
        <Card className="filter-card">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8} lg={6}>
              <Input
                placeholder="Tìm kiếm theo tên, email..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Select
                placeholder="Lọc theo trạng thái"
                value={statusFilter}
                onChange={handleStatusFilter}
                style={{ width: '100%' }}
              >
                <Option value="all">Tất cả trạng thái</Option>
                <Option value="active">Hoạt động</Option>
                <Option value="inactive">Không hoạt động</Option>
                <Option value="pending">Chờ duyệt</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Select
                placeholder="Lọc theo vai trò"
                value={roleFilter}
                onChange={handleRoleFilter}
                style={{ width: '100%' }}
              >
                <Option value="all">Tất cả vai trò</Option>
                <Option value="Admin">Admin</Option>
                <Option value="Teacher">Teacher</Option>
                <Option value="Student">Student</Option>
                <Option value="Manager">Manager</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Space>
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={fetchAccounts}
                  loading={loading}
                >
                  Làm mới
                </Button>
                {selectedRowKeys.length > 0 && (
                  <Button 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={handleBatchDelete}
                  >
                    Xóa ({selectedRowKeys.length})
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={filteredAccounts}
            rowKey="id"
            loading={loading}
            rowSelection={rowSelection}
            pagination={{
              total: filteredAccounts.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} của ${total} tài khoản`,
            }}
            scroll={{ x: 1200 }}
          />
        </Card>

        {/* Add/Edit Modal */}
        <Modal
          title={editingAccount ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={600}
          okText="Lưu"
          cancelText="Hủy"
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              status: 'active',
              role: 'Student'
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Tên đăng nhập"
                  name="username"
                  rules={[
                    { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
                    { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự!' }
                  ]}
                >
                  <Input placeholder="Nhập tên đăng nhập" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: 'Vui lòng nhập email!' },
                    { type: 'email', message: 'Email không hợp lệ!' }
                  ]}
                >
                  <Input placeholder="Nhập email" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Họ và tên"
                  name="fullName"
                  rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
                >
                  <Input placeholder="Nhập họ và tên" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Số điện thoại"
                  name="phone"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số điện thoại!' },
                    { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' }
                  ]}
                >
                  <Input placeholder="Nhập số điện thoại" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Vai trò"
                  name="role"
                  rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
                >
                  <Select placeholder="Chọn vai trò">
                    <Option value="Admin">Admin</Option>
                    <Option value="Teacher">Teacher</Option>
                    <Option value="Student">Student</Option>
                    <Option value="Manager">Manager</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Trạng thái"
                  name="status"
                  rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
                >
                  <Select placeholder="Chọn trạng thái">
                    <Option value="active">Hoạt động</Option>
                    <Option value="inactive">Không hoạt động</Option>
                    <Option value="pending">Chờ duyệt</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {!editingAccount && (
              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu!' },
                  { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                ]}
              >
                <Input.Password placeholder="Nhập mật khẩu" />
              </Form.Item>
            )}

            <Form.Item
              label="Ghi chú"
              name="note"
            >
              <TextArea rows={3} placeholder="Nhập ghi chú (tùy chọn)" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
};

export default AccountList;
