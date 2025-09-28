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
  Form,
  Upload,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  ReloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import Layout from "../../../../component/Layout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./ClassTeachers.css";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { spaceToast } from "../../../../component/SpaceToastify";

const { Option } = Select;

// Mock data for all available staff (teachers can be both teacher and teaching assistant)
const mockAllStaff = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@fpt.edu.vn",
    phone: "0123456789",
    specialization: "English",
    type: "teacher", // teacher có thể vừa là teacher vừa là teaching assistant
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.johnson@fpt.edu.vn",
    phone: "0987654321",
    specialization: "English",
    type: "teacher",
  },
  {
    id: 3,
    name: "Michael Brown",
    email: "michael.brown@fpt.edu.vn",
    phone: "0369258147",
    specialization: "English",
    type: "teacher",
  },
  {
    id: 10,
    name: "Emily Davis",
    email: "emily.davis@fpt.edu.vn",
    phone: "0123456780",
    specialization: "English",
    type: "teaching_assistant", // teaching assistant chỉ có thể là teaching assistant
  },
  {
    id: 11,
    name: "David Wilson",
    email: "david.wilson@fpt.edu.vn",
    phone: "0987654320",
    specialization: "English",
    type: "teaching_assistant",
  },
  {
    id: 12,
    name: "Lisa Anderson",
    email: "lisa.anderson@fpt.edu.vn",
    phone: "0369258140",
    specialization: "English",
    type: "teaching_assistant",
  },
  {
    id: 13,
    name: "Robert Taylor",
    email: "robert.taylor@fpt.edu.vn",
    phone: "0123456781",
    specialization: "English",
    type: "teaching_assistant",
  },
];

// Filter teachers (can be both teacher and teaching assistant)
const mockAvailableTeachers = mockAllStaff.filter(staff => staff.type === "teacher");

