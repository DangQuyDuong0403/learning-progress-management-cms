import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Input,
  Button,
  Row,
  Col,
  Card,
  Tag,
  Spin,
  Empty,
  List,
  Avatar,
} from "antd";
import {
  SearchOutlined,
  CheckOutlined,
  UserOutlined,
  BookOutlined,
  StarOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../../../contexts/ThemeContext";
import { spaceToast } from "../../../../component/SpaceToastify";
import classManagementApi from "../../../../apis/backend/classManagement";

const AssignStudentToClass = ({ student, onClose, onSuccess }) => {
	const { t } = useTranslation();
	const { theme } = useTheme();
  
  // State management
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [assigningLoading, setAssigningLoading] = useState(false);

  // Search and recommendation logic
  const handleSearch = useCallback(async (searchValue) => {
    
    // Filter statuses for class search - can be easily modified
    const FILTER_STATUSES = ['ACTIVE', 'PENDING', 'UPCOMING_END'];
    if (!searchValue.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      
      // Call API to search classes with multiple status filters
      const response = await classManagementApi.getClasses({
        page: 0,
        size: 100,
        searchText: searchValue.trim(),
        status: FILTER_STATUSES // Filter on backend using array
      });


      if (response.success && response.data) {
        const classes = response.data;
        
        // Debug: Log class data structure to understand the fields
        // Add recommendation logic based on student's level
        const recommended = classes.map(cls => {
          let recommendationScore = 0;
          let reasons = [];

          // Check if student is already assigned to this class
          const studentsList = cls.students || cls.studentInfos || [];
          const isAlreadyAssigned = studentsList.some(s => s.id === student.id);


          // Level matching (highest priority)
          if (cls.syllabus && cls.syllabus.level && student?.currentLevelInfo) {
            const classLevel = cls.syllabus.level.levelName || cls.syllabus.level;
            const studentLevel = student.currentLevelInfo.levelName || student.currentLevelInfo.name;
            if (classLevel && studentLevel && classLevel.toLowerCase() === studentLevel.toLowerCase()) {
              recommendationScore += 50;
              reasons.push(t('studentManagement.levelMatch'));
            }
          }

          // Class capacity (prefer classes with more students)
          const currentStudentCount = cls.studentCount || studentsList.length || 0;
          if (currentStudentCount > 15) {
            recommendationScore += 30;
            reasons.push(t('studentManagement.goodClassSize'));
          }

          // Class status scoring
          if (cls.status === 'ACTIVE') {
            recommendationScore += 30;
            reasons.push(t('studentManagement.activeClass'));
          } else if (cls.status === 'PENDING') {
            recommendationScore += 20;
            reasons.push(t('studentManagement.pendingClass'));
          } else if (cls.status === 'UPCOMING_END') {
            recommendationScore += 10;
            reasons.push(t('studentManagement.upcomingEndClass'));
          }

          return {
            ...cls,
            recommendationScore,
            reasons,
            isRecommended: recommendationScore >= 30,
            isAlreadyAssigned,
            studentCount: currentStudentCount,
            maxStudents: cls.maxStudents || 25,
            currentTeachers: cls.teacherInfos || []
          };
        });

        // Sort by recommendation score (highest first), then by name
        recommended.sort((a, b) => {
          if (b.recommendationScore !== a.recommendationScore) {
            return b.recommendationScore - a.recommendationScore;
          }
          // Use className instead of name, with fallback to empty string
          const nameA = a.className || a.name || '';
          const nameB = b.className || b.name || '';
          return nameA.localeCompare(nameB);
        });

        setSearchResults(recommended);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching classes:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || t('studentManagement.searchError');
      spaceToast.error(errorMessage);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [student, t]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchText);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchText, handleSearch]);

  // Handle class selection (single selection only)
  const handleClassSelection = (classId) => {
    if (selectedClass?.id === classId) {
      setSelectedClass(null);
    } else {
      const classItem = searchResults.find(cls => cls.id === classId);
      setSelectedClass(classItem);
    }
  };

  // Handle assign student to class
  const handleAssignToClass = async () => {
    if (!selectedClass) {
      spaceToast.warning(t('studentManagement.selectAtLeastOneClass'));
      return;
    }

    if (!student || !student.id) {
      spaceToast.error('Student information is missing');
      return;
    }

    setAssigningLoading(true);
    try {
      const response = await classManagementApi.addStudentsToClass(selectedClass.id, [student.id]);
      
      if (response.success) {
        spaceToast.success(response.message);
        onClose(); // Close modal
        if (onSuccess) {
          onSuccess(); // Refresh the student list
        }
      } 
    } catch (error) {
      console.error('Error assigning student to class:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || t('studentManagement.assignStudentError');
      spaceToast.error(errorMessage);
    } finally {
      setAssigningLoading(false);
    }
  };

  // Render class recommendation item
  const renderClassItem = (classItem) => {
    const isSelected = selectedClass?.id === classItem.id;
    const isAlreadyAssigned = classItem.isAlreadyAssigned;
    
    return (
      <List.Item
        key={classItem.id}
        className={`class-recommendation-item ${theme}-class-recommendation-item`}
        style={{
          background: isSelected ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
          border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
          borderRadius: '8px',
          marginBottom: '12px',
          padding: '16px',
          cursor: isAlreadyAssigned ? 'not-allowed' : 'pointer',
          opacity: isAlreadyAssigned ? 0.6 : 1,
        }}
        onClick={() => !isAlreadyAssigned && handleClassSelection(classItem.id)}
      >
        <List.Item.Meta
          avatar={
            <Avatar 
              icon={<BookOutlined />} 
              style={{ 
                backgroundColor: isAlreadyAssigned ? '#ff4d4f' : 
                                classItem.isRecommended ? '#52c41a' : '#1890ff',
                color: 'white'
              }} 
            />
          }
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                {classItem.className || classItem.name || 'Unnamed Class'}
              </span>
              {classItem.isRecommended && !isAlreadyAssigned && (
                <Tag color="green" icon={<StarOutlined />}>
                  {t('studentManagement.recommended')}
                </Tag>
              )}
              {isAlreadyAssigned && (
                <Tag color="red">
                  {t('studentManagement.alreadyAssigned')}
                </Tag>
              )}
            </div>
          }
          description={
            <div>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: theme === 'dark' ? '#cccccc' : '#666666', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '500' }}>Code:</span> {classItem.classCode}
                </div>
                {classItem.syllabus && (
                  <Tag color="blue">
                    {classItem.syllabus.level?.levelName || classItem.syllabus.syllabusName || classItem.syllabus.level || classItem.syllabus.name}
                  </Tag>
                )}
                <Tag color={
                  classItem.status === 'ACTIVE' ? 'green' : 
                  classItem.status === 'PENDING' ? 'orange' : 
                  classItem.status === 'UPCOMING_END' ? 'blue' : 'default'
                }>
                  {classItem.status === 'ACTIVE' ? t('common.active') : 
                   classItem.status === 'PENDING' ? t('common.pending') : 
                   classItem.status === 'UPCOMING_END' ? t('classManagement.upcomingEnd') : t('common.inactive')}
                </Tag>
              </div>
              
              {classItem.startDate && (
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ color: '#666' }}>
                    <CalendarOutlined /> {t('studentManagement.startDate')}: {new Date(classItem.startDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#666' }}>
                  {t('studentManagement.currentTeachers')}: {
                    classItem.teacherInfos && classItem.teacherInfos.length > 0 
                      ? classItem.teacherInfos.map(t => t.fullName || t.userName).join(', ')
                      : t('studentManagement.noTeacher')
                  }
                </span>
              </div>
              
              {classItem.reasons && classItem.reasons.length > 0 && !isAlreadyAssigned && (
                <div>
                  <span style={{ color: '#52c41a', fontSize: '12px' }}>
                    {t('studentManagement.recommendationReasons')}: {classItem.reasons.join(', ')}
                  </span>
                </div>
              )}
            </div>
          }
        />
        <div>
          {isAlreadyAssigned ? (
            <Button
              type="default"
              disabled
              size="small"
              style={{ color: '#ff4d4f', borderColor: '#ff4d4f' }}
            >
              {t('studentManagement.alreadyAssigned')}
            </Button>
          ) : isSelected ? (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleClassSelection(classItem.id);
              }}
            >
              {t('common.selected')}
            </Button>
          ) : (
            <Button
              type="default"
              icon={<CheckOutlined />}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleClassSelection(classItem.id);
              }}
            >
              {t('common.select')}
            </Button>
          )}
        </div>
      </List.Item>
    );
  };


  return (
    <div className={`assign-student-form ${theme}-assign-student-form`}>
      {/* Student Info Card */}
      <Card 
        title={t('studentManagement.studentInfo')}
        className={`student-info-card ${theme}-student-info-card`}
        style={{ marginBottom: 24 }}
      >
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <UserOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            </div>
          </Col>
          <Col span={16}>
            <div>
              <h3 style={{ margin: 0, fontSize: '20px' }}>
                {student?.fullName || student?.userName || student?.name}
              </h3>
              <Tag color={student?.roleName === 'STUDENT' ? 'blue' : 'green'}>
                {student?.roleName === 'STUDENT' 
                  ? t('common.student') 
                  : t('common.testTaker')
                }
              </Tag>
              {student?.currentLevelInfo && (
                <Tag color="orange" style={{ marginLeft: 8 }}>
                  {student.currentLevelInfo.levelName || student.currentLevelInfo.name}
                </Tag>
              )}
              {student?.email && (
                <div style={{ marginTop: '8px', color: '#666' }}>
                  {student.email}
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Card>

      {/* Search Classes */}
      <Card 
        title={t('studentManagement.searchAndRecommendClasses')}
        className={`search-card ${theme}-search-card`}
        style={{ marginBottom: 24 }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Input
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className={`search-input ${theme}-search-input`}
              style={{ height: '40px', fontSize: '16px' }}
              allowClear
              size="large"
            />
          </Col>
        </Row>
        
        {/* Search Results */}
        {hasSearched && (
          <div style={{ marginTop: '16px' }}>
            {isSearching ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px', color: '#666' }}>
                  {t('studentManagement.searchingClasses')}
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                <div style={{ marginBottom: '16px', color: '#666' }}>
                  {t('studentManagement.foundClasses', { count: searchResults.length })}
                </div>
                <List
                  dataSource={searchResults}
                  renderItem={renderClassItem}
                  className={`search-results-list ${theme}-search-results-list`}
                />
              </div>
            ) : (
              <Empty
                description={t('studentManagement.noClassesFound')}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      <Row gutter={16} style={{ marginTop: 32 }}>
        <Col span={12}>
          <Button
            type="default"
            onClick={onClose}
            style={{ width: '100%', height: 40 }}
            className={`cancel-button ${theme}-cancel-button`}
          >
            {t('common.cancel')}
          </Button>
        </Col>
        <Col span={12}>
          <Button
            type="primary"
            onClick={handleAssignToClass}
            loading={assigningLoading}
            disabled={!selectedClass || assigningLoading}
            style={{ 
              width: '100%', 
              height: 40,
              backgroundColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
              background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
              borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'transparent',
              color: theme === 'sun' ? '#000000' : '#ffffff',
            }}
            className={`submit-button ${theme}-submit-button`}
          >
            {selectedClass 
              ? `${t('studentManagement.assignToSelectedClass')}`
              : t('studentManagement.assignToSelectedClass')
            }
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default AssignStudentToClass;