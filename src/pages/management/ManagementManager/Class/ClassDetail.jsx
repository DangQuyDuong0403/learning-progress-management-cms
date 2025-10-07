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
  Upload,
  Radio,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  ImportOutlined,
  ExportOutlined,
  DownloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/ThemedLayout";
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

// Mock data for all available students (for autocomplete)
const mockAllStudents = [
  { id: 10, code: "HE176502", name: "Nguyễn Đức Anh", email: "anhndhe176502@fpt.edu.vn" },
  { id: 11, code: "HE176501", name: "Nguyễn Đức Anh", email: "anhndhe176501@fpt.edu.vn" },
  { id: 12, code: "HE176503", name: "Trần Văn Bình", email: "binhtvhe176503@fpt.edu.vn" },
  { id: 13, code: "HE176504", name: "Lê Thị Cường", email: "cuonglthe176504@fpt.edu.vn" },
  { id: 14, code: "HE176505", name: "Phạm Văn Dũng", email: "dungpvhe176505@fpt.edu.vn" },
  { id: 15, code: "HE176506", name: "Hoàng Thị Em", email: "emhthe176506@fpt.edu.vn" },
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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [studentSearchValue, setStudentSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [importFile, setImportFile] = useState(null);

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

  const handleAddStudent = () => {
    setStudentSearchValue("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedStudents([]);
    setIsModalVisible(true);
  };


  const handleStudentSearch = (value) => {
    setStudentSearchValue(value);
    if (value.length > 0) {
      const filtered = mockAllStudents.filter(student => 
        student.name.toLowerCase().includes(value.toLowerCase()) ||
        student.code.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectStudent = (student) => {
    console.log("Student selected:", student);
    
    // Check if student is already selected
    const isAlreadySelected = selectedStudents.some(s => s.id === student.id);
    if (isAlreadySelected) {
      spaceToast.warning(t('classDetail.alreadyInClass'));
      return;
    }
    
    // Add to selected students
    setSelectedStudents([...selectedStudents, student]);
    setStudentSearchValue("");
    setShowSuggestions(false);
  };

  const handleRemoveSelectedStudent = (studentId) => {
    setSelectedStudents(selectedStudents.filter(s => s.id !== studentId));
  };

  const handleDeleteStudent = (student) => {
    console.log("Delete button clicked for student:", student);
    setStudentToDelete(student);
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = () => {
    if (studentToDelete) {
      console.log("Confirm delete for student:", studentToDelete);
      const updatedStudents = students.filter(s => s.id !== studentToDelete.id);
      console.log("Updated students:", updatedStudents);
      setStudents(updatedStudents);
      spaceToast.success(`${t('classDetail.deleteSuccess')} "${studentToDelete.name}" ${t('classDetail.fromClass')}`);
      setIsDeleteModalVisible(false);
      setStudentToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    console.log("Delete cancelled");
    setIsDeleteModalVisible(false);
    setStudentToDelete(null);
  };

  const handleImport = () => {
    setIsImportModalVisible(true);
  };

  const handleExport = () => {
    setIsExportModalVisible(true);
  };

  const handleImportModalOk = () => {
    if (importFile) {
      // Simulate import process
      spaceToast.success(t('classDetail.importSuccess'));
      setIsImportModalVisible(false);
      setImportFile(null);
    } else {
      spaceToast.error(t('classDetail.selectFileToImportError'));
    }
  };

  const handleImportModalCancel = () => {
    setIsImportModalVisible(false);
    setImportFile(null);
  };

  const handleExportModalOk = (exportType) => {
    // Simulate export process
    spaceToast.success(`${t('classDetail.exportSuccess')} ${exportType} ${t('classDetail.successful')}`);
    setIsExportModalVisible(false);
  };

  const handleExportModalCancel = () => {
    setIsExportModalVisible(false);
  };

  const handleFileUpload = (info) => {
    if (info.file.status === 'done') {
      setImportFile(info.file);
      spaceToast.success(`${info.file.name} has been selected for import`);
    } else if (info.file.status === 'error') {
      spaceToast.error(`${info.file.name} upload failed`);
    }
  };

  const handleModalOk = async () => {
    try {
      console.log("Add students clicked");
      console.log("selectedStudents:", selectedStudents);
      
      if (selectedStudents.length === 0) {
        spaceToast.error(t('classDetail.selectAtLeastOne'));
        return;
      }

      const newStudents = [];
      const existingStudents = [];
      
      selectedStudents.forEach(selectedStudent => {
        console.log("Checking student:", selectedStudent);
        console.log("Current students in class:", students);
        
        // Check if student already exists in class
        const exists = students.some(s => s.id === selectedStudent.id);
        console.log("Student exists:", exists);
        
        if (exists) {
          existingStudents.push(selectedStudent.name);
        } else {
          // Add new student to class
          const newStudent = {
            id: selectedStudent.id,
            name: selectedStudent.name,
            email: selectedStudent.email,
            phone: "0123456789", // Default phone
            status: "active",
            joinDate: new Date().toISOString().split("T")[0],
            gender: "male", // Default gender
          };
          newStudents.push(newStudent);
        }
      });

      if (newStudents.length > 0) {
        setStudents([...newStudents, ...students]);
        spaceToast.success(`${t('classDetail.addStudentsSuccess')} ${newStudents.length} ${t('classDetail.studentsToClass')}`);
      }

      if (existingStudents.length > 0) {
        spaceToast.warning(`${t('classDetail.alreadyInClass')} ${existingStudents.join(", ")}`);
      }

      setIsModalVisible(false);
      setStudentSearchValue("");
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedStudents([]);
    } catch (error) {
      console.error("Error adding students:", error);
      spaceToast.error(t('classDetail.checkInfoError'));
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setStudentSearchValue("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedStudents([]);
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
      render: (_, record) => (
        <Space>
        
          <Button
            type="text"
            icon={<DeleteOutlined style={{ fontSize: '18px' }} />}
            onClick={() => handleDeleteStudent(record)}
            style={{ color: "#ff4d4f" }}
            title={t('classDetail.removeFromClass')}
          />
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <ThemedLayout>
        <div className="class-detail-container">
          <LoadingWithEffect loading={true} message={t('classDetail.loadingClassInfo')} />
        </div>
      </ThemedLayout>
    );
  }

  return (
    <ThemedLayout>
      <div className="class-detail-container">
        {/* Header */}
        <Card className="header-card">
          <div className="header-content">
            <div className="header-left">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(`/manager/classes/menu/${id}`)}
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
                <Button
                  icon={<ImportOutlined />}
                  onClick={handleImport}
                  className="import-button"
                >
                  {t('classDetail.import')}
                </Button>
                <Button
                  icon={<ExportOutlined />}
                  onClick={handleExport}
                  className="export-button"
                >
                  {t('classDetail.export')}
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddStudent}
                  className="add-student-button"
                >
                  {t('classDetail.addStudent')}
                </Button>
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

        {/* Add Student Modal */}
        <Modal
          title={`${t('classDetail.addStudentsToClass')} (${selectedStudents.length} ${t('classDetail.selectedStudents')})`}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={600}
          okText={`${t('classDetail.addStudents')} ${selectedStudents.length} ${t('classDetail.studentsAdded')}`}
          cancelText={t('common.cancel')}
        >
          <div style={{ position: 'relative' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: '#1e293b'
              }}>
                {t('classDetail.searchAndSelectStudents')}
              </label>
              <Input
                value={studentSearchValue}
                onChange={(e) => handleStudentSearch(e.target.value)}
                placeholder={t('classDetail.typeStudentNameOrCode')}
                style={{
                  fontSize: "15px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "2px solid #e2e8f0",
                  transition: "all 0.3s ease",
                }}
                allowClear
              />
            </div>

            {/* Selected Students List */}
            {selectedStudents.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500',
                  color: '#1e293b'
                }}>
                  {t('classDetail.selectedStudentsList')} ({selectedStudents.length})
                </label>
                <div style={{
                  maxHeight: '150px',
                  overflowY: 'auto',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px'
                }}>
                  {selectedStudents.map((student) => (
                    <div
                      key={student.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        marginBottom: '4px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '500', color: '#1e293b' }}>
                          {student.code} - {student.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {student.email}
                        </div>
                      </div>
                      <Button
                        type="text"
                        size="small"
                        danger
                        onClick={() => handleRemoveSelectedStudent(student.id)}
                        style={{ color: '#ef4444' }}
                      >
                        {t('classDetail.remove')}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {suggestions.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => handleSelectStudent(student)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'white';
                    }}
                  >
                    <div style={{ fontWeight: '500', color: '#1e293b' }}>
                      {student.code} - {student.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      {student.email}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>

        {/* Import Modal */}
        <Modal
          title={t('classDetail.importStudentsList')}
          open={isImportModalVisible}
          onOk={handleImportModalOk}
          onCancel={handleImportModalCancel}
          okText={t('classDetail.import')}
          cancelText={t('common.cancel')}
          width={600}
        >
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
              {t('classDetail.selectFileToImport')}
            </p>
            
            <Upload.Dragger
              name="file"
              multiple={false}
              accept=".xlsx,.xls,.csv"
              beforeUpload={() => false} // Prevent auto upload
              onChange={handleFileUpload}
              onDrop={(e) => {
                console.log('Dropped files', e.dataTransfer.files);
              }}
              style={{
                border: '2px dashed #d9d9d9',
                borderRadius: '6px',
                backgroundColor: '#fafafa',
              }}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text" style={{ fontSize: '16px', fontWeight: '500' }}>
                Click or drag file here to upload
              </p>
              <p className="ant-upload-hint" style={{ fontSize: '14px', color: '#666' }}>
                Support Excel (.xlsx, .xls) and CSV (.csv) files
              </p>
            </Upload.Dragger>
          </div>

          <div style={{ 
            padding: '12px', 
            backgroundColor: '#f6f8fa', 
            borderRadius: '6px',
            border: '1px solid #e1e4e8'
          }}>
            <div style={{ fontSize: '14px', color: '#24292e', marginBottom: '8px' }}>
              <strong>{t('classDetail.fileFormatInstructions')}:</strong>
            </div>
            <div style={{ fontSize: '13px', color: '#586069' }}>
              <div>• {t('classDetail.column1')}</div>
              <div>• {t('classDetail.column2')}</div>
              <div>• {t('classDetail.column3')}</div>
              <div>• {t('classDetail.column4')}</div>
              <div>• {t('classDetail.column5')}</div>
            </div>
          </div>
        </Modal>

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
                    <DownloadOutlined style={{ color: '#ff4d4f' }} />
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

        {/* Delete Confirmation Modal */}
        <Modal
          title={t('classDetail.confirmDelete')}
          open={isDeleteModalVisible}
          onOk={handleConfirmDelete}
          onCancel={handleCancelDelete}
          okText={t('common.delete')}
          cancelText={t('common.cancel')}
          okType="danger"
          centered
        >
          <p>{t('classDetail.confirmDeleteMessage')} "{studentToDelete?.name}"?</p>
        </Modal>
      </div>
    </ThemedLayout>
  );
};

export default ClassDetail;
