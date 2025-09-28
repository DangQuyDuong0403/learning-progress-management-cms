import React, { useState, useEffect } from "react";
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
  Upload,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  SearchOutlined,
  ReloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import Layout from "../../../../component/Layout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { spaceToast } from "../../../../component/SpaceToastify";

const { Option } = Select;


// Mock data for current class teachers and teaching assistants
const mockClassTeachers = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@fpt.edu.vn",
    phone: "0123456789",
    role: "teacher",
    status: "active",
    joinDate: "2024-01-01",
    specialization: "English",
  },
  {
    id: 10,
    name: "Emily Davis",
    email: "emily.davis@fpt.edu.vn",
    phone: "0123456780",
    role: "teaching_assistant",
    status: "active",
    joinDate: "2024-01-15",
    specialization: "English",
  },
  {
    id: 11,
    name: "David Wilson",
    email: "david.wilson@fpt.edu.vn",
    phone: "0987654320",
    role: "teaching_assistant",
    status: "active",
    joinDate: "2024-02-01",
    specialization: "English",
  },
];

// Mock class data
const mockClassData = {
  id: 1,
  name: "Rising star 1",
  color: "#00d4ff",
  status: "active",
  createdAt: "2024-01-15",
};

const ClassTeachers = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [classData, setClassData] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    fetchClassData();
    fetchTeachers();
  }, [id]);

  const fetchClassData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setClassData(mockClassData);
        setLoading(false);
      }, 500);
    } catch (error) {
      spaceToast.error(t('classTeachers.loadingClassInfo'));
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        setTeachers(mockClassTeachers);
      }, 500);
    } catch (error) {
      spaceToast.error(t('classTeachers.loadingTeachers'));
    }
  };


  const handleImportFile = () => {
    setIsImportModalVisible(true);
  };

  const handleImportModalOk = () => {
    if (fileList.length === 0) {
      spaceToast.warning(t('classTeachers.selectFileToImportError'));
      return;
    }
    
    // Simulate file processing
    spaceToast.success(t('classTeachers.importSuccess'));
    setIsImportModalVisible(false);
    setFileList([]);
  };

  const handleImportModalCancel = () => {
    setIsImportModalVisible(false);
    setFileList([]);
  };

  const handleFileChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
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

  const getRoleTag = (role) => {
    const roleConfig = {
      teacher: { color: "gold", text: "Teacher" },
      teaching_assistant: { color: "blue", text: "Teaching Assistant" },
    };

    const config = roleConfig[role] || roleConfig.teaching_assistant;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // Filter teachers based on search and filters
  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      searchText === "" ||
      teacher.name.toLowerCase().includes(searchText.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || teacher.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: t('classTeachers.teacherTeachingAssistant'),
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Avatar
            size={40}
            icon={<UserOutlined style={{ fontSize: '18px' }} />}
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
      title: t('classTeachers.role'),
      dataIndex: "role",
      key: "role",
      render: (role) => getRoleTag(role),
    },
    {
      title: t('classTeachers.phoneNumber'),
      dataIndex: "phone",
      key: "phone",
      render: (text) => <span style={{ fontSize: "14px" }}>{text}</span>,
    },
    {
      title: t('classTeachers.status'),
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status),
    },
    {
      title: t('classTeachers.joinDate'),
      dataIndex: "joinDate",
      key: "joinDate",
      render: (date) => (
        <span style={{ fontSize: "14px" }}>
          {new Date(date).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="class-detail-container">
          <LoadingWithEffect loading={true} message={t('classTeachers.loadingClassInfo')} />
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
                icon={<ArrowLeftOutlined style={{ fontSize: '18px' }} />}
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
                  icon={<ReloadOutlined style={{ fontSize: '18px' }} />}
                  onClick={fetchTeachers}
                  className="refresh-button"
                >
                  {t('classTeachers.refresh')}
                </Button>
                <Button
                  icon={<UploadOutlined style={{ fontSize: '18px' }} />}
                  onClick={handleImportFile}
                  className="import-button"
                >
                  {t('classTeachers.importFile')}
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
            <div 
              className="nav-tab"
              onClick={() => navigate(`/teacher/classes/student/${id}`)}
            >
              <span>{t('classTeachers.students')}</span>
            </div>
            <div className="nav-tab active">
              <span>{t('classTeachers.teachers')} ({filteredTeachers.length})</span>
            </div>
            <div 
              className="nav-tab"
              onClick={() => navigate(`/teacher/classes/activities/${id}`)}
            >
              <span>{t('classTeachers.activities')}</span>
            </div>
         
          </div>

          {/* Filters */}
          <div className="filters-section">
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={8} lg={6}>
                <Input
                  placeholder={t('classTeachers.searchTeachers')}
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

          {/* Teachers Table */}
          <div className="table-section">
            <LoadingWithEffect loading={loading} message={t('classTeachers.loadingTeachers')}>
              <Table
                columns={columns}
                dataSource={filteredTeachers}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} ${t('classTeachers.teachers')}`,
                }}
                scroll={{ x: 800 }}
              />
            </LoadingWithEffect>
          </div>
        </Card>


         {/* Import File Modal */}
         <Modal
           title={t('classTeachers.importTeachersList')}
           open={isImportModalVisible}
           onOk={handleImportModalOk}
           onCancel={handleImportModalCancel}
           okText={t('classTeachers.import')}
           cancelText={t('common.cancel')}
           width={600}
         >
           <div style={{ marginBottom: '16px' }}>
             <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
               {t('classTeachers.selectFileToImport')}
             </p>
             <p style={{ fontSize: '13px', color: '#999', marginBottom: '16px' }}>
               {t('classTeachers.fileFormat')}
             </p>
           </div>
           
           <Upload
             fileList={fileList}
             onChange={handleFileChange}
             beforeUpload={() => false}
             accept=".xlsx,.xls,.csv"
             maxCount={1}
           >
             <Button icon={<UploadOutlined style={{ fontSize: '18px' }} />} style={{ width: '100%' }}>
               {t('classTeachers.selectFileToUpload')}
             </Button>
           </Upload>
           
           {fileList.length > 0 && (
             <div style={{ 
               marginTop: '12px', 
               padding: '8px 12px', 
               backgroundColor: '#f6f8fa', 
               borderRadius: '6px',
               fontSize: '13px',
               color: '#586069'
             }}>
               <strong>{t('classTeachers.selectedFile')}</strong> {fileList[0].name}
             </div>
           )}
         </Modal>
       </div>
     </Layout>
   );
 };

export default ClassTeachers;
