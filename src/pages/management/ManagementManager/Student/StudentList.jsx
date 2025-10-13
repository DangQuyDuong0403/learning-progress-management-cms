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
  Typography,
  Divider,
  DatePicker,
  Radio,
  Upload,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  CheckOutlined,
  StopOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  UploadOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import { useTheme } from "../../../../contexts/ThemeContext";
import "./StudentList.css";
import { spaceToast } from "../../../../component/SpaceToastify";
import authApi from "../../../../apis/backend/auth";
import AssignStudentToClass from "./AssignStudentToClass";
import { useDispatch, useSelector } from "react-redux";
import { fetchLevels } from "../../../../redux/level";

const { Option } = Select;
const { Title, Text } = Typography;

const StudentList = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const { levels, loading: levelsLoading } = useSelector((state) => state.level);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
  });
  
  // Search and filter state
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [roleNameFilter, setRoleNameFilter] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  // Sort state
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("asc");
  
  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
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
  const [assignClassModal, setAssignClassModal] = useState({
    visible: false,
    student: null,
  });

  const fetchStudents = useCallback(async (page = 1, size = 10, search = '', statusFilter = [], roleNameFilter = [], sortField = 'createdAt', sortDirection = 'asc') => {
    setLoading(true);
    try {
      const params = {
        page: page - 1, // API uses 0-based indexing
        size: size,
        sortBy: sortField,
        sortDir: sortDirection,
      };

      // Thêm search text nếu có
      if (search && search.trim()) {
        params.text = search.trim();
      }

      // Thêm status filter nếu có
      if (statusFilter.length > 0) {
        params.status = statusFilter;
      }

      // Thêm roleName filter nếu có
      if (roleNameFilter.length > 0) {
        params.roleName = roleNameFilter;
      }

      console.log('Fetching students with params:', params);
      const response = await authApi.getStudents(params);
      
      if (response.success && response.data) {
        // Sort students: ACTIVE status first, then INACTIVE
        const sortedStudents = response.data.sort((a, b) => {
          // ACTIVE status gets priority (appears first)
          if (a.status === 'ACTIVE' && b.status === 'INACTIVE') {
            return -1;
          }
          if (a.status === 'INACTIVE' && b.status === 'ACTIVE') {
            return 1;
          }
          // If both have same status, maintain original order or sort by other criteria
          return 0;
        });
        
        setStudents(sortedStudents);
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize: size,
          total: response.totalElements || response.data.length,
        }));
      } else {
        setStudents([]);
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize: size,
          total: 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      spaceToast.error(t('studentManagement.loadStudentsError'));
      setStudents([]);
      setPagination(prev => ({
        ...prev,
        current: page,
        pageSize: size,
        total: 0,
      }));
    } finally {
      setLoading(false);
    }
  }, [t]);


  useEffect(() => {
    fetchStudents(1, pagination.pageSize, searchText, statusFilter, roleNameFilter, sortBy, sortDir);
  }, [fetchStudents, searchText, statusFilter, roleNameFilter, sortBy, sortDir, pagination.pageSize]);

  // Fetch levels when component mounts
  useEffect(() => {
    dispatch(fetchLevels());
  }, [dispatch]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);


  // Status options for filter
  const statusOptions = [
    { key: "ACTIVE", label: t('studentManagement.active') },
    { key: "INACTIVE", label: t('studentManagement.inactive') },
  ];

  // Role options for filter
  const roleOptions = [
    { key: "STUDENT", label: "Student" },
    { key: "TEST_TAKER", label: "Test Taker" },
  ];

  // Table columns
  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      render: (_, __, index) => {
        // Calculate index based on current page and page size
        const currentPage = pagination.current || 1;
        const pageSize = pagination.pageSize || 10;
        return (
          <span className="stt-text">
            {(currentPage - 1) * pageSize + index + 1}
          </span>
        );
      },
    },
    {
      title: "Username",
      dataIndex: "userName",
      key: "userName",
      render: (userName) => (
        <span className="username-text">
          {userName}
        </span>
      ),
    },
    {
      title: "Full Name",
      key: "fullName",
      render: (_, record) => (
        <span className="fullname-text">
          {`${record.firstName || ''} ${record.lastName || ''}`.trim()}
        </span>
      ),
    },
    {
      title: "Role",
      dataIndex: "roleName",
      key: "roleName",
      render: (roleName) => (
        <span className="role-text">
          {roleName || 'N/A'}
        </span>
      ),
    },
    {
      title: "Current Level",
      dataIndex: "currentLevelInfo",
      key: "currentLevelInfo",
      render: (currentLevelInfo) => (
        <span className="level-text">
          {currentLevelInfo?.name || 'N/A'}
        </span>
      ),
    },
    {
      title: "Current Class",
      dataIndex: "currentClassInfo",
      key: "currentClassInfo",
      render: (currentClassInfo) => (
        <span className="class-text">
          {currentClassInfo?.name || 'N/A'}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const statusConfig = {
          ACTIVE: { color: "green", text: t('studentManagement.active') },
          INACTIVE: { color: "red", text: t('studentManagement.inactive') },
        };
        const config = statusConfig[status] || statusConfig.INACTIVE;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: t('studentManagement.actions'),
      key: "actions",
      width: 220,
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
          {record.currentClassInfo ? (
            <Tooltip title="Remove from Class">
              <Button
                type="text"
                icon={<StopOutlined style={{ fontSize: '25px' }} />}
                size="small"
                onClick={() => handleRemoveFromClass(record)}
                style={{
                  color: '#ff4d4f',
                  padding: '8px 12px'
                }}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Assign to Class">
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
          )}
          <Tooltip title={record.status === 'ACTIVE' ? t('studentManagement.deactivate') : t('studentManagement.activate')}>
            <Button
              type="text"
              icon={record.status === 'ACTIVE' ? <StopOutlined style={{ fontSize: '25px' }} /> : <CheckOutlined style={{ fontSize: '25px' }} />}
              size="small"
              onClick={() => handleToggleStatus(record.id)}
              style={{
                color: record.status === 'ACTIVE' ? '#ff4d4f' : '#52c41a',
                padding: '8px 12px'
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Handle table change (pagination, sorting, filtering)
  const handleTableChange = (pagination, filters, sorter) => {
    console.log('Table change:', { pagination, filters, sorter });
    
    // Handle sorting
    if (sorter && sorter.field) {
      const newSortBy = sorter.field;
      const newSortDir = sorter.order === 'ascend' ? 'asc' : 'desc';
      
      setSortBy(newSortBy);
      setSortDir(newSortDir);
      
      // Fetch data with new sorting
      fetchStudents(pagination.current, pagination.pageSize, searchText, statusFilter, roleNameFilter, newSortBy, newSortDir);
    } else {
      // Handle pagination without sorting change
      fetchStudents(pagination.current, pagination.pageSize, searchText, statusFilter, roleNameFilter, sortBy, sortDir);
    }
  };

  // Handle search input change
  const handleSearch = (value) => {
    setSearchText(value);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for 1 second delay
    const newTimeout = setTimeout(() => {
      // Reset to first page when searching
      fetchStudents(1, pagination.pageSize, value, statusFilter, roleNameFilter, sortBy, sortDir);
    }, 1000);
    
    setSearchTimeout(newTimeout);
  };

  // Handle status filter change
  const handleStatusFilterChange = (values) => {
    setStatusFilter(values);
    // Reset to first page when filtering
    fetchStudents(1, pagination.pageSize, searchText, values, roleNameFilter, sortBy, sortDir);
  };

  // Handle role filter change
  const handleRoleFilterChange = (values) => {
    setRoleNameFilter(values);
    // Reset to first page when filtering
    fetchStudents(1, pagination.pageSize, searchText, statusFilter, values, sortBy, sortDir);
  };

  // Add/Edit
  const handleAddStudent = () => {
    setEditingStudent(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'active' // Set default status
    });
    setIsModalVisible(true);
  };


  const handleToggleStatus = (id) => {
    const student = students.find(s => s.id === id);
    if (student) {
      const newStatus = student.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const actionText = newStatus === 'ACTIVE' ? t('studentManagement.activate') : t('studentManagement.deactivate');
      const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.userName;
      
      setConfirmModal({
        visible: true,
        title: t('studentManagement.changeStatus'),
        content: `${t('studentManagement.confirmStatusChange')} ${actionText} ${t('studentManagement.student')} "${studentName}"?`,
        onConfirm: async () => {
          try {
            // Call API to update student status
            const response = await authApi.updateStudentStatus(id, newStatus);
            
            if (response.success) {
              // Update local state with API response data
              const updatedStudents = students.map(s => 
                s.id === id ? { ...s, status: newStatus } : s
              );
              
              // Re-sort after status change to maintain ACTIVE first order
              const sortedStudents = updatedStudents.sort((a, b) => {
                // ACTIVE status gets priority (appears first)
                if (a.status === 'ACTIVE' && b.status === 'INACTIVE') {
                  return -1;
                }
                if (a.status === 'INACTIVE' && b.status === 'ACTIVE') {
                  return 1;
                }
                // If both have same status, maintain original order
                return 0;
              });
              
              setStudents(sortedStudents);
              setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
              
              // Show success toast
              if (newStatus === 'ACTIVE') {
                spaceToast.success(`${t('studentManagement.activateStudentSuccess')} "${studentName}" ${t('studentManagement.success')}`);
              } else {
                spaceToast.success(`${t('studentManagement.deactivateStudentSuccess')} "${studentName}" ${t('studentManagement.success')}`);
              }
            } else {
              throw new Error(response.message || 'Failed to update student status');
            }
          } catch (error) {
            console.error('Error updating student status:', error);
            setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
            spaceToast.error(error.response?.data?.message || error.message || t('studentManagement.updateStatusError'));
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
      
      // Format the data according to CreateStudentRequest schema
      const studentData = {
        roleName: values.roleName,
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        avatarUrl: values.avatar && values.avatar.length > 0 ? URL.createObjectURL(values.avatar[0].originFileObj) : null,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]') : null,
        address: values.address || null,
        phoneNumber: values.phoneNumber || null,
        gender: values.gender || null,
        parentInfo: {
          parentName: values.parentInfo?.parentName,
          parentEmail: values.parentInfo?.parentEmail || null,
          parentPhone: values.parentInfo?.parentPhone,
          relationship: values.parentInfo?.relationship || null,
        },
        levelId: values.levelId,
      };
      
      console.log('Student form values:', studentData);
      
      if (editingStudent) {
        // TODO: Call update student API
        spaceToast.success(`Update student "${values.firstName} ${values.lastName}" successfully`);
      } else {
        // TODO: Call create student API with studentData
        spaceToast.success(`Add student "${values.firstName} ${values.lastName}" successfully`);
        // Refresh the list after adding
        fetchStudents();
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
    // TODO: Implement student profile view
    console.log('View profile for student:', record);
    spaceToast.info('Student profile view not implemented yet');
  };

  // Handle assign student to class
  const handleAssignToClass = (record) => {
    setAssignClassModal({
      visible: true,
      student: record,
    });
  };

  // Handle remove student from class
  const handleRemoveFromClass = (record) => {
    const studentName = `${record.firstName || ''} ${record.lastName || ''}`.trim() || record.userName;
    const className = record.currentClassInfo?.name || 'current class';
    
    setConfirmModal({
      visible: true,
      title: 'Remove from Class',
      content: `Are you sure you want to remove student "${studentName}" from class "${className}"?`,
      onConfirm: () => {
        // TODO: Implement API call to remove student from class
        console.log('Removing student from class:', record);
        
        // Update local state
        const updatedStudents = students.map(s => 
          s.id === record.id ? { ...s, currentClassInfo: null } : s
        );
        setStudents(updatedStudents);
        setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
        
        spaceToast.success(`Student "${studentName}" has been removed from class "${className}"`);
      }
    });
  };

  // Handle assign class modal close
  const handleAssignClassClose = () => {
    setAssignClassModal({
      visible: false,
      student: null,
    });
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

      // Combine new students with existing ones and sort by status
      const allStudents = [...newStudents, ...students];
      const sortedStudents = allStudents.sort((a, b) => {
        // ACTIVE status gets priority (appears first)
        if (a.status === 'ACTIVE' && b.status === 'INACTIVE') {
          return -1;
        }
        if (a.status === 'INACTIVE' && b.status === 'ACTIVE') {
          return 1;
        }
        // If both have same status, maintain original order
        return 0;
      });
      
      setStudents(sortedStudents);
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
            <div className="search-section" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Input
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                className={`search-input ${theme}-search-input`}
                style={{ flex: '1', minWidth: '250px', maxWidth: '400px', width: '350px', height: '40px', fontSize: '16px' }}
               
                allowClear
              />
              <Select
                mode="multiple"
                placeholder="Status"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                style={{ minWidth: '200px', color: '#000' }}
                allowClear
                maxTagCount={2}
                maxTagPlaceholder="..."
              >
                {statusOptions.map(option => (
                  <Option key={option.key} value={option.key} style={{ color: '#000' }}>
                    {option.label}
                  </Option>
                ))}
              </Select>
              <Select
                mode="multiple"
                placeholder="Role"
                value={roleNameFilter}
                onChange={handleRoleFilterChange}
                style={{ minWidth: '200px', color: '#000' }}
                allowClear
                maxTagCount={2}
                maxTagPlaceholder="..."
              >
                {roleOptions.map(option => (
                  <Option key={option.key} value={option.key} style={{ color: '#000' }}>
                    {option.label}
                  </Option>
                ))}
              </Select>
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
                dataSource={students}
                rowKey="id"
                pagination={{
                  ...pagination,
                  className: `${theme}-pagination`,
                  pageSizeOptions: ['5', '10', '20', '50', '100'],
                }}
                onChange={handleTableChange}
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
          width={800}
          okText={editingStudent ? t('common.save') : t('studentManagement.addStudent')}
          cancelText={t('common.cancel')}
        >
          <Form form={form} layout="vertical">
            {/* Basic Information */}
            <Title level={5} style={{ marginBottom: '16px', color: '#1890ff' }}>
              Basic Information
            </Title>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={
                    <span>
                      Role Name
                      <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                    </span>
                  }
                  name="roleName"
                  rules={[
                    { required: true, message: 'Role name is required' },
                  ]}
                >
                  <Select placeholder="Select role">
                    <Option value="STUDENT">Student</Option>
                    <Option value="TEST_TAKER">Test Taker</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={
                    <span>
                      Email
                      <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                    </span>
                  }
                  name="email"
                  rules={[
                    { required: true, message: 'Email is required' },
                    { type: 'email', message: 'Please enter a valid email' },
                    { max: 255, message: 'Email must not exceed 255 characters' },
                  ]}
                >
                  <Input placeholder="Enter email address" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={
                    <span>
                      First Name
                      <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                    </span>
                  }
                  name="firstName"
                  rules={[
                    { required: true, message: 'First name is required' },
                    { max: 50, message: 'First name must not exceed 50 characters' },
                  ]}
                >
                  <Input placeholder="Enter first name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={
                    <span>
                      Last Name
                      <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                    </span>
                  }
                  name="lastName"
                  rules={[
                    { required: true, message: 'Last name is required' },
                    { max: 50, message: 'Last name must not exceed 50 characters' },
                  ]}
                >
                  <Input placeholder="Enter last name" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Date of Birth"
                  name="dateOfBirth"
                >
                  <DatePicker 
                    style={{ width: '100%' }}
                    placeholder="Select date of birth"
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Address"
                  name="address"
                  rules={[
                    { max: 255, message: 'Address must not exceed 255 characters' },
                  ]}
                >
                  <Input placeholder="Enter address" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Phone Number"
                  name="phoneNumber"
                  rules={[
                    { max: 20, message: 'Phone number must not exceed 20 characters' },
                  ]}
                >
                  <Input placeholder="Enter phone number" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Gender"
                  name="gender"
                  rules={[
                    { max: 10, message: 'Gender must not exceed 10 characters' },
                  ]}
                >
                  <Radio.Group>
                    <Radio value="Male">Male</Radio>
                    <Radio value="Female">Female</Radio>
                    <Radio value="Other">Other</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Level"
                  name="levelId"
                  rules={[
                    { required: true, message: 'Level is required' },
                  ]}
                >
                  <Select 
                    placeholder="Select level"
                    loading={levelsLoading}
                    showSearch
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {levels.map(level => (
                      <Option key={level.id} value={level.id}>
                        {level.name} ({level.code})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="Avatar"
                  name="avatar"
                  valuePropName="fileList"
                  getValueFromEvent={(e) => {
                    if (Array.isArray(e)) {
                      return e;
                    }
                    return e && e.fileList;
                  }}
                >
                  <Upload.Dragger
                    name="avatar"
                    listType="picture"
                    maxCount={1}
                    beforeUpload={() => false}
                    accept="image/*"
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag image to upload</p>
                    <p className="ant-upload-hint">Support for single image upload</p>
                  </Upload.Dragger>
                </Form.Item>
              </Col>
            </Row>

            {/* Parent Information */}
            <Title level={5} style={{ marginTop: '24px', marginBottom: '16px', color: '#1890ff' }}>
              Parent Information
            </Title>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={
                    <span>
                      Parent Name
                      <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                    </span>
                  }
                  name={['parentInfo', 'parentName']}
                  rules={[
                    { required: true, message: 'Parent name is required' },
                  ]}
                >
                  <Input placeholder="Enter parent name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Parent Email"
                  name={['parentInfo', 'parentEmail']}
                  rules={[
                    { type: 'email', message: 'Please enter a valid email' },
                  ]}
                >
                  <Input placeholder="Enter parent email" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={
                    <span>
                      Parent Phone
                      <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                    </span>
                  }
                  name={['parentInfo', 'parentPhone']}
                  rules={[
                    { required: true, message: 'Parent phone is required' },
                  ]}
                >
                  <Input placeholder="Enter parent phone number" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Relationship"
                  name={['parentInfo', 'relationship']}
                >
                  <Input placeholder="Enter relationship (e.g., Father, Mother, Guardian)" />
                </Form.Item>
              </Col>
            </Row>

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

            <div
              style={{
                marginBottom: '20px',
                border: '2px dashed #d9d9d9',
                borderRadius: '8px',
                background: '#fafafa',
                padding: '40px',
                textAlign: 'center',
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
            </div>

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

        {/* Assign to Class Modal */}
        <Modal
          title={
            <div style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#1890ff',
              textAlign: 'center',
              padding: '10px 0'
            }}>
              Assign Student to Class
            </div>
          }
          open={assignClassModal.visible}
          onCancel={handleAssignClassClose}
          footer={null}
          width={800}
          centered
        >
          {assignClassModal.student && (
            <AssignStudentToClass
              student={assignClassModal.student}
              onClose={handleAssignClassClose}
            />
          )}
        </Modal>

    </ThemedLayout>
  );
};

export default StudentList;
