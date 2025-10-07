import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
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
} from "antd";
import {
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckOutlined,
  StopOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import { useTheme } from "../../../../contexts/ThemeContext";
import "./RoleList.css";
import { spaceToast } from "../../../../component/SpaceToastify";

const { Option } = Select;

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
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter] = useState("all");
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

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setRoles(mockRoles);
        setLoading(false);
      }, 1000);
    } catch (error) {
      spaceToast.error(t('roleManagement.loadRolesError'));
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Role options with translations
  const roleOptions = [
    { key: "admin", label: t('roleManagement.admin') },
    { key: "manager", label: t('roleManagement.manager') },
    { key: "teacher", label: t('roleManagement.teacher') },
    { key: "teacher_assistant", label: t('roleManagement.teacherAssistant') },
    { key: "student", label: t('roleManagement.student') },
    { key: "test_taker", label: t('roleManagement.testTaker') },
  ];

  // Permission groups with translations
  const permissionGroups = [
    {
      group: t('roleManagement.userManagementGroup'),
      permissions: [
        t('roleManagement.createNewAccount'),
        t('roleManagement.updateAccount'),
        t('roleManagement.activateDeactivateAccount'),
      ],
    },
    {
      group: t('roleManagement.exerciseManagementGroup'),
      permissions: [
        t('roleManagement.createNewExercise'),
        t('roleManagement.updateExercise'),
        t('roleManagement.activateDeactivateExercise'),
      ],
    },
  ];

  // Function to translate role names
  const translateRole = (role) => {
    const roleTranslations = {
      "Admin": t('roleManagement.admin'),
      "Manager": t('roleManagement.manager'),
      "Teacher": t('roleManagement.teacher'),
      "Teacher Assistant": t('roleManagement.teacherAssistant'),
      "Student": t('roleManagement.student'),
      "Test Taker": t('roleManagement.testTaker'),
    };
    
    return roleTranslations[role] || role;
  };

  // Function to translate permissions
  const translatePermission = (permission) => {
    const permissionTranslations = {
      // Original Vietnamese permissions (from mockRoles)
      "Quản lý hệ thống": t('roleManagement.systemManagement'),
      "Quản lý tài khoản": t('roleManagement.accountManagement'),
      "Chỉnh sửa quyền": t('roleManagement.editPermissions'),
      "Quản lý lớp học": t('roleManagement.classManagement'),
      "Quản lý giáo viên": t('roleManagement.teacherManagement'),
      "Quản lý học sinh": t('roleManagement.studentManagement'),
      "Tạo đề kiểm tra": t('roleManagement.createExamQuestions'),
      "Hỗ trợ giáo viên": t('roleManagement.teacherSupport'),
      "Quản lý bài tập": t('roleManagement.assignmentManagement'),
      "Làm bài kiểm tra": t('roleManagement.takeExam'),
      "Xem điểm": t('roleManagement.viewScores'),
      "Làm bài kiểm tra thử": t('roleManagement.takePracticeExam'),
      
      // New translated permissions (from permissionGroups)
      [t('roleManagement.createNewAccount')]: t('roleManagement.createNewAccount'),
      [t('roleManagement.updateAccount')]: t('roleManagement.updateAccount'),
      [t('roleManagement.activateDeactivateAccount')]: t('roleManagement.activateDeactivateAccount'),
      [t('roleManagement.createNewExercise')]: t('roleManagement.createNewExercise'),
      [t('roleManagement.updateExercise')]: t('roleManagement.updateExercise'),
      [t('roleManagement.activateDeactivateExercise')]: t('roleManagement.activateDeactivateExercise'),
    };
    
    return permissionTranslations[permission] || permission;
  };

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
      title: t('roleManagement.role'),
      dataIndex: "role",
      key: "role",
      render: (role) => (
        <span className="role-name-text" style={{ fontSize: '20px' }}>
          {translateRole(role)}
        </span>
      ),
      sorter: (a, b) => a.role.localeCompare(b.role),
    },
    {
      title: t('roleManagement.active'),
      dataIndex: "active",
      key: "active",
      render: (active) =>
        active ? (
          <Tag color="green" style={{ fontSize: '14px' }}>{t('roleManagement.active')}</Tag>
        ) : (
          <Tag color="red" style={{ fontSize: '14px' }}>{t('roleManagement.inactive')}</Tag>
        ),
      filters: [
        { text: t('roleManagement.active'), value: true },
        { text: t('roleManagement.inactive'), value: false },
      ],
      onFilter: (value, record) => record.active === value,
    },
    {
      title: t('roleManagement.permissions'),
      dataIndex: "permissions",
      key: "permissions",
       render: (permissions) =>
         permissions.map((p, idx) => (
           <span key={idx} className="permission-text" style={{ display: 'inline-block', marginRight: '8px', fontSize: '20px' }}>
             {translatePermission(p)}
             {idx < permissions.length - 1 && ', '}
           </span>
         )),
    },
    {
      title: t('roleManagement.actions'),
      key: "actions",
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('roleManagement.edit')}>
            <Button
              type="text"
              icon={<EditOutlined style={{ fontSize: '25px' }} />}
              size="small"
              onClick={() => handleEditRole(record)}
              style={{ padding: '8px 12px' }}
            />
          </Tooltip>
          <Tooltip title={record.active ? t('roleManagement.deactivate') : t('roleManagement.activate')}>
            <Button
              type="text"
              icon={record.active ? <StopOutlined style={{ fontSize: '25px' }} /> : <CheckOutlined style={{ fontSize: '25px' }} />}
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
      const actionText = newStatus ? t('roleManagement.activate') : t('roleManagement.deactivate');
      
      setConfirmModal({
        visible: true,
        title: t('roleManagement.changeStatus'),
        content: `${t('roleManagement.confirmStatusChange')} ${actionText} ${t('roleManagement.role')} "${translateRole(role.role)}"?`,
        onConfirm: () => {
          setRoles(roles.map(r => 
            r.id === id ? { ...r, active: newStatus } : r
          ));
          setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
          
          // Show success toast
          if (newStatus) {
            spaceToast.success(`${t('roleManagement.activateRoleSuccess')} "${translateRole(role.role)}" ${t('roleManagement.success')}`);
          } else {
            spaceToast.success(`${t('roleManagement.deactivateRoleSuccess')} "${translateRole(role.role)}" ${t('roleManagement.success')}`);
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
        spaceToast.success(`${t('roleManagement.updateRoleSuccess')} "${translateRole(values.role)}" ${t('roleManagement.success')}`);
      } else {
        const newRole = {
          id: Date.now(),
          ...values,
          permissions,
        };
        setRoles([newRole, ...roles]);
        spaceToast.success(`${t('roleManagement.addRoleSuccess')} "${translateRole(values.role)}" ${t('roleManagement.success')}`);
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
                onChange={(e) => setSearchText(e.target.value)}
                className={`search-input ${theme}-search-input`}
                allowClear
              />
              <div style={{width: 500}}></div>
            </div>
            <div className="action-buttons">
              <Button 
                icon={<ReloadOutlined />}
                className={`export-button ${theme}-export-button`}
                onClick={fetchRoles}
              >
                Refresh
              </Button>
              <Button 
                icon={<PlusOutlined />}
                className={`create-button ${theme}-create-button`}
                onClick={handleAddRole}
              >
                Create Role
              </Button>
            </div>
          </div>

          {/* Table Section */}
          <div className={`table-section ${theme}-table-section`}>
            <LoadingWithEffect
              loading={loading}
              message={t('roleManagement.loadingRoles')}>
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
                    `${range[0]}-${range[1]} of ${total}`,
                  className: `${theme}-pagination`
                }}
                scroll={{ x: 800 }}
                className={`role-table ${theme}-role-table`}
              />
            </LoadingWithEffect>
          </div>
        </div>

        <Modal
          title={
            <div style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#000000ff',
              textAlign: 'center',
              padding: '10px 0'
            }}>
              {editingRole ? t('roleManagement.editRole') : t('roleManagement.addNewRole')}
            </div>
          }
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={600}
          okText={editingRole ? t('common.save') : t('roleManagement.addRole')}
          cancelText={t('common.cancel')}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label={
                <span style={{ fontSize: '20px' }}>
                  {t('roleManagement.roleName')}
                  <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                </span>
              }
              name="role"
              rules={[
                { required: true, message: t('roleManagement.roleRequired') },
              ]}
              required={false}
            >
              <Select placeholder={t('roleManagement.selectRole')}>
                {roleOptions.map((opt) => (
                  <Option key={opt.key} value={opt.label}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{ fontWeight: 500, marginBottom: 8, display: "block", color: '#000', fontSize: '20px' }}
              >
                {t('roleManagement.permissions')}
              </label>
              <Collapse defaultActiveKey={[permissionGroups[0].group]}>
                {permissionGroups.map((group, idx) => (
                  <Collapse.Panel
                    header={
                      <span style={{ fontWeight: 600, color: '#000', fontSize: '20px' }}>
                        {group.group}
                      </span>
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
                        <Checkbox key={perm} value={perm} style={{ color: '#000', fontSize: '20px' }}>
                          {translatePermission(perm)}
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
              fontSize: '20px',
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

export default RoleList;
