import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  Table,
  Space,
  Input,
  Modal,
  Upload,
  Typography,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import ThemedLayoutWithSidebar from "../../../../component/ThemedLayout";
import ThemedLayoutNoSidebar from "../../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./ClassStudent.css";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useClassMenu } from "../../../../contexts/ClassMenuContext";
import classManagementApi from "../../../../apis/backend/classManagement";
import usePageTitle from "../../../../hooks/usePageTitle";

const { Title } = Typography;

// Mock data for all available students (for autocomplete) - keeping for add student functionality
const mockAllStudents = [
  { id: 10, code: "HE176502", name: "Nguyễn Đức Anh", email: "anhndhe176502@fpt.edu.vn" },
  { id: 11, code: "HE176501", name: "Nguyễn Đức Anh", email: "anhndhe176501@fpt.edu.vn" },
  { id: 12, code: "HE176503", name: "Trần Văn Bình", email: "binhtvhe176503@fpt.edu.vn" },
  { id: 13, code: "HE176504", name: "Lê Thị Cường", email: "cuonglthe176504@fpt.edu.vn" },
  { id: 14, code: "HE176505", name: "Phạm Văn Dũng", email: "dungpvhe176505@fpt.edu.vn" },
  { id: 15, code: "HE176506", name: "Hoàng Thị Em", email: "emhthe176506@fpt.edu.vn" },
];

