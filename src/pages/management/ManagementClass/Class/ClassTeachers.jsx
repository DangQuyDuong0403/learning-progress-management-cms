import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  Table,
  Space,
  Input,
  Select,
  Modal,
  Form,
  Upload,
  Typography,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import ThemedLayoutWithSidebar from "../../../../component/ThemedLayout";
import ThemedLayoutNoSidebar from "../../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./ClassTeachers.css";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useClassMenu } from "../../../../contexts/ClassMenuContext";
import classManagementApi from "../../../../apis/backend/classManagement";
import teacherManagementApi from "../../../../apis/backend/teacherManagement";
import usePageTitle from "../../../../hooks/usePageTitle";

const { Option } = Select;
const { Title } = Typography;

const ClassTeachers = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { theme } = useTheme();
  const { user } = useSelector((state) => state.auth);
  const { enterClassMenu, exitClassMenu } = useClassMenu();
  
  // Prefer backend error message if provided
  const getBackendErrorMessage = (error, defaultMessage) => (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    defaultMessage
  );

  // Deduplicate identical error toasts within a short window
  const lastErrorRef = useRef({ message: null, time: 0 });
  const showErrorToast = useCallback((error, defaultMessage) => {
    const message = getBackendErrorMessage(error, defaultMessage);
    const now = Date.now();
    if (lastErrorRef.current.message === message && (now - lastErrorRef.current.time) < 1500) {
      return;
    }
    lastErrorRef.current = { message, time: now };
    spaceToast.error(message);
  }, []);

  // Determine which layout to use based on user role
  const userRole = user?.role?.toLowerCase();
  const ThemedLayout = (userRole === 'teacher' || userRole === 'teaching_assistant') 
    ? ThemedLayoutNoSidebar 
    : ThemedLayoutWithSidebar;
  
  // Set page title
  usePageTitle('Class Teachers');
  
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [classData, setClassData] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(["ACTIVE"]); // Changed to array to support multiple statuses
  const [isModalVisible, setIsModalVisible] = useState(false);
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
  const [form] = Form.useForm();
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [fileList, setFileList] = useState([]);
  
  // Available teachers state
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [availableTeachingAssistants, setAvailableTeachingAssistants] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [buttonLoading, setButtonLoading] = useState({
    add: false,
    delete: false,
    import: false,
  });
  
  // Refs for click outside detection
  const filterContainerRef = useRef(null);

  // Status options for filter
  const statusOptions = [
    { key: "ACTIVE", label: t('classTeachers.active') },
    { key: "INACTIVE", label: t('classTeachers.inactive') },
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
      selectedStatuses: prev.visible ? prev.selectedStatuses : (Array.isArray(statusFilter) ? statusFilter : [statusFilter]).filter(s => s !== 'all'),
    }));
  };

  // Handle filter submission
  const handleFilterSubmit = () => {
    if (filterDropdown.selectedStatuses.length > 0) {
      setStatusFilter(filterDropdown.selectedStatuses); // Save all selected statuses as array
    } else {
      setStatusFilter(['ACTIVE']); // Default to ACTIVE as array
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
    showErrorToast(error, t('classTeachers.loadingClassInfo'));
    }
  }, [id, t, showErrorToast]);

  const fetchTeachers = useCallback(async (params = {}) => {
    try {
      const apiParams = {
        page: params.page !== undefined ? params.page : 0,
        size: params.size !== undefined ? params.size : 10,
        text: params.text !== undefined ? params.text : '',
        status: params.status !== undefined ? params.status : ['ACTIVE'], // Default to array
        sortBy: params.sortBy !== undefined ? params.sortBy : 'joinedAt',
        sortDir: params.sortDir !== undefined ? params.sortDir : 'desc',
      };
      
      console.log('Fetching teachers with params:', apiParams);
      const response = await classManagementApi.getClassTeachers(id, apiParams);
      console.log('Teachers response:', response);
      
      if (response.success) {
        console.log('Teachers data structure:', response.data);
        console.log('First teacher sample:', response.data?.[0]);
        setTeachers(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.totalElements || 0,
          current: (response.page || 0) + 1,
        }));
      } else {
        spaceToast.error(response.message || t('classTeachers.loadingTeachers'));
        setTeachers([]);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    showErrorToast(error, t('classTeachers.loadingTeachers'));
      setTeachers([]);
    }
  }, [id, t, showErrorToast]);

  // Fetch available teachers for adding to class
  const fetchAvailableTeachers = useCallback(async () => {
    setLoadingTeachers(true);
    try {
      // Fetch teachers using teacherManagement API - same format as TeacherList.jsx
      const teacherParams = {
        page: 0,
        size: 100,
        text: '', // Empty search text to get all
        status: ['ACTIVE'], // Only ACTIVE teachers
        roleName: ['TEACHER'], // Only teachers - use uppercase
        sortBy: 'fullName',
        sortDir: 'asc'
      };
      
      const teacherResponse = await teacherManagementApi.getTeachers(teacherParams);
      
      // Fetch teaching assistants using teacherManagement API - same format as TeacherList.jsx
      const taParams = {
        page: 0,
        size: 100,
        text: '', // Empty search text to get all
        status: ['ACTIVE'], // Only ACTIVE teaching assistants
        roleName: ['TEACHING_ASSISTANT'], // Only teaching assistants - use uppercase
        sortBy: 'fullName',
        sortDir: 'asc'
      };
      
      const taResponse = await teacherManagementApi.getTeachers(taParams);
      
      console.log('Available teachers response:', teacherResponse);
      console.log('Available TAs response:', taResponse);
      console.log('Teacher request params:', teacherParams);
      console.log('TA request params:', taParams);
      
      if (teacherResponse.success) {
        setAvailableTeachers(teacherResponse.data || []);
      }
      
      if (taResponse.success) {
        setAvailableTeachingAssistants(taResponse.data || []);
      }
    } catch (error) {
      console.error('Error fetching available teachers:', error);
    showErrorToast(error, t('classTeachers.loadingTeachers'));
    } finally {
      setLoadingTeachers(false);
    }
  }, [showErrorToast, t]);

  // Initial data loading
  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);

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
        description: classData.name
      });
    }
    
    // Cleanup function to exit class menu mode when leaving
    return () => {
      exitClassMenu();
    };
  }, [classData?.id, classData?.name]);

  // Handle search and filter changes with debounce
  useEffect(() => {
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
        
        console.log('Fetching teachers with params:', apiParams);
        const response = await classManagementApi.getClassTeachers(id, apiParams);
        console.log('Teachers response:', response);
        
        if (response.success) {
          console.log('Teachers data structure in useEffect:', response.data);
          console.log('First teacher sample in useEffect:', response.data?.[0]);
          setTeachers(response.data || []);
          setPagination(prev => ({
            ...prev,
            total: response.totalElements || 0,
            current: 1,
          }));
        } else {
          spaceToast.error(response.message || t('classTeachers.loadingTeachers'));
          setTeachers([]);
        }
      } catch (error) {
        console.error('Error fetching teachers:', error);
        showErrorToast(error, t('classTeachers.loadingTeachers'));
        setTeachers([]);
      } finally {
        setLoading(false);
      }
    }, searchText ? 1000 : 0);
    
    return () => clearTimeout(timeoutId);
  }, [searchText, statusFilter, sortConfig.sortBy, sortConfig.sortDir, pagination.pageSize, id, t, showErrorToast]);

  const handleAddTeacher = () => {
    setButtonLoading(prev => ({ ...prev, add: true }));
    setTimeout(() => {
      form.resetFields();
      setIsModalVisible(true);
      fetchAvailableTeachers(); // Fetch available teachers when opening modal
      setButtonLoading(prev => ({ ...prev, add: false }));
    }, 100);
  };

  const handleImportModalOk = async () => {
    if (fileList.length === 0) {
      spaceToast.warning(t('classTeachers.selectFileToImportError'));
      return;
    }
    
    if (buttonLoading.import) {
      return; // Prevent multiple clicks
    }
    
    setButtonLoading(prev => ({ ...prev, import: true }));
    
    try {
      // Simulate file processing - replace with actual API call when ready
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
      
      spaceToast.success(t('classTeachers.importSuccess'));
      setIsImportModalVisible(false);
      setFileList([]);
      
      // Refresh the teachers list after import
      fetchTeachers();
    } catch (error) {
      console.error('Error importing teachers:', error);
      showErrorToast(error, t('classTeachers.importError'));
    } finally {
      setButtonLoading(prev => ({ ...prev, import: false }));
    }
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
    setButtonLoading(prev => ({ ...prev, delete: true }));
    setTimeout(() => {
      setTeacherToDelete(teacher);
      setIsDeleteModalVisible(true);
      setButtonLoading(prev => ({ ...prev, delete: false }));
    }, 100);
  };

  const handleConfirmDelete = async () => {
    if (teacherToDelete && !buttonLoading.delete) {
      console.log("Confirm delete for teacher:", teacherToDelete);
      
      setButtonLoading(prev => ({ ...prev, delete: true }));
      
      try {
        const response = await classManagementApi.removeTeacherFromClass(id, teacherToDelete.userId);
        
        console.log('Remove teacher response:', response);
        
        if (response.success) {
          const isTeacher = teacherToDelete.role === 'teacher' || teacherToDelete.roleInClass === 'TEACHER' || teacherToDelete.roleName === 'TEACHER';
          const teacherName = teacherToDelete.fullName || teacherToDelete.userName || teacherToDelete.name;
          spaceToast.success(`${t('classTeachers.deleteSuccess')} ${isTeacher ? t('classTeachers.teacher') : t('classTeachers.teachingAssistant')} "${teacherName}"`);
          
          // Refresh the teachers list
          fetchTeachers();
        } else {
          spaceToast.error(response.message || t('classTeachers.deleteError'));
        }
      } catch (error) {
        console.error('Error removing teacher:', error);
      showErrorToast(error, t('classTeachers.deleteError'));
      } finally {
        setButtonLoading(prev => ({ ...prev, delete: false }));
        setIsDeleteModalVisible(false);
        setTeacherToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    console.log("Delete cancelled");
    setIsDeleteModalVisible(false);
    setTeacherToDelete(null);
  };

  const handleModalOk = async () => {
    if (buttonLoading.add) {
      return; // Prevent multiple clicks
    }
    
    setButtonLoading(prev => ({ ...prev, add: true }));
    try {
      const values = await form.validateFields();
      console.log("Form values:", values);

      // Prepare teachers data according to API spec
      const teachersToAdd = [];
      
      // Add selected teacher
      if (values.selectedTeacher) {
        teachersToAdd.push({
          userId: values.selectedTeacher,
          roleInClass: "TEACHER"
        });
      }
      
      // Add selected teaching assistants
      if (values.selectedTeachingAssistants && values.selectedTeachingAssistants.length > 0) {
        values.selectedTeachingAssistants.forEach(taId => {
          teachersToAdd.push({
            userId: taId,
            roleInClass: "TEACHING_ASSISTANT"
          });
        });
      }
      
      if (teachersToAdd.length === 0) {
        spaceToast.warning(t('classTeachers.selectAtLeastOneTeacher'));
        return;
      }
      
      // Call API to add teachers
      const response = await classManagementApi.addTeacherToClass(id, {
        teachers: teachersToAdd
      });
      
      console.log('Add teachers response:', response);
      
      if (response.success) {
        spaceToast.success(t('classTeachers.addSuccess'));
        setIsModalVisible(false);
        form.resetFields();
        
        // Refresh the teachers list
        fetchTeachers();
      } else {
        spaceToast.error(response.message || t('classTeachers.addError'));
      }
    } catch (error) {
      console.error("Error adding teachers:", error);
      showErrorToast(error, t('classTeachers.addError'));
    } finally {
      setButtonLoading(prev => ({ ...prev, add: false }));
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };


  // Handle table changes (pagination, sorting)
  const handleTableChange = (paginationInfo, filters, sorter) => {
    console.log('Table change:', { paginationInfo, filters, sorter });
    
    // Handle pagination
    if (paginationInfo.current !== pagination.current || paginationInfo.pageSize !== pagination.pageSize) {
      setPagination(prev => ({
        ...prev,
        current: paginationInfo.current,
        pageSize: paginationInfo.pageSize,
      }));
    }
    
    // Handle sorting
    if (sorter && sorter.field) {
      const newSortConfig = {
        sortBy: sorter.field,
        sortDir: sorter.order === 'ascend' ? 'asc' : 'desc',
      };
      setSortConfig(newSortConfig);
    }
  };

  // Define all columns
  const allColumns = [
    {
      title: t('classTeachers.no'),
      key: 'no',
      width: 60,
      render: (_, record, index) => {
        const no = (pagination.current - 1) * pagination.pageSize + index + 1;
        return <span style={{ fontSize: "20px", fontWeight: 500 }}>{no}</span>;
      },
    },
    {
      title: t('classTeachers.username'),
      dataIndex: "userName",
      key: "userName",
      render: (text) => (
        <div className="teacher-name-text" style={{ fontSize: "20px" }}>{text}</div>
      ),
    },
    {
      title: t('classTeachers.fullName'),
      dataIndex: "fullName",
      key: "fullName",
      render: (text) => (
        <div className="teacher-name-text" style={{ fontSize: "20px" }}>
          {text || '-'}
        </div>
      ),
    },
    {
      title: t('classTeachers.email'),
      dataIndex: "email",
      key: "email",
      render: (text) => (
        <span style={{ fontSize: "20px" }}>{text || 'N/A'}</span>
      ),
    },
    {
      title: t('classTeachers.roleInClass'),
      dataIndex: "roleInClass",
      key: "roleInClass",
      render: (role) => (
        <span style={{ fontSize: "20px" }}>
          {role === 'TEACHER' ? t('classTeachers.teacher') : role === 'TEACHING_ASSISTANT' ? t('classTeachers.teachingAssistant') : role || '-'}
        </span>
      ),
    },
    {
      title: t('classTeachers.status'),
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span style={{ fontSize: "20px" }}>
          {status === 'ACTIVE' ? t('classTeachers.active') : status === 'INACTIVE' ? t('classTeachers.inactive') : t('classTeachers.removed')}
        </span>
      ),
    },
    {
      title: t('classTeachers.actions'),
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<DeleteOutlined style={{ fontSize: '18px' }} />}
            onClick={() => handleDeleteTeacher(record)}
            style={{ color: "#ff4d4f" }}
            title={t('classTeachers.delete')}
            loading={buttonLoading.delete}
          />
        </Space>
      ),
    },
  ];

  // Filter columns based on user role - hide Actions column for TEACHER and TEACHING_ASSISTANT
  const columns = (userRole === 'teacher' || userRole === 'teaching_assistant')
    ? allColumns.filter(col => col.key !== 'actions')
    : allColumns;

  if (loading) {
    return (
      <ThemedLayout>
        <div className={`main-content-panel ${theme}-main-panel`}>
          <LoadingWithEffect loading={true} message={t('classTeachers.loadingClassInfo')} />
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
              {t('classTeachers.teacherManagement')} <span className="student-count">({pagination.total})</span>
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
                className={`filter-button ${theme}-filter-button ${filterDropdown.visible ? 'active' : ''} ${(Array.isArray(statusFilter) ? statusFilter.length !== 1 || statusFilter[0] !== 'ACTIVE' : statusFilter !== 'ACTIVE') ? 'has-filters' : ''}`}
              >
                {t('classTeachers.filter')}
              </Button>
              
              {/* Filter Dropdown Panel */}
              {filterDropdown.visible && (
                <div className={`filter-dropdown-panel ${theme}-filter-dropdown`}>
                  <div style={{ padding: '20px' }}>
                    {/* Status Filter */}
                    <div style={{ marginBottom: '24px' }}>
                      <Title level={5} style={{ marginBottom: '12px', fontSize: '16px' }}>
                        {t('classTeachers.status')}
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
                        {t('classTeachers.reset')}
                      </Button>
                      <Button
                        type="primary"
                        onClick={handleFilterSubmit}
                        className="filter-submit-button"
                      >
                        {t('classTeachers.viewResults')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Hide Add button for TEACHER and TEACHING_ASSISTANT - they can only view */}
            {(userRole !== 'teacher' && userRole !== 'teaching_assistant') && (
              <div className="action-buttons" style={{ marginLeft: 'auto' }}>
                <Button 
                  icon={<PlusOutlined />}
                  className={`create-button ${theme}-create-button`}
                  onClick={handleAddTeacher}
                  loading={buttonLoading.add}
                >
                  {t('common.add')}
                </Button>
              </div>
            )}
          </div>

          {/* Table Section */}
          <div className={`table-section ${theme}-table-section`}>
            <LoadingWithEffect loading={loading} message={t('classTeachers.loadingTeachers')}>
              <Table
                columns={columns}
                dataSource={teachers}
                rowKey="userId"
                loading={loading}
                pagination={{
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: pagination.total,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} ${t('classTeachers.teachers')}`,
                  className: `${theme}-pagination`,
                  pageSizeOptions: ['10', '20', '50', '100'],
                }}
                onChange={handleTableChange}
                scroll={{ x: 800 }}
                className={`teacher-table ${theme}-teacher-table`}
              />
            </LoadingWithEffect>
          </div>
        </div>

        {/* Add Staff Modal */}
        <Modal
          title={
            <div style={{ 
              fontSize: '28px', 
              fontWeight: '600', 
              color: 'rgb(24, 144, 255)',
              textAlign: 'center',
              padding: '10px 0'
            }}>
              {t('classTeachers.addMembersToClass')}
            </div>
          }
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={600}
          okText={t('classTeachers.add')}
          cancelText={t('common.cancel')}
          okButtonProps={{
            loading: buttonLoading.add,
            disabled: buttonLoading.add,
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
              • {t('classTeachers.teacher')}: {(() => {
                // Simple logic: if there are teachers in the class, show assigned
                if (teachers.length > 0) {
                  // Try to find teacher by role first, then by username pattern, then just take first one
                  const teacher = teachers.find(t => 
                    t.role === "teacher" || 
                    t.roleInClass === "TEACHER" || 
                    t.roleName === "TEACHER"
                  ) || teachers.find(t => t.userName?.startsWith('TC')) || teachers[0];
                  
                  return `${t('classTeachers.assigned')} (${teacher?.fullName || teacher?.userName || 'Unknown'})`;
                } else {
                  return t('classTeachers.notAssigned');
                }
              })()}
            </div>
            <div style={{ fontSize: '13px', color: '#586069' }}>
              • {t('classTeachers.teachingAssistant')}: {(() => {
                // Count teaching assistants (excluding the main teacher)
                const tas = teachers.filter(t => 
                  t.role === "teaching_assistant" || 
                  t.roleInClass === "TEACHING_ASSISTANT" || 
                  t.roleName === "TEACHING_ASSISTANT" ||
                  (t.userName?.startsWith('TA') && teachers.length > 1)
                );
                return `${tas.length} ${tas.length === 1 ? t('classTeachers.person') : t('classTeachers.people')}`;
              })()}
            </div>
            <div style={{ fontSize: '13px', color: '#586069' }}>
              • {t('classTeachers.total')} {teachers.length} {teachers.length === 1 ? t('classTeachers.member') : t('classTeachers.members')}
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
                loading={loadingTeachers}
                showSearch
                filterOption={(input, option) => {
                  const teacher = availableTeachers.find(t => t.id === option.value);
                  if (!teacher) return false;
                  const searchText = (input || '').toLowerCase();
                  const fullName = (teacher.fullName || '').toLowerCase();
                  const userName = (teacher.userName || '').toLowerCase();
                  const email = (teacher.email || '').toLowerCase();
                  return fullName.includes(searchText) || userName.includes(searchText) || email.includes(searchText);
                }}
              >
                {availableTeachers.map(teacher => (
                  <Option key={teacher.id} value={teacher.id}>
                    {teacher.fullName || teacher.userName} ({teacher.email})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={t('classTeachers.teachingAssistantsIncludingBoth')}
              name="selectedTeachingAssistants"
              rules={[
                {
                  validator: (_, value) => {
                    if (!value || value.length === 0) {
                      return Promise.resolve();
                    }
                    if (value.length > 2) {
                      return Promise.reject(new Error(t('classTeachers.maxTwoTeachingAssistants')));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Select 
                mode="multiple"
                placeholder={t('classTeachers.selectTeachingAssistants')}
                style={{
                  fontSize: "15px",
                }}
                allowClear
                loading={loadingTeachers}
                showSearch
                maxTagCount={2}
                onChange={(value) => {
                  // Limit to maximum 2 teaching assistants
                  if (value && value.length > 2) {
                    const limitedValue = value.slice(0, 2);
                    form.setFieldsValue({ selectedTeachingAssistants: limitedValue });
                    spaceToast.warning(t('classTeachers.maxTwoTeachingAssistants'));
                    return;
                  }
                }}
                filterOption={(input, option) => {
                  const ta = availableTeachingAssistants.find(t => t.id === option.value);
                  if (!ta) return false;
                  const searchText = (input || '').toLowerCase();
                  const fullName = (ta.fullName || '').toLowerCase();
                  const userName = (ta.userName || '').toLowerCase();
                  const email = (ta.email || '').toLowerCase();
                  return fullName.includes(searchText) || userName.includes(searchText) || email.includes(searchText);
                }}
              >
                {availableTeachingAssistants.map(ta => (
                  <Option key={ta.id} value={ta.id}>
                    {ta.fullName || ta.userName} ({ta.email})
                  </Option>
                ))}
              </Select>
            </Form.Item>
           </Form>
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
               {t('classTeachers.confirmDelete')}
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
             loading: buttonLoading.delete,
             disabled: buttonLoading.delete,
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
				{teacherToDelete?.role === 'teacher' || teacherToDelete?.roleInClass === 'TEACHER' || teacherToDelete?.roleName === 'TEACHER' ? t('classTeachers.confirmDeleteTeacher') : t('classTeachers.confirmDeleteTA')}
			</p>
			{teacherToDelete && (
				<p style={{
					fontSize: '20px',
					color: '#000',
					margin: 0,
					fontWeight: '400'
				}}>
					<strong>"{teacherToDelete.fullName || teacherToDelete.userName || teacherToDelete.name}"</strong>
				</p>
			)}
           </div>
         </Modal>

         {/* Import File Modal */}
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
               <PlusOutlined style={{ color: 'rgb(24, 144, 255)' }} />
               {t('classTeachers.importTeachersList')}
             </div>
           }
           open={isImportModalVisible}
           onOk={handleImportModalOk}
           onCancel={handleImportModalCancel}
           okText={t('classTeachers.import')}
           cancelText={t('common.cancel')}
           width={600}
           centered
           okButtonProps={{
             loading: buttonLoading.import,
             disabled: fileList.length === 0 || buttonLoading.import,
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
             <Button icon={<PlusOutlined style={{ fontSize: '18px' }} />} style={{ width: '100%' }}>
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
     </ThemedLayout>
   );
 };

export default ClassTeachers;
