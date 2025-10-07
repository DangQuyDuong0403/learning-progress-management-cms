import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Input,
  Space,
  message,
  Card,
  Row,
  Col,
  Select,
  Modal,
  Form,
  Dropdown,
  Tag,
  ColorPicker,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  MoreOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  ImportOutlined,
  TeamOutlined,
  CalendarOutlined,
  BookOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./ClassList.css";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const { Option } = Select;

// Mock data - thay thế bằng API call thực tế
const mockClasses = [
  {
    id: 1,
    name: "Rising Stars 1",
    studentCount: 0,
    color: "#00d4ff", // space blue
    status: "active",
    createdAt: "2024-01-15",
    description: "Basic English course for beginners",
    teacher: "Nguyễn Văn A",
    level: "Beginner",
    ageRange: "6-8",
  },
  {
    id: 2,
    name: "Rising Stars 2",
    studentCount: 0,
    color: "#ff6b35", // mars orange
    status: "active",
    createdAt: "2024-01-16",
    description: "Intermediate English course",
    teacher: "Trần Thị B",
    level: "Intermediate",
    ageRange: "8-10",
  },
  {
    id: 3,
    name: "Rising Stars 3",
    studentCount: 0,
    color: "#9c88ff", // nebula purple
    status: "active",
    createdAt: "2024-01-17",
    description: "Advanced English course",
    teacher: "Lê Văn C",
    level: "Advanced",
    ageRange: "10-12",
  },
  {
    id: 4,
    name: "Rising Stars 4",
    studentCount: 0,
    color: "#00ff88", // alien green
    status: "active",
    createdAt: "2024-01-18",
    description: "English conversation club",
    teacher: "Phạm Thị D",
    level: "Upper Intermediate",
    ageRange: "12-14",
  },
];