// Filter teaching assistants (teachers + teaching assistants can be teaching assistants)
const mockAvailableTeachingAssistants = mockAllStaff;

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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [fileList, setFileList] = useState([]);

  const fetchClassData = useCallback(async () => {
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
  }, [t]);

  const fetchTeachers = useCallback(async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        setTeachers(mockClassTeachers);
      }, 500);
    } catch (error) {
      spaceToast.error(t('classTeachers.loadingTeachers'));
    }
  }, [t]);

  useEffect(() => {
    fetchClassData();
    fetchTeachers();
  }, [id, fetchClassData, fetchTeachers]);

  const handleAddTeacher = () => {
    form.resetFields();
    setIsModalVisible(true);
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

  const handleDeleteTeacher = (teacher) => {
    console.log("Delete button clicked for teacher:", teacher);
    setTeacherToDelete(teacher);
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = () => {
    if (teacherToDelete) {
      console.log("Confirm delete for teacher:", teacherToDelete);
      const updatedTeachers = teachers.filter(t => t.id !== teacherToDelete.id);
      console.log("Updated teachers:", updatedTeachers);
      setTeachers(updatedTeachers);
      spaceToast.success(`${t('classTeachers.deleteSuccess')} ${teacherToDelete.role === 'teacher' ? t('classTeachers.teacher') : t('classTeachers.teachingAssistant')} "${teacherToDelete.name}"`);
      setIsDeleteModalVisible(false);
      setTeacherToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    console.log("Delete cancelled");
    setIsDeleteModalVisible(false);
    setTeacherToDelete(null);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      console.log("Form values:", values);

      const newTeachers = [];
      const duplicateNames = [];
      const existingTeacherNames = [];
      
      // Check if there's already a teacher in the class
      const hasExistingTeacher = teachers.some(t => t.role === "teacher");
      
      // Add selected teacher
      if (values.selectedTeacher) {
        const teacher = mockAllStaff.find(t => t.id === values.selectedTeacher);
        if (teacher) {
          // Check if this person already exists in the class
          const alreadyExists = teachers.some(t => t.id === teacher.id);
          if (alreadyExists) {
            duplicateNames.push(teacher.name);
          } else if (hasExistingTeacher) {
            existingTeacherNames.push(teacher.name);
          } else {
            const newTeacher = {
              ...teacher,
              role: "teacher",
              status: "active",
              joinDate: new Date().toISOString().split("T")[0],
            };
            newTeachers.push(newTeacher);
          }
        }
      }

      // Add selected teaching assistants
      if (values.selectedTeachingAssistants && values.selectedTeachingAssistants.length > 0) {
        values.selectedTeachingAssistants.forEach(taId => {
          // Skip if this person is already selected as teacher
          if (values.selectedTeacher === taId) {
            return;
          }
          
          const ta = mockAllStaff.find(t => t.id === taId);
          if (ta) {
            // Check if this person already exists in the class
            const alreadyExists = teachers.some(t => t.id === ta.id);
            if (alreadyExists) {
              duplicateNames.push(ta.name);
            } else {
              const newTA = {
                ...ta,
                role: "teaching_assistant",
                status: "active",
                joinDate: new Date().toISOString().split("T")[0],
              };
              newTeachers.push(newTA);
            }
          }
        });
      }

      // Show appropriate messages
      if (duplicateNames.length > 0) {
        spaceToast.error(`${t('classTeachers.alreadyInClassError')} ${duplicateNames.join(", ")}`);
      }
      
      if (existingTeacherNames.length > 0) {
        spaceToast.error(`${t('classTeachers.classAlreadyHasTeacherError')} ${existingTeacherNames.join(", ")}`);
      }

      if (newTeachers.length > 0) {
        setTeachers([...newTeachers, ...teachers]);
        spaceToast.success(`${t('classTeachers.addSuccess')} ${newTeachers.length} ${t('classTeachers.membersToClass')}`);
        setIsModalVisible(false);
        form.resetFields();
      } else if (duplicateNames.length === 0 && existingTeacherNames.length === 0) {
        spaceToast.warning(t('classTeachers.selectAtLeastOne'));
      } else {
        // Don't close modal if there are errors, let user fix the selection
        return;
      }

    } catch (error) {
      console.error("Error adding staff:", error);
      spaceToast.error(t('classTeachers.checkInfoError'));
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
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
    {
      title: t('classTeachers.actions'),
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<DeleteOutlined style={{ fontSize: '18px' }} />}
            onClick={() => handleDeleteTeacher(record)}
            style={{ color: "#ff4d4f" }}
            title={t('classTeachers.delete')}
          />
        </Space>
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
                onClick={() => navigate(`/teacher/classes/menu/${id}`)}
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
              </Space>
            </div>
          </div>
        </Card>

        {/* Main Content Card */}
        <Card className="main-content-card">
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

        {/* Add Staff Modal */}
        <Modal
          title={t('classTeachers.addMembersToClass')}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={600}
          okText={t('classTeachers.add')}
          cancelText={t('common.cancel')}
        >
          {/* Status Info */}
          <div style={{ 
            marginBottom: '16px', 
            padding: '12px', 
            backgroundColor: '#f6f8fa', 
            borderRadius: '6px',
            border: '1px solid #e1e4e8'
          }}>
            <div style={{ fontSize: '14px', color: '#24292e' }}>
              <strong>{t('classTeachers.currentClassStatus')}</strong>
            </div>
            <div style={{ fontSize: '13px', color: '#586069', marginTop: '4px' }}>
              • {t('classTeachers.teacher')}: {teachers.some(t => t.role === "teacher") ? t('classTeachers.assigned') : t('classTeachers.notAssigned')} 
              {teachers.some(t => t.role === "teacher") && ` (${teachers.find(t => t.role === "teacher")?.name})`}
            </div>
            <div style={{ fontSize: '13px', color: '#586069' }}>
              • {t('classTeachers.teachingAssistant')}: {teachers.filter(t => t.role === "teaching_assistant").length} {t('classTeachers.people')}
            </div>
            <div style={{ fontSize: '13px', color: '#586069' }}>
              • {t('classTeachers.total')} {teachers.length} {t('classTeachers.members')}
            </div>
          </div>

          <Form
            form={form}
            layout="vertical"
          >
            <Form.Item
              label={t('classTeachers.teacherCanBeBoth')}
              name="selectedTeacher"
            >
              <Select 
                placeholder={t('classTeachers.selectTeacher')}
                style={{
                  fontSize: "15px",
                }}
                allowClear
                onChange={(value) => {
                  // Clear teaching assistant selection if same person is selected as teacher
                  const currentTeachingAssistants = form.getFieldValue('selectedTeachingAssistants') || [];
                  const filteredTAs = currentTeachingAssistants.filter(id => id !== value);
                  form.setFieldValue('selectedTeachingAssistants', filteredTAs);
                }}
              >
                {mockAvailableTeachers.map(teacher => {
                  const alreadyInClass = teachers.some(t => t.id === teacher.id);
                  const hasExistingTeacher = teachers.some(t => t.role === "teacher");
                  const isDisabled = alreadyInClass || hasExistingTeacher;
                  
                  return (
                    <Option 
                      key={teacher.id} 
                      value={teacher.id}
                      disabled={isDisabled}
                    >
                      {teacher.name} - {teacher.email}
                      {alreadyInClass && ` - ${t('classTeachers.alreadyInClass')}`}
                      {hasExistingTeacher && !alreadyInClass && ` - ${t('classTeachers.classAlreadyHasTeacher')}`}
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>

            <Form.Item
              label={t('classTeachers.teachingAssistantsIncludingBoth')}
              name="selectedTeachingAssistants"
            >
              <Select 
                mode="multiple"
                placeholder={t('classTeachers.selectTeachingAssistants')}
                style={{
                  fontSize: "15px",
                }}
                allowClear
                onChange={(values) => {
                  // Clear teacher selection if same person is selected as teaching assistant
                  const selectedTeacher = form.getFieldValue('selectedTeacher');
                  if (selectedTeacher && values && values.includes(selectedTeacher)) {
                    // Don't allow selecting the same person as both teacher and teaching assistant
                    spaceToast.warning(t('classTeachers.cannotSelectSamePerson'));
                    // Remove the conflicting selection
                    const filteredValues = values.filter(id => id !== selectedTeacher);
                    form.setFieldValue('selectedTeachingAssistants', filteredValues);
                  }
                }}
              >
                {mockAvailableTeachingAssistants.map(ta => {
                  const selectedTeacher = form.getFieldValue('selectedTeacher');
                  const alreadyInClass = teachers.some(t => t.id === ta.id);
                  const isDisabled = selectedTeacher === ta.id || alreadyInClass;
                  
                  return (
                    <Option 
                      key={ta.id} 
                      value={ta.id}
                      disabled={isDisabled}
                    >
                      {ta.name} - {ta.email} {ta.type === "teacher" ? `(${t('classTeachers.teacher')})` : `(${t('classTeachers.teachingAssistant')})`}
                      {selectedTeacher === ta.id && ` - ${t('classTeachers.selectedAsTeacher')}`}
                      {alreadyInClass && ` - ${t('classTeachers.alreadyInClass')}`}
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>
           </Form>
         </Modal>

         {/* Delete Confirmation Modal */}
         <Modal
           title={t('classTeachers.confirmDelete')}
           open={isDeleteModalVisible}
           onOk={handleConfirmDelete}
           onCancel={handleCancelDelete}
           okText={t('common.delete')}
           cancelText={t('common.cancel')}
           okType="danger"
           centered
         >
           <p>{teacherToDelete?.role === 'teacher' ? t('classTeachers.confirmDeleteTeacher') : t('classTeachers.confirmDeleteTA')} "{teacherToDelete?.name}"?</p>
         </Modal>

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