import React, { useState, useEffect, useCallback } from "react";
import usePageTitle from "../../../../hooks/usePageTitle";
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
  Typography,
  Upload,
  Pagination,
  Tooltip,
  Switch,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  DownloadOutlined,
  CalendarOutlined,
  BookOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./ClassList.css";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../../contexts/ThemeContext";
import { classManagementApi, syllabusManagementApi } from "../../../../apis/apis";

const { Option } = Select;

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

const ClassList = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  // Set page title
  usePageTitle('Class Management');
  
  // State for classes data
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syllabuses, setSyllabuses] = useState([]);
  const [syllabusLoading, setSyllabusLoading] = useState(false);
  
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
  
  // Import modal state
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);

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
          isActive: classItem.status === 'ACTIVE',
          createdAt: classItem.createdAt ? classItem.createdAt.split('T')[0] : '-',
          syllabusName: classItem.syllabus?.syllabusName || '-',
          levelName: classItem.syllabus?.level?.levelName || '-',
          startDate: classItem.startDate ? classItem.startDate.split('T')[0] : '-',
          endDate: classItem.endDate ? classItem.endDate.split('T')[0] : '-',
          syllabusId: classItem.syllabusId,
          createdBy: classItem.createdBy || '-',
          updatedBy: classItem.updatedBy,
          updatedAt: classItem.updatedAt,
        }));
        
        setClasses(mappedClasses);
        
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
    }
  }, [t]);

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
    
    form.setFieldsValue({
      name: classItem.name,
    });
    
    setIsModalVisible(true);
  };

  const handleToggleStatus = async (classItem) => {
    const newStatus = !classItem.isActive;
    const actionText = newStatus ? t('classManagement.activate') : t('classManagement.deactivate');
    
    setConfirmModal({
      visible: true,
      title: t('classManagement.confirmStatusChange'),
      content: `${t('classManagement.confirmStatusChangeMessage')} ${actionText} ${t('classManagement.class')} "${classItem.name}"?`,
      onConfirm: async () => {
        try {
          await classManagementApi.toggleClassStatus(classItem.id, newStatus);
          
          // Refresh the list
          fetchClasses(pagination.current, pagination.pageSize, searchText);
        setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
        spaceToast.success(`${t('classManagement.class')} "${classItem.name}" ${t('classManagement.statusChangedSuccess')}!`);
        } catch (error) {
          console.error('Error updating class status:', error);
          spaceToast.error(t('classManagement.checkInfoError'));
        }
      }
    });
  };

  const handleDeleteClass = (classItem) => {
    setConfirmModal({
      visible: true,
      title: t('classManagement.deleteClass'),
      content: t('classManagement.deleteClassMessage', { className: classItem.name }),
      onConfirm: async () => {
        try {
          await classManagementApi.deleteClass(classItem.id);
          
          // Refresh the list
          fetchClasses(pagination.current, pagination.pageSize, searchText);
          setConfirmModal({ visible: false, title: '', content: '', onConfirm: null });
          spaceToast.success(t('classManagement.classDeletedSuccess', { className: classItem.name }));
        } catch (error) {
          console.error('Error deleting class:', error);
          spaceToast.error(error.response?.data?.message || error.message || t('classManagement.checkInfoError'));
        }
      }
    });
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

  // Handle import modal cancel
  const handleImportModalCancel = () => {
    setIsImportModalVisible(false);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingClass) {
        // Update existing class
        const updateData = {
          className: values.name,
          avatarUrl: "string", // Default as per API requirements
        };
        
        await classManagementApi.updateClass(editingClass.id, updateData);
        
        // Refresh the list
        fetchClasses(pagination.current, pagination.pageSize, searchText);
        spaceToast.success('Class updated successfully!');
      } else {
        // Add new class
        const newClassData = {
          className: values.name,
          syllabusId: values.syllabusId,
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
  };

  const handleCardClick = (classItem) => {
    navigate(`/manager/classes/menu/${classItem.id}`);
  };

  // Filter data based on search and filters - removed client-side filtering
  // Now using server-side filtering through API calls
  const filteredClasses = classes;

  const getMenuItems = (classItem) => [
    {
      key: "edit",
      label: <span style={{ color: '#000000' }}>{t('common.edit')}</span>,
      icon: <EditOutlined className="edit-icon" style={{ color: '#000000' }} />,
      onClick: (e) => {
        e.domEvent.stopPropagation();
        handleEditClass(classItem);
      },
      className: "edit-menu-item",
    },
    {
      key: "delete",
      label: <span style={{ color: '#ff4d4f' }}>{t('classManagement.deleteClass')}</span>,
      icon: <DeleteOutlined className="delete-icon" style={{ color: '#ff4d4f' }} />,
      danger: true,
      onClick: (e) => {
        e.domEvent.stopPropagation();
        handleDeleteClass(classItem);
      },
      className: "delete-menu-item",
    },
  ];


  return (
    <ThemedLayout>
      <div className={`class-page main-content-panel ${theme}-main-panel`}>
        {/* Page Title */}
        <div className="page-title-container">
          <Typography.Title 
            level={1} 
            className="page-title"
          >
            {t('classManagement.title')} <span className="student-count">({pagination.total})</span>
          </Typography.Title>
        </div>

        {/* Action Bar */}
        <div className="action-bar" style={{ marginBottom: '16px' }}>
          <Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space size="middle">
              <Input
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                className="search-input"
                style={{ minWidth: '350px', maxWidth: '500px', height: '40px', fontSize: '16px' }}
                allowClear
              />
            </Space>
            <Space>
              <Button
                icon={<UploadOutlined />}
                onClick={handleExport}
                className="export-button"
              >
                {t('classManagement.exportData')}
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleImport}
                className="import-button"
              >
                {t('classManagement.importClasses')}
              </Button>
              <Button
                icon={<PlusOutlined />}
                className={`create-button ${theme}-create-button`}
                onClick={handleCreateClass}
              >
                {t('classManagement.addClass')}
              </Button>
            </Space>
          </Space>
        </div>

        {/* Cards Section */}
        <div 
          className={`table-section ${theme}-table-section`}
          style={{
            backgroundColor: theme === 'sun' ? '#ffffff' : '#1a1a2e99',
            borderRadius: '8px',
            padding: '20px'
          }}
        >
          <LoadingWithEffect loading={loading}>
            {filteredClasses.length > 0 ? (
              <>
                <Row gutter={[16, 16]} justify="start" style={{ padding: '0 20px', marginBottom: '24px' }}>
                  {filteredClasses.map((classItem) => (
                    <Col xs={24} sm={12} md={8} lg={8} xl={8} key={classItem.id}>
                      <Card 
                        className="class-card" 
                        hoverable
                        onClick={() => handleCardClick(classItem)}
                        style={{ 
                          height: '100%',
                          backgroundColor: theme === 'sun' ? '#ffffff' : undefined,
                          cursor: 'pointer'
                        }}
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
                              onClick={(e) => e.stopPropagation()}
                            />
                          </Dropdown>
                        </div>
                        
                        <div className="class-card-content">
                          {/* Class Name and Avatar Row */}
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px', 
                            marginBottom: '12px' 
                          }}>
                            {/* Class Avatar */}
                            <img 
                              src={classItem.avatar} 
                              alt={`${classItem.name} avatar`}
                              style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                border: `3px solid ${classItem.color}`,
                                objectFit: 'cover',
                                boxShadow: `0 4px 12px ${classItem.color}40`,
                                flexShrink: 0
                              }}
                            />
                            
                            {/* Class Name */}
                            <Tooltip title={classItem.name} placement="top">
                              <h3 
                                className="class-name"
                                style={{
                                  background: "linear-gradient(90deg, #5e17eb 0%, #4dd0ff 100%)",
                                  WebkitBackgroundClip: "text",
                                  WebkitTextFillColor: "transparent",
                                  backgroundClip: "text",
                                  fontWeight: 700,
                                  fontSize: "20px",
                                  letterSpacing: "0.3px",
                                  margin: 0,
                                  flex: 1,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical'
                                }}
                              >
                                {classItem.name}
                              </h3>
                            </Tooltip>
                            
                            {/* Status Switch */}
                            <div className="class-stats" style={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                              <Switch
                                checked={classItem.isActive}
                                onChange={() => handleToggleStatus(classItem)}
                                size="default"
                                style={{
                                  transform: 'scale(1.1)',
                                }}
                              />
                            </div>
                          </div>
                          
                          <div className="class-meta" style={{ fontSize: '16px', gap: '8px' }}>
                            {/* Syllabus and Level */}
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              gap: '8px'
                            }}>
                              <Tooltip title={`${t('classManagement.syllabus')}: ${classItem.syllabusName}`} placement="top">
                                <span style={{ 
                                  color: '#000000',
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap',
                                  flex: 1
                                }}>
                                  <BookOutlined style={{ color: '#000000', fontSize: '14px', marginRight: '4px' }} />
                                  {t('classManagement.syllabus')}: {classItem.syllabusName}
                                </span>
                              </Tooltip>
                              <Tooltip title={`${t('classManagement.level')}: ${classItem.levelName}`} placement="top">
                                <span style={{ 
                                  color: '#000000',
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap'
                                }}>
                                  {t('classManagement.level')}: {classItem.levelName}
                                </span>
                              </Tooltip>
                            </div>

                            {/* Start Date and End Date */}
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              gap: '8px'
                            }}>
                              <Tooltip title={`${t('classManagement.startDate')}: ${classItem.startDate}`} placement="top">
                                <span style={{ 
                                  color: '#000000',
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap',
                                  flex: 1
                                }}>
                                  <CalendarOutlined style={{ color: '#000000', fontSize: '14px', marginRight: '4px' }} />
                                  {t('classManagement.startDate')}: {classItem.startDate}
                                </span>
                              </Tooltip>
                              <Tooltip title={`${t('classManagement.endDate')}: ${classItem.endDate}`} placement="top">
                                <span style={{ 
                                  color: '#000000',
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap'
                                }}>
                                  {t('classManagement.endDate')}: {classItem.endDate}
                                </span>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
                
                {/* Pagination */}
                {pagination.total > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    padding: '0 20px',
                    marginTop: '8px'
                  }}>
                    <Pagination
                      current={pagination.current}
                      total={pagination.total}
                      pageSize={pagination.pageSize}
                      showSizeChanger={true}
                      showQuickJumper={false}
                      showTotal={(total, range) => 
                        `${range[0]}-${range[1]} of ${total} classes`
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
                )}
              </>
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

        {/* Add/Edit Modal */}
        <Modal
          title={
            editingClass
              ? t('classManagement.editClass')
              : t('classManagement.addClass')
          }
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={600}
          okText={t('common.save')}
          cancelText={t('common.cancel')}
          destroyOnClose
          okButtonProps={{
            style: {
              backgroundColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
              background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
              borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'transparent',
              color: theme === 'sun' ? '#000000' : '#ffffff',
              height: '40px',
              fontSize: '16px',
              fontWeight: '500',
              minWidth: '100px',
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
          <Form
            form={form}
            layout="vertical"
          >
            <Form.Item
              label={t('classManagement.className')}
              name="name"
              rules={[
                { required: true, message: t('classManagement.classNameRequired') },
                { min: 3, message: t('classManagement.classNameRequired') },
                { max: 100, message: t('classManagement.classNameRequired') },
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

            <Form.Item
              label={t('classManagement.syllabus')}
              name="syllabusId"
              rules={[
                { required: !editingClass, message: t('classManagement.levelRequired') },
              ]}
            >
              <Select 
                placeholder={t('classManagement.selectLevel')}
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
          onCancel={() => setConfirmModal({ visible: false, title: '', content: '', onConfirm: null })}
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
              {t('classManagement.importClasses')}
            </div>
          }
          open={isImportModalVisible}
          onOk={() => {
            // TODO: Implement import functionality
            setIsImportModalVisible(false);
          }}
          onCancel={handleImportModalCancel}
          okText={t('classManagement.importClasses')}
          cancelText={t('common.cancel')}
          width={600}
          centered
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
          <div style={{ padding: '20px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <Button
                type="dashed"
                icon={<DownloadOutlined />}
                onClick={() => {
                  // TODO: Implement template download
                  spaceToast.success(t('classManagement.templateDownloaded'));
                }}
                style={{
                  borderColor: '#1890ff',
                  color: '#1890ff',
                  height: '36px',
                  fontSize: '14px',
                  fontWeight: '500',
                }}>
                {t('classManagement.downloadTemplate')}
              </Button>
            </div>
            
            <Typography.Title
              level={5}
              style={{
                textAlign: 'center',
                marginBottom: '20px',
                color: '#666',
              }}>
              {t('classManagement.importInstructions')}
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
                {t('classManagement.clickOrDragFile')}
              </p>
              <p className='ant-upload-hint' style={{ color: '#999' }}>
                {t('classManagement.supportedFormats')}
              </p>
            </Upload.Dragger>
          </div>
        </Modal>
      </div>
    </ThemedLayout>
  );
};

export default ClassList;