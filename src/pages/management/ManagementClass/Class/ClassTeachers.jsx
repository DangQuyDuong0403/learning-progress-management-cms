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
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
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
  
  // Refs for click outside detection
  const filterContainerRef = useRef(null);

  // Status options for filter
  const statusOptions = [
    { key: "ACTIVE", label: t('classTeachers.active') },
    { key: "INACTIVE", label: t('classTeachers.inactive') },
    { key: "REMOVED", label: t('classTeachers.removed') },
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
      setStatusFilter('ACTIVE');
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
      spaceToast.error(t('classTeachers.loadingClassInfo'));
    }
  }, [id, t]);

  const fetchTeachers = useCallback(async (params = {}) => {
    try {
      const apiParams = {
        page: params.page !== undefined ? params.page : 0,
        size: params.size !== undefined ? params.size : 10,
        text: params.text !== undefined ? params.text : '',
        status: params.status !== undefined ? params.status : 'ACTIVE',
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
      spaceToast.error(t('classTeachers.loadingTeachers'));
      setTeachers([]);
    }
  }, [id, t]);

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
      spaceToast.error('Failed to load available teachers');
    } finally {
      setLoadingTeachers(false);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    fetchClassData();
    fetchTeachers();
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
        description: `${t('classTeachers.teachers')} (${teachers.length})`
      });
    }
    
    // Cleanup function to exit class menu mode when leaving
    return () => {
      exitClassMenu();
    };
  }, [classData?.id, classData?.name, teachers.length]);

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
        spaceToast.error(t('classTeachers.loadingTeachers'));
        setTeachers([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchText, statusFilter, sortConfig.sortBy, sortConfig.sortDir, pagination.pageSize, id, t]);

  const handleAddTeacher = () => {
    form.resetFields();
    setIsModalVisible(true);
    fetchAvailableTeachers(); // Fetch available teachers when opening modal
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

  const handleConfirmDelete = async () => {
    if (teacherToDelete) {
      console.log("Confirm delete for teacher:", teacherToDelete);
      
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
        
        // Use BE error message if available, otherwise fallback to generic message
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            error.message || 
                            t('classTeachers.deleteError');
        
        spaceToast.error(errorMessage);
      }
      
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
      
      // Use BE error message if available, otherwise fallback to generic message
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          t('classTeachers.addError');
      
      spaceToast.error(errorMessage);
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

  const columns = [
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
      sorter: true,
      render: (text) => (
        <div className="teacher-name-text" style={{ fontSize: "20px" }}>{text}</div>
      ),
    },
    {
      title: t('classTeachers.fullName'),
      dataIndex: "fullName",
      key: "fullName",
      sorter: true,
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
      sorter: true,
      render: (text) => (
        <span style={{ fontSize: "20px" }}>{text || 'N/A'}</span>
      ),
    },
    {
      title: t('classTeachers.status'),
      dataIndex: "status",
      key: "status",
      sorter: true,
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
          />
        </Space>
      ),
    },
  ];

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
              Teacher Management <span className="student-count">({pagination.total})</span>
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
                className={`filter-button ${theme}-filter-button ${filterDropdown.visible ? 'active' : ''} ${(statusFilter !== 'ACTIVE') ? 'has-filters' : ''}`}
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
            <div className="action-buttons" style={{ marginLeft: 'auto' }}>
              <Button 
                icon={<PlusOutlined />}
                className={`create-button ${theme}-create-button`}
                onClick={handleAddTeacher}
              >
                {t('common.add')}
              </Button>
            </div>
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
          title={t('classTeachers.addMembersToClass')}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={600}
          okText={t('classTeachers.add')}
          cancelText={t('common.cancel')}
          okButtonProps={{
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
                return `${tas.length} ${t('classTeachers.people')}`;
              })()}
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
                loading={loadingTeachers}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
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
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
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
               fontSize: '20px', 
               fontWeight: '600', 
               color: '#1890ff',
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
               {(teacherToDelete?.role === 'teacher' || teacherToDelete?.roleInClass === 'TEACHER' || teacherToDelete?.roleName === 'TEACHER') ? t('classTeachers.confirmDeleteTeacher') : t('classTeachers.confirmDeleteTA')} "{teacherToDelete?.fullName || teacherToDelete?.userName || teacherToDelete?.name}"?
             </p>
           </div>
         </Modal>

         {/* Import File Modal */}
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
               <PlusOutlined style={{ color: '#000000' }} />
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
             disabled: fileList.length === 0,
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
