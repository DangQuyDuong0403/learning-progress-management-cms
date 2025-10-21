import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
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
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import { useTheme } from "../../../../contexts/ThemeContext";
import "./StudentList.css";
import { spaceToast } from "../../../../component/SpaceToastify";
import studentManagementApi from "../../../../apis/backend/StudentManagement";
import AssignStudentToClass from "./AssignStudentToClass";
import levelManagementApi from "../../../../apis/backend/levelManagement";
import StudentBottomActionBar from "../../../../component/StudentBottomActionBar";

const { Option } = Select;
const { Title, Text } = Typography;

const StudentList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
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
    // Filter out PENDING records from current page
    const nonPendingStudents = students.filter(student => student.status !== 'PENDING');
    const currentPageKeys = nonPendingStudents.map(student => student.id);
    const selectedCount = selectedRowKeys.length;
    
    // Check if all non-PENDING items on current page are selected
    const allCurrentPageSelected = currentPageKeys.length > 0 && 
      currentPageKeys.every(key => selectedRowKeys.includes(key));
    
    // For table header checkbox: only check if all non-PENDING current page items are selected
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
      nonPendingStudents: nonPendingStudents.length,
    });
    
    return { isSelectAll, isIndeterminate, totalItems: currentPageKeys.length, selectedCount };
  }, [selectedRowKeys, students]);

  // Handle table header checkbox (only current page)
  const handleSelectAllCurrentPage = (checked) => {
    // Filter out PENDING records from current page
    const nonPendingStudents = students.filter(student => student.status !== 'PENDING');
    const currentPageKeys = nonPendingStudents.map(student => student.id);
    
    if (checked) {
      // Add all non-PENDING current page items to selection
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

        // Get all IDs from the response, excluding PENDING records
        const allKeys = response.data
          .filter(student => student.status !== 'PENDING')
          .map(student => student.id);
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
    // Don't allow selection of PENDING records
    if (record.status === 'PENDING') {
      return;
    }
    
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
    
    // Filter out PENDING records from selected items
    const selectedStudents = students.filter(student => selectedRowKeys.includes(student.id));
    const nonPendingSelected = selectedStudents.filter(student => student.status !== 'PENDING');
    
    if (nonPendingSelected.length === 0) {
      spaceToast.warning('Cannot activate PENDING students');
      return;
    }
    
    const confirmContent = `${t('studentManagement.confirmBulkActivate')} ${nonPendingSelected.length} ${t('studentManagement.students')}? ${selectedStudents.length !== nonPendingSelected.length ? `(${selectedStudents.length - nonPendingSelected.length} PENDING students will be skipped)` : ''}`;
    
    setConfirmModal({
      visible: true,
      title: `${t('studentManagement.activeAll')} ${t('studentManagement.students')}`,
      content: confirmContent,
      onConfirm: async () => {
        try {
          // Call API for bulk update - activate only non-PENDING selected students
          const promises = nonPendingSelected.map(student => 
            studentManagementApi.updateStudentStatus(student.id, 'ACTIVE')
          );
          
          const results = await Promise.all(promises);
          const successCount = results.filter(r => r.success).length;
          
          if (successCount > 0) {
            // Close modal first
            setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
            
            // Clear selection
            setSelectedRowKeys([]);
            
            // Show success toast
            spaceToast.success(`${t('studentManagement.activateStudentSuccess')} ${successCount} ${t('studentManagement.students')} ${t('studentManagement.success')}`);
            
            // Refresh the list
            fetchStudents(pagination.current, pagination.pageSize, searchText, statusFilter, roleNameFilter, sortBy, sortDir);
          } else {
            throw new Error('All operations failed');
          }
        } catch (error) {
          console.error('Error updating student statuses:', error);
          setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
          spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message || t('studentManagement.bulkUpdateStatusError'));
        }
      }
    });
  };

  const handleBulkDeactive = () => {
    if (selectedRowKeys.length === 0) {
      spaceToast.warning(t('studentManagement.selectItemsToActiveDeactive'));
      return;
    }
    
    // Filter out PENDING records from selected items
    const selectedStudents = students.filter(student => selectedRowKeys.includes(student.id));
    const nonPendingSelected = selectedStudents.filter(student => student.status !== 'PENDING');
    
    if (nonPendingSelected.length === 0) {
      spaceToast.warning('Cannot deactivate PENDING students');
      return;
    }
    
    const confirmContent = `${t('studentManagement.confirmBulkDeactivate')} ${nonPendingSelected.length} ${t('studentManagement.students')}? ${selectedStudents.length !== nonPendingSelected.length ? `(${selectedStudents.length - nonPendingSelected.length} PENDING students will be skipped)` : ''}`;
    
    setConfirmModal({
      visible: true,
      title: `${t('studentManagement.deactiveAll')} ${t('studentManagement.students')}`,
      content: confirmContent,
      onConfirm: async () => {
        try {
          // Call API for bulk update - deactivate only non-PENDING selected students
          const promises = nonPendingSelected.map(student => 
            studentManagementApi.updateStudentStatus(student.id, 'INACTIVE')
          );
          
          const results = await Promise.all(promises);
          const successCount = results.filter(r => r.success).length;
          
          if (successCount > 0) {
            // Close modal first
            setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
            
            // Clear selection
            setSelectedRowKeys([]);
            
            // Show success toast
            spaceToast.success(`${t('studentManagement.deactivateStudentSuccess')} ${successCount} ${t('studentManagement.students')} ${t('studentManagement.success')}`);
            
            // Refresh the list
            fetchStudents(pagination.current, pagination.pageSize, searchText, statusFilter, roleNameFilter, sortBy, sortDir);
          } else {
            throw new Error('All operations failed');
          }
        } catch (error) {
          console.error('Error updating student statuses:', error);
          setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
          spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message || t('studentManagement.bulkUpdateStatusError'));
        }
      }
    });
  };

  const handleBulkAssignToClass = () => {
    if (selectedRowKeys.length === 0) {
      spaceToast.warning(t('studentManagement.selectItemsToAssign'));
      return;
    }
    
    // Filter out PENDING records from selected items
    const selectedStudents = students.filter(student => selectedRowKeys.includes(student.id));
    const nonPendingSelected = selectedStudents.filter(student => student.status !== 'PENDING');
    
    if (nonPendingSelected.length === 0) {
      spaceToast.warning('Cannot assign PENDING students to class');
      return;
    }
    
    const confirmContent = `${t('studentManagement.confirmBulkAssignToClass')} ${nonPendingSelected.length} ${t('studentManagement.students')}? ${selectedStudents.length !== nonPendingSelected.length ? `(${selectedStudents.length - nonPendingSelected.length} PENDING students will be skipped)` : ''}`;
    
    setConfirmModal({
      visible: true,
      title: `${t('studentManagement.assignAllToClass')} ${t('studentManagement.students')}`,
      content: confirmContent,
      onConfirm: async () => {
        try {
          // TODO: Implement bulk assign to class API call
          // await studentManagementApi.bulkAssignStudentsToClass(selectedRowKeys, classId);
          
          // Close modal first
          setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
          
          // Clear selection
          setSelectedRowKeys([]);
          
          // Show success toast
          spaceToast.success(`${t('studentManagement.bulkAssignSuccess')} ${nonPendingSelected.length} ${t('studentManagement.students')}`);
          
          // Refresh the list
          fetchStudents(pagination.current, pagination.pageSize, searchText, statusFilter, roleNameFilter, sortBy, sortDir);
        } catch (error) {
          console.error('Error in bulk assign to class:', error);
          setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
          spaceToast.error(error.response?.data?.error || error.message || t('studentManagement.bulkAssignError'));
        }
      }
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
          disabled={record.status === 'PENDING'}
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
        } else if (record.status === 'ACTIVE') {
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
      status: 'active' // Set default status
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
        content: `${t('studentManagement.confirmStatusChange')} ${actionText} ${t('studentManagement.student')} "${studentName}"?`,
        onConfirm: async () => {
          try {
            // Call API to update student status
            const response = await studentManagementApi.updateStudentStatus(id, newStatus);
            
            if (response.success) {
              // Close modal first
              setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
              
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
    if (isButtonDisabled) return; // Prevent multiple submissions
    
    setIsButtonDisabled(true);
    
    try {
      const values = await form.validateFields();
      
      // Format the data according to CreateStudentRequest schema from API
      const studentData = {
        roleName: values.roleName, // STUDENT or TEST_TAKER
        email: values.email,
        fullName: values.fullName,
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
            spaceToast.success(`Add student "${values.fullName}" successfully`);
            
            // Navigate to student profile if student ID is available
            if (response.data && response.data.id) {
              console.log('Navigating to student profile:', response.data.id);
              navigate(`/manager/student/${response.data.id}/profile`);
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
      } else {
        throw new Error(response.message || 'Import failed');
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

  const handleExportSelected = async () => {
    try {
      // TODO: Implement export selected items API call
      // await studentManagementApi.exportStudents(selectedRowKeys);
      
      spaceToast.success(`${t('studentManagement.exportSuccess')}: ${selectedRowKeys.length} ${t('studentManagement.students')}`);
      setIsExportModalVisible(false);
    } catch (error) {
      console.error('Error exporting selected students:', error);
      spaceToast.error(t('studentManagement.exportError'));
    }
  };

  const handleExportAll = async () => {
    try {
      // TODO: Implement export all items API call
      // await studentManagementApi.exportAllStudents();
      
      spaceToast.success(`${t('studentManagement.exportSuccess')}: ${totalStudents} ${t('studentManagement.students')}`);
      setIsExportModalVisible(false);
    } catch (error) {
      console.error('Error exporting all students:', error);
      spaceToast.error(t('studentManagement.exportError'));
    }
  };


  // Handle file selection
  const handleFileSelect = (file) => {
    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    if (!allowedTypes.includes(file.type)) {
      spaceToast.error('Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file');
      return false;
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      spaceToast.error('File size must be less than 10MB');
      return false;
    }
    
    setImportModal(prev => ({
      ...prev,
      fileList: [file]
    }));
    
    return false; // Prevent default upload behavior
  };

  // Handle download template
  const handleDownloadTemplate = async () => {
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
      link.setAttribute('target', '_blank');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      spaceToast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to download template');
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
              >
                {t('studentManagement.exportData')}
                {selectedRowKeys.length > 0 && ` (${selectedRowKeys.length})`}
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
            disabled: isButtonDisabled,
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

            <Upload.Dragger
              name="file"
              multiple={false}
              beforeUpload={handleFileSelect}
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
                {t('studentManagement.clickOrDragFile')}
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

        {/* Export Data Modal */}
        <Modal
          title={
            <div
              style={{
                fontSize: '24px',
                fontWeight: '600',
                color: theme === 'dark' ? '#ffffff' : '#000000',
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
                fontSize: '14px',
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
              {selectedRowKeys.length > 0 && (
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={handleExportSelected}
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
                  {t('studentManagement.exportSelected')} ({selectedRowKeys.length} {t('studentManagement.students')})
                </Button>
              )}

              <Button
                icon={<UploadOutlined />}
                onClick={handleExportAll}
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
        />

    </ThemedLayout> 
  );
};

export default StudentList;
