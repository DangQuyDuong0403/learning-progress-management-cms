import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
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
  Row,
  Col,
  Upload,
  Typography,
  Divider,
  DatePicker,
  Radio,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  CheckOutlined,
  StopOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  UploadOutlined,
  CameraOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import { useTheme } from "../../../../contexts/ThemeContext";
import "./StudentList.css";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useNavigate } from "react-router-dom";
import AssignStudentToClass from "./AssignStudentToClass";

const { Option } = Select;
const { Title, Text } = Typography;
const { Dragger } = Upload;

const mockStudents = [
  {
    id: 1,
    studentCode: "STU001",
    fullName: "Nguyễn Văn An",
    email: "nguyenvanan@example.com",
    phone: "0123456789",
    class: "Lớp 10A1",
    level: "Beginner",
    status: "active",
    lastActivity: "2024-12-20",
    avatar: null,
    dateOfBirth: "2005-03-15",
    gender: "male",
  },
  {
    id: 2,
    studentCode: "STU002",
    fullName: "Trần Thị Bình",
    email: "tranthibinh@example.com",
    phone: "0987654321",
    class: "Lớp 10A2",
    level: "Intermediate",
    status: "active",
    lastActivity: "2024-12-19",
    avatar: null,
    dateOfBirth: "2005-07-22",
    gender: "female",
  },
  {
    id: 3,
    studentCode: "STU003",
    fullName: "Lê Văn Cường",
    email: "levancuong@example.com",
    phone: "0111222333",
    class: "Lớp 11B1",
    level: "Advanced",
    status: "inactive",
    lastActivity: "2024-11-15",
    avatar: null,
    dateOfBirth: "2004-11-08",
    gender: "male",
  },
  {
    id: 4,
    studentCode: "STU004",
    fullName: "Phạm Thị Dung",
    email: "phamthidung@example.com",
    phone: "0444555666",
    class: "Lớp 9C1",
    level: "Beginner",
    status: "active",
    lastActivity: "2024-12-18",
    avatar: null,
    dateOfBirth: "2006-01-12",
    gender: "female",
  },
  {
    id: 5,
    studentCode: "STU006",
    fullName: "Vũ Thị Phương",
    email: "vuthiphuong@example.com",
    phone: "0333444555",
    class: "Lớp 10A3",
    level: "Advanced",
    status: "active",
    lastActivity: "2024-12-21",
    avatar: null,
    dateOfBirth: "2005-05-18",
    gender: "female",
  },
];