const ClassStudent = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { theme } = useTheme();
  const { user } = useSelector((state) => state.auth);
  const { enterClassMenu, exitClassMenu } = useClassMenu();
  
  // Determine which layout to use based on user role
  const userRole = user?.role?.toLowerCase();
  const ThemedLayout = (userRole === 'teacher' || userRole === 'teaching_assistant') 
    ? ThemedLayoutNoSidebar 
    : ThemedLayoutWithSidebar;
  
  // Set page title
  usePageTitle('Class Students');
  
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
  const [importModal, setImportModal] = useState({
    visible: false,
    fileList: [],
    uploading: false
  });
  const [filterDropdown, setFilterDropdown] = useState({
    visible: false,
    selectedStatuses: [],
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  // Sort state
  const [sortConfig, setSortConfig] = useState({
    sortBy: 'joinedAt',
    sortDir: 'desc',
  });
  
  // Refs for click outside detection
  const filterContainerRef = useRef(null);

  // Status options for filter
  const statusOptions = [
    { key: "ACTIVE", label: t('classDetail.active') },
    { key: "INACTIVE", label: t('classDetail.inactive') },
    { key: "DROPPED", label: t('classDetail.dropped') },
  ];

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

  // Handle filter dropdown toggle
  const handleFilterToggle = () => {
    setFilterDropdown(prev => ({
      ...prev,
      visible: !prev.visible,
      selectedStatuses: prev.visible ? prev.selectedStatuses : [statusFilter].filter(s => s !== 'all'),
    }));
  };

  // Handle filter submission
  const handleFilterSubmit = () => {
    if (filterDropdown.selectedStatuses.length > 0) {
      setStatusFilter(filterDropdown.selectedStatuses[0]);
    } else {
      setStatusFilter('all');
    }
    setFilterDropdown(prev => ({
      ...prev,
      visible: false,
    }));
  };

  // Handle filter reset
  const handleFilterReset = () => {
    setFilterDropdown(prev => ({
      ...prev,
      selectedStatuses: [],
    }));
  };

  const fetchClassData = useCallback(async () => {
    try {
      const response = await classManagementApi.getClassDetail(id);
      console.log('Class detail response:', response);
      const data = response?.data?.data ?? response?.data ?? null;
      if (data) {
        const mapped = {
          id: data.id ?? id,
          name:
            data.name ??
            data.className ??
            data.classname ??
            data.class_name ??
            data.title ??
            data.classTitle ??
            '',
        };
        setClassData(mapped);
      }
    } catch (error) {
      console.error('Error fetching class data:', error);
      spaceToast.error(t('classDetail.loadingClassInfo'));
    }
  }, [id, t]);

  const fetchStudents = useCallback(async (params = {}) => {
    try {
      const apiParams = {
        page: params.page !== undefined ? params.page : 0, // Default to first page
        size: params.size !== undefined ? params.size : 10, // Default page size
        text: params.text !== undefined ? params.text : '',
        status: params.status !== undefined ? params.status : 'all',
        sortBy: params.sortBy !== undefined ? params.sortBy : 'joinedAt',
        sortDir: params.sortDir !== undefined ? params.sortDir : 'desc',
      };
      
      console.log('Fetching students with params:', apiParams);
      const response = await classManagementApi.getClassStudents(id, apiParams);
      console.log('Students response:', response);
      
      if (response.success) {
        setStudents(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.totalElements || 0,
          current: (response.page || 0) + 1, // Convert 0-based to 1-based
        }));
      } else {
        spaceToast.error(response.message || t('classDetail.loadingStudents'));
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      spaceToast.error(t('classDetail.loadingStudents'));
      setStudents([]);
    }
  }, [id, t]);

  // Initial data loading
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchClassData(),
      fetchStudents()
    ]).finally(() => {
      setLoading(false);
    });
  }, [id]);

  // Ensure header back button appears immediately while class info loads
  useEffect(() => {
    if (id) {
      enterClassMenu({ id });
    }
    return () => {
      exitClassMenu();
    };
  }, [id]);

  // Enter class menu mode when component mounts
  useEffect(() => {
    if (classData) {
      enterClassMenu({
        id: classData.id,
        name: classData.name,
        description: `${t('classDetail.students')} (${students.length})`
      });
    }
    
    // Cleanup function to exit class menu mode when leaving
    return () => {
      exitClassMenu();
    };
  }, [classData?.id, classData?.name, students.length]);

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
      // Remove student from local state immediately for better UX
      const updatedStudents = students.filter(s => s.userId !== studentToDelete.userId);
      setStudents(updatedStudents);
      
      // Update pagination total
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1,
      }));
      
      const fullName = studentToDelete.fullName || `${studentToDelete.firstName || ''} ${studentToDelete.lastName || ''}`.trim();
      spaceToast.success(`${t('classDetail.deleteSuccess')} "${fullName}" ${t('classDetail.fromClass')}`);
      setIsDeleteModalVisible(false);
      setStudentToDelete(null);
      
      // TODO: Call API to remove student from class
      // await classManagementApi.removeStudentFromClass(id, studentToDelete.userId);
    }
  };

  const handleCancelDelete = () => {
    console.log("Delete cancelled");
    setIsDeleteModalVisible(false);
    setStudentToDelete(null);
  };

  const handleImport = () => {
    setImportModal(prev => ({
      ...prev,
      visible: true,
      fileList: [],
      uploading: false
    }));
  };

  const handleImportOk = async () => {
    setImportModal(prev => ({ ...prev, uploading: true }));
    
    try {
      // TODO: Implement import functionality
      spaceToast.success(t('classDetail.importSuccess'));
      setImportModal(prev => ({
        ...prev,
        visible: false,
        fileList: [],
        uploading: false
      }));
      
      // Refresh the data
      fetchStudents({
        page: pagination.current - 1,
        size: pagination.pageSize,
        text: searchText,
        status: statusFilter,
        sortBy: sortConfig.sortBy,
        sortDir: sortConfig.sortDir
      });
    } catch (error) {
      console.error('Import error:', error);
      spaceToast.error('Failed to import students');
    } finally {
      setImportModal(prev => ({ ...prev, uploading: false }));
    }
  };

  const handleImportCancel = () => {
    setImportModal(prev => ({
      ...prev,
      visible: false,
      fileList: [],
      uploading: false
    }));
  };

  const handleDownloadTemplate = async () => {
    try {
      // TODO: Implement template download functionality
      spaceToast.success(t('classDetail.templateDownloaded'));
    } catch (error) {
      console.error('Error downloading template:', error);
      spaceToast.error('Failed to download template');
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    spaceToast.success(t('classDetail.exportSuccess'));
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
      ACTIVE: { text: t('classDetail.active') },
      INACTIVE: { text: t('classDetail.inactive') },
      DROPPED: { text: t('classDetail.dropped') },
    };

    const config = statusConfig[status] || statusConfig.INACTIVE;
    return <span style={{ color: '#000000', fontSize: '20px' }}>{config.text}</span>;
  };

  // Track if this is the initial load
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Single useEffect to handle all changes with debounce
  useEffect(() => {
    // Skip the first load since it's handled by the initial useEffect
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const apiParams = {
          page: 0,
          size: pagination.pageSize,
          text: searchText,
          status: statusFilter,
          sortBy: sortConfig.sortBy,
          sortDir: sortConfig.sortDir,
        };
        
        console.log('Fetching students with params:', apiParams);
        const response = await classManagementApi.getClassStudents(id, apiParams);
        console.log('Students response:', response);
        
        if (response.success) {
          setStudents(response.data || []);
          setPagination(prev => ({
            ...prev,
            total: response.totalElements || 0,
            current: 1,
          }));
        } else {
          spaceToast.error(response.message || t('classDetail.loadingStudents'));
          setStudents([]);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        spaceToast.error(t('classDetail.loadingStudents'));
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchText, statusFilter, sortConfig.sortBy, sortConfig.sortDir, pagination.pageSize, id, t]);
  
  // Handle pagination change
  const handleTableChange = (paginationInfo, filters, sorter) => {
    console.log('Table change:', { paginationInfo, filters, sorter });
    
    // Handle pagination - only update state, don't call API here
    if (paginationInfo.current !== pagination.current || paginationInfo.pageSize !== pagination.pageSize) {
      setPagination(prev => ({
        ...prev,
        current: paginationInfo.current,
        pageSize: paginationInfo.pageSize,
      }));
    }
    
    // Handle sorting - this will trigger the main useEffect
    if (sorter && sorter.field) {
      const newSortConfig = {
        sortBy: sorter.field,
        sortDir: sorter.order === 'ascend' ? 'asc' : 'desc',
      };
      setSortConfig(newSortConfig);
    }
  };

  const columns = [
    {
      title: t('classDetail.no'),
      key: 'no',
      width: 60,
      render: (_, record, index) => {
        const no = (pagination.current - 1) * pagination.pageSize + index + 1;
        return <span style={{ fontSize: "20px", fontWeight: 500 }}>{no}</span>;
      },
    },
    {
      title: t('classDetail.fullName'),
      dataIndex: "fullName",
      key: "fullName",
      sorter: true,
      render: (text) => (
        <div className="student-name-text" style={{ fontSize: "20px" }}>
          {text || '-'}
        </div>
      ),
    },
    {
      title: t('classDetail.email'),
      dataIndex: 'email',
      key: 'email',
      sorter: true,
      render: (text) => <span style={{ fontSize: "20px" }}>{text}</span>,
    },
    {
      title: t('classDetail.status'),
      dataIndex: 'status',
      key: 'status',
      sorter: true,
      render: (status) => getStatusTag(status),
    },
    {
      title: t('classDetail.joinedAt'),
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      sorter: true,
      render: (date) => (
        <span style={{ fontSize: "20px" }}>
          {new Date(date).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
    {
      title: t('classDetail.actions'),
      key: "actions",
      width: 100,
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
        <div className={`main-content-panel ${theme}-main-panel`}>
          <LoadingWithEffect loading={true} message={t('classDetail.loadingClassInfo')} />
        </div>
      </ThemedLayout>
    );
  }

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
              Student Management <span className="student-count">({pagination.total})</span>
            </Typography.Title>
          </div>

          {/* Search and Action Section */}
          <div className="search-action-section" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px' }}>
            <Input
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className={`search-input ${theme}-search-input`}
              style={{ flex: '1', minWidth: '250px', maxWidth: '400px', width: '350px', height: '40px', fontSize: '16px' }}
              allowClear
            />
            <div ref={filterContainerRef} style={{ position: 'relative' }}>
              <Button 
                icon={<FilterOutlined />}
                onClick={handleFilterToggle}
                className={`filter-button ${theme}-filter-button ${filterDropdown.visible ? 'active' : ''} ${(statusFilter !== 'all') ? 'has-filters' : ''}`}
              >
                {t('classDetail.filter')}
              </Button>
              
              {/* Filter Dropdown Panel */}
              {filterDropdown.visible && (
                <div className={`filter-dropdown-panel ${theme}-filter-dropdown`}>
                  <div style={{ padding: '20px' }}>
                    {/* Status Filter */}
                    <div style={{ marginBottom: '24px' }}>
                      <Title level={5} style={{ marginBottom: '12px', fontSize: '16px' }}>
                        {t('classDetail.status')}
                      </Title>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {statusOptions.map(option => (
                          <Button
                            key={option.key}
                            onClick={() => {
                              const newStatus = filterDropdown.selectedStatuses.includes(option.key)
                                ? filterDropdown.selectedStatuses.filter(status => status !== option.key)
                                : [...filterDropdown.selectedStatuses, option.key];
                              setFilterDropdown(prev => ({ ...prev, selectedStatuses: newStatus }));
                            }}
                            className={`filter-option ${filterDropdown.selectedStatuses.includes(option.key) ? 'selected' : ''}`}
                          >
                            {option.label}
                          </Button>
                        ))}
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
                        {t('classDetail.reset')}
                      </Button>
                      <Button
                        type="primary"
                        onClick={handleFilterSubmit}
                        className="filter-submit-button"
                      >
                        {t('classDetail.viewResults')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="action-buttons" style={{ marginLeft: 'auto' }}>
              <Button 
                icon={<UploadOutlined />}
                className={`export-button ${theme}-export-button`}
                onClick={handleExport}
              >
                {t('classDetail.exportData')}
              </Button>
              <Button 
                icon={<DownloadOutlined />}
                className={`import-button ${theme}-import-button`}
                onClick={handleImport}
              >
                {t('classDetail.importData')}
              </Button>
              <Button 
                icon={<PlusOutlined />}
                className={`create-button ${theme}-create-button`}
                onClick={handleAddStudent}
              >
                {t('classDetail.addStudent')}
              </Button>
            </div>
          </div>

          {/* Table Section */}
          <div className={`table-section ${theme}-table-section`}>
            <LoadingWithEffect loading={loading} message={t('classDetail.loadingStudents')}>
              <Table
                columns={columns}
                dataSource={students}
                rowKey="userId"
                loading={loading}
                pagination={{
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: pagination.total,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} ${t('classDetail.students')}`,
                  className: `${theme}-pagination`,
                  pageSizeOptions: ['10', '20', '50', '100'],
                }}
                onChange={handleTableChange}
                scroll={{ x: 800 }}
                className={`student-table ${theme}-student-table`}
              />
            </LoadingWithEffect>
          </div>
        </div>

        {/* Add Student Modal */}
        <Modal
          title={
            <div style={{ 
              fontSize: '28px', 
              fontWeight: '600', 
              color: 'rgb(24, 144, 255)',
              textAlign: 'center',
              padding: '10px 0'
            }}>
              {`${t('classDetail.addStudentsToClass')} (${selectedStudents.length} ${t('classDetail.selectedStudents')})`}
            </div>
          }
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={600}
          okText={`${t('classDetail.addStudents')} ${selectedStudents.length} ${t('classDetail.studentsAdded')}`}
          cancelText={t('common.cancel')}
          okButtonProps={{
            style: {
              background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
              borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
              color: theme === 'sun' ? '#000' : '#fff',
              borderRadius: '6px',
              height: '32px',
              fontWeight: '500',
              fontSize: '16px',
              padding: '4px 15px',
              width: '100px',
              transition: 'all 0.3s ease',
              boxShadow: 'none'
            },
          }}
          cancelButtonProps={{
            style: {
              height: '32px',
              fontWeight: '500',
              fontSize: '16px',
              padding: '4px 15px',
              width: '100px'
            },
          }}
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
          title={
            <div
              style={{
                fontSize: '28px',
                fontWeight: '600',
                color: 'rgb(24, 144, 255)',
                textAlign: 'center',
                padding: '10px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}>
              <DownloadOutlined style={{ color: 'rgb(24, 144, 255)' }} />
              {t('classDetail.importStudentsList')}
            </div>
          }
          open={importModal.visible}
          onOk={handleImportOk}
          onCancel={handleImportCancel}
          okText={t('classDetail.importStudentsList')}
          cancelText={t('common.cancel')}
          width={600}
          centered
          confirmLoading={importModal.uploading}
          okButtonProps={{
            disabled: importModal.fileList.length === 0,
            style: {
              background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
              borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
              color: theme === 'sun' ? '#000' : '#fff',
              borderRadius: '6px',
              height: '32px',
              fontWeight: '500',
              fontSize: '16px',
              padding: '4px 15px',
              width: '200px',
              transition: 'all 0.3s ease',
              boxShadow: 'none'
            },
          }}
          cancelButtonProps={{
            style: {
              height: '32px',
              fontWeight: '500',
              fontSize: '16px',
              padding: '4px 15px',
              width: '100px'
            },
          }}
        >
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
                {t('classDetail.downloadTemplate')}
              </Button>
            </div>
            
            <Typography.Title
              level={5}
              style={{
                textAlign: 'center',
                marginBottom: '20px',
                color: '#666',
              }}>
              {t('classDetail.importInstructions')}
            </Typography.Title>

            <Upload.Dragger
              name="file"
              multiple={false}
              beforeUpload={() => false}
              showUploadList={false}
              accept=".xlsx,.xls,.csv"
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
                {t('classDetail.clickOrDragFile')}
              </p>
              <p className='ant-upload-hint' style={{ color: '#999' }}>
                {t('classDetail.supportedFormats')}
              </p>
            </Upload.Dragger>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          title={
            <div style={{ 
              fontSize: '28px', 
              fontWeight: '600', 
              color: 'rgb(24, 144, 255)',
              textAlign: 'center',
              padding: '10px 0'
            }}>
              {t('classDetail.confirmDelete')}
            </div>
          }
          open={isDeleteModalVisible}
          onOk={handleConfirmDelete}
          onCancel={handleCancelDelete}
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
              background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
              borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
              color: theme === 'sun' ? '#000' : '#fff',
              borderRadius: '6px',
              height: '32px',
              fontWeight: '500',
              fontSize: '16px',
              padding: '4px 15px',
              width: '100px',
              transition: 'all 0.3s ease',
              boxShadow: 'none'
            }
          }}
          cancelButtonProps={{
            style: {
              height: '32px',
              fontWeight: '500',
              fontSize: '16px',
              padding: '4px 15px',
              width: '100px'
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
						{t('classDetail.confirmDeleteMessage')}
					</p>
					{studentToDelete && (
						<p style={{
							fontSize: '20px',
							color: '#000',
							margin: 0,
							fontWeight: '400'
						}}>
							<strong>"{studentToDelete.fullName || `${studentToDelete.firstName || ''} ${studentToDelete.lastName || ''}`.trim()}"</strong>
						</p>
					)}
          </div>
        </Modal>
    </ThemedLayout>
  );
};

export default ClassStudent;
  