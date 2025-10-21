import React, { useState } from "react";
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
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../contexts/ThemeContext";

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

// Fake data for student classes
const generateFakeClasses = () => {
  return [
    {
      id: 1,
      name: "English Level A1 - Morning Class",
      color: getClassColor(1),
      avatar: getRandomAvatar(),
      isActive: true,
      syllabusName: "Cambridge English A1",
      levelName: "Starters",
      startDate: "2025-01-15",
      endDate: "2025-06-30",
    },
    {
      id: 2,
      name: "Mathematics Basic",
      color: getClassColor(2),
      avatar: getRandomAvatar(),
      isActive: true,
      syllabusName: "Basic Math Course",
      levelName: "Movers",
      startDate: "2025-02-01",
      endDate: "2025-07-15",
    },
    {
      id: 3,
      name: "English Conversation A2",
      color: getClassColor(3),
      avatar: getRandomAvatar(),
      isActive: true,
      syllabusName: "Cambridge English A2",
      levelName: "Flyers",
      startDate: "2025-01-20",
      endDate: "2025-06-20",
    },
    {
      id: 4,
      name: "Writing Skills Development",
      color: getClassColor(4),
      avatar: getRandomAvatar(),
      isActive: false,
      syllabusName: "Advanced Writing",
      levelName: "Pre A1",
      startDate: "2024-09-01",
      endDate: "2024-12-31",
    },
    {
      id: 5,
      name: "English Grammar Fundamentals",
      color: getClassColor(5),
      avatar: getRandomAvatar(),
      isActive: true,
      syllabusName: "Grammar Basics",
      levelName: "Starters",
      startDate: "2025-01-10",
      endDate: "2025-06-10",
    },
    {
      id: 6,
      name: "Reading Comprehension B1",
      color: getClassColor(6),
      avatar: getRandomAvatar(),
      isActive: true,
      syllabusName: "Reading Skills B1",
      levelName: "KET",
      startDate: "2025-02-15",
      endDate: "2025-08-15",
    },
    {
      id: 7,
      name: "Listening Practice A2",
      color: getClassColor(7),
      avatar: getRandomAvatar(),
      isActive: true,
      syllabusName: "Listening A2 Course",
      levelName: "Flyers",
      startDate: "2025-01-25",
      endDate: "2025-07-25",
    },
    {
      id: 8,
      name: "Speaking Confidence Builder",
      color: getClassColor(8),
      avatar: getRandomAvatar(),
      isActive: false,
      syllabusName: "Speaking Workshop",
      levelName: "Movers",
      startDate: "2024-10-01",
      endDate: "2024-12-31",
    },
  ];
};

const StudentClassList = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  // Set page title
  usePageTitle('My Classes');
  
  // State for classes data
  const [allClasses] = useState(generateFakeClasses());
  const [loading] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 9,
    total: generateFakeClasses().length,
  });
  
  // Search state
  const [searchText, setSearchText] = useState("");

  const handleSearch = (value) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleCardClick = (classItem) => {
    // TODO: Navigate to class detail page for student
    console.log('Navigate to class:', classItem.id);
    // navigate(`/student/classes/${classItem.id}`);
  };

  // Filter classes based on search
  const filteredClasses = allClasses.filter(classItem =>
    classItem.name.toLowerCase().includes(searchText.toLowerCase()) ||
    classItem.syllabusName.toLowerCase().includes(searchText.toLowerCase()) ||
    classItem.levelName.toLowerCase().includes(searchText.toLowerCase())
  );

  // Paginate filtered classes
  const startIndex = (pagination.current - 1) * pagination.pageSize;
  const endIndex = startIndex + pagination.pageSize;
  const paginatedClasses = filteredClasses.slice(startIndex, endIndex);

  return (
    <ThemedLayout>
      <div className={`class-page main-content-panel ${theme}-main-panel`}>
        {/* Page Title */}
        <div className="page-title-container">
          <Typography.Title 
            level={1} 
            className="page-title"
          >
            Lớp của tôi <span className="student-count">({filteredClasses.length})</span>
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
                placeholder="Tìm kiếm lớp học..."
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
            {paginatedClasses.length > 0 ? (
              <>
                <Row gutter={[16, 16]} justify="start" style={{ padding: '0 20px', marginBottom: '24px' }}>
                  {paginatedClasses.map((classItem) => (
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
                              {classItem.isActive ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                          
                          <div className="class-meta" style={{ fontSize: '16px', gap: '8px' }}>
                            {/* Syllabus and Level */}
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              gap: '8px'
                            }}>
                              <Tooltip title={`Giáo trình: ${classItem.syllabusName}`} placement="top">
                                <span style={{ 
                                  color: '#000000',
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap',
                                  flex: 1
                                }}>
                                  <BookOutlined style={{ color: '#000000', fontSize: '14px', marginRight: '4px' }} />
                                  Giáo trình: {classItem.syllabusName}
                                </span>
                              </Tooltip>
                              <Tooltip title={`Cấp độ: ${classItem.levelName}`} placement="top">
                                <span style={{ 
                                  color: '#000000',
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap'
                                }}>
                                  Cấp độ: {classItem.levelName}
                                </span>
                              </Tooltip>
                            </div>

                            {/* Start Date and End Date */}
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              gap: '8px'
                            }}>
                              <Tooltip title={`Ngày bắt đầu: ${classItem.startDate}`} placement="top">
                                <span style={{ 
                                  color: '#000000',
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap',
                                  flex: 1
                                }}>
                                  <CalendarOutlined style={{ color: '#000000', fontSize: '14px', marginRight: '4px' }} />
                                  Bắt đầu: {classItem.startDate}
                                </span>
                              </Tooltip>
                              <Tooltip title={`Ngày kết thúc: ${classItem.endDate}`} placement="top">
                                <span style={{ 
                                  color: '#000000',
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap'
                                }}>
                                  Kết thúc: {classItem.endDate}
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
                {filteredClasses.length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    padding: '0 20px',
                    marginTop: '8px'
                  }}>
                    <Pagination
                      current={pagination.current}
                      total={filteredClasses.length}
                      pageSize={pagination.pageSize}
                      showSizeChanger={true}
                      showQuickJumper={false}
                      showTotal={(total, range) => 
                        `${range[0]}-${range[1]} of ${total} classes`
                      }
                      onChange={(page, pageSize) => {
                        setPagination(prev => ({ ...prev, current: page, pageSize }));
                      }}
                      onShowSizeChange={(current, size) => {
                        setPagination(prev => ({ ...prev, current: 1, pageSize: size }));
                      }}
                      pageSizeOptions={['6', '9', '12', '18']}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <p>Không tìm thấy lớp học nào</p>
              </div>
            )}
          </LoadingWithEffect>
        </div>
      </div>
    </ThemedLayout>
  );
};

export default StudentClassList;

