import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import usePageTitle from "../../../hooks/usePageTitle";
import {
  Input,
  Space,
  Card,
  Row,
  Col,
  Typography,
  Pagination,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  CalendarOutlined,
  BookOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../component/spinner/LoadingWithEffect";
import "../ManagementClass/Class/ClassList.css";
import { useTheme } from "../../../contexts/ThemeContext";
import { spaceToast } from "../../../component/SpaceToastify";
import classManagementApi from "../../../apis/backend/classManagement";

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


const StudentClassList = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  // Set page title
  usePageTitle(t('studentClassList.title'));
  
  // State for classes data
  const [allClasses, setAllClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 9,
    total: 0,
  });
  
  // Search state
  const [searchText, setSearchText] = useState("");
  const [searchValue, setSearchValue] = useState(""); // Actual search value used for API calls

  // Fetch student classes from API
  const fetchStudentClasses = useCallback(async (page = 1, size = 9, search = '') => {
    setLoading(true);
    try {
      const params = {
        page: page - 1, // API uses 0-based indexing
        size: size,
      };

      // Add search parameter if provided
      if (search && search.trim()) {
        params.text = search.trim();
      }

      console.log('Fetching student classes with params:', params);
      const response = await classManagementApi.getStudentClasses(params);
      
      // Handle different response structures from /api/v1/class
      let classesData = [];
      let totalElements = 0;
      
      if (response && response.data) {
        // Check if response has content array (pagination structure)
        if (response.data.content && Array.isArray(response.data.content)) {
          classesData = response.data.content;
          totalElements = response.data.totalElements || 0;
        } 
        // Check if response.data is directly an array
        else if (Array.isArray(response.data)) {
          classesData = response.data;
          totalElements = response.data.length;
        }
        // Check if response.data has data property
        else if (response.data.data && Array.isArray(response.data.data)) {
          classesData = response.data.data;
          totalElements = response.data.totalElements || response.data.data.length;
        }
      }
      
      console.log('Classes data received:', classesData);
      
      if (classesData.length > 0) {
        // Map API response to include required fields
        const mappedClasses = classesData.map(classItem => ({
          id: classItem.id,
          name: classItem.className || classItem.name || 'Unknown Class',
          color: getClassColor(classItem.id),
          avatar: classItem.avatarUrl || getRandomAvatar(),
          isActive: classItem.status === 'ACTIVE',
          syllabusName: classItem.syllabus?.syllabusName || classItem.syllabusInfo?.name || classItem.syllabusName || 'Unknown Syllabus',
          levelName: classItem.syllabus?.level?.levelName || classItem.levelInfo?.name || classItem.levelName || 'Unknown Level',
          startDate: classItem.startDate ? classItem.startDate.split('T')[0] : 'N/A',
          endDate: classItem.endDate ? classItem.endDate.split('T')[0] : 'N/A',
        }));
        
        setAllClasses(mappedClasses);
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize: size,
          total: totalElements,
        }));
      } else {
        setAllClasses([]);
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize: size,
          total: 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching student classes:', error);
      spaceToast.error(t('studentClassList.loadClassesError'));
      setAllClasses([]);
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

  // Fetch classes on component mount and when search changes
  useEffect(() => {
    fetchStudentClasses(1, pagination.pageSize, searchValue);
  }, [fetchStudentClasses, pagination.pageSize, searchValue]);

  const handleSearch = (value) => {
    setSearchText(value);
    
    // Debounce search to avoid too many API calls
    const timeout = setTimeout(() => {
      setSearchValue(value);
      setPagination(prev => ({ ...prev, current: 1 }));
    }, 500);
    
    return () => clearTimeout(timeout);
  };

  const handleCardClick = (classItem) => {
    // Navigate to class menu for student
    console.log('Navigate to class menu:', classItem.id);
    navigate(`/student/classes/menu/${classItem.id}`);
  };

  const handlePaginationChange = (page, pageSize) => {
    setPagination(prev => ({ ...prev, current: page, pageSize }));
    fetchStudentClasses(page, pageSize, searchValue);
  };

  return (
    <ThemedLayout>
      <div className={`class-page main-content-panel ${theme}-main-panel`}>
        {/* Page Title */}
        <div className="page-title-container" style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Typography.Title 
            level={1} 
            className="page-title"
            style={{ margin: 0 }}
          >
            {t('studentClassList.title')} <span className="student-count">({pagination.total})</span>
          </Typography.Title>
        </div>

        {/* Search Bar */}
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
            {allClasses.length > 0 ? (
              <>
                <Row gutter={[16, 16]} justify="start" style={{ padding: '0 20px', marginBottom: '24px' }}>
                  {allClasses.map((classItem) => (
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
                            
                            {/* Status Badge */}
                            <div 
                              style={{ 
                                flexShrink: 0,
                                padding: '4px 12px',
                                borderRadius: '12px',
                                backgroundColor: classItem.isActive ? '#52c41a' : '#ff4d4f',
                                color: '#fff',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}
                            >
                              {classItem.isActive ? t('common.active') : t('common.inactive')}
                            </div>
                          </div>
                          
                          <div className="class-meta" style={{ fontSize: '16px', gap: '8px' }}>
                            {/* Syllabus and Level */}
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              gap: '8px'
                            }}>
                              <Tooltip title={`${t('common.syllabus')}: ${classItem.syllabusName}`} placement="top">
                                <span style={{ 
                                  color: '#000000',
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap',
                                  flex: 1
                                }}>
                                  <BookOutlined style={{ color: '#000000', fontSize: '14px', marginRight: '4px' }} />
                                  {t('common.syllabus')}: {classItem.syllabusName}
                                </span>
                              </Tooltip>
                              <Tooltip title={`${t('common.level')}: ${classItem.levelName}`} placement="top">
                                <span style={{ 
                                  color: '#000000',
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap'
                                }}>
                                  {t('common.level')}: {classItem.levelName}
                                </span>
                              </Tooltip>
                            </div>

                            {/* Start Date and End Date */}
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              gap: '8px'
                            }}>
                              <Tooltip title={`${t('common.startDate')}: ${classItem.startDate}`} placement="top">
                                <span style={{ 
                                  color: '#000000',
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap',
                                  flex: 1
                                }}>
                                  <CalendarOutlined style={{ color: '#000000', fontSize: '14px', marginRight: '4px' }} />
                                  {t('common.start')}: {classItem.startDate}
                                </span>
                              </Tooltip>
                              <Tooltip title={`${t('common.endDate')}: ${classItem.endDate}`} placement="top">
                                <span style={{ 
                                  color: '#000000',
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap'
                                }}>
                                  {t('common.end')}: {classItem.endDate}
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
                        `${range[0]}-${range[1]} ${t('common.of')} ${total} ${t('studentClassList.classes')}`
                      }
                      onChange={handlePaginationChange}
                      onShowSizeChange={(current, size) => {
                        setPagination(prev => ({ ...prev, current: 1, pageSize: size }));
                        fetchStudentClasses(1, size, searchValue);
                      }}
                      pageSizeOptions={['6', '9', '12', '18']}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <p>{t('studentClassList.noClassesFound')}</p>
              </div>
            )}
          </LoadingWithEffect>
        </div>
      </div>
    </ThemedLayout>
  );
};

export default StudentClassList;