// Mock level options
const levelOptions = [
  { value: "Beginner", label: "Beginner" },
  { value: "Elementary", label: "Elementary" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Upper Intermediate", label: "Upper Intermediate" },
  { value: "Advanced", label: "Advanced" },
  { value: "IELTS Preparation", label: "IELTS Preparation" },
  { value: "TOEFL Preparation", label: "TOEFL Preparation" },
];

// Mock age range options
const ageRangeOptions = [
  { value: "3-5", label: "3-5 tuổi" },
  { value: "6-8", label: "6-8 tuổi" },
  { value: "8-10", label: "8-10 tuổi" },
  { value: "10-12", label: "10-12 tuổi" },
  { value: "12-14", label: "12-14 tuổi" },
  { value: "14-16", label: "14-16 tuổi" },
  { value: "16-18", label: "16-18 tuổi" },
  { value: "18+", label: "18+ tuổi" },
];


const ClassList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [form] = Form.useForm();
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    content: '',
    onConfirm: null
  });

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setClasses(mockClasses);
        setLoading(false);
      }, 1000);
    } catch (error) {
      message.error("Error loading classes list");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
  };

  const handleCreateClass = () => {
    setEditingClass(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditClass = (classItem) => {
    setEditingClass(classItem);
    form.setFieldsValue({
      ...classItem,
      color: classItem.color,
    });
    setIsModalVisible(true);
  };

  const handleToggleStatus = (classItem) => {
    const newStatus = classItem.status === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? t('classManagement.activate') : t('classManagement.deactivate');
    
    setConfirmModal({
      visible: true,
      title: t('classManagement.confirmStatusChange'),
      content: `${t('classManagement.confirmStatusChangeMessage')} ${actionText} ${t('classManagement.class')} "${classItem.name}"?`,
      onConfirm: () => {
        setClasses(classes.map(c => 
          c.id === classItem.id 
            ? { ...c, status: newStatus }
            : c
        ));
        setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
        spaceToast.success(`${t('classManagement.statusChangedSuccess')} ${actionText}d ${t('classManagement.class')} "${classItem.name}"`);
      }
    });
  };

  const handleConfirmCancel = () => {
    setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      // Handle color conversion
      const processedValues = {
        ...values,
        color: typeof values.color === 'string' ? values.color : values.color?.toHexString(),
      };

      if (editingClass) {
        // Update existing class
        setClasses(
          classes.map((classItem) =>
            classItem.id === editingClass.id
              ? { ...classItem, ...processedValues }
              : classItem
          )
        );
        message.success(t('classManagement.classUpdatedSuccess'));
      } else {
        // Add new class
        const newClass = {
          id: Date.now(),
          ...processedValues,
          studentCount: 0,
          status: "active",
          createdAt: new Date().toISOString().split("T")[0],
        };
        setClasses([newClass, ...classes]);
        message.success(t('classManagement.classCreatedSuccess'));
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(t('classManagement.checkInfoError'));
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleCardClick = (classItem) => {
    navigate(`/manager/classes/menu/${classItem.id}`);
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      active: { color: "green", text: t('classManagement.active') },
      inactive: { color: "red", text: t('classManagement.inactive') },
      pending: { color: "orange", text: t('classManagement.pending') },
    };

    const config = statusConfig[status] || statusConfig.inactive;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // Filter data based on search and filters
  const filteredClasses = classes.filter((classItem) => {
    const matchesSearch =
      searchText === "" ||
      classItem.name.toLowerCase().includes(searchText.toLowerCase()) ||
      classItem.description.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || classItem.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getMenuItems = (classItem) => [
    {
      key: "edit",
      label: t('common.edit'),
      icon: <EditOutlined />,
      onClick: () => handleEditClass(classItem),
    },
    {
      key: "toggle",
      label: classItem.status === 'active' ? t('classManagement.deactivate') : t('classManagement.activate'),
      icon: <DeleteOutlined />,
      danger: classItem.status === 'active',
      onClick: () => handleToggleStatus(classItem),
    },
  ];

  return (
    <ThemedLayout>
      <div className="class-list-container">
        {/* Header */}
        <Card className="header-card">
          <Row justify="space-between" align="middle">
            <Col>
              <h2
                style={{
                  margin: 0,
                  background:
                    "linear-gradient(135deg, #00d4ff 0%, #9c88ff 50%, #ff6b35 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 800,
                  fontSize: "32px",
                  letterSpacing: "-0.5px",
                  textShadow: "0 0 30px rgba(0, 212, 255, 0.3)",
                }}
              >
                Class
              </h2>
            </Col>
          </Row>
        </Card>

        {/* Filters */}
        <Card className="filter-card">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6} lg={4}>
              <Input
                placeholder={t('classManagement.searchClasses')}
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Select
                placeholder={t('classManagement.filterByStatus')}
                value={statusFilter}
                onChange={handleStatusFilter}
                style={{ width: "100%" }}
              >
                <Option value="all">{t('classManagement.allStatus')}</Option>
                <Option value="active">{t('classManagement.active')}</Option>
                <Option value="inactive">{t('classManagement.inactive')}</Option>
                <Option value="pending">{t('classManagement.pending')}</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchClasses}
              >
                {t('classManagement.refresh')}
              </Button>
            </Col>
            <Col xs={24} sm={24} md={6} lg={12} style={{ textAlign: 'right' }}>
              <Space>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: "import",
                        label: t('classManagement.importClasses'),
                        icon: <ImportOutlined />,
                      },
                      {
                        key: "export",
                        label: t('classManagement.exportClasses'),
                        icon: <ExportOutlined />,
                      },
                    ],
                  }}
                  trigger={["click"]}
                >
                  <Button icon={<ImportOutlined />}>
                    {t('classManagement.importClasses')}
                  </Button>
                </Dropdown>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreateClass}
                  style={{
                    background: "linear-gradient(135deg, #00d4ff 0%, #9c88ff 100%)",
                    borderColor: "transparent",
                    height: "44px",
                    fontSize: "16px",
                    fontWeight: "600",
                    borderRadius: "12px",
                    boxShadow: "0 4px 20px rgba(0, 212, 255, 0.4)",
                  }}
                >
                   {t('classManagement.createClass')}
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Class Cards */}
        <div className="classes-grid">
            <LoadingWithEffect loading={loading} message={t('classManagement.loadingClasses')}>
            {filteredClasses.length > 0 ? (
               <Row gutter={[24, 24]} justify="center" style={{ padding: '0 20px' }}>
                 {filteredClasses.map((classItem) => (
                   <Col xs={22} sm={20} md={12} lg={12} xl={12} key={classItem.id}>
                    <Card 
                      className="class-card" 
                      hoverable
                    >
                      <div className="class-card-header">
                        <div 
                          className="class-color-bar" 
                          style={{ backgroundColor: classItem.color }}
                        />
                        <Dropdown
                          menu={{ items: getMenuItems(classItem) }}
                          trigger={["click"]}
                          placement="bottomRight"
                        >
                          <Button
                            type="text"
                            icon={<MoreOutlined />}
                            className="class-menu-button"
                          />
                        </Dropdown>
                      </div>
                      
                      <div className="class-card-content">
                        <h3 
                          className="class-name clickable-name"
                          onClick={() => handleCardClick(classItem)}
                          style={{
                            background: "linear-gradient(90deg, #5e17eb 0%, #4dd0ff 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            fontWeight: 700,
                            fontSize: "24px",
                            letterSpacing: "0.3px"
                          }}
                        >
                          {classItem.name}
                        </h3>
                        
                        <div className="class-info">
                          <div className="student-count">
                            <UserOutlined style={{ color: classItem.color }} />
                            <span>{classItem.studentCount}</span>
                          </div>
                          
                          <div className="class-stats">
                            {getStatusTag(classItem.status)}
                          </div>
                        </div>
                        
                        <div className="class-meta">
                          <span className="teacher">
                            <TeamOutlined style={{ color: '#059669' }} />
                            Teacher: {classItem.teacher}
                          </span>
                          <span className="age-range">
                            <BookOutlined style={{ color: '#059669' }} />
                            Level: {classItem.level}
                          </span>
                          <span className="age-range">
                            <UserOutlined style={{ color: '#059669' }} />
                            Age Range: {classItem.ageRange}
                          </span>
                          <span className="created-date">
                            <CalendarOutlined style={{ color: '#64748b' }} />
                            Created: {classItem.createdAt}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <div className="empty-state">
                <p>{t('classManagement.noClassesFound')}</p>
                <Button type="primary" onClick={handleCreateClass}>
                  {t('classManagement.createFirstClass')}
                </Button>
              </div>
            )}
          </LoadingWithEffect>
        </div>

        {/* Add/Edit Modal */}
        <Modal
          title={editingClass ? t('classManagement.editClass') : t('classManagement.createClass')}
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
              color: "#00d4ff",
            }}
          >
            <Form.Item
              label={t('classManagement.className')}
              name="name"
              rules={[
                { required: true, message: t('classManagement.classNameRequired') },
              ]}
            >
              <Input 
                placeholder={t('classManagement.enterClassName')} 
                style={{
                  fontSize: "15px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "2px solid #e2e8f0",
                  transition: "all 0.3s ease",
                }}
              />
            </Form.Item>

            <Form.Item
              label={t('classManagement.level')}
              name="level"
              rules={[
                { required: true, message: t('classManagement.levelRequired') },
              ]}
            >
              <Select 
                placeholder={t('classManagement.selectLevel')}
                style={{
                  fontSize: "15px",
                }}
              >
                {levelOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={t('classManagement.ageRange')}
              name="ageRange"
              rules={[
                { required: true, message: t('classManagement.ageRangeRequired') },
              ]}
            >
              <Select 
                placeholder={t('classManagement.selectAgeRange')}
                style={{
                  fontSize: "15px",
                }}
              >
                {ageRangeOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>


            <Form.Item
              label={t('classManagement.classColor')}
              name="color"
              rules={[
                { required: true, message: t('classManagement.classColorRequired') },
              ]}
            >
              <ColorPicker 
                placeholder={t('classManagement.selectClassColor')}
                style={{
                  fontSize: "15px",
                }}
                showText
                format="hex"
              />
            </Form.Item>

            <Form.Item
              label={t('classManagement.status')}
              name="status"
              rules={[
                { required: true, message: t('classManagement.statusRequired') },
              ]}
            >
              <Select 
                placeholder={t('classManagement.selectStatus')}
                style={{
                  fontSize: "15px",
                }}
              >
                <Option value="active">{t('classManagement.active')}</Option>
                <Option value="inactive">{t('classManagement.inactive')}</Option>
                <Option value="pending">{t('classManagement.pending')}</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        {/* Confirmation Modal */}
        <Modal
          title={confirmModal.title}
          open={confirmModal.visible}
          onOk={confirmModal.onConfirm}
          onCancel={handleConfirmCancel}
          okText={t('common.confirm')}
          cancelText={t('common.cancel')}
        >
          <p>{confirmModal.content}</p>
        </Modal>
      </div>
    </ThemedLayout>
  );
};

export default ClassList;
