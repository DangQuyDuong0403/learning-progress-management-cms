import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import usePageTitle from "../../../../hooks/usePageTitle";
import {
  Table,
  Button,
  Input,
  Space,
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
  Switch,
  Checkbox,
  Upload,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  UploadOutlined,
  FilterOutlined,
  DeleteOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import { useTheme } from "../../../../contexts/ThemeContext";
import "./StudentList.css";
import { spaceToast } from "../../../../component/SpaceToastify";
import studentManagementApi from "../../../../apis/backend/StudentManagement";
import accountManagementApi from "../../../../apis/backend/accountManagement";
import AssignStudentToClass from "./AssignStudentToClass";
import levelManagementApi from "../../../../apis/backend/levelManagement";
import StudentBottomActionBar from "../../../../component/StudentBottomActionBar";
import { FILE_NAME_PREFIXES, formatDateForFilename } from "../../../../constants/fileNames";

const { Option } = Select;
const { Title, Text } = Typography;

const trimIfString = (value) => (typeof value === "string" ? value.trim() : value);

const StudentList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const listReturnPath = useMemo(() => `${location.pathname}${location.search}`, [location.pathname, location.search]);
  
  // Set page title
  usePageTitle('Student Management');
  const { theme } = useTheme();
  const [publishedLevels, setPublishedLevels] = useState([]);
  const [publishedLevelsLoading, setPublishedLevelsLoading] = useState(false);
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
  const [searchValue, setSearchValue] = useState(""); // Actual search value used for API calls
  const [statusFilter, setStatusFilter] = useState([]);
  const [roleNameFilter, setRoleNameFilter] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  // Sort state - start with createdAt DESC (newest first)
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  
  // Checkbox selection state
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  
  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [form] = Form.useForm();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    content: '',
    displayData: null,
    onConfirm: null,
    loading: false,
  });
  const [importModal, setImportModal] = useState({
    visible: false,
    fileList: [],
    uploading: false,
  });
  const [assignClassModal, setAssignClassModal] = useState({
    visible: false,
    student: null,
    students: null, // For bulk assignment
  });
  const [filterDropdown, setFilterDropdown] = useState({
    visible: false,
    selectedRoles: [],
    selectedStatuses: [],
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState({
    active: false,
    deactive: false,
  });
  const [templateLoading, setTemplateLoading] = useState(false);
  const [fileValidationLoading, setFileValidationLoading] = useState(false);
  const [validateLoading, setValidateLoading] = useState(false);
  
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
        // Map API response to include classId field if available
        const mappedStudents = response.data.map(student => ({
          ...student,
          // classId should come from API response
          // className should also come from API if available
        }));
        
        setStudents(mappedStudents);
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
    fetchStudents(1, pagination.pageSize, searchValue, statusFilter, roleNameFilter, sortBy, sortDir);
  }, [fetchStudents, pagination.pageSize, searchValue, statusFilter, roleNameFilter, sortBy, sortDir]);

  // Fetch published levels when component mounts
  useEffect(() => {
    const fetchPublishedLevels = async () => {
      setPublishedLevelsLoading(true);
      try {
        const params = {
          page: 0,
          size: 100, // Get all published levels
        };
        
        const response = await levelManagementApi.getPublishedLevels({ params });
        
        // Handle different response structures
        const levelsData = response.data?.content || response.data || [];
        setPublishedLevels(levelsData);
        
        console.log('Fetched published levels:', levelsData);
      } catch (error) {
        console.error('Error fetching published levels:', error);
        spaceToast.error('Failed to load levels');
        setPublishedLevels([]);
      } finally {
        setPublishedLevelsLoading(false);
      }
    };
    
    fetchPublishedLevels();
  }, []);

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

  // Calculate checkbox states with useMemo
  const checkboxStates = useMemo(() => {
    // Include all students (including PENDING) for selection
    const currentPageKeys = students.map(student => student.id);
    const selectedCount = selectedRowKeys.length;
    
    // Check if all items on current page are selected
    const allCurrentPageSelected = currentPageKeys.length > 0 && 
      currentPageKeys.every(key => selectedRowKeys.includes(key));
    
    // For table header checkbox: check if all current page items are selected
    const isSelectAll = allCurrentPageSelected;
    // Never show indeterminate state for table header checkbox
    const isIndeterminate = false;
    
    console.log('Checkbox Debug:', {
      currentPageKeys,
      selectedRowKeys,
      allCurrentPageSelected,
      isSelectAll,
      isIndeterminate,
      selectedCount,
      totalStudents: students.length,
    });
    
    return { isSelectAll, isIndeterminate, totalItems: currentPageKeys.length, selectedCount };
  }, [selectedRowKeys, students]);

  // Handle table header checkbox (only current page)
  const handleSelectAllCurrentPage = (checked) => {
    // Include all students (including PENDING) from current page
    const currentPageKeys = students.map(student => student.id);
    
    if (checked) {
      // Add all current page items to selection
      setSelectedRowKeys(prev => {
        const newKeys = [...prev];
        currentPageKeys.forEach(key => {
          if (!newKeys.includes(key)) {
            newKeys.push(key);
          }
        });
        return newKeys;
      });
    } else {
      // Remove all current page items from selection
      setSelectedRowKeys(prev => prev.filter(key => !currentPageKeys.includes(key)));
    }
  };

  // Checkbox logic for BottomActionBar (select all in entire dataset)
  const handleSelectAll = async (checked) => {
    if (checked) {
      try {
        // Fetch all student IDs from API (without pagination)
        const params = {
          page: 0,
          size: totalStudents, // Get all items
        };
        
        // Add search parameter if provided
        if (searchText && searchText.trim()) {
          params.text = searchText.trim();
        }

        // Add status filter if provided
        if (statusFilter.length > 0) {
          params.status = statusFilter;
        }

        // Add roleName filter if provided
        if (roleNameFilter.length > 0) {
          params.roleName = roleNameFilter;
        }

        const response = await studentManagementApi.getStudents(params);

        // Get all IDs from the response (including PENDING records)
        const allKeys = response.data.map(student => student.id);
        setSelectedRowKeys(allKeys);
      } catch (error) {
        console.error('Error fetching all student IDs:', error);
        spaceToast.error('Error selecting all items');
      }
    } else {
      setSelectedRowKeys([]);
    }
  };

  const handleSelectRow = (record, checked) => {
    // Allow selection of all students including PENDING records
    if (checked) {
      setSelectedRowKeys(prev => [...prev, record.id]);
    } else {
      setSelectedRowKeys(prev => prev.filter(key => key !== record.id));
    }
  };

  // Bulk actions
  const handleBulkActive = () => {
    if (selectedRowKeys.length === 0) {
      spaceToast.warning(t('studentManagement.selectItemsToActiveDeactive'));
      return;
    }
    
    // Filter out PENDING students for activation (only ACTIVE/INACTIVE can be activated)
    const selectedStudents = students.filter(student => selectedRowKeys.includes(student.id));
    const activatableStudents = selectedStudents.filter(student => student.status !== 'PENDING');
    
    if (activatableStudents.length === 0) {
      spaceToast.warning('Cannot activate PENDING students. Please select ACTIVE or INACTIVE students.');
      return;
    }
    
    const activatableIds = activatableStudents.map(student => student.id);
    const confirmContent = t('studentManagement.confirmBulkActivate');
    const displayData = `${activatableIds.length} ${t('studentManagement.students')}`;
    
    setConfirmModal({
      visible: true,
      title: `${t('studentManagement.activeAll')} ${t('studentManagement.students')}`,
      content: confirmContent,
      displayData: displayData,
      onConfirm: async () => {
        setBulkLoading(prev => ({ ...prev, active: true }));
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          // Call bulk API to update status for multiple students at once
          // Use filtered IDs (excluding PENDING students)
          const response = await studentManagementApi.bulkUpdateStudentStatus(activatableIds, 'ACTIVE');
          
          if (response.success) {
            // Close modal first
            setConfirmModal({ visible: false, title: '', content: '', displayData: null, onConfirm: null, loading: false });
            
            // Clear selection
            setSelectedRowKeys([]);
            
            // Show success toast
            spaceToast.success(`${t('studentManagement.bulkUpdateSuccess')} ${activatableIds.length} ${t('studentManagement.students')}`);
            
            // Refresh the list
            fetchStudents(pagination.current, pagination.pageSize, searchValue, statusFilter, roleNameFilter, sortBy, sortDir);
          } else {
            throw new Error(response.message || 'No students were updated');
          }
        } catch (error) {
          console.error('Error in bulk update:', error);
          setConfirmModal({ visible: false, title: '', content: '', displayData: null, onConfirm: null, loading: false });
          spaceToast.error(error.response?.data?.error || error.message || t('studentManagement.bulkUpdateStatusError'));
        } finally {
          setBulkLoading(prev => ({ ...prev, active: false }));
        }
      }
    });
  };

  const handleBulkDeactive = () => {
    if (selectedRowKeys.length === 0) {
      spaceToast.warning(t('studentManagement.selectItemsToActiveDeactive'));
      return;
    }
    
    // Filter out PENDING students for deactivation (only ACTIVE/INACTIVE can be deactivated)
    const selectedStudents = students.filter(student => selectedRowKeys.includes(student.id));
    const deactivatableStudents = selectedStudents.filter(student => student.status !== 'PENDING');
    
    if (deactivatableStudents.length === 0) {
      spaceToast.warning('Cannot deactivate PENDING students. Please select ACTIVE or INACTIVE students.');
      return;
    }
    
    const deactivatableIds = deactivatableStudents.map(student => student.id);
    const confirmContent = t('studentManagement.confirmBulkDeactivate');
    const displayData = `${deactivatableIds.length} ${t('studentManagement.students')}`;
    
    setConfirmModal({
      visible: true,
      title: `${t('studentManagement.deactiveAll')} ${t('studentManagement.students')}`,
      content: confirmContent,
      displayData: displayData,
      onConfirm: async () => {
        setBulkLoading(prev => ({ ...prev, deactive: true }));
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          // Call bulk API to update status for multiple students at once
          // Use filtered IDs (excluding PENDING students)
          const response = await studentManagementApi.bulkUpdateStudentStatus(deactivatableIds, 'INACTIVE');
          
          if (response.success) {
            // Close modal first
            setConfirmModal({ visible: false, title: '', content: '', displayData: null, onConfirm: null, loading: false });
            
            // Clear selection
            setSelectedRowKeys([]);
            
            // Show success toast
            spaceToast.success(`${t('studentManagement.bulkUpdateSuccess')} ${deactivatableIds.length} ${t('studentManagement.students')}`);
            
            // Refresh the list
            fetchStudents(pagination.current, pagination.pageSize, searchValue, statusFilter, roleNameFilter, sortBy, sortDir);
          } else {
            throw new Error(response.message || 'No students were updated');
          }
        } catch (error) {
          console.error('Error in bulk update:', error);
          setConfirmModal({ visible: false, title: '', content: '', displayData: null, onConfirm: null, loading: false });
          spaceToast.error(error.response?.data?.error || error.message || t('studentManagement.bulkUpdateStatusError'));
        } finally {
          setBulkLoading(prev => ({ ...prev, deactive: false }));
        }
      }
    });
  };

  const handleBulkAssignToClass = () => {
    if (selectedRowKeys.length === 0) {
      spaceToast.warning(t('studentManagement.selectItemsToAssign'));
      return;
    }
    
    // Get selected students (including PENDING students now)
    const selectedStudents = students.filter(student => selectedRowKeys.includes(student.id));
    
    if (selectedStudents.length === 0) {
      spaceToast.warning('No students selected for assignment');
      return;
    }
    
    // Open modal with multiple students
    setAssignClassModal({
      visible: true,
      student: null,
      students: selectedStudents,
    });
  };

  // Table columns
  const columns = [
    {
      title: (
        <Checkbox
          key={`select-all-${checkboxStates.selectedCount}-${checkboxStates.totalItems}`}
          checked={checkboxStates.isSelectAll}
          indeterminate={checkboxStates.isIndeterminate}
          onChange={(e) => handleSelectAllCurrentPage(e.target.checked)}
          style={{
            transform: 'scale(1.2)',
            marginRight: '8px'
          }}
        />
      ),
      key: 'selection',
      width: '5%',
      render: (_, record) => (
        <Checkbox
          checked={selectedRowKeys.includes(record.id)}
          onChange={(e) => handleSelectRow(record, e.target.checked)}
          style={{
            transform: 'scale(1.2)'
          }}
        />
      ),
    },
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
      title: t('studentManagement.username'),
      dataIndex: "userName",
      key: "userName",
      width: 100,
      ellipsis: true,
      render: (userName) => (
        <span className="username-text">
          {userName || '-'}
        </span>
      ),
    },
    {
      title: t('studentManagement.fullName'),
      dataIndex: "fullName",
      key: "fullName",
      width: 120,
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      ellipsis: true,
      render: (fullName) => (
        <span className="fullname-text">
          {fullName || '-'}
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
      dataIndex: "classInfo",
      key: "classInfo",
      width: 120,
      ellipsis: true,
      render: (classInfo, record) => {
        // Check if student has classInfo object
        const hasClass = classInfo?.className || classInfo?.name;
        
        if (hasClass) {
          // Display class name from classInfo object
          const className = classInfo?.className || classInfo?.name;
          return (
            <div>
              <span 
                className="class-text clickable-class-name"
                onClick={() => handleNavigateToClass(classInfo)}
                style={{
                  cursor: 'pointer',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  padding: '2px 4px',
                  borderRadius: '4px',
                }}
                title={`Click to view class: ${className}`}
                onMouseEnter={(e) => {
                  e.target.style.color = '#40a9ff';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#000000';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                {className}
              </span>
            </div>
          );
        } else if (record.status === 'ACTIVE' || record.status === 'PENDING') {
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
                backgroundColor: record.status === 'PENDING' ? '#faad14' : '#52c41a',
                borderColor: record.status === 'PENDING' ? '#faad14' : '#52c41a',
                borderRadius: '4px'
              }}
            >
              {t('studentManagement.assignToClass')}
            </Button>
          );
        } else {
          return (
            <span className="class-text">
              -
            </span>
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
          {record.status === 'PENDING' && (
            <Tooltip title={t('studentManagement.deleteStudent')}>
              <Button
                type="text"
                icon={<DeleteOutlined style={{ fontSize: '25px', color: '#ff4d4f' }} />}
                size="small"
                onClick={() => handleDeletePending(record.id)}
                danger
                style={{ 
                  padding: '8px 12px'
                }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Handle table change (pagination, sorting, filtering)
  const handleTableChange = (paginationInfo, filters, sorter) => {
    console.log('handleTableChange called:', { paginationInfo, filters, sorter });
    console.log('Current sortBy:', sortBy, 'Current sortDir:', sortDir);
    
    // Handle sorting
    if (sorter && sorter.field) {
      // Map frontend field names to backend field names
      const fieldMapping = {
        'fullName': 'fullName', // Map to fullName field
        'status': 'status',
        'createdAt': 'createdAt'
      };
      
      const backendField = fieldMapping[sorter.field] || sorter.field;
      
      // Handle sorting direction - force toggle if same field
      let newSortDir;
      if (backendField === sortBy) {
        // Same field - toggle direction
        newSortDir = sortDir === 'asc' ? 'desc' : 'asc';
        console.log('Same field clicked, toggling from', sortDir, 'to', newSortDir);
      } else {
        // Different field - start with asc
        newSortDir = 'asc';
        console.log('Different field clicked, starting with asc');
      }

      console.log('Sorting:', {
        frontendField: sorter.field,
        backendField: backendField,
        direction: newSortDir,
        order: sorter.order
      });

      // Update state - useEffect will handle the API call
      setSortBy(backendField);
      setSortDir(newSortDir);
    } else {
      // Handle pagination without sorting change
      console.log('Pagination only, no sorting change');
      console.log('New pagination:', paginationInfo);
      
      // Call fetchStudents directly with new pagination
      fetchStudents(
        paginationInfo.current, 
        paginationInfo.pageSize, 
        searchValue, 
        statusFilter, 
        roleNameFilter, 
        sortBy, 
        sortDir
      );
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
      // Update searchValue which will trigger useEffect
      setSearchValue(value);
      // Reset to first page when searching
      setPagination(prev => ({
        ...prev,
        current: 1,
      }));
    }, 1000);
    
    setSearchTimeout(newTimeout);
  };


  // Add/Edit
  const handleAddStudent = () => {
    setEditingStudent(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'active', // Set default status
      gender: 'MALE' // Set default gender to Male
    });
    setIsModalVisible(true);
  };


  const handleToggleStatus = (id) => {
    const student = students.find(s => s.id === id);
    if (student) {
      const newStatus = student.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const actionText = newStatus === 'ACTIVE' ? t('studentManagement.activate') : t('studentManagement.deactivate');
      const studentName = student.fullName || student.userName;
      
      setConfirmModal({
        visible: true,
        title: t('studentManagement.changeStatus'),
        content: `${t('studentManagement.confirmStatusChange')} ${actionText} ${t('studentManagement.student')}?`,
        displayData: studentName,
        onConfirm: async () => {
          try {
            // Call API to update student status
            const response = await studentManagementApi.updateStudentStatus(id, newStatus);
            
            if (response.success) {
              // Close modal first
              setConfirmModal({ visible: false, title: '', content: '', displayData: null, onConfirm: null });
              
              // Show success toast
              if (newStatus === 'ACTIVE') {
                spaceToast.success(`${t('studentManagement.activateStudentSuccess')} "${studentName}" ${t('studentManagement.success')}`);
              } else {
                spaceToast.success(`${t('studentManagement.deactivateStudentSuccess')} "${studentName}" ${t('studentManagement.success')}`);
              }
              
              // Refresh the list to get updated data from server
              fetchStudents(pagination.current, pagination.pageSize, searchValue, statusFilter, roleNameFilter, sortBy, sortDir);
            } else {
              throw new Error(response.message || 'Failed to update student status');
            }
          } catch (error) {
            console.error('Error updating student status:', error);
            setConfirmModal({ visible: false, title: '', content: '', displayData: null, onConfirm: null });
            spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message || t('studentManagement.updateStatusError'));
          }
        }
      });
    }
  };

  // Handle delete for PENDING students (trash button)
  const handleDeletePending = (id) => {
    const student = students.find(s => s.id === id);
    if (!student || student.status !== 'PENDING') return;
    
    const studentName = student.fullName || student.userName;
    
    setConfirmModal({
      visible: true,
      title: t('studentManagement.deleteStudent'),
      content: `${t('studentManagement.confirmDeletePending')}? ${t('studentManagement.deletePendingNote')}`,
      displayData: studentName,
      onConfirm: async () => {
        try {
          // Call API to delete student
          const response = await accountManagementApi.deleteAccount(id);
          
          // Close modal first
          setConfirmModal({ visible: false, title: '', content: '', displayData: null, onConfirm: null });
          
          // Use backend message if available, otherwise fallback to translation
          const successMessage = response.message + ` "${studentName}"`;
          spaceToast.success(successMessage);
          
          // Refresh the list to get updated data from server
          fetchStudents(pagination.current, pagination.pageSize, searchValue, statusFilter, roleNameFilter, sortBy, sortDir);
        } catch (error) {
          console.error('Error deleting PENDING student:', error);
          setConfirmModal({ visible: false, title: '', content: '', displayData: null, onConfirm: null });
          spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message || t('studentManagement.deleteStudentError'));
        }
      }
    });
  };

  const handleConfirmCancel = () => {
    setConfirmModal({ visible: false, title: '', content: '', displayData: null, onConfirm: null });
  };

  const handleModalOk = async () => {
    if (isButtonDisabled) return; // Prevent multiple submissions
    
    setIsButtonDisabled(true);
    
    try {
      const values = await form.validateFields();

      const sanitizedValues = {
        ...values,
        email: trimIfString(values.email),
        fullName: trimIfString(values.fullName),
        address: trimIfString(values.address),
        phoneNumber: trimIfString(values.phoneNumber),
        gender: trimIfString(values.gender),
        roleName: trimIfString(values.roleName),
        parentInfo: {
          parentName: trimIfString(values.parentInfo?.parentName),
          parentEmail: trimIfString(values.parentInfo?.parentEmail),
          parentPhone: trimIfString(values.parentInfo?.parentPhone),
          relationship: trimIfString(values.parentInfo?.relationship),
        },
      };
      
      // Format the data according to CreateStudentRequest schema from API
      const studentData = {
        roleName: sanitizedValues.roleName, // STUDENT or TEST_TAKER
        email: sanitizedValues.email,
        fullName: sanitizedValues.fullName,
        avatarUrl: "string", // Always send "string" as per API example
        dateOfBirth: sanitizedValues.dateOfBirth ? sanitizedValues.dateOfBirth.format('YYYY-MM-DDTHH:mm:ss.SSS') + 'Z' : null,
        address: sanitizedValues.address || null,
        phoneNumber: sanitizedValues.phoneNumber || null,
        gender: sanitizedValues.gender || null, // MALE, FEMALE, OTHER
        parentInfo: {
          parentName: sanitizedValues.parentInfo?.parentName || "",
          parentEmail: sanitizedValues.parentInfo?.parentEmail || null,
          parentPhone: sanitizedValues.parentInfo?.parentPhone || "",
          relationship: sanitizedValues.parentInfo?.relationship || null,
        },
        levelId: sanitizedValues.levelId,
      };
      
      console.log('Student form values:', studentData);
      
      if (editingStudent) {
        // TODO: Call update student API
        spaceToast.success(`Update student "${values.fullName}" successfully`);
      } else {
        try {
          // Call create student API
          const response = await studentManagementApi.createStudent(studentData);
          
          if (response.success) {
            // Close modal first
            setIsModalVisible(false);
            form.resetFields();
            
            // Show success toast
            spaceToast.success(`Add student "${sanitizedValues.fullName}" successfully`);
            
            // Navigate to student profile if student ID is available
            if (response.data && response.data.id) {
              console.log('Navigating to student profile:', response.data.id);
              navigate(`/manager/student/${response.data.id}/profile`, {
                state: { returnTo: listReturnPath },
              });
            } else {
              // Fallback: refresh the list if no ID available
              fetchStudents(1, pagination.pageSize, searchValue, statusFilter, roleNameFilter, sortBy, sortDir);
            }
          } else {
            throw new Error(response.message || 'Failed to create student');
          }
        } catch (error) {
          console.error('Error creating student:', error);
          
          // Check if it's a timeout error but data might have been created
          if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
            spaceToast.warning('Request timeout - please check if student was created successfully');
            // Still refresh the list in case data was created
            fetchStudents(1, pagination.pageSize, searchValue, statusFilter, roleNameFilter, sortBy, sortDir);
          } else {
            spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create student');
            return; // Don't close modal on actual error
          }
        }
      }
    } catch (error) {
      console.error('Form validation error:', error);
    } finally {
      // Re-enable button after 0.5 seconds
      setTimeout(() => {
        setIsButtonDisabled(false);
      }, 500);
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
    navigate(`/manager/student/${record.id}/profile`, {
      state: { returnTo: listReturnPath },
    });
  };

  // Handle assign student to class
  const handleAssignToClass = (record) => {
    setAssignClassModal({
      visible: true,
      student: record,
    });
  };

  // Handle navigate to class management
  const handleNavigateToClass = (classInfo) => {
    if (!classInfo || !classInfo.id) {
      spaceToast.warning('Class information not available');
      return;
    }
    
    console.log('Navigating to class:', classInfo);
    navigate(`/manager/classes/menu/${classInfo.id}`);
  };


  // Handle assign class modal close
  const handleAssignClassClose = () => {
    setAssignClassModal({
      visible: false,
      student: null,
      students: null,
    });
  };

  // Handle successful assignment - refresh the student list
  const handleAssignStudentSuccess = () => {
    fetchStudents(pagination.current, pagination.pageSize, searchValue, statusFilter, roleNameFilter, sortBy, sortDir);
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
    fetchStudents(1, pagination.pageSize, searchValue, filterDropdown.selectedStatuses, filterDropdown.selectedRoles, sortBy, sortDir);
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
      const file = importModal.fileList[0];
      
      // Create FormData object
      const formData = new FormData();
      formData.append('file', file);
      
      // Call import API with FormData
      const response = await studentManagementApi.importStudents(formData);

      if (response.success) {
        // Close modal first
        setImportModal({ visible: false, fileList: [], uploading: false });
        
        // Use backend message if available, otherwise fallback to translation
        const successMessage = response.message || t('studentManagement.importSuccess');
        spaceToast.success(successMessage);
        
        // Refresh the list to get updated data from server
        fetchStudents(pagination.current, pagination.pageSize, searchValue, statusFilter, roleNameFilter, sortBy, sortDir);
      } 
    } catch (error) {
      console.error('Error importing students:', error);
      spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message || t('studentManagement.importError'));
      setImportModal((prev) => ({ ...prev, uploading: false }));
    }
  };

  const handleExportStudents = () => {
    setIsExportModalVisible(true);
  };

  const handleExportModalClose = () => {
    setIsExportModalVisible(false);
  };


  const handleExportAll = async () => {
    setExportLoading(true);
    
    try {
      // Prepare export parameters with current page filters
      const exportParams = {
        text: searchValue || undefined,
        status: statusFilter.length > 0 ? statusFilter : undefined,
        roleName: roleNameFilter.length > 0 ? roleNameFilter : undefined,
        // Export all students (no classIds filter means all)
      };

      console.log('Exporting all students with current filters:', exportParams);
      
      const response = await studentManagementApi.exportStudents(exportParams);
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const formattedDate = formatDateForFilename();
      link.download = `${FILE_NAME_PREFIXES.STUDENT_LIST}${formattedDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      spaceToast.success('Export file successfully');
      setIsExportModalVisible(false);
    } catch (error) {
      console.error('Error exporting all students:', error);
      spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message || t('studentManagement.exportError'));
    } finally {
      setExportLoading(false);
    }
  };


  // Handle file selection
  const handleFileSelect = (file) => {
    setFileValidationLoading(true);
    
    // Simulate validation delay to show loading state
    setTimeout(() => {
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
      ];
      
      if (!allowedTypes.includes(file.type)) {
        spaceToast.error('Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file');
        setFileValidationLoading(false);
        return false;
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        spaceToast.error('File size must be less than 10MB');
        setFileValidationLoading(false);
        return false;
      }
      
      setImportModal(prev => ({
        ...prev,
        fileList: [file]
      }));
      
      setFileValidationLoading(false);
    }, 500); // Small delay to show loading state
    
    return false; // Prevent default upload behavior
  };

  // Handle validate import file
  const handleValidateFile = async () => {
    if (validateLoading) return;
    if (importModal.fileList.length === 0) {
      spaceToast.warning(t('studentManagement.selectFileToValidate'));
      return;
    }

    setValidateLoading(true);
    
    try {
      const rawFile = importModal.fileList[0];
      const file = rawFile.originFileObj || rawFile;
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      if (!allowedTypes.includes(file.type) && !file.name?.match(/\.(xlsx|xls|csv)$/i)) {
        spaceToast.error(t('studentManagement.invalidFileType') || 'Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file');
        setValidateLoading(false);
        return;
      }
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        spaceToast.error(t('studentManagement.fileTooLarge') || 'File size must be less than 10MB');
        setValidateLoading(false);
        return;
      }
      
      // Create FormData object
      const formData = new FormData();
      formData.append('file', file);
      
      // Call validate API with FormData
      const response = await studentManagementApi.validateImportFile(formData);

      // API trả về file validation result dưới dạng blob
      if (response.data instanceof Blob) {
        // Tạo URL từ blob để download
        const downloadUrl = window.URL.createObjectURL(response.data);
        
        // Tạo link download
        const link = document.createElement('a');
        link.setAttribute('href', downloadUrl);
        link.setAttribute('download', `validation_student_result_${new Date().getTime()}.xlsx`);
        link.setAttribute('target', '_blank');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Cleanup URL
        window.URL.revokeObjectURL(downloadUrl);
        
        spaceToast.success(t('studentManagement.validateSuccess') + ' - ' + t('studentManagement.fileDownloaded'));
      } else {
        // Nếu không phải blob, có thể là JSON response với URL
        let downloadUrl;
        
        if (typeof response.data === 'string') {
          downloadUrl = response.data;
        } else if (response.data && response.data.url) {
          downloadUrl = response.data.url;
        }
        
        if (downloadUrl) {
          const link = document.createElement('a');
          link.setAttribute('href', downloadUrl);
          link.setAttribute('download', `validation_result_${new Date().getTime()}.xlsx`);
          link.setAttribute('target', '_blank');
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          spaceToast.success(t('studentManagement.validateSuccess') + ' - ' + t('studentManagement.fileDownloaded'));
        } else {
          spaceToast.success(response.message || t('studentManagement.validateSuccess'));
        }
      }
    } catch (error) {
      console.error('Error validating file:', error);
      
      // Xử lý lỗi chi tiết hơn
      let errorMessage = t('studentManagement.validateError');
      
      if (error.response?.data) {
        if (error.response.data instanceof Blob) {
          // Nếu lỗi trả về dưới dạng blob, đọc text để lấy thông báo lỗi
          try {
            const errorText = await error.response.data.text();
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorJson.message || errorMessage;
          } catch (parseError) {
            errorMessage = error.message || errorMessage;
          }
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      spaceToast.error(errorMessage);
    } finally {
      setValidateLoading(false);
    }
  };

  // Handle download template
  const handleDownloadTemplate = async () => {
    setTemplateLoading(true);
    try {
      
      const response = await studentManagementApi.downloadStudentTemplate();
      
      // API returns SAS URL directly (due to axios interceptor returning response.data)
      let downloadUrl;
      if (typeof response === 'string') {
        downloadUrl = response;
      } else if (response && typeof response.data === 'string') {
        downloadUrl = response.data;
      } else if (response && response.data && response.data.url) {
        downloadUrl = response.data.url;
      } else {
        console.error('Unexpected response format:', response);
        throw new Error('No download URL received from server');
      }
      
      // Create download link directly from SAS URL
      const link = document.createElement('a');
      link.setAttribute('href', downloadUrl);
      link.setAttribute('download', 'student_import_template.xlsx');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      
      // Track download start time
      const downloadStartTime = Date.now();
      
      // Monitor for download completion by checking if file appears in downloads
      const checkDownloadProgress = () => {
        // Check if download has started by monitoring network activity or file system
        // For now, we'll use a shorter timeout since the file should download quickly
        const elapsed = Date.now() - downloadStartTime;
        
        if (elapsed > 2000) { // 2 seconds should be enough for most files
          setTemplateLoading(false);
          spaceToast.success('Template downloaded successfully');
          document.body.removeChild(link);
          return;
        }
        
        // Continue checking
        setTimeout(checkDownloadProgress, 500);
      };
      
      // Start download
      link.click();
      
      // Start monitoring download progress
      setTimeout(checkDownloadProgress, 500);
      
      // Fallback: if still loading after 15 seconds, assume download completed
      setTimeout(() => {
        if (templateLoading) {
          setTemplateLoading(false);
          spaceToast.success('Template download completed');
          document.body.removeChild(link);
        }
      }, 15000);
      
    } catch (error) {
      console.error('Error downloading template:', error);
      spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to download template');
      setTemplateLoading(false);
    }
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
              {t('studentManagement.title')} <span className="student-count">({totalStudents})</span>
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
              style={{ flex: '1', minWidth: '200px', maxWidth: '300px', width: '250px', height: '40px', fontSize: '16px' }}
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
                loading={exportLoading}
                disabled={exportLoading}
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
						message={t('common.loading')}>
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
                className={`student-table ${theme}-student-table`}
                showSorterTooltip={false}
                sortDirections={['ascend', 'descend']}
              />
            </LoadingWithEffect>
          </div>
        </div>

        <Modal
          title={
            <div style={{ 
              fontSize: '28px', 
              fontWeight: '600', 
              color: 'rgb(24, 144, 255)',
              textAlign: 'center',
              padding: '10px 0'
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
            disabled: isButtonDisabled,
            style: {
              background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
              borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
              color: theme === 'sun' ? '#000' : '#fff',
              borderRadius: '6px',
              height: '32px',
              fontWeight: '500',
              fontSize: '16px',
              padding: '4px 15px',
              width: '140px',
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
          <Form form={form} layout="vertical">
            {/* Basic Information */}
            <Title level={5} style={{ marginBottom: '16px', color: '#000000' }}>
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
                    {/* Only allow TEST_TAKER option if not editing a STUDENT */}
                    {(!editingStudent || editingStudent?.roleName !== 'STUDENT') && (
                      <Option value="TEST_TAKER">{t('common.testTaker')}</Option>
                    )}
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
                { max: 100, message: t('studentManagement.fullNameMaxLength') },
              ]}
            >
              <Input placeholder={t('studentManagement.enterFullName')} />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={t('studentManagement.dateOfBirth')}
                  name="dateOfBirth"
                  rules={[
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        const selectedYear = value.year();
                        if (selectedYear < 1920) {
                          return Promise.reject(new Error('Date of birth must be from 1920 onwards'));
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <DatePicker 
                    style={{ width: '100%' }}
                    placeholder={t('studentManagement.selectDateOfBirth')}
                    format="YYYY-MM-DD"
                    disabledDate={(current) => {
                      // Disable dates before 1950-01-01
                      return current && current.year() < 1920;
                    }}
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
                  label={
                    <span>
                      {t('studentManagement.phoneNumber')}
                      <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                    </span>
                  }
                  name="phoneNumber"
                  rules={[
                    { required: true, message: t('studentManagement.phoneRequired') },
                    { max: 20, message: t('studentManagement.phoneMaxLength') },
                  ]}
                >
                  <Input placeholder={t('studentManagement.enterPhoneNumber')} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={
                    <span>
                      {t('studentManagement.gender')}
                      <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                    </span>
                  }
                  name="gender"
                  rules={[
                    { required: true, message: t('studentManagement.genderRequired') },
                    { max: 10, message: t('studentManagement.genderMaxLength') },
                  ]}
                  initialValue="MALE"
                >
                  <Radio.Group>
                    <Radio value="MALE">{t('studentManagement.male')}</Radio>
                    <Radio value="FEMALE">{t('studentManagement.female')}</Radio>
                    <Radio value="OTHER">{t('studentManagement.other')}</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item shouldUpdate={(prevValues, currentValues) => prevValues.roleName !== currentValues.roleName}>
              {({ getFieldValue }) => {
                const roleName = getFieldValue('roleName');
                const isStudent = roleName === 'STUDENT';
                
                return (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label={
                          <span>
                            {t('studentManagement.level')}
                            {isStudent && <span style={{ color: 'red', marginLeft: '4px' }}>*</span>}
                          </span>
                        }
                        name="levelId"
                        rules={isStudent ? [
                          { required: true, message: t('studentManagement.levelRequired') }
                        ] : []}
                      >
                        <Select 
                          placeholder={t('studentManagement.selectLevel')}
                          loading={publishedLevelsLoading}
                          showSearch
                          filterOption={(input, option) =>
                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                          }
                          notFoundContent={publishedLevelsLoading ? t("common.loading") : t("studentManagement.noLevelsFound")}
                        >
                          {publishedLevels && publishedLevels.length > 0 ? (
                            publishedLevels.map(level => {
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
                            !publishedLevelsLoading && (
                              <Option disabled value="">
                                No levels available
                              </Option>
                            )
                          )}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                );
              }}
            </Form.Item>


            {/* Parent Information */}
            <Title level={5} style={{ marginTop: '24px', marginBottom: '16px', color: '#000000' }}>
              {t('studentManagement.parentInformation')}
            </Title>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={t('studentManagement.parentName')}
                  name={['parentInfo', 'parentName']}
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
                  label={t('studentManagement.parentPhone')}
                  name={['parentInfo', 'parentPhone']}
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
              fontSize: '28px', 
              fontWeight: '600', 
              color: 'rgb(24, 144, 255)',
              textAlign: 'center',
              padding: '10px 0'
            }}>
              {confirmModal.title}
            </div>
          }
          open={confirmModal.visible}
          onOk={confirmModal.onConfirm}
          onCancel={handleConfirmCancel}
          confirmLoading={confirmModal.loading}
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
              {confirmModal.content}
            </p>
            {confirmModal.displayData && (
              <p style={{
                fontSize: '20px',
                color: '#000',
                margin: 0,
                fontWeight: '400'
              }}>
                <strong>{confirmModal.displayData}</strong>
              </p>
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
              {t('studentManagement.importStudents')}
            </div>
          }
          open={importModal.visible}
          onCancel={handleImportCancel}
          width={600}
          centered
          footer={[
            <Button 
              key="cancel" 
              onClick={handleImportCancel}
              style={{
                height: '32px',
                fontWeight: '500',
                fontSize: '16px',
                padding: '4px 15px',
                width: '100px'
              }}>
              {t('common.cancel')}
            </Button>,
            <Button 
              key="validate" 
              onClick={handleValidateFile}
              loading={validateLoading}
              disabled={validateLoading}
              style={{
                background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
                borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
                color: theme === 'sun' ? '#000' : '#fff',
                borderRadius: '6px',
                height: '32px',
                fontWeight: '500',
                fontSize: '16px',
                padding: '4px 15px',
                width: '120px',
                transition: 'all 0.3s ease',
                boxShadow: 'none',
                marginLeft: '8px'
              }}>
              {t('studentManagement.validateFile')}
            </Button>,
            <Button 
              key="import" 
              type="primary"
              onClick={handleImportOk}
              loading={importModal.uploading}
              disabled={importModal.uploading || importModal.fileList.length === 0}
              style={{
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
                boxShadow: 'none',
                marginLeft: '8px'
              }}>
              {t('studentManagement.import')}
            </Button>
          ]}>
          <div style={{ padding: '20px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <Button
                type="dashed"
                icon={<DownloadOutlined />}
                onClick={handleDownloadTemplate}
                loading={templateLoading}
                disabled={templateLoading}
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

            <Upload.Dragger
              name="file"
              multiple={false}
              beforeUpload={handleFileSelect}
              showUploadList={false}
              accept=".xlsx,.xls,.csv"
              disabled={fileValidationLoading}
              style={{
                marginBottom: '20px',
                border: '2px dashed #d9d9d9',
                borderRadius: '8px',
                background: fileValidationLoading ? '#f0f0f0' : '#fafafa',
                padding: '40px',
                textAlign: 'center',
                opacity: fileValidationLoading ? 0.6 : 1,
              }}>
              <p
                className='ant-upload-drag-icon'
                style={{ fontSize: '48px', color: '#1890ff' }}>
                {fileValidationLoading ? <LoadingOutlined /> : <DownloadOutlined />}
              </p>
              <p
                className='ant-upload-text'
                style={{ fontSize: '16px', fontWeight: '500' }}>
                {fileValidationLoading ? 'Validating file...' : t('studentManagement.clickOrDragFile')}
              </p>
              <p className='ant-upload-hint' style={{ color: '#999' }}>
                {t('studentManagement.supportedFormats')}: Excel (.xlsx, .xls),
              </p>
            </Upload.Dragger>

            <Divider />

            {importModal.fileList.length > 0 && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: '#e6f7ff',
                  border: '1px solid #91d5ff',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <div>
                  <Text style={{ color: '#1890ff', fontWeight: '500' }}>
                    ✅ {t('studentManagement.fileSelected')}:{' '}
                    {importModal.fileList[0].name}
                  </Text>
                  <br />
                  <Text style={{ color: '#666', fontSize: '12px' }}>
                    Size: {importModal.fileList[0].size < 1024 * 1024 
                      ? `${(importModal.fileList[0].size / 1024).toFixed(1)} KB`
                      : `${(importModal.fileList[0].size / 1024 / 1024).toFixed(2)} MB`
                    }
                  </Text>
                </div>
                <Button
                  type="text"
                  size="small"
                  onClick={() => setImportModal(prev => ({ ...prev, fileList: [] }))}
                  style={{ color: '#ff4d4f' }}>
                  Remove
                </Button>
              </div>
            )}
          </div>
        </Modal>

        {/* Assign to Class Modal */}
        <Modal
          title={
            <div style={{ 
              fontSize: '28px', 
              fontWeight: '600', 
              color: 'rgb(24, 144, 255)',
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
          {(assignClassModal.student || assignClassModal.students) && (
            <AssignStudentToClass
              student={assignClassModal.student}
              students={assignClassModal.students}
              onClose={handleAssignClassClose}
              onSuccess={handleAssignStudentSuccess}
            />
          )}
        </Modal>

        {/* Export Data Modal */}
        <Modal
          title={
            <div
              style={{
                fontSize: '28px',
                fontWeight: '600',
                color: 'rgb(24, 144, 255)',
                textAlign: 'center',
                padding: '10px 0',
              }}>
              {t('studentManagement.exportData')}
            </div>
          }
          open={isExportModalVisible}
          onCancel={handleExportModalClose}
          width={500}
          footer={[
            <Button 
              key="cancel" 
              onClick={handleExportModalClose}
              style={{
                height: '32px',
                fontWeight: '500',
                fontSize: '16px',
                padding: '4px 15px',
                width: '100px'
              }}>
              {t('common.cancel')}
            </Button>
          ]}>
          <div style={{ padding: '20px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <UploadOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
              <Typography.Title level={4} style={{ color: theme === 'dark' ? '#cccccc' : '#666', marginBottom: '8px' }}>
                {t('studentManagement.chooseExportOption')}
              </Typography.Title>
              <Typography.Text style={{ color: theme === 'dark' ? '#999999' : '#999' }}>
                {t('studentManagement.exportDescription')}
              </Typography.Text>
            </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <Button
                 type="primary"
                 icon={<UploadOutlined />}
                 onClick={handleExportAll}
                 loading={exportLoading}
                 disabled={exportLoading}
                 style={{
                   height: '48px',
                   fontSize: '16px',
                   fontWeight: '500',
                   background: theme === 'sun' 
                     ? 'linear-gradient(135deg, #FFFFFF, #B6D8FE 77%, #94C2F5)'
                     : 'linear-gradient(135deg, #FFFFFF 0%, #9F96B6 46%, #A79EBB 64%, #ACA5C0 75%, #6D5F8F 100%)',
                   borderColor: theme === 'sun' ? '#B6D8FE' : '#9F96B6',
                   color: '#000000',
                   borderRadius: '8px',
                 }}>
                 {t('studentManagement.exportAll')} ({totalStudents} {t('studentManagement.students')})
               </Button>
             </div>
          </div>
        </Modal>

        {/* Bottom Action Bar - Fixed at bottom of viewport */}
        <StudentBottomActionBar
          selectedCount={selectedRowKeys.length}
          onSelectAll={handleSelectAll}
          onActiveAll={handleBulkActive}
          onDeactiveAll={handleBulkDeactive}
          onAssignAllToClass={handleBulkAssignToClass}
          onClose={() => setSelectedRowKeys([])}
          selectAllText={t('classManagement.selectAll')}
          activeAllText={t('studentManagement.activeAll')}
          deactiveAllText={t('studentManagement.deactiveAll')}
          assignAllToClassText={t('studentManagement.assignAllToClass')}
          loadingActive={bulkLoading.active}
          loadingDeactive={bulkLoading.deactive}
        />

    </ThemedLayout> 
  );
};

export default StudentList;
