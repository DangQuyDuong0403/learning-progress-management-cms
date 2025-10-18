import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import usePageTitle from "../../../../hooks/usePageTitle";
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
  Switch,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  CheckOutlined,
  StopOutlined,
  EyeOutlined,
  DownloadOutlined,
  UploadOutlined,
  InboxOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import { useTheme } from "../../../../contexts/ThemeContext";
import "./StudentList.css";
import { spaceToast } from "../../../../component/SpaceToastify";
import studentManagementApi from "../../../../apis/backend/StudentManagement";
import AssignStudentToClass from "./AssignStudentToClass";
import { useDispatch, useSelector } from "react-redux";
import { fetchLevels } from "../../../../redux/level";

const { Option } = Select;
const { Title, Text } = Typography;

const StudentList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Set page title
  usePageTitle('Student Management');
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const { levels, loading: levelsLoading } = useSelector((state) => state.level);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  
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
  
  // Sort state - start with createdAt DESC (newest first)
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  
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
  const [filterDropdown, setFilterDropdown] = useState({
    visible: false,
    selectedRoles: [],
    selectedStatuses: [],
  });
  
  // Refs for click outside detection
  const filterContainerRef = useRef(null);

  const fetchStudents = useCallback(async (page = 1, size = 10, search = '', statusFilter = [], roleNameFilter = [], sortField = null, sortDirection = null) => {
    setLoading(true);
    try {
      const params = {
        page: page - 1, // API uses 0-based indexing
        size: size,
      };

      // Add sort parameters
      if (sortField && sortDirection) {
        params.sortBy = sortField;
        params.sortDir = sortDirection;
      }

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
      const response = await studentManagementApi.getStudents(params);
      
      if (response.success && response.data) {
        setStudents(response.data);
        setTotalStudents(response.totalElements || response.data.length);
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize: size,
          total: response.totalElements || response.data.length,
        }));
      } else {
        setStudents([]);
        setTotalStudents(0);
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
      setTotalStudents(0);
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

  // Handle click outside to close filter dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdown.visible && filterContainerRef.current) {
        // Check if click is outside the filter container
        if (!filterContainerRef.current.contains(event.target)) {
          setFilterDropdown(prev => ({
            ...prev,
            visible: false,
          }));
        }
      }
    };

    // Add event listener when dropdown is visible
    if (filterDropdown.visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filterDropdown.visible]);


  // Status options for filter
  const statusOptions = [
    { key: "ACTIVE", label: t('studentManagement.active') },
    { key: "INACTIVE", label: t('studentManagement.inactive') },
    { key: "PENDING", label: t('studentManagement.pending') },
  ];

  // Role options for filter
  const roleOptions = [
    { key: "STUDENT", label: t('common.student') },
    { key: "TEST_TAKER", label: t('common.testTaker') },
  ];

  // Table columns
  const columns = [
    {
      title: t('studentManagement.stt'),
      key: "stt",
      width: 50,
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
      title: t('studentManagement.fullName'),
      dataIndex: "firstName",
      key: "fullName",
      width: 120,
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      ellipsis: true,
      render: (_, record) => (
        <span className="fullname-text">
          {`${record.firstName || ''} ${record.lastName || ''}`.trim()}
        </span>
      ),
    },
    {
      title: t('studentManagement.role'),
      dataIndex: "roleName",
      key: "roleName",
      width: 80,
      ellipsis: true,
      render: (roleName) => {
        const getRoleDisplayName = (role) => {
          if (!role) return 'N/A';
          switch (role.toUpperCase()) {
            case 'STUDENT':
              return t('common.student');
            case 'TEST_TAKER':
              return t('common.testTaker');
            default:
              return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
          }
        };
        return (
          <span className="role-text">
            {getRoleDisplayName(roleName)}
          </span>
        );
      },
    },
    {
      title: t('studentManagement.currentLevel'),
      dataIndex: "currentLevelInfo",
      key: "currentLevelInfo",
      width: 100,
      ellipsis: true,
      render: (currentLevelInfo) => {
        // Debug logging to check level data structure
        if (currentLevelInfo) {
          console.log('Current Level Info:', currentLevelInfo);
        }
        return (
          <span className="level-text">
            {currentLevelInfo?.levelName || currentLevelInfo?.name || 'N/A'}
          </span>
        );
      },
    },
    {
      title: t('studentManagement.currentClass'),
      dataIndex: "currentClassInfo",
      key: "currentClassInfo",
      width: 120,
      ellipsis: true,
      render: (currentClassInfo, record) => {
        if (currentClassInfo?.name) {
          return (
            <span className="class-text">
              {currentClassInfo.name}
            </span>
          );
        } else {
          return (
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => handleAssignToClass(record)}
              className={`assign-class-button ${theme}-assign-class-button`}
              style={{
                fontSize: '12px',
                height: '28px',
                padding: '0 8px',
                backgroundColor: '#52c41a',
                borderColor: '#52c41a',
                borderRadius: '4px'
              }}
            >
              {t('studentManagement.assignToClass')}
            </Button>
          );
        }
      },
    },
    {
      title: t('studentManagement.status'),
      dataIndex: "status",
      key: "status",
      width: 80,
      align: 'center',
      render: (status, record) => {
        if (status === 'PENDING') {
          return <span style={{ color: '#000' }}>{t('studentManagement.pending')}</span>;
        }
        
        return (
          <Switch
            checked={status === 'ACTIVE'}
            onChange={() => handleToggleStatus(record.id)}
            size="large"
            style={{
              transform: 'scale(1.2)',
            }}
          />
        );
      },
    },
    {
      title: t('studentManagement.actions'),
      key: "actions",
      width: 80,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('studentManagement.viewProfile')}>
            <Button
              type="text"
              icon={<EyeOutlined style={{ fontSize: '25px' }} />}
              size="small"
              onClick={() => handleViewProfile(record)}
              style={{ 
                color: '#000',
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
      let newSortBy = sorter.field;
      let newSortDir = 'asc'; // Default to asc for first click
      
      // Determine sort direction
      if (sorter.order === 'ascend') {
        newSortDir = 'asc';
      } else if (sorter.order === 'descend') {
        newSortDir = 'desc';
      } else if (sorter.order === undefined) {
        // First click on column - start with asc
        newSortDir = 'asc';
      }
      
      // Map column field to API field
      if (sorter.field === 'firstName') {
        newSortBy = 'firstName'; // Sort by firstName for Full Name column
      } else if (sorter.field === 'status') {
        newSortBy = 'status'; // Sort by status
      }
      
      console.log('Setting sort:', { newSortBy, newSortDir });
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
            const response = await studentManagementApi.updateStudentStatus(id, newStatus);
            
            if (response.success) {
              // Refresh the list to get updated data from server
              fetchStudents(pagination.current, pagination.pageSize, searchText, statusFilter, roleNameFilter, sortBy, sortDir);
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
            spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message || t('studentManagement.updateStatusError'));
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
      
      // Format the data according to CreateStudentRequest schema from API
      const studentData = {
        roleName: values.roleName, // STUDENT or TEST_TAKER
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        avatarUrl: "string", // Always send "string" as per API example
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DDTHH:mm:ss.SSS') + 'Z' : null,
        address: values.address || null,
        phoneNumber: values.phoneNumber || null,
        gender: values.gender || null, // MALE, FEMALE, OTHER
        parentInfo: {
          parentName: values.parentInfo?.parentName || "",
          parentEmail: values.parentInfo?.parentEmail || null,
          parentPhone: values.parentInfo?.parentPhone || "",
          relationship: values.parentInfo?.relationship || null,
        },
        levelId: values.levelId,
      };
      
      console.log('Student form values:', studentData);
      
      if (editingStudent) {
        // TODO: Call update student API
        spaceToast.success(`Update student "${values.firstName} ${values.lastName}" successfully`);
      } else {
        try {
          // Call create student API
          const response = await studentManagementApi.createStudent(studentData);
          
          if (response.success) {
            spaceToast.success(`Add student "${values.firstName} ${values.lastName}" successfully`);
            // Refresh the list after adding
            fetchStudents(1, pagination.pageSize, searchText, statusFilter, roleNameFilter, sortBy, sortDir);
          } else {
            throw new Error(response.message || 'Failed to create student');
          }
        } catch (error) {
          console.error('Error creating student:', error);
          
          // Check if it's a timeout error but data might have been created
          if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
            spaceToast.warning('Request timeout - please check if student was created successfully');
            // Still refresh the list in case data was created
            fetchStudents(1, pagination.pageSize, searchText, statusFilter, roleNameFilter, sortBy, sortDir);
          } else {
            spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create student');
            return; // Don't close modal on actual error
          }
        }
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Form validation error:', error);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  // Handle view student profile
  const handleViewProfile = (record) => {
    console.log('View profile for student:', record);
    console.log('Student ID:', record.id);
    if (!record.id) {
      spaceToast.error('Student ID not found');
      return;
    }
    navigate(`/manager/student/${record.id}/profile`);
  };

  // Handle assign student to class
  const handleAssignToClass = (record) => {
    setAssignClassModal({
      visible: true,
      student: record,
    });
  };


  // Handle assign class modal close
  const handleAssignClassClose = () => {
    setAssignClassModal({
      visible: false,
      student: null,
    });
  };

  // Handle filter dropdown toggle
  const handleFilterToggle = () => {
    setFilterDropdown(prev => ({
      ...prev,
      visible: !prev.visible,
      selectedRoles: prev.visible ? prev.selectedRoles : [...roleNameFilter],
      selectedStatuses: prev.visible ? prev.selectedStatuses : [...statusFilter],
    }));
  };

  // Handle filter submission
  const handleFilterSubmit = () => {
    setRoleNameFilter(filterDropdown.selectedRoles);
    setStatusFilter(filterDropdown.selectedStatuses);
    setFilterDropdown(prev => ({
      ...prev,
      visible: false,
    }));
    // Reset to first page when applying filters
    fetchStudents(1, pagination.pageSize, searchText, filterDropdown.selectedStatuses, filterDropdown.selectedRoles, sortBy, sortDir);
  };

  // Handle filter reset
  const handleFilterReset = () => {
    setFilterDropdown(prev => ({
      ...prev,
      selectedRoles: [],
      selectedStatuses: [],
    }));
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

      // Refresh the list to get updated data from server
      fetchStudents(pagination.current, pagination.pageSize, searchText, statusFilter, roleNameFilter, sortBy, sortDir);
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
          {/* Page Title */}
          <div className="page-title-container">
            <Typography.Title 
              level={1} 
              className="page-title"
            >
              {t('studentManagement.title')} ({totalStudents})
            </Typography.Title>
          </div>
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
              <div ref={filterContainerRef} style={{ position: 'relative' }}>
                <Button 
                  icon={<FilterOutlined />}
                  onClick={handleFilterToggle}
                  className={`filter-button ${theme}-filter-button ${filterDropdown.visible ? 'active' : ''} ${(statusFilter.length > 0 || roleNameFilter.length > 0) ? 'has-filters' : ''}`}
                >
                  {t('common.filter')}
                </Button>
                
                {/* Filter Dropdown Panel */}
                {filterDropdown.visible && (
                  <div className={`filter-dropdown-panel ${theme}-filter-dropdown`}>
                    <div style={{ padding: '20px' }}>
                      {/* Role and Status Filters in same row */}
                      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                        {/* Role Filter */}
                        <div style={{ flex: 1 }}>
                          <Title level={5} style={{ marginBottom: '12px', fontSize: '16px' }}>
                            Role
                          </Title>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {roleOptions.map(option => (
                              <Button
                                key={option.key}
                                onClick={() => {
                                  const newRoles = filterDropdown.selectedRoles.includes(option.key)
                                    ? filterDropdown.selectedRoles.filter(role => role !== option.key)
                                    : [...filterDropdown.selectedRoles, option.key];
                                  setFilterDropdown(prev => ({ ...prev, selectedRoles: newRoles }));
                                }}
                                className={`filter-option ${filterDropdown.selectedRoles.includes(option.key) ? 'selected' : ''}`}
                              >
                                {option.label}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Status Filter */}
                        <div style={{ flex: 1 }}>
                          <Title level={5} style={{ marginBottom: '12px', fontSize: '16px' }}>
                            Status
                          </Title>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {statusOptions.map(option => (
                              <Button
                                key={option.key}
                                onClick={() => {
                                  const newStatuses = filterDropdown.selectedStatuses.includes(option.key)
                                    ? filterDropdown.selectedStatuses.filter(status => status !== option.key)
                                    : [...filterDropdown.selectedStatuses, option.key];
                                  setFilterDropdown(prev => ({ ...prev, selectedStatuses: newStatuses }));
                                }}
                                className={`filter-option ${filterDropdown.selectedStatuses.includes(option.key) ? 'selected' : ''}`}
                              >
                                {option.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginTop: '20px',
                        paddingTop: '16px',
                        borderTop: '1px solid #f0f0f0'
                      }}>
                        <Button
                          onClick={handleFilterReset}
                          className="filter-reset-button"
                        >
                          {t('common.reset')}
                        </Button>
                        <Button
                          type="primary"
                          onClick={handleFilterSubmit}
                          className="filter-submit-button"
                        >
                          {t('common.viewResults')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
                scroll={{ y: 400 }}
                className={`student-table ${theme}-student-table`}
                showSorterTooltip={false}
                sortDirections={['ascend', 'descend']}
                defaultSortOrder={
                  sortBy === 'firstName' ? (sortDir === 'asc' ? 'ascend' : 'descend') :
                  sortBy === 'status' ? (sortDir === 'asc' ? 'ascend' : 'descend') :
                  null
                }
              />
            </LoadingWithEffect>
          </div>
        </div>

        <Modal
          title={
            <div style={{ 
              fontSize: '22px', 
              fontWeight: '600', 
              color: '#000000ff',
              textAlign: 'center',
              padding: '8px 0'
            }}>
              {editingStudent ? t('studentManagement.editStudent') : t('studentManagement.addNewStudent')}
            </div>
          }
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={700}
          okText={editingStudent ? t('common.save') : t('studentManagement.addStudent')}
          cancelText={t('common.cancel')}
          okButtonProps={{
            style: {
              backgroundColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
              background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
              borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'transparent',
              color: theme === 'sun' ? '#000000' : '#ffffff',
              height: '36px',
              fontSize: '14px',
              fontWeight: '500',
              minWidth: '100px',
            },
          }}
          cancelButtonProps={{
            style: {
              height: '36px',
              fontSize: '14px',
              fontWeight: '500',
              minWidth: '80px',
            },
          }}
        >
          <Form form={form} layout="vertical">
            {/* Basic Information */}
            <Title level={5} style={{ marginBottom: '16px', color: '#1890ff' }}>
              {t('studentManagement.basicInformation')}
            </Title>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={
                    <span>
                      {t('studentManagement.roleName')}
                      <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                    </span>
                  }
                  name="roleName"
                  rules={[
                    { required: true, message: t('studentManagement.roleNameRequired') },
                  ]}
                >
                  <Select placeholder={t('studentManagement.selectRole')}>
                    <Option value="STUDENT">{t('common.student')}</Option>
                    <Option value="TEST_TAKER">{t('common.testTaker')}</Option>
                  </Select>
                </Form.Item>
              </Col>
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
                    { max: 255, message: t('studentManagement.emailMaxLength') },
                  ]}
                >
                  <Input placeholder={t('studentManagement.enterEmail')} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={
                    <span>
                      {t('studentManagement.firstName')}
                      <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                    </span>
                  }
                  name="firstName"
                  rules={[
                    { required: true, message: t('studentManagement.firstNameRequired') },
                    { max: 50, message: t('studentManagement.firstNameMaxLength') },
                  ]}
                >
                  <Input placeholder={t('studentManagement.enterFirstName')} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={
                    <span>
                      {t('studentManagement.lastName')}
                      <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                    </span>
                  }
                  name="lastName"
                  rules={[
                    { required: true, message: t('studentManagement.lastNameRequired') },
                    { max: 50, message: t('studentManagement.lastNameMaxLength') },
                  ]}
                >
                  <Input placeholder={t('studentManagement.enterLastName')} />
                </Form.Item>
              </Col>
            </Row>

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
                  label={t('studentManagement.address')}
                  name="address"
                  rules={[
                    { max: 255, message: t('studentManagement.addressMaxLength') },
                  ]}
                >
                  <Input placeholder={t('studentManagement.enterAddress')} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={t('studentManagement.phoneNumber')}
                  name="phoneNumber"
                  rules={[
                    { max: 20, message: t('studentManagement.phoneMaxLength') },
                  ]}
                >
                  <Input placeholder={t('studentManagement.enterPhoneNumber')} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={t('studentManagement.gender')}
                  name="gender"
                  rules={[
                    { max: 10, message: t('studentManagement.genderMaxLength') },
                  ]}
                >
                  <Radio.Group>
                    <Radio value="MALE">{t('studentManagement.male')}</Radio>
                    <Radio value="FEMALE">{t('studentManagement.female')}</Radio>
                    <Radio value="OTHER">{t('studentManagement.other')}</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={t('studentManagement.level')}
                  name="levelId"
                >
                  <Select 
                    placeholder={t('studentManagement.selectLevel')}
                    loading={levelsLoading}
                    showSearch
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                    notFoundContent={levelsLoading ? t("common.loading") : t("studentManagement.noLevelsFound")}
                  >
                    {levels && levels.length > 0 ? (
                      levels.map(level => {
                        // Handle different field names that might come from API
                        const levelName = level.name || level.levelName || level.title || 'Unknown Level';
                        const levelCode = level.code || level.levelCode || level.code || '';
                        
                        return (
                          <Option key={level.id} value={level.id}>
                            {levelName} {levelCode ? `(${levelCode})` : ''}
                          </Option>
                        );
                      })
                    ) : (
                      !levelsLoading && (
                        <Option disabled value="">
                          No levels available
                        </Option>
                      )
                    )}
                  </Select>
                </Form.Item>
              </Col>
            </Row>


            {/* Parent Information */}
            <Title level={5} style={{ marginTop: '24px', marginBottom: '16px', color: '#1890ff' }}>
              {t('studentManagement.parentInformation')}
            </Title>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={
                    <span>
                      {t('studentManagement.parentName')}
                      <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                    </span>
                  }
                  name={['parentInfo', 'parentName']}
                  rules={[
                    { required: true, message: t('studentManagement.parentNameRequired') },
                  ]}
                >
                  <Input placeholder={t('studentManagement.enterParentName')} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={t('studentManagement.parentEmail')}
                  name={['parentInfo', 'parentEmail']}
                  rules={[
                    { type: 'email', message: t('studentManagement.emailInvalid') },
                  ]}
                >
                  <Input placeholder={t('studentManagement.enterParentEmail')} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={
                    <span>
                      {t('studentManagement.parentPhone')}
                      <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                    </span>
                  }
                  name={['parentInfo', 'parentPhone']}
                  rules={[
                    { required: true, message: t('studentManagement.parentPhoneRequired') },
                  ]}
                >
                  <Input placeholder={t('studentManagement.enterParentPhone')} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={t('studentManagement.relationship')}
                  name={['parentInfo', 'relationship']}
                >
                  <Input placeholder={t('studentManagement.enterRelationship')} />
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
              backgroundColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
              background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
              borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'transparent',
              color: theme === 'sun' ? '#000000' : '#ffffff',
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
                color: '#000000',
                textAlign: 'center',
                padding: '10px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}>
              <DownloadOutlined style={{ color: '#000000' }} />
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
              backgroundColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
              background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
              borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'transparent',
              color: theme === 'sun' ? '#000000' : '#ffffff',
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

            <Title
              level={5}
              style={{
                textAlign: 'center',
                marginBottom: '20px',
                color: '#666',
              }}>
              {t('studentManagement.importInstructions')}
            </Title>

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
                <DownloadOutlined />
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
              {t('studentManagement.assignStudentToClass')}
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
