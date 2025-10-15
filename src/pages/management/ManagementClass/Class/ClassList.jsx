import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  Input,
  Space,
  Card,
  Row,
  Col,
  Select,
  Modal,
  Form,
  Dropdown,
  Tag,
  ColorPicker,
  Typography,
  Upload,
  Pagination,
  Avatar,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  MoreOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  FilterOutlined,
  UploadOutlined,
  DownloadOutlined,
  CalendarOutlined,
  BookOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./ClassList.css";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../../contexts/ThemeContext";
import { classManagementApi, syllabusManagementApi } from "../../../../apis/apis";

const { Option } = Select;

// Status options for filter
const statusOptions = [
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "pending", label: "Pending" },
];

// Predefined colors for classes
const classColors = [
  "#00d4ff", // space blue
  "#ff6b35", // mars orange
  "#9c88ff", // nebula purple
  "#00ff88", // alien green
  "#ff4757", // red
  "#ffa502", // orange
  "#2ed573", // green
  "#5352ed", // indigo
  "#ff6348", // tomato
  "#1e90ff", // dodger blue
  "#ff1493", // deep pink
  "#32cd32", // lime green
];

// Function to get color for class based on ID
const getClassColor = (classId) => {
  return classColors[classId % classColors.length];
};

// Function to get random avatar from student_avatar folder
const getRandomAvatar = () => {
  const avatarNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  const randomNumber = avatarNumbers[Math.floor(Math.random() * avatarNumbers.length)];
  return `/img/student_avatar/avatar${randomNumber}.png`;
};

// Available avatar images
const avatarImages = [
  'avatar1.png',
  'avatar2.png',
  'avatar3.png',
  'avatar4.png',
  'avatar5.png',
  'avatar6.png',
  'avatar7.png',
  'avatar8.png',
  'avatar9.png',
  'avatar10.png',
  'avatar11.png',
  'avatar12.png',
  'avatar13.png',
  'avatar14.png',
  'avatar15.png',
  'avatar16.png',
  'avatar17.png',
  'avatar18.png',
];

