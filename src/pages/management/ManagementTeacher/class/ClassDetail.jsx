import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Card,
  Row,
  Col,
  Table,
  Space,
  Tag,
  Avatar,
  Input,
  Select,
  Modal,
  Radio,
  Form,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  SearchOutlined,
  ExportOutlined,
  EyeOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import Layout from "../../../../component/Layout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./ClassDetail.css";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { spaceToast } from "../../../../component/SpaceToastify";

const { Option } = Select;

// Mock data for students
const mockStudents = [
  {
    id: 1,
    name: "Nguyễn Văn An",
    email: "an.nguyen@example.com",
    phone: "0123456789",
    status: "active",
    joinDate: "2024-01-15",
    gender: "male",
  },
  {
    id: 2,
    name: "Trần Thị Bình",
    email: "binh.tran@example.com",
    phone: "0987654321",
    status: "active",
    joinDate: "2024-01-16",
    gender: "female",
  },
  {
    id: 3,
    name: "Lê Văn Cường",
    email: "cuong.le@example.com",
    phone: "0369258147",
    status: "inactive",
    joinDate: "2024-01-17",
    gender: "male",
  },
];


// Mock class data
const mockClassData = {
  id: 1,
  name: "Rising star 1",
  studentCount: 3,
  color: "#00d4ff",
  status: "active",
  createdAt: "2024-01-15",
  teacher: "Nguyễn Văn A",
};

const ClassDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [classData, setClassData] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [isStudentModalVisible, setIsStudentModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [form] = Form.useForm();

  const fetchClassData = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setClassData(mockClassData);
        setLoading(false);
      }, 1000);
    } catch (error) {
      spaceToast.error(t('classDetail.loadingClassInfo'));
      setLoading(false);
    }
  }, [t]);

  const fetchStudents = useCallback(async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        setStudents(mockStudents);
      }, 1000);
    } catch (error) {
      spaceToast.error(t('classDetail.loadingStudents'));
    }
  }, [t]);

  useEffect(() => {
    fetchClassData();
    fetchStudents();
  }, [id, fetchClassData, fetchStudents]);

  const handleExport = () => {
    setIsExportModalVisible(true);
  };

  const handleExportModalOk = (exportType) => {
    // Simulate export process
    spaceToast.success(`${t('classDetail.exportSuccess')} ${exportType} ${t('classDetail.successful')}`);
    setIsExportModalVisible(false);
  };

  const handleExportModalCancel = () => {
    setIsExportModalVisible(false);
  };

  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setIsStudentModalVisible(true);
  };

  const handleChangePassword = (student) => {
    setSelectedStudent(student);
    form.resetFields();
    setIsPasswordModalVisible(true);
  };

  const handleStudentModalCancel = () => {
    setIsStudentModalVisible(false);
    setSelectedStudent(null);
  };

  const handlePasswordModalCancel = () => {
    setIsPasswordModalVisible(false);
    setSelectedStudent(null);
    form.resetFields();
  };

  const handlePasswordChange = async () => {
    try {
      const values = await form.validateFields();
      
      // Simulate password change API call
      console.log("Changing password for student:", selectedStudent.name, values);
      spaceToast.success(t('classDetail.passwordChangedSuccess'));
      setIsPasswordModalVisible(false);
      setSelectedStudent(null);
      form.resetFields();
    } catch (error) {
      spaceToast.error(t('classDetail.passwordChangeError'));
    }
  };


  const getStatusTag = (status) => {
    const statusConfig = {
      active: { color: "green", text: "Active" },
      inactive: { color: "red", text: "Inactive" },
      pending: { color: "orange", text: "Pending" },
    };

    const config = statusConfig[status] || statusConfig.inactive;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getGenderTag = (gender) => {
    const genderConfig = {
      male: { color: "blue", text: "Male" },
      female: { color: "pink", text: "Female" },
      other: { color: "purple", text: "Other" },
    };

    const config = genderConfig[gender] || genderConfig.other;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // Filter students based on search and filters
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      searchText === "" ||
      student.name.toLowerCase().includes(searchText.toLowerCase()) ||
      student.email.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || student.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: t('classDetail.student'),
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Avatar
            size={40}
            icon={<UserOutlined />}
            style={{
              backgroundColor: classData?.color || "#00d4ff",
            }}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: "15px" }}>{text}</div>
            <div style={{ fontSize: "13px", color: "#666" }}>{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: t('classDetail.phoneNumber'),
      dataIndex: "phone",
      key: "phone",
      render: (text) => <span style={{ fontSize: "14px" }}>{text}</span>,
    },
    {
      title: t('classDetail.status'),
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status),
    },
    {
      title: t('classDetail.gender'),
      dataIndex: "gender",
      key: "gender",
      render: (gender) => getGenderTag(gender),
    },
    {
      title: t('classDetail.joinDate'),
      dataIndex: "joinDate",
      key: "joinDate",
      render: (date) => (
        <span style={{ fontSize: "14px" }}>
          {new Date(date).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
    {
      title: t('classDetail.actions'),
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined style={{ fontSize: '18px' }} />}
            onClick={() => handleEditStudent(record)}
            style={{ color: "#1890ff" }}
            title={t('classDetail.viewStudentInfo')}
          />
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="class-detail-container">
          <LoadingWithEffect loading={true} message={t('classDetail.loadingClassInfo')} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="class-detail-container">
        {/* Header */}
        <Card className="header-card">
          <div className="header-content">
            <div className="header-left">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/teacher/classes')}
                className="back-button"
              >
                {t('common.back')}
              </Button>
            </div>
            
            <div className="header-center">
              <h2 className="class-title">
                {classData?.name}
              </h2>
             
            </div>
            
            <div className="header-right">
              <Space>
                 {/* Chapters/Lessons Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              size="large"
              onClick={() => navigate(`/teacher/classes/chapters-lessons/${id}`)}
              style={{
                borderRadius: '8px',
                fontWeight: '500',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              {t('classDetail.chaptersLessons')}
            </Button>
          </div>
                <Button
                  icon={<ExportOutlined />}
                  onClick={handleExport}
                  className="export-button"
                >
                  {t('classDetail.export')}
                </Button>
              </Space>
            </div>
          </div>
        </Card>

        {/* Main Content Card */}
        <Card className="main-content-card">
          {/* Navigation Tabs */}
          <div className="nav-tabs">
            <div 
              className="nav-tab"
              onClick={() => navigate(`/teacher/classes/dashboard/${id}`)}
            >
              <span>{t('classDashboard.dashboard')}</span>
            </div>
            <div className="nav-tab active">
              <span>{t('classDetail.students')} ({filteredStudents.length})</span>
            </div>
            <div 
              className="nav-tab"
              onClick={() => navigate(`/teacher/classes/teachers/${id}`)}
            >
              <span>{t('classDetail.teachers')}</span>
            </div>
            <div 
              className="nav-tab"
              onClick={() => navigate(`/teacher/classes/activities/${id}`)}
            >
              <span>{t('classDetail.activities')}</span>
            </div>
          </div>

         

          {/* Filters */}
          <div className="filters-section">
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={8} lg={6}>
                <Input
                  placeholder={t('classDetail.searchStudents')}
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Select
                  placeholder="Filter by status"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: "100%" }}
                >
                  <Option value="all">All Status</Option>
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                  <Option value="pending">Pending</Option>
                </Select>
              </Col>
            </Row>
          </div>

          {/* Students Table */}
          <div className="table-section">
            <LoadingWithEffect loading={loading} message={t('classDetail.loadingStudents')}>
              <Table
                columns={columns}
                dataSource={filteredStudents}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} ${t('classDetail.students')}`,
                }}
                scroll={{ x: 800 }}
              />
            </LoadingWithEffect>
          </div>
        </Card>


        {/* Export Modal */}
        <Modal
          title={t('classDetail.exportStudentsList')}
          open={isExportModalVisible}
          onCancel={handleExportModalCancel}
          footer={null}
          width={500}
        >
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
              {t('classDetail.selectFileFormat')}
            </p>
            
            <Radio.Group 
              defaultValue="excel"
              style={{ width: '100%' }}
            >
              <div style={{ marginBottom: '12px' }}>
                <Radio value="excel">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ExportOutlined style={{ color: '#52c41a' }} />
                    <span>{t('classDetail.excel')}</span>
                  </div>
                </Radio>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <Radio value="csv">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ExportOutlined style={{ color: '#1890ff' }} />
                    <span>{t('classDetail.csv')}</span>
                  </div>
                </Radio>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <Radio value="pdf">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ExportOutlined style={{ color: '#ff4d4f' }} />
                    <span>{t('classDetail.pdf')}</span>
                  </div>
                </Radio>
              </div>
            </Radio.Group>
          </div>

          <div style={{ 
            padding: '12px', 
            backgroundColor: '#f6f8fa', 
            borderRadius: '6px',
            border: '1px solid #e1e4e8',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '14px', color: '#24292e', marginBottom: '8px' }}>
              <strong>{t('classDetail.exportInfo')}</strong>
            </div>
            <div style={{ fontSize: '13px', color: '#586069' }}>
              <div>• {t('classDetail.totalStudents')} {students.length}</div>
              <div>• {t('classDetail.activeStudents')} {students.filter(s => s.status === 'active').length}</div>
              <div>• {t('classDetail.inactiveStudents')} {students.filter(s => s.status === 'inactive').length}</div>
              <div>• {t('classDetail.maleStudents')} {students.filter(s => s.gender === 'male').length}</div>
              <div>• {t('classDetail.femaleStudents')} {students.filter(s => s.gender === 'female').length}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button onClick={handleExportModalCancel}>
              {t('common.cancel')}
            </Button>
            <Button type="primary" onClick={() => handleExportModalOk("Excel")}>
              {t('classDetail.exportExcel')}
            </Button>
            <Button type="primary" onClick={() => handleExportModalOk("CSV")}>
              {t('classDetail.exportCsv')}
            </Button>
            <Button type="primary" onClick={() => handleExportModalOk("PDF")}>
              {t('classDetail.exportPdf')}
            </Button>
          </div>
        </Modal>

        {/* Student Information Modal */}
        <Modal
          title={`${t('classDetail.studentInfo')} - ${selectedStudent?.name}`}
          open={isStudentModalVisible}
          onCancel={handleStudentModalCancel}
          footer={[
            <Button key="changePassword" type="primary" icon={<KeyOutlined />} onClick={() => {
              setIsStudentModalVisible(false);
              handleChangePassword(selectedStudent);
            }}>
              {t('classDetail.changePassword')}
            </Button>,
            <Button key="close" onClick={handleStudentModalCancel}>
              {t('common.close')}
            </Button>
          ]}
          width={600}
        >
          {selectedStudent && (
            <div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: '#f6f8fa',
                borderRadius: '8px'
              }}>
                <Avatar
                  size={64}
                  icon={<UserOutlined />}
                  style={{
                    backgroundColor: classData?.color || "#00d4ff",
                  }}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                    {selectedStudent.name}
                  </h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                    {selectedStudent.email}
                  </p>
                </div>
              </div>

              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontWeight: '600', color: '#333', display: 'block', marginBottom: '4px' }}>
                      {t('classDetail.fullName')}
                    </label>
                    <Input value={selectedStudent.name} disabled style={{ backgroundColor: '#f5f5f5' }} />
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontWeight: '600', color: '#333', display: 'block', marginBottom: '4px' }}>
                      {t('classDetail.email')}
                    </label>
                    <Input value={selectedStudent.email} disabled style={{ backgroundColor: '#f5f5f5' }} />
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontWeight: '600', color: '#333', display: 'block', marginBottom: '4px' }}>
                      {t('classDetail.phoneNumber')}
                    </label>
                    <Input value={selectedStudent.phone} disabled style={{ backgroundColor: '#f5f5f5' }} />
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontWeight: '600', color: '#333', display: 'block', marginBottom: '4px' }}>
                      {t('classDetail.gender')}
                    </label>
                    <div style={{ padding: '8px 12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                      {getGenderTag(selectedStudent.gender)}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontWeight: '600', color: '#333', display: 'block', marginBottom: '4px' }}>
                      {t('classDetail.status')}
                    </label>
                    <div style={{ padding: '8px 12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                      {getStatusTag(selectedStudent.status)}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontWeight: '600', color: '#333', display: 'block', marginBottom: '4px' }}>
                      {t('classDetail.joinDate')}
                    </label>
                    <Input 
                      value={new Date(selectedStudent.joinDate).toLocaleDateString("vi-VN")} 
                      disabled 
                      style={{ backgroundColor: '#f5f5f5' }} 
                    />
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal>

        {/* Change Password Modal */}
        <Modal
          title={`${t('classDetail.changePassword')} - ${selectedStudent?.name}`}
          open={isPasswordModalVisible}
          onOk={handlePasswordChange}
          onCancel={handlePasswordModalCancel}
          okText={t('classDetail.changePassword')}
          cancelText={t('common.cancel')}
          width={500}
        >
          <Form
            form={form}
            layout="vertical"
            autoComplete="off"
          >
            <Form.Item
              label={t('classDetail.newPassword')}
              name="newPassword"
              rules={[
                { required: true, message: t('classDetail.newPasswordRequired') },
                { min: 6, message: t('classDetail.passwordMinLength') }
              ]}
            >
              <Input.Password 
                placeholder={t('classDetail.enterNewPassword')}
                style={{
                  fontSize: "15px",
                  padding: "12px 16px",
                  borderRadius: "8px",
                }}
              />
            </Form.Item>

            <Form.Item
              label={t('classDetail.confirmPassword')}
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: t('classDetail.confirmPasswordRequired') },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(t('classDetail.passwordsDoNotMatch')));
                  },
                }),
              ]}
            >
              <Input.Password 
                placeholder={t('classDetail.confirmNewPassword')}
                style={{
                  fontSize: "15px",
                  padding: "12px 16px",
                  borderRadius: "8px",
                }}
              />
            </Form.Item>
          </Form>
        </Modal>

      </div>
    </Layout>
  );
};

export default ClassDetail;