const StudentList = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter] = useState("all");
  const [classFilter] = useState("all");
  const [levelFilter] = useState("all");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [assigningStudent, setAssigningStudent] = useState(null);
  const [form] = Form.useForm();
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    content: '',
    onConfirm: null
  });
  const [importModal, setImportModal] = useState({
    visible: false,
    fileList: [],
    uploading: false,
  });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setStudents(mockStudents);
        setLoading(false);
      }, 1000);
    } catch (error) {
      spaceToast.error(t('studentManagement.loadStudentsError'));
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Class options
  const classOptions = [
    { key: "10A1", label: "Lớp 10A1" },
    { key: "10A2", label: "Lớp 10A2" },
    { key: "10A3", label: "Lớp 10A3" },
    { key: "11B1", label: "Lớp 11B1" },
    { key: "9C1", label: "Lớp 9C1" },
    { key: "12A1", label: "Lớp 12A1" },
  ];

  // Level options
  const levelOptions = [
    { key: "beginner", label: t('studentManagement.beginner') },
    { key: "intermediate", label: t('studentManagement.intermediate') },
    { key: "advanced", label: t('studentManagement.advanced') },
  ];

  // Search/filter
  const filteredStudents = students.filter((student) => {
    const matchesSearch = 
      student.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
      student.studentCode.toLowerCase().includes(searchText.toLowerCase()) ||
      student.email.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && student.status === "active") ||
      (statusFilter === "inactive" && student.status === "inactive") ||
      (statusFilter === "pending" && student.status === "pending");
    
    const matchesClass = classFilter === "all" || student.class === classFilter;
    const matchesLevel = levelFilter === "all" || student.level === levelFilter;
    
    return matchesSearch && matchesStatus && matchesClass && matchesLevel;
  });

  // Table columns
  const columns = [
    {
      title: t('studentManagement.studentCode'),
      dataIndex: "studentCode",
      key: "studentCode",
      render: (code) => (
        <span className="student-code-text">
          {code}
        </span>
      ),
      sorter: (a, b) => a.studentCode.localeCompare(b.studentCode),
    },
    {
      title: t('studentManagement.student'),
      dataIndex: "fullName",
      key: "fullName",
      render: (name) => (
        <span className="student-name-text">{name}</span>
      ),
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
    },
    {
      title: t('studentManagement.phone'),
      dataIndex: "phone",
      key: "phone",
      render: (phone) => (
        <span className="phone-text">
          {phone}
        </span>
      ),
    },
    {
      title: t('studentManagement.class'),
      dataIndex: "class",
      key: "class",
      render: (class_) => (
        <span className="class-text">{class_}</span>
      ),
      filters: classOptions.map(opt => ({ text: opt.label, value: opt.key })),
      onFilter: (value, record) => record.class === value,
    },
    {
      title: t('studentManagement.level'),
      dataIndex: "level",
      key: "level",
      render: (level) => (
        <span className="level-text">{level}</span>
      ),
      filters: levelOptions.map(opt => ({ text: opt.label, value: opt.key })),
      onFilter: (value, record) => record.level === value,
    },
    {
      title: t('studentManagement.status'),
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const statusConfig = {
          active: { color: "green", text: t('studentManagement.active') },
          inactive: { color: "red", text: t('studentManagement.inactive') },
          pending: { color: "orange", text: t('studentManagement.pending') },
        };
        const config = statusConfig[status] || statusConfig.inactive;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      filters: [
        { text: t('studentManagement.active'), value: "active" },
        { text: t('studentManagement.inactive'), value: "inactive" },
        { text: t('studentManagement.pending'), value: "pending" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: t('studentManagement.actions'),
      key: "actions",
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('studentManagement.viewProfile')}>
            <Button
              type="text"
              icon={<InfoCircleOutlined style={{ fontSize: '25px' }} />}
              size="small"
              onClick={() => handleViewProfile(record)}
              style={{ 
                color: '#1890ff',
                padding: '8px 12px'
              }}
            />
          </Tooltip>
          <Tooltip title={t('studentManagement.assignToClass')}>
            <Button
              type="text"
              icon={<PlusOutlined style={{ fontSize: '25px' }} />}
              size="small"
              onClick={() => handleAssignToClass(record)}
              style={{ 
                color: '#52c41a',
                padding: '8px 12px'
              }}
            />
          </Tooltip>
          <Tooltip title={record.status === 'active' ? t('studentManagement.deactivate') : t('studentManagement.activate')}>
            <Button
              type="text"
              icon={record.status === 'active' ? <StopOutlined style={{ fontSize: '25px' }} /> : <CheckOutlined style={{ fontSize: '25px' }} />}
              size="small"
              onClick={() => handleToggleStatus(record.id)}
              style={{
                color: record.status === 'active' ? '#ff4d4f' : '#52c41a',
                padding: '8px 12px'
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Add/Edit
  const handleAddStudent = () => {
    setEditingStudent(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'active' // Set default status
    });
    setIsModalVisible(true);
  };

  const handleAssignToClass = (record) => {
    setAssigningStudent(record);
    setIsAssignModalVisible(true);
  };

  const handleAssignModalClose = () => {
    setIsAssignModalVisible(false);
    setAssigningStudent(null);
  };

  const handleToggleStatus = (id) => {
    const student = students.find(s => s.id === id);
    if (student) {
      const newStatus = student.status === 'active' ? 'inactive' : 'active';
      const actionText = newStatus === 'active' ? t('studentManagement.activate') : t('studentManagement.deactivate');
      
      setConfirmModal({
        visible: true,
        title: t('studentManagement.changeStatus'),
        content: `${t('studentManagement.confirmStatusChange')} ${actionText} ${t('studentManagement.student')} "${student.fullName}"?`,
        onConfirm: () => {
          setStudents(students.map(s => 
            s.id === id ? { ...s, status: newStatus } : s
          ));
          setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
          
          // Show success toast
          if (newStatus === 'active') {
            spaceToast.success(`${t('studentManagement.activateStudentSuccess')} "${student.fullName}" ${t('studentManagement.success')}`);
          } else {
            spaceToast.success(`${t('studentManagement.deactivateStudentSuccess')} "${student.fullName}" ${t('studentManagement.success')}`);
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
      if (editingStudent) {
        setStudents(
          students.map((student) =>
            student.id === editingStudent.id
              ? { ...student, ...values }
              : student
          )
        );
        spaceToast.success(`${t('studentManagement.updateStudentSuccess')} "${values.fullName}" ${t('studentManagement.success')}`);
      } else {
        const newStudent = {
          id: Date.now(),
          ...values,
          lastActivity: new Date().toISOString().split('T')[0],
        };
        setStudents([newStudent, ...students]);
        spaceToast.success(`${t('studentManagement.addStudentSuccess')} "${values.fullName}" ${t('studentManagement.success')}`);
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch {
      // Do nothing
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  // Handle view student profile
  const handleViewProfile = (record) => {
    navigate(`/manager/student/${record.id}/profile`, { state: { student: record } });
  };

  // Handle import students
  const handleImportStudents = () => {
    setImportModal({ visible: true, fileList: [], uploading: false });
  };

  const handleImportCancel = () => {
    setImportModal({ visible: false, fileList: [], uploading: false });
  };

  const handleImportOk = async () => {
    if (importModal.fileList.length === 0) {
      spaceToast.warning(t('studentManagement.selectFileToImport'));
      return;
    }

    setImportModal((prev) => ({ ...prev, uploading: true }));

    try {
      // Simulate file processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock successful import
      const newStudents = [
        {
          id: Date.now() + 1,
          studentCode: 'IMPORT001',
          fullName: 'Student Imported 1',
          email: 'imported1@example.com',
          phone: '0123456789',
          class: 'Lớp 10A1',
          level: 'Beginner',
          status: 'active',
          lastActivity: new Date().toISOString().split('T')[0],
        },
        {
          id: Date.now() + 2,
          studentCode: 'IMPORT002',
          fullName: 'Student Imported 2',
          email: 'imported2@example.com',
          phone: '0987654321',
          class: 'Lớp 10A2',
          level: 'Intermediate',
          status: 'active',
          lastActivity: new Date().toISOString().split('T')[0],
        },
      ];

      setStudents([...newStudents, ...students]);
      spaceToast.success(
        `${t('studentManagement.importSuccess')} ${newStudents.length} ${t(
          'studentManagement.students'
        )}`
      );

      setImportModal({ visible: false, fileList: [], uploading: false });
    } catch (error) {
      spaceToast.error(t('studentManagement.importError'));
      setImportModal((prev) => ({ ...prev, uploading: false }));
    }
  };

  // Handle export students
  const handleExportStudents = () => {
    // Simulate export functionality
    spaceToast.info(t('studentManagement.exportInProgress'));
  };

  // Handle download template
  const handleDownloadTemplate = () => {
    // Create CSV template content
    const templateContent = `studentCode,fullName,email,phone,class,level,status,username,password
STU001,Nguyen Van An,nguyenvanan@example.com,0123456789,Lớp 10A1,Beginner,active,student001,password123
STU002,Tran Thi Binh,tranthibinh@example.com,0987654321,Lớp 10A2,Intermediate,active,student002,password123
STU003,Le Van Cuong,levancuong@example.com,0111222333,Lớp 11B1,Advanced,active,student003,password123`;

    // Create blob and download
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'student_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    spaceToast.success(t('studentManagement.templateDownloaded'));
  };

  return (
    <ThemedLayout>
        {/* Main Content Panel */}
        <div className={`main-content-panel ${theme}-main-panel`}>
          {/* Header Section */}
          <div className={`panel-header ${theme}-panel-header`}>
            <div className="search-section">
              <Input
                placeholder={t('studentManagement.searchPlaceholder')}
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className={`search-input ${theme}-search-input`}
                allowClear
              />
            </div>
            <div className="action-buttons">
              <Button 
                icon={<UploadOutlined />}
                className={`export-button ${theme}-export-button`}
                onClick={handleExportStudents}
              >
                {t('studentManagement.exportData')}
              </Button>
              <Button 
                icon={<DownloadOutlined />}
                className={`import-button ${theme}-import-button`}
                onClick={handleImportStudents}
              >
                {t('studentManagement.importStudents')}
              </Button>
              <Button 
                icon={<PlusOutlined />}
                className={`create-button ${theme}-create-button`}
                onClick={handleAddStudent}
              >
                {t('studentManagement.createStudent')}
              </Button>
            </div>
          </div>

          {/* Table Section */}
          <div className={`table-section ${theme}-table-section`}>
            <LoadingWithEffect
              loading={loading}
              message={t('studentManagement.loadingStudents')}>
              <Table
                columns={columns}
                dataSource={filteredStudents}
                rowKey="id"
                pagination={{
                  total: filteredStudents.length,
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total}`,
                  className: `${theme}-pagination`
                }}
                scroll={{ x: 1200 }}
                className={`student-table ${theme}-student-table`}
              />
            </LoadingWithEffect>
          </div>
        </div>

        <Modal
          title={
            <div style={{ 
              fontSize: '26px', 
              fontWeight: '600', 
              color: '#000000ff',
              textAlign: 'center',
              padding: '10px 0'
            }}>
              {editingStudent ? t('studentManagement.editStudent') : t('studentManagement.addNewStudent')}
            </div>
          }
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={600}
          okText={editingStudent ? t('common.save') : t('studentManagement.addStudent')}
          cancelText={t('common.cancel')}
        >
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={
                    <span>
                      {t('studentManagement.studentCode')}
                      <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                    </span>
                  }
                  name="studentCode"
                  rules={[
                    { required: true, message: t('studentManagement.studentCodeRequired') },
                  ]}
                  required={false}
                >
                  <Input placeholder={t('studentManagement.enterStudentCode')} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={
                    <span>
                      {t('studentManagement.fullName')}
                      <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                    </span>
                  }
                  name="fullName"
                  rules={[
                    { required: true, message: t('studentManagement.fullNameRequired') },
                  ]}
                  required={false}
                >
                  <Input placeholder={t('studentManagement.enterFullName')} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={
                    <span>
                      {t('studentManagement.email')}
                      <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                    </span>
                  }
                  name="email"
                  rules={[
                    { required: true, message: t('studentManagement.emailRequired') },
                    { type: 'email', message: t('studentManagement.emailInvalid') },
                  ]}
                  required={false}
                >
                  <Input placeholder={t('studentManagement.enterEmail')} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={t('studentManagement.phone')}
                  name="phone"
                >
                  <Input placeholder={t('studentManagement.enterPhone')} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={t('studentManagement.level')}
                  name="level"
                >
                  <Select placeholder={t('studentManagement.selectLevel')}>
                    {levelOptions.map((opt) => (
                      <Option key={opt.key} value={opt.label}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={t('studentManagement.class')}
                  name="class"
                >
                  <Select placeholder={t('studentManagement.selectClass')}>
                    {classOptions.map((opt) => (
                      <Option key={opt.key} value={opt.label}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {!editingStudent && (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span>
                        {t('studentManagement.username')}
                        <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                      </span>
                    }
                    name="username"
                    rules={[
                      { required: true, message: t('studentManagement.usernameRequired') },
                    ]}
                    required={false}
                  >
                    <Input placeholder={t('studentManagement.enterUsername')} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span>
                        {t('studentManagement.password')}
                        <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                      </span>
                    }
                    name="password"
                    rules={[
                      { required: true, message: t('studentManagement.passwordRequired') },
                      { min: 6, message: t('studentManagement.passwordMinLength') },
                    ]}
                    required={false}
                  >
                    <Input.Password placeholder={t('studentManagement.enterPassword')} />
                  </Form.Item>
                </Col>
              </Row>
            )}

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={t('studentManagement.dateOfBirth')}
                  name="dateOfBirth"
                >
                  <DatePicker 
                    style={{ width: '100%' }}
                    placeholder={t('studentManagement.selectDateOfBirth')}
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={t('studentManagement.gender')}
                  name="gender"
                >
                  <Radio.Group>
                    <Radio value="male">{t('common.male')}</Radio>
                    <Radio value="female">{t('common.female')}</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label={t('studentManagement.profileImage')}
              name="avatar"
            >
              <Upload
                listType="picture-card"
                maxCount={1}
                beforeUpload={() => false}
                showUploadList={{
                  showPreviewIcon: true,
                  showRemoveIcon: true,
                }}
              >
                <div>
                  <CameraOutlined />
                  <div style={{ marginTop: 8 }}>{t('studentManagement.uploadImage')}</div>
                </div>
              </Upload>
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
              {t('studentManagement.importStudents')}
            </div>
          }
          open={importModal.visible}
          onOk={handleImportOk}
          onCancel={handleImportCancel}
          okText={t('studentManagement.import')}
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
              {t('studentManagement.importInstructions')}
            </Title>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <Button
                type="dashed"
                icon={<DownloadOutlined />}
                onClick={handleDownloadTemplate}
                style={{
                  borderColor: '#1890ff',
                  color: '#1890ff',
                  height: '36px',
                  fontSize: '14px',
                  fontWeight: '500',
                }}>
                {t('studentManagement.downloadTemplate')}
              </Button>
            </div>

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
                {t('studentManagement.clickOrDragFile')}
              </p>
              <p className='ant-upload-hint' style={{ color: '#999' }}>
                {t('studentManagement.supportedFormats')}: Excel (.xlsx, .xls),
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
                📋 {t('studentManagement.fileFormat')}
              </Title>
              <Text
                style={{ color: '#586069', fontSize: '14px', lineHeight: '1.6' }}>
                {t('studentManagement.fileFormatDescription')}
              </Text>

              <div
                style={{ marginTop: '12px', fontSize: '13px', color: '#6a737d' }}>
                <div>
                  <strong>{t('studentManagement.requiredColumns')}:</strong>
                </div>
                <div>• studentCode, fullName, email, phone, class, level, status</div>
                <div>
                  <strong>{t('studentManagement.optionalColumns')}:</strong>
                </div>
                <div>• username, password (nếu không có sẽ tự động tạo)</div>
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
                  ✅ {t('studentManagement.fileSelected')}:{' '}
                  {importModal.fileList[0].name}
                </Text>
              </div>
            )}
          </div>
        </Modal>

        {/* Assign Student to Class Modal */}
        <Modal
          title={t('studentManagement.assignStudentToClass')}
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
          <AssignStudentToClass student={assigningStudent} onClose={handleAssignModalClose} />
        </Modal>
    </ThemedLayout>
  );
};

export default StudentList;
