import React, { useState, useEffect, useCallback, useMemo } from "react";
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

const AssignStudentToClass = ({ student, students, onClose, onSuccess }) => {
	const { t } = useTranslation();
	const { theme } = useTheme();
  
  // Determine if this is bulk assignment (multiple students)
  const isBulkAssignment = Array.isArray(students) && students.length > 0;
  const studentsList = useMemo(() => {
    return isBulkAssignment ? students : (student ? [student] : []);
  }, [isBulkAssignment, students, student]);
  
  // State management
  const [searchText, setSearchText] = useState("");
  const [allClasses, setAllClasses] = useState([]); // All classes loaded
  const [displayedClasses, setDisplayedClasses] = useState([]); // Filtered classes to display
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [assigningLoading, setAssigningLoading] = useState(false);

  // Process and recommend classes - memoized based on studentsList
  const processClasses = useCallback((classes, studentList) => {
    if (!classes || classes.length === 0) {
      return [];
    }
    
    // Add recommendation logic based on student's level
    const recommended = classes.map(cls => {
          let recommendationScore = 0;
          let reasons = [];

          // Check if students are already assigned to this class
          const classStudentsList = cls.students || cls.studentInfos || [];
          const studentIds = studentList.map(s => s.id);
          const alreadyAssignedCount = classStudentsList.filter(s => studentIds.includes(s.id)).length;
          const isAllAssigned = alreadyAssignedCount === studentList.length;
          const isSomeAssigned = alreadyAssignedCount > 0 && alreadyAssignedCount < studentList.length;


          // Level matching (highest priority) - check if any student matches
          if (cls.syllabus && cls.syllabus.level) {
            const classLevel = cls.syllabus.level.levelName || cls.syllabus.level;
            const matchingStudents = studentList.filter(s => {
              const studentLevel = s.currentLevelInfo?.levelName || s.currentLevelInfo?.name;
              return studentLevel && classLevel && studentLevel.toLowerCase() === classLevel.toLowerCase();
            });
            if (matchingStudents.length > 0) {
              recommendationScore += 50;
              if (matchingStudents.length === studentList.length) {
                reasons.push(t('studentManagement.allLevelMatch'));
              } else {
                reasons.push(t('studentManagement.someLevelMatch', { count: matchingStudents.length }));
              }
            }
          }

          // Class capacity (prefer classes with more students)
          const currentStudentCount = cls.studentCount || classStudentsList.length || 0;
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
            isAlreadyAssigned: isAllAssigned,
            isSomeAssigned,
            alreadyAssignedCount,
            totalSelectedCount: studentList.length,
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

    return recommended;
  }, [t]);

  // Load all classes on component mount - only once
  useEffect(() => {
    let isMounted = true;
    
    const loadClasses = async () => {
      setIsLoading(true);
      try {
        // Filter statuses for class search - can be easily modified
        const FILTER_STATUSES = ['ACTIVE', 'PENDING', 'UPCOMING_END'];
        
        // Call API to get all classes with multiple status filters
        const response = await classManagementApi.getClasses({
          page: 0,
          size: 100,
          searchText: '', // Empty to get all
          status: FILTER_STATUSES
        });

        if (isMounted) {
          if (response.success && response.data) {
            // Process classes with current studentsList
            const processedClasses = processClasses(response.data, studentsList);
            setAllClasses(processedClasses);
            setDisplayedClasses(processedClasses);
          } else {
            setAllClasses([]);
            setDisplayedClasses([]);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading classes:', error);
          const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || t('studentManagement.searchError');
          spaceToast.error(errorMessage);
          setAllClasses([]);
          setDisplayedClasses([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadClasses();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - studentsList is passed as parameter to processClasses

  // Filter classes based on search text
  useEffect(() => {
    if (!searchText.trim()) {
      // If no search text, show all classes
      setDisplayedClasses(allClasses);
      return;
    }

    // Filter classes by search text (case-insensitive)
    const searchLower = searchText.toLowerCase().trim();
    const filtered = allClasses.filter(cls => {
      const className = (cls.className || cls.name || '').toLowerCase();
      const classCode = (cls.classCode || '').toLowerCase();
      const levelName = (cls.syllabus?.level?.levelName || cls.syllabus?.syllabusName || '').toLowerCase();
      const teacherNames = (cls.teacherInfos || []).map(t => (t.fullName || t.userName || '').toLowerCase()).join(' ');
      
      return className.includes(searchLower) || 
             classCode.includes(searchLower) || 
             levelName.includes(searchLower) ||
             teacherNames.includes(searchLower);
    });

    setDisplayedClasses(filtered);
  }, [searchText, allClasses]);

  // Handle class selection (single selection only)
  const handleClassSelection = (classId) => {
    if (selectedClass?.id === classId) {
      setSelectedClass(null);
    } else {
      const classItem = displayedClasses.find(cls => cls.id === classId);
      setSelectedClass(classItem);
    }
  };

  // Handle assign students to class
  const handleAssignToClass = async () => {
    if (!selectedClass) {
      spaceToast.warning(t('studentManagement.selectAtLeastOneClass'));
      return;
    }

    if (!studentsList || studentsList.length === 0) {
      spaceToast.error('Student information is missing');
      return;
    }

    // Get all student IDs
    const studentIds = studentsList.map(s => s.id).filter(id => id);
    
    if (studentIds.length === 0) {
      spaceToast.error('No valid student IDs found');
      return;
    }

    setAssigningLoading(true);
    try {
      const response = await classManagementApi.addStudentsToClass(selectedClass.id, studentIds);
      
      if (response.success) {
        const successMessage = isBulkAssignment 
          ? t('studentManagement.bulkAssignSuccess', { count: studentIds.length, className: selectedClass.className || selectedClass.name })
          : response.message || t('studentManagement.assignStudentSuccess');
        spaceToast.success(successMessage);
        onClose(); // Close modal
        if (onSuccess) {
          onSuccess(); // Refresh the student list
        }
      } 
    } catch (error) {
      console.error('Error assigning students to class:', error);
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
    const isSomeAssigned = classItem.isSomeAssigned;
    
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
                  {isBulkAssignment 
                    ? t('studentManagement.allAlreadyAssigned', { count: classItem.totalSelectedCount })
                    : t('studentManagement.alreadyAssigned')
                  }
                </Tag>
              )}
              {isSomeAssigned && !isAlreadyAssigned && (
                <Tag color="orange">
                  {t('studentManagement.someAlreadyAssigned', { 
                    assigned: classItem.alreadyAssignedCount, 
                    total: classItem.totalSelectedCount 
                  })}
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
              {isBulkAssignment 
                ? t('studentManagement.allAlreadyAssigned', { count: classItem.totalSelectedCount })
                : t('studentManagement.alreadyAssigned')
              }
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
        title={isBulkAssignment ? t('studentManagement.totalSelectedStudents', { count: studentsList.length }) : t('studentManagement.studentInfo')}
        className={`student-info-card ${theme}-student-info-card`}
        style={{ marginBottom: 24 }}
      >
        {isBulkAssignment ? (
          <div>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <List
                size="small"
                dataSource={studentsList}
                renderItem={(s) => (
                  <List.Item style={{ padding: '8px 0' }}>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                      title={
                        <span style={{ fontSize: '14px' }}>
                          {s.fullName || s.userName || s.name}
                        </span>
                      }
                      description={
                        <div>
                          <Tag color={s.roleName === 'STUDENT' ? 'blue' : 'green'} style={{ marginRight: 4 }}>
                            {s.roleName === 'STUDENT' ? t('common.student') : t('common.testTaker')}
                          </Tag>
                          {s.currentLevelInfo && (
                            <Tag color="orange">
                              {s.currentLevelInfo.levelName || s.currentLevelInfo.name}
                            </Tag>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          </div>
        ) : (
          <Row gutter={16}>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <UserOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              </div>
            </Col>
            <Col span={16}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px' }}>
                  {studentsList[0]?.fullName || studentsList[0]?.userName || studentsList[0]?.name}
                </h3>
                <Tag color={studentsList[0]?.roleName === 'STUDENT' ? 'blue' : 'green'}>
                  {studentsList[0]?.roleName === 'STUDENT' 
                    ? t('common.student') 
                    : t('common.testTaker')
                  }
                </Tag>
                {studentsList[0]?.currentLevelInfo && (
                  <Tag color="orange" style={{ marginLeft: 8 }}>
                    {studentsList[0].currentLevelInfo.levelName || studentsList[0].currentLevelInfo.name}
                  </Tag>
                )}
                {studentsList[0]?.email && (
                  <div style={{ marginTop: '8px', color: '#666' }}>
                    {studentsList[0].email}
                  </div>
                )}
              </div>
            </Col>
          </Row>
        )}
      </Card>

      {/* Classes List */}
      <Card 
        title={t('studentManagement.selectClass')}
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
        
        {/* Classes List */}
        <div style={{ marginTop: '16px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px', color: '#666' }}>
                {t('studentManagement.searchingClasses')}
              </div>
            </div>
          ) : displayedClasses.length > 0 ? (
            <div>
              <div style={{ marginBottom: '16px', color: '#666' }}>
                {searchText.trim() 
                  ? t('studentManagement.foundClasses', { count: displayedClasses.length })
                  : t('studentManagement.availableClasses', { count: displayedClasses.length })
                }
              </div>
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <List
                  dataSource={displayedClasses}
                  renderItem={renderClassItem}
                  className={`search-results-list ${theme}-search-results-list`}
                />
              </div>
            </div>
          ) : (
            <Empty
              description={searchText.trim() 
                ? t('studentManagement.noClassesFound')
                : t('studentManagement.noClassesAvailable')
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
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
              ? (isBulkAssignment 
                  ? t('studentManagement.assignAllToSelectedClass', { count: studentsList.length })
                  : t('studentManagement.assignToSelectedClass')
                )
              : (isBulkAssignment 
                  ? t('studentManagement.selectClassToAssignAll')
                  : t('studentManagement.selectClassToAssign')
                )
            }
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default AssignStudentToClass;