const ClassList = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  // State for classes data
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [syllabusMap, setSyllabusMap] = useState({});
  const [syllabuses, setSyllabuses] = useState([]);
  const [syllabusLoading, setSyllabusLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  
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
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [form] = Form.useForm();
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    content: '',
    onConfirm: null
  });

  // Filter dropdown state
  const [filterDropdown, setFilterDropdown] = useState({
    visible: false,
    selectedStatuses: [],
  });
  
  // Import modal state
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  
  // Refs for click outside detection
  const filterContainerRef = useRef(null);

  // Fetch syllabus data
  const fetchSyllabusData = useCallback(async (syllabusIds) => {
    if (!syllabusIds || syllabusIds.length === 0) return {};
    
    try {
      const syllabusMap = {};
      
      // Fetch all unique syllabus IDs
      const uniqueSyllabusIds = [...new Set(syllabusIds.filter(id => id))];
      
      // Fetch syllabus data for each ID
      for (const syllabusId of uniqueSyllabusIds) {
        try {
          const response = await syllabusManagementApi.getSyllabuses({ 
            params: { id: syllabusId } 
          });
          
          if (response.success && response.data && response.data.length > 0) {
            syllabusMap[syllabusId] = response.data[0].syllabusName || 'Unknown Syllabus';
          } else {
            syllabusMap[syllabusId] = 'Unknown Syllabus';
          }
        } catch (error) {
          console.error(`Error fetching syllabus ${syllabusId}:`, error);
          syllabusMap[syllabusId] = 'Unknown Syllabus';
        }
      }
      
      return syllabusMap;
    } catch (error) {
      console.error('Error fetching syllabus data:', error);
      return {};
    }
  }, []);

  // Fetch all syllabuses for dropdown
  const fetchAllSyllabuses = useCallback(async () => {
    setSyllabusLoading(true);
    try {
      const response = await syllabusManagementApi.getSyllabuses({ 
        params: { page: 0, size: 1000 } // Get all syllabuses
      });
      
      if (response.success && response.data) {
        setSyllabuses(response.data);
      } else {
        console.error('Failed to fetch syllabuses:', response.message);
        setSyllabuses([]);
      }
    } catch (error) {
      console.error('Error fetching syllabuses:', error);
      setSyllabuses([]);
    } finally {
      setSyllabusLoading(false);
    }
  }, []);

  // Fetch classes from API
  const fetchClasses = useCallback(async (page = 1, size = 10, search = '') => {
    setLoading(true);
    setLoadingComplete(false);
    try {
      const params = {
        page: page - 1, // API uses 0-based indexing
        size: size,
      };

      // Thêm search text nếu có
      if (search && search.trim()) {
        params.searchText = search.trim();
      }

      console.log('Fetching classes with params:', params);
      const response = await classManagementApi.getClasses(params);
      
      if (response.success && response.data) {
        // Map API response to component format
        const mappedClasses = response.data.map(classItem => ({
          id: classItem.id,
          name: classItem.className,
          studentCount: 0, // API doesn't provide student count, set to 0
          color: getClassColor(classItem.id), // Use predefined color based on ID
          avatar: getRandomAvatar(), // Random avatar for display
          isActive: classItem.isActive,
          createdAt: classItem.createdAt ? classItem.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
          description: "", // API doesn't provide description
          teacher: "", // API doesn't provide teacher info
          level: "", // API doesn't provide level info
          ageRange: "", // API doesn't provide age range
          syllabusId: classItem.syllabusId,
          createdBy: classItem.createdBy,
          updatedBy: classItem.updatedBy,
          updatedAt: classItem.updatedAt,
        }));
        
        setClasses(mappedClasses);
        
        // Fetch syllabus data for all classes
        const syllabusIds = mappedClasses.map(cls => cls.syllabusId).filter(id => id);
        const syllabusData = await fetchSyllabusData(syllabusIds);
        setSyllabusMap(syllabusData);
        
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize: size,
          total: response.totalElements || response.data.length,
        }));
      } else {
        setClasses([]);
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize: size,
          total: 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      spaceToast.error(t('classManagement.loadClassesError'));
      setClasses([]);
      setPagination(prev => ({
        ...prev,
        current: page,
        pageSize: size,
        total: 0,
      }));
    } finally {
      setLoading(false);
      // Delay setting loadingComplete to allow LoadingWithEffect animation to finish
      setTimeout(() => {
        setLoadingComplete(true);
      }, 1000); // Adjust this delay based on your LoadingWithEffect animation duration
    }
  }, [t, fetchSyllabusData]);

  useEffect(() => {
    fetchClasses(1, pagination.pageSize, searchText);
  }, [fetchClasses, searchText, pagination.pageSize]);

  useEffect(() => {
    fetchAllSyllabuses();
  }, [fetchAllSyllabuses]);

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


  const handleSearch = (value) => {
    setSearchText(value);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      fetchClasses(1, pagination.pageSize, value);
    }, 500);
    
    setSearchTimeout(timeout);
  };


  const handleCreateClass = () => {
    setEditingClass(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditClass = (classItem) => {
    setEditingClass(classItem);
    
    // Get current avatar filename from classItem.avatar
    const currentAvatarFilename = classItem.avatar ? classItem.avatar.split('/').pop() : null;
    
    form.setFieldsValue({
      name: classItem.name,
      color: classItem.color,
      avatar: currentAvatarFilename,
    });
    
    setSelectedAvatar(classItem.avatar);
    setIsModalVisible(true);
  };

  const handleToggleStatus = async (classItem) => {
    const newStatus = !classItem.isActive;
    const actionText = newStatus ? 'open' : 'close';
    
    setConfirmModal({
      visible: true,
      title: 'Confirm Status Change',
      content: `Are you sure you want to ${actionText} the class "${classItem.name}"?`,
      onConfirm: async () => {
        try {
          await classManagementApi.toggleClassStatus(classItem.id, newStatus);
          
          // Refresh the list
          fetchClasses(pagination.current, pagination.pageSize, searchText);
        setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
        spaceToast.success(`Class "${classItem.name}" has been ${actionText}ed successfully!`);
        } catch (error) {
          console.error('Error updating class status:', error);
          spaceToast.error('Failed to update class status. Please try again.');
        }
      }
    });
  };

  const handleDeleteClass = (classItem) => {
    setConfirmModal({
      visible: true,
      title: 'Delete Class',
      content: `Are you sure you want to delete the class "${classItem.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await classManagementApi.deleteClass(classItem.id);
          
          // Refresh the list
          fetchClasses(pagination.current, pagination.pageSize, searchText);
          setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
          spaceToast.success(`Class "${classItem.name}" has been deleted successfully!`);
        } catch (error) {
          console.error('Error deleting class:', error);
          spaceToast.error(error.response?.data?.message || error.message || 'Failed to delete class. Please try again.');
        }
      }
    });
  };

  const handleConfirmCancel = () => {
    setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
  };

  // Handle filter dropdown toggle
  const handleFilterToggle = () => {
    setFilterDropdown(prev => ({
      ...prev,
      visible: !prev.visible,
      selectedStatuses: prev.visible ? prev.selectedStatuses : [...statusFilter],
    }));
  };

  // Handle filter submission
  const handleFilterSubmit = () => {
    setStatusFilter(filterDropdown.selectedStatuses);
    setFilterDropdown(prev => ({
      ...prev,
      visible: false,
    }));
    // Reset to first page when applying filters
    fetchClasses(1, pagination.pageSize, searchText);
  };

  // Handle filter reset
  const handleFilterReset = () => {
    setFilterDropdown(prev => ({
      ...prev,
      selectedStatuses: [],
    }));
  };

  // Handle import
  const handleImport = () => {
    setIsImportModalVisible(true);
  };

  // Handle export
  const handleExport = () => {
    // TODO: Implement export functionality
    spaceToast.success(t('classManagement.exportSuccess'));
  };

  // Handle import file upload
  const handleImportUpload = async (file) => {
    setImportLoading(true);
    try {
      // TODO: Implement actual import logic
      // Simulate API call
      setTimeout(() => {
        setImportLoading(false);
        setIsImportModalVisible(false);
        spaceToast.success(t('classManagement.importSuccess'));
        fetchClasses(1, pagination.pageSize, searchText); // Refresh the list
      }, 2000);
    } catch (error) {
      setImportLoading(false);
      spaceToast.error(t('classManagement.importError'));
    }
    return false; // Prevent default upload behavior
  };

  // Handle import modal cancel
  const handleImportModalCancel = () => {
    setIsImportModalVisible(false);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      // Handle color conversion
      const processedValues = {
        ...values,
        color: typeof values.color === 'string' ? values.color : values.color?.toHexString(),
      };

      if (editingClass) {
        // Update existing class
        const updateData = {
          className: processedValues.name,
          avatarUrl: "string", // Default as per API requirements
        };
        
        await classManagementApi.updateClass(editingClass.id, updateData);
        
        // Refresh the list
        fetchClasses(pagination.current, pagination.pageSize, searchText);
        spaceToast.success('Class updated successfully!');
      } else {
        // Add new class
        const newClassData = {
          className: processedValues.name,
          syllabusId: processedValues.syllabusId,
          avatarUrl: "string", // Default as per API requirements
        };
        
        await classManagementApi.createClass(newClassData);
        
        // Refresh the list
        fetchClasses(1, pagination.pageSize, searchText);
        spaceToast.success('Class created successfully!');
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error saving class:', error);
      spaceToast.error(error.response?.data?.message || error.message || 'Failed to save class. Please try again.');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setSelectedAvatar(null);
  };

  const handleCardClick = (classItem) => {
    navigate(`/manager/classes/menu/${classItem.id}`);
  };

  // Function to handle avatar selection from dropdown
  const handleAvatarSelect = (selectedAvatar) => {
    if (selectedAvatar) {
      setSelectedAvatar(`/img/student_avatar/${selectedAvatar}`);
    }
  };

  const getStatusTag = (isActive) => {
    const statusConfig = {
      true: { color: "green", text: "Open" },
      false: { color: "red", text: "Close" },
    };

    const config = statusConfig[isActive] || statusConfig.false;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // Filter data based on search and filters - removed client-side filtering
  // Now using server-side filtering through API calls
  const filteredClasses = classes;

  const getMenuItems = (classItem) => [
    {
      key: "edit",
      label: <span style={{ color: '#000000' }}>{t('common.edit')}</span>,
      icon: <EditOutlined className="edit-icon" style={{ color: '#000000' }} />,
      onClick: () => handleEditClass(classItem),
      className: "edit-menu-item",
    },
    {
      key: "toggle",
      label: <span style={{ color: '#000000' }}>{classItem.isActive ? 'Close' : 'Open'}</span>,
      icon: <DeleteOutlined className="delete-icon" style={{ color: '#000000' }} />,
      danger: classItem.isActive,
      onClick: () => handleToggleStatus(classItem),
      className: "delete-menu-item",
    },
    {
      key: "delete",
      label: <span style={{ color: '#ff4d4f' }}>Delete Class</span>,
      icon: <DeleteOutlined className="delete-icon" style={{ color: '#ff4d4f' }} />,
      danger: true,
      onClick: () => handleDeleteClass(classItem),
      className: "delete-menu-item",
    },
  ];


  return (
    <ThemedLayout>
      <div className={`class-list-container class-page ${theme}-theme`}>

        {/* Filters */}
        <Card className="filter-card">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6} lg={4}>
              <Input
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <div ref={filterContainerRef} style={{ position: 'relative' }}>
                <Button 
                  icon={<FilterOutlined />}
                  onClick={handleFilterToggle}
                  className={`filter-button ${theme}-filter-button ${filterDropdown.visible ? 'active' : ''} ${(statusFilter.length > 0) ? 'has-filters' : ''}`}
                  style={{ width: "100%" }}
                >
                  Filter
                </Button>
                
                {/* Filter Dropdown Panel */}
                {filterDropdown.visible && (
                  <div className={`filter-dropdown-panel ${theme}-filter-dropdown`}>
                    <div style={{ padding: '20px' }}>
                      {/* Status Filter */}
                      <div style={{ marginBottom: '24px' }}>
                        <Typography.Title level={5} style={{ marginBottom: '12px', color: '#1890ff', fontSize: '16px' }}>
                          Status
                        </Typography.Title>
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
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchClasses(pagination.current, pagination.pageSize, searchText)}
              >
                {t('classManagement.refresh')}
              </Button>
            </Col>
            <Col xs={24} sm={24} md={6} lg={12} style={{ textAlign: 'right' }}>
              <Space>
                <Button
                  icon={<UploadOutlined />}
                  onClick={handleExport}
                  className={`export-button ${theme}-export-button`}
                >
                  {t('classManagement.exportClasses')}
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleImport}
                  className={`import-button ${theme}-import-button`}
                >
                  {t('classManagement.importClasses')}
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreateClass}
                  style={{
                    background: "linear-gradient(135deg, #00d4ff 0%, #9c88ff 100%)",
                    borderColor: "transparent",
                    height: "44px",
                    fontSize: "16px",
                    fontWeight: "600",
                    borderRadius: "12px",
                    boxShadow: "0 4px 20px rgba(0, 212, 255, 0.4)",
                  }}
                >
                   {t('classManagement.createClass')}
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Class Cards */}
        <div className="classes-grid">
          <LoadingWithEffect loading={loading} message={t('classManagement.loadingClasses')}>
            {filteredClasses.length > 0 ? (
              <Row gutter={[24, 24]} justify="center" style={{ padding: '0 20px' }}>
                {filteredClasses.map((classItem) => (
                  <Col xs={22} sm={20} md={12} lg={12} xl={12} key={classItem.id}>
                    <Card 
                      className="class-card" 
                      hoverable
                    >
                      <div className="class-card-header">
                        <div 
                          className="class-color-bar" 
                          style={{ backgroundColor: classItem.color }}
                        />
                        <Dropdown
                          menu={{ items: getMenuItems(classItem) }}
                          trigger={["click"]}
                          placement="bottomRight"
                        >
                          <Button
                            type="text"
                            icon={<MoreOutlined />}
                            className="class-menu-button"
                          />
                        </Dropdown>
                      </div>
                      
                      <div className="class-card-content">
                        {/* Class Name and Avatar Row */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '16px', 
                          marginBottom: '16px' 
                        }}>
                          {/* Class Avatar */}
                          <img 
                            src={classItem.avatar} 
                            alt={`${classItem.name} avatar`}
                            style={{
                              width: '80px',
                              height: '80px',
                              borderRadius: '50%',
                              border: `3px solid ${classItem.color}`,
                              objectFit: 'cover',
                              boxShadow: `0 4px 12px ${classItem.color}40`,
                              flexShrink: 0
                            }}
                          />
                          
                          {/* Class Name */}
                          <h3 
                            className="class-name clickable-name"
                            onClick={() => handleCardClick(classItem)}
                            style={{
                              background: "linear-gradient(90deg, #5e17eb 0%, #4dd0ff 100%)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              backgroundClip: "text",
                              fontWeight: 700,
                              fontSize: "24px",
                              letterSpacing: "0.3px",
                              margin: 0,
                              flex: 1
                            }}
                          >
                            {classItem.name}
                          </h3>
                        </div>
                        
                        <div className="class-info">
                          <div className="student-count">
                            <UserOutlined style={{ color: classItem.color }} />
                            <span>{classItem.studentCount}</span>
                          </div>
                          
                          <div className="class-stats">
                            {getStatusTag(classItem.isActive)}
                          </div>
                        </div>
                        
                        <div className="class-meta">
                          <span className="created-date">
                            <CalendarOutlined style={{ color: '#000000' }} />
                            Created: {classItem.createdAt}
                          </span>
                          <span className="created-by" style={{ color: '#000000' }}>
                            <UserOutlined style={{ color: '#000000' }} />
                            Created by: {classItem.createdBy}
                          </span>
                          {classItem.syllabusId && (
                            <span className="syllabus-name" style={{ color: '#000000' }}>
                              <BookOutlined style={{ color: '#000000' }} />
                              Syllabus: {syllabusMap[classItem.syllabusId] || 'Loading...'}
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <div className="empty-state">
                <p>{t('classManagement.noClassesFound')}</p>
                <Button type="primary" onClick={handleCreateClass}>
                  {t('classManagement.createFirstClass')}
                </Button>
              </div>
            )}
          </LoadingWithEffect>
        </div>

        {/* Pagination */}
        {loadingComplete && filteredClasses.length > 0 && pagination.total > 0 && (
          <Card className="pagination-card">
            <div style={{ textAlign: 'right' }}>
              <Pagination
                current={pagination.current}
                total={pagination.total}
                pageSize={pagination.pageSize}
                showSizeChanger={true}
                showQuickJumper={false}
                showTotal={(total, range) => 
                  `${range[0]}-${range[1]} ${t('common.of')} ${total} ${t('common.classes')}`
                }
                onChange={(page, pageSize) => {
                  fetchClasses(page, pageSize, searchText);
                }}
                onShowSizeChange={(current, size) => {
                  fetchClasses(1, size, searchText);
                }}
                pageSizeOptions={['5', '10', '20', '50']}
              />
            </div>
          </Card>
        )}

        {/* Add/Edit Modal */}
        <Modal
          title={editingClass ? t('classManagement.editClass') : t('classManagement.createClass')}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={600}
          okText={t('common.save')}
          cancelText={t('common.cancel')}
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              color: "#00d4ff",
            }}
          >
            <Form.Item
              label={t('classManagement.className')}
              name="name"
              rules={[
                { required: true, message: t('classManagement.classNameRequired') },
                { min: 3, message: 'Class name must be at least 3 characters' },
                { max: 100, message: 'Class name must not exceed 100 characters' },
              ]}
            >
              <Input 
                placeholder={t('classManagement.enterClassName')} 
                style={{
                  fontSize: "15px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "2px solid #e2e8f0",
                  transition: "all 0.3s ease",
                }}
              />
            </Form.Item>

            {/* Avatar Section - Only show in edit mode */}
            {editingClass && (
              <Row gutter={24} style={{ marginBottom: 24 }}>
                <Col span={24} style={{ textAlign: 'center' }}>
                  <div className="avatar-section">
                    <Avatar
                      size={120}
                      src={selectedAvatar}
                      style={{ 
                        backgroundColor: '#1890ff',
                        marginBottom: 16,
                        border: `3px solid ${theme === 'space' ? 'rgba(77, 208, 255, 0.5)' : 'rgba(0, 0, 0, 0.1)'}`,
                        boxShadow: `0 4px 12px ${theme === 'space' ? 'rgba(77, 208, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)'}`
                      }}
                    />
                    <div>
                      <Form.Item
                        name="avatar"
                        label="Select Avatar"
                        rules={[{ required: true, message: 'Please select an avatar for the class' }]}
                      >
                        <Select
                          placeholder="Select Avatar"
                          onChange={handleAvatarSelect}
                          showSearch
                          filterOption={(input, option) =>
                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                          }
                          style={{ width: 200 }}
                        >
                          {avatarImages.map((avatar, index) => (
                            <Select.Option key={index} value={avatar}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Avatar
                                  size={24}
                                  src={`/img/student_avatar/${avatar}`}
                                  style={{ flexShrink: 0 }}
                                />
                                <span>{avatar.replace('.png', '').replace('avatar', 'Avatar ')}</span>
                              </div>
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </div>
                  </div>
                </Col>
              </Row>
            )}

            <Form.Item
              label="Syllabus"
              name="syllabusId"
              rules={[
                { required: !editingClass, message: 'Please select a syllabus for the class' },
              ]}
            >
              <Select 
                placeholder="Select a syllabus"
                loading={syllabusLoading}
                disabled={editingClass}
                style={{
                  fontSize: "15px",
                }}
              >
                {syllabuses.map(syllabus => (
                  <Option key={syllabus.id} value={syllabus.id}>
                    {syllabus.syllabusName}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={t('classManagement.classColor')}
              name="color"
              rules={[
                { required: true, message: 'Please select a color for the class' },
              ]}
            >
              <ColorPicker 
                placeholder={t('classManagement.selectClassColor')}
                style={{
                  fontSize: "15px",
                }}
                showText
                format="hex"
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Confirmation Modal */}
        <Modal
          title={confirmModal.title}
          open={confirmModal.visible}
          onOk={confirmModal.onConfirm}
          onCancel={handleConfirmCancel}
          okText={t('common.confirm')}
          cancelText={t('common.cancel')}
        >
          <p>{confirmModal.content}</p>
        </Modal>

        {/* Import Modal */}
        <Modal
          title={t('classManagement.importClasses')}
          open={isImportModalVisible}
          onCancel={handleImportModalCancel}
          footer={null}
          width={600}
        >
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: '20px' }}>
              <Typography.Text>
                {t('classManagement.importInstructions')}
              </Typography.Text>
            </div>
            
            <Upload.Dragger
              name="file"
              multiple={false}
              accept=".xlsx,.xls,.csv"
              beforeUpload={handleImportUpload}
              showUploadList={false}
              disabled={importLoading}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">
                {t('classManagement.dragFileHere')}
              </p>
              <p className="ant-upload-hint">
                {t('classManagement.supportedFormats')}
              </p>
            </Upload.Dragger>

            {importLoading && (
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <Typography.Text type="secondary">
                  {t('classManagement.importing')}...
                </Typography.Text>
              </div>
            )}

            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f6f8fa', borderRadius: '8px' }}>
              <Typography.Title level={5} style={{ marginBottom: '8px' }}>
                {t('classManagement.importTemplate')}
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: '14px' }}>
                {t('classManagement.templateInstructions')}
              </Typography.Text>
              <div style={{ marginTop: '12px' }}>
                <Button 
                  type="link" 
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    // TODO: Implement template download
                    spaceToast.success(t('classManagement.templateDownloaded'));
                  }}
                >
                  {t('classManagement.downloadTemplate')}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </ThemedLayout>
  );
};

export default ClassList;