import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  Table,
  Space,
  Tag,
  Input,
  Modal,
  Upload,
  Radio,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  ImportOutlined,
  ExportOutlined,
  DownloadOutlined,
  UploadOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./ClassStudent.css";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useTheme } from "../../../../contexts/ThemeContext";
import { Typography } from "antd";
import classManagementApi from "../../../../apis/backend/classManagement";

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
  const navigate = useNavigate();
  const { theme } = useTheme();
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
    { key: "ACTIVE", label: "Active" },
    { key: "INACTIVE", label: "Inactive" },
    { key: "PENDING", label: "Pending" },
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
      setClassData(response.data);
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

  // Combined initial data loading
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchClassData(),
        fetchStudents()
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchClassData, fetchStudents]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

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
      
      const fullName = `${studentToDelete.firstName || ''} ${studentToDelete.lastName || ''}`.trim();
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
      ACTIVE: { color: "green", text: "Active" },
      INACTIVE: { color: "red", text: "Inactive" },
      PENDING: { color: "orange", text: "Pending" },
    };

    const config = statusConfig[status] || statusConfig.INACTIVE;
    return <Tag color={config.color}>{config.text}</Tag>;
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

    const timeoutId = setTimeout(() => {
      setLoading(true);
      fetchStudents({
        page: 0, // Always reset to first page for search/filter/sort
        size: pagination.pageSize,
        text: searchText,
        status: statusFilter,
        sortBy: sortConfig.sortBy,
        sortDir: sortConfig.sortDir
      }).finally(() => {
        setLoading(false);
      });
      // Reset pagination to first page
      setPagination(prev => ({ ...prev, current: 1 }));
    }, 300); // Reduced debounce time
    
    return () => clearTimeout(timeoutId);
  }, [searchText, statusFilter, sortConfig.sortBy, sortConfig.sortDir, pagination.pageSize, fetchStudents, isInitialLoad]);
  
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
      
      // Call API with new pagination
      setLoading(true);
      fetchStudents({ 
        page: paginationInfo.current - 1, 
        size: paginationInfo.pageSize,
        text: searchText,
        status: statusFilter,
        sortBy: sortConfig.sortBy,
        sortDir: sortConfig.sortDir
      }).finally(() => {
        setLoading(false);
      });
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
      title: 'No',
      key: 'no',
      width: 60,
      render: (_, record, index) => {
        const no = (pagination.current - 1) * pagination.pageSize + index + 1;
        return <span style={{ fontSize: "20px", fontWeight: 500 }}>{no}</span>;
      },
    },
    {
      title: 'Full Name',
      key: 'fullName',
      sorter: true,
      render: (_, record) => {
        const fullName = `${record.firstName || ''} ${record.lastName || ''}`.trim();
        return (
          <div className="student-name-text" style={{ fontSize: "20px" }}>
            {fullName}
          </div>
        );
      },
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: true,
      render: (text) => <span style={{ fontSize: "20px" }}>{text}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      sorter: true,
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Joined At',
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
          {/* Header Section */}
          <div className={`panel-header ${theme}-panel-header`}>
            <div className="search-section" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(`/manager/classes/menu/${id}`)}
                className={`back-button ${theme}-back-button`}
                style={{ height: '40px', fontSize: '16px' }}
              >
                {t('common.back')}
              </Button>
              <div style={{ flex: '1', textAlign: 'center' }}>
                <h2 className={`class-title ${theme}-class-title`} style={{ margin: 0, fontSize: '36px', fontWeight: '600' }}>
                  {classData?.name}
                </h2>
              </div>
              <div style={{ width: '120px' }}></div> {/* Spacer for centering */}
            </div>
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
                Filter
              </Button>
              
              {/* Filter Dropdown Panel */}
              {filterDropdown.visible && (
                <div className={`filter-dropdown-panel ${theme}-filter-dropdown`}>
                  <div style={{ padding: '20px' }}>
                    {/* Status Filter */}
                    <div style={{ marginBottom: '24px' }}>
                      <Title level={5} style={{ marginBottom: '12px', color: '#298EFE', fontSize: '16px' }}>
                        Status
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
                        Reset
                      </Button>
                      <Button
                        type="primary"
                        onClick={handleFilterSubmit}
                        className="filter-submit-button"
                      >
                        View Results
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="action-buttons" style={{ marginLeft: 'auto' }}>
              <Button 
                icon={<ImportOutlined />}
                className={`import-button ${theme}-import-button`}
                onClick={handleImport}
              >
                {t('classDetail.import')}
              </Button>
              <Button 
                icon={<ExportOutlined />}
                className={`export-button ${theme}-export-button`}
                onClick={handleExport}
              >
                {t('classDetail.export')}
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
            {/* Class Title */}
            <div style={{ marginBottom: '16px', textAlign: 'center' }}>
              <h3 style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                color: '#1e293b',
                margin: 0,
                padding: '12px 0',
                borderBottom: '2px solid #e2e8f0'
              }}>
                {classData?.name} - {t('classDetail.students')}
              </h3>
            </div>
            
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
              <div>• {t('classDetail.totalStudents')} {pagination.total}</div>
              <div>• {t('classDetail.activeStudents')} {students.filter(s => s.status === 'ACTIVE').length}</div>
              <div>• {t('classDetail.inactiveStudents')} {students.filter(s => s.status === 'INACTIVE').length}</div>
              <div>• {t('classDetail.pendingStudents')} {students.filter(s => s.status === 'PENDING').length}</div>
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
          <p>{t('classDetail.confirmDeleteMessage')} "{studentToDelete ? `${studentToDelete.firstName || ''} ${studentToDelete.lastName || ''}`.trim() : ''}"?</p>
        </Modal>
    </ThemedLayout>
  );
};

export default ClassStudent;
  