import React, { useState } from "react";
import { Collapse, Checkbox } from "antd";
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Modal,
  Form,
  Select,
  Tooltip,
  Card,
  Row,
  Col,
} from "antd";
import {
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckOutlined,
  StopOutlined,
} from "@ant-design/icons";
import Layout from "../../../../component/Layout";
import "./RoleList.css";
import { spaceToast } from "../../../../component/SpaceToastify";

const { Option } = Select;

const roleOptions = [
  { key: "admin", label: "Admin" },
  { key: "manager", label: "Manager" },
  { key: "teacher", label: "Teacher" },
  { key: "teacher_assistant", label: "Teacher Assistant" },
  { key: "student", label: "Student" },
  { key: "test_taker", label: "Test Taker" },
];

const permissionGroups = [
  {
    group: "Quản lí người dùng",
    permissions: [
      "Tạo tài khoản mới",
      "Cập nhật tài khoản",
      "Active/Deactivate tài khoản",
    ],
  },
  {
    group: "Quản lí bài tập",
    permissions: [
      "Tạo bài tập mới",
      "Cập nhật bài tập",
      "Active/Deactivate bài tập",
    ],
  },
];

const mockRoles = [
  {
    id: 1,
    role: "Admin",
    active: true,
    permissions: ["Quản lý hệ thống", "Quản lý tài khoản", "Chỉnh sửa quyền"],
  },
  {
    id: 2,
    role: "Manager",
    active: true,
    permissions: ["Quản lý lớp học", "Quản lý giáo viên"],
  },
  {
    id: 3,
    role: "Teacher",
    active: true,
    permissions: ["Quản lý học sinh", "Tạo đề kiểm tra"],
  },
  {
    id: 4,
    role: "Teacher Assistant",
    active: false,
    permissions: ["Hỗ trợ giáo viên", "Quản lý bài tập"],
  },
  {
    id: 5,
    role: "Student",
    active: true,
    permissions: ["Làm bài kiểm tra", "Xem điểm"],
  },
  {
    id: 6,
    role: "Test Taker",
    active: false,
    permissions: ["Làm bài kiểm tra thử"],
  },
];

