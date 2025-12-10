import React, { useState, useEffect, useCallback } from "react";
import usePageTitle from "../../../../hooks/usePageTitle";
import {
  Card,
  Row,
  Col,
  Typography,
  Pagination,
  Tooltip,
} from "antd";
import {
  CalendarOutlined,
  BookOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./ClassList.css";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import ROUTER_PAGE from "../../../../constants/router";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../../contexts/ThemeContext";
import { classManagementApi } from "../../../../apis/apis";

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

// Helper function to get valid class avatar URL
const getClassAvatarUrl = (avatarUrl) => {
  if (!avatarUrl || avatarUrl === 'string' || avatarUrl.trim() === '') {
    return '/img/student_avatar/avatar5.png';
  }
  // Check if it's a valid URL (starts with http://, https://, or /)
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.startsWith('/')) {
    return avatarUrl;
  }
  return '/img/student_avatar/avatar5.png';
};

// Helper function to get status display text and styling
const getStatusConfig = (status, theme) => {
  const statusConfigs = {
    PENDING: {
      text: 'classManagement.pending',
      bgColor: theme === 'sun' ? '#fff3cd' : '#f59e0b',
      textColor: theme === 'sun' ? '#856404' : '#ffffff',
      borderColor: theme === 'sun' ? '#ffeaa7' : 'none',
    },
    ACTIVE: {
      text: 'classManagement.active',
      bgColor: theme === 'sun' ? '#d4edda' : '#10b981',
      textColor: theme === 'sun' ? '#155724' : '#ffffff',
      borderColor: theme === 'sun' ? '#c3e6cb' : 'none',
    },
    UPCOMING_END: {
      text: 'classManagement.upcomingEnd',
      bgColor: theme === 'sun' ? '#ffeaa7' : '#f59e0b',
      textColor: theme === 'sun' ? '#856404' : '#ffffff',
      borderColor: theme === 'sun' ? '#fdcb6e' : 'none',
    },
    FINISHED: {
      text: 'classManagement.finished',
      bgColor: theme === 'sun' ? '#d1ecf1' : '#3b82f6',
      textColor: theme === 'sun' ? '#0c5460' : '#ffffff',
      borderColor: theme === 'sun' ? '#bee5eb' : 'none',
    },
    INACTIVE: {
      text: 'classManagement.inactive',
      bgColor: theme === 'sun' ? '#f8d7da' : '#ef4444',
      textColor: theme === 'sun' ? '#721c24' : '#ffffff',
      borderColor: theme === 'sun' ? '#f5c6cb' : 'none',
    },
  };
  
  return statusConfigs[status] || statusConfigs.INACTIVE;
};

const ClassList = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const userRole = (user?.role || '').toLowerCase();
  
  // Set page title
  usePageTitle('Class Management');
  
  // State for classes data
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 9,
    total: 0,
    showSizeChanger: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
  });

  // Fetch classes from API
  const fetchClasses = useCallback(async (page = 1, size = 10) => {
    setLoading(true);
    try {
      const params = {
        page: page - 1, // API uses 0-based indexing
        size: size,
      };

      const response = await classManagementApi.getClasses(params);
      
      if (response.success && response.data) {
        // Map API response to component format
        const mappedClasses = response.data.map(classItem => ({
          id: classItem.id,
          name: classItem.className,
          studentCount: 0, // API doesn't provide student count, set to 0
          color: getClassColor(classItem.id), // Use predefined color based on ID
          avatar: getClassAvatarUrl(classItem.avatarUrl), // Use avatar5.png as default if invalid
          status: classItem.status, // Store full status
          isActive: classItem.status === 'ACTIVE', // Keep for backward compatibility
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
    fetchClasses(1, pagination.pageSize);
  }, [fetchClasses, pagination.pageSize]);

  const handleCardClick = (classItem) => {
    let path = ROUTER_PAGE.MANAGER_CLASS_MENU.replace(':id', String(classItem.id));
    if (userRole === 'teacher') {
      path = ROUTER_PAGE.TEACHER_CLASS_MENU.replace(':id', String(classItem.id));
    } else if (userRole === 'teaching_assistant') {
      path = ROUTER_PAGE.TEACHING_ASSISTANT_CLASS_MENU.replace(':id', String(classItem.id));
    }
    navigate(path);
  };


  return (
    <ThemedLayout>
      <div className={`class-page class-list-view main-content-panel ${theme}-main-panel`}>
        {/* Page Title */}
        <div className="page-title-container">
          <Typography.Title 
            level={1} 
            className="page-title"
          >
            {t('classManagement.title')} <span className="student-count">({pagination.total})</span>
          </Typography.Title>
        </div>


        {/* Cards Section */}
        <div 
          className={`table-section ${theme}-table-section`}
          style={{
            borderRadius: '8px',
            padding: '20px'
          }}
        >
          <LoadingWithEffect loading={loading}>
            {classes.length > 0 ? (
              <>
                <Row gutter={[16, 16]} justify="start" style={{ padding: '0 20px', marginTop: '20px', marginBottom: '24px' }}>
                  {classes.map((classItem) => (
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
                            
                            {/* Status Display */}
                            <div className="class-stats" style={{ flexShrink: 0 }}>
                              {(() => {
                                const statusConfig = getStatusConfig(classItem.status || 'INACTIVE', theme);
                                return (
                                  <span
                                    style={{
                                      padding: '4px 12px',
                                      borderRadius: '12px',
                                      fontSize: '13px',
                                      fontWeight: '600',
                                      backgroundColor: statusConfig.bgColor,
                                      color: statusConfig.textColor,
                                      border: statusConfig.borderColor !== 'none' ? `1px solid ${statusConfig.borderColor}` : 'none',
                                    }}
                                  >
                                    {t(statusConfig.text)}
                                  </span>
                                );
                              })()}
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
                
                {/* Pagination - Only show when total >= 10 */}
                {pagination.total >= 10 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    padding: '0 20px',
                    marginTop: '8px',
                    marginBottom: '20px'
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
                        fetchClasses(page, pageSize);
                      }}
                      onShowSizeChange={(current, size) => {
                        fetchClasses(1, size);
                      }}
                      pageSizeOptions={['9', '18', '27', '45']}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <p>{t('classManagement.noClassesFound')}</p>
              </div>
            )}
          </LoadingWithEffect>
        </div>
      </div>
    </ThemedLayout>
  );
};

export default ClassList;