const RoleList = () => {
  const [roles, setRoles] = useState(mockRoles);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form] = Form.useForm();
  const [checkedPermissions, setCheckedPermissions] = useState([]);
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    content: '',
    onConfirm: null
  });

  // Search/filter
  const filteredRoles = roles.filter((role) => {
    const matchesSearch = role.role
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && role.active) ||
      (statusFilter === "inactive" && !role.active);
    return matchesSearch && matchesStatus;
  });

  // Table columns
  const columns = [
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => (
        <Tag color="blue" style={{ fontWeight: 600 }}>
          {role}
        </Tag>
      ),
      sorter: (a, b) => a.role.localeCompare(b.role),
    },
    {
      title: "Hoạt động",
      dataIndex: "active",
      key: "active",
      render: (active) =>
        active ? (
          <Tag color="green">Hoạt động</Tag>
        ) : (
          <Tag color="red">Không hoạt động</Tag>
        ),
      filters: [
        { text: "Hoạt động", value: true },
        { text: "Không hoạt động", value: false },
      ],
      onFilter: (value, record) => record.active === value,
    },
    {
      title: "Quyền",
      dataIndex: "permissions",
      key: "permissions",
      render: (permissions) =>
        permissions.map((p, idx) => (
          <Tag key={idx} color="purple">
            {p}
          </Tag>
        )),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined style={{ fontSize: '18px' }} />}
              size="small"
              onClick={() => handleEditRole(record)}
              style={{ padding: '8px 12px' }}
            />
          </Tooltip>
          <Tooltip title={record.active ? "Vô hiệu hóa" : "Kích hoạt"}>
            <Button
              type="text"
              icon={record.active ? <StopOutlined style={{ fontSize: '18px' }} /> : <CheckOutlined style={{ fontSize: '18px' }} />}
              size="small"
              onClick={() => handleToggleStatus(record.id)}
              style={{
                color: record.active ? '#ff4d4f' : '#52c41a',
                padding: '8px 12px'
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Add/Edit
  const handleAddRole = () => {
    setEditingRole(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditRole = (record) => {
    setEditingRole(record);
    form.setFieldsValue({
      role: record.role,
      active: record.active,
    });
    setCheckedPermissions(record.permissions || []);
    setIsModalVisible(true);
  };

  const handleToggleStatus = (id) => {
    const role = roles.find(r => r.id === id);
    if (role) {
      const newStatus = !role.active;
      const actionText = newStatus ? 'kích hoạt' : 'vô hiệu hóa';
      
      setConfirmModal({
        visible: true,
        title: "Thay đổi trạng thái",
        content: `Bạn có chắc chắn muốn ${actionText} vai trò "${role.role}"?`,
        onConfirm: () => {
          setRoles(roles.map(r => 
            r.id === id ? { ...r, active: newStatus } : r
          ));
          setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
          
          // Show success toast
          if (newStatus) {
            spaceToast.success(`Đã kích hoạt vai trò "${role.role}" thành công!`);
          } else {
            spaceToast.success(`Đã vô hiệu hóa vai trò "${role.role}" thành công!`);
          }
        }
      });
    }
  };

  const handleConfirmCancel = () => {
    setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const permissions = checkedPermissions;
      if (editingRole) {
        setRoles(
          roles.map((role) =>
            role.id === editingRole.id
              ? { ...role, ...values, permissions }
              : role
          )
        );
        spaceToast.success(`Đã cập nhật vai trò "${values.role}" thành công!`);
      } else {
        const newRole = {
          id: Date.now(),
          ...values,
          permissions,
        };
        setRoles([newRole, ...roles]);
        spaceToast.success(`Đã thêm vai trò "${values.role}" thành công!`);
      }
      setIsModalVisible(false);
      form.resetFields();
      setCheckedPermissions([]);
    } catch {
      // Do nothing
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setCheckedPermissions([]);
  };

  return (
    <Layout>
      <div className="account-list-container">
        <Card className="header-card">
          <Row justify="space-between" align="middle">
            <Col>
              <h2
                style={{
                  margin: 0,
                  background:
                    "linear-gradient(90deg, #5e17eb 0%, #4dd0ff 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 700,
                }}
              >
                Role management
              </h2>
              <p style={{ margin: "4px 0 0 0", color: "#666" }}>
                Tổng cộng: {filteredRoles.length} vai trò
              </p>
            </Col>
            <Col>
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddRole}
                >
                  Thêm vai trò
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => setRoles(mockRoles)}
                >
                  Làm mới
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        <Card className="filter-card">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8} lg={6}>
              <Input
                placeholder="Tìm kiếm vai trò..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Select
                placeholder="Lọc theo trạng thái"
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: "100%" }}
              >
                <Option value="all">Tất cả trạng thái</Option>
                <Option value="active">Hoạt động</Option>
                <Option value="inactive">Không hoạt động</Option>
              </Select>
            </Col>
          </Row>
        </Card>

        <Card>
          <Table
            columns={columns}
            dataSource={filteredRoles}
            rowKey="id"
            pagination={{
              total: filteredRoles.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} vai trò`,
            }}
            scroll={{ x: 800 }}
          />
        </Card>

        <Modal
          title={editingRole ? "Chỉnh sửa vai trò" : "Thêm vai trò mới"}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={600}
          okText={editingRole ? "Lưu" : "Thêm mới"}
          cancelText="Hủy bỏ"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="Tên vai trò"
              name="role"
              rules={[
                { required: true, message: "Vui lòng nhập tên vai trò!" },
              ]}
            >
              <Select placeholder="Chọn vai trò">
                {roleOptions.map((opt) => (
                  <Option key={opt.key} value={opt.label}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="Hoạt động"
              name="active"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}
            >
              <Select placeholder="Chọn trạng thái">
                <Option value={true}>Hoạt động</Option>
                <Option value={false}>Không hoạt động</Option>
              </Select>
            </Form.Item>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{ fontWeight: 500, marginBottom: 8, display: "block" }}
              >
                Quyền
              </label>
              <Collapse defaultActiveKey={[permissionGroups[0].group]}>
                {permissionGroups.map((group, idx) => (
                  <Collapse.Panel
                    header={
                      <span style={{ fontWeight: 600 }}>{group.group}</span>
                    }
                    key={group.group}
                  >
                    <Checkbox.Group
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                      value={checkedPermissions.filter((p) =>
                        group.permissions.includes(p)
                      )}
                      onChange={(checked) => {
                        // checked: các quyền vừa được chọn trong nhóm này
                        // checkedPermissions: toàn bộ quyền đã chọn ở các nhóm khác
                        const otherPermissions = checkedPermissions.filter(
                          (p) => !group.permissions.includes(p)
                        );
                        setCheckedPermissions([
                          ...otherPermissions,
                          ...checked,
                        ]);
                      }}
                    >
                      {group.permissions.map((perm) => (
                        <Checkbox key={perm} value={perm}>
                          {perm}
                        </Checkbox>
                      ))}
                    </Checkbox.Group>
                  </Collapse.Panel>
                ))}
              </Collapse>
            </div>
          </Form>
        </Modal>

        {/* Confirmation Modal */}
        <Modal
          title={confirmModal.title}
          open={confirmModal.visible}
          onOk={confirmModal.onConfirm}
          onCancel={handleConfirmCancel}
          okText="Xác nhận"
          cancelText="Hủy"
        >
          <p>{confirmModal.content}</p>
        </Modal>
      </div>
    </Layout>
  );
};

export default RoleList;
