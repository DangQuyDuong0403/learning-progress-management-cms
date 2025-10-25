import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  Input,
  Space,
  Table,
  Typography,
  Tooltip,
  Modal,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  FilterOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
// import CreateDailyChallengeModal from "./CreateDailyChallengeModal"; // Keep old modal (not deleted, just commented)
import SimpleDailyChallengeModal from "./SimpleDailyChallengeModal"; // New simple modal
import EditDailyChallengeModal from "./EditDailyChallengeModal"; // Edit modal
import "./DailyChallengeList.css";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useDailyChallengeMenu } from "../../../../contexts/DailyChallengeMenuContext";
import usePageTitle from "../../../../hooks/usePageTitle";
import { useSelector } from "react-redux";
import { dailyChallengeApi } from "../../../../apis/apis";

// Select removed in favor of AccountList-style filter dropdown

// Mock data - thay thế bằng API call thực tế
const mockDailyChallenges = [
  {
    id: 1,
    title: "Grammar & Vocabulary Challenge #1",
    type: "Grammar & Vocabulary",
    timeLimit: 30,
    totalQuestions: 20,
    description: "Basic English grammar and vocabulary test",
    status: "active",
    createdAt: "2024-01-15",
    teacher: "Nguyễn Văn A",
  },
  {
    id: 2,
    title: "Reading Comprehension Test #2",
    type: "Reading",
    timeLimit: 45,
    totalQuestions: 15,
    description: "Reading comprehension with multiple choice questions",
    status: "active",
    createdAt: "2024-01-16",
    teacher: "Trần Thị B",
  },
  {
    id: 3,
    title: "Writing Challenge #3",
    type: "Writing",
    timeLimit: 60,
    totalQuestions: 3,
    description: "Essay writing challenge with specific topics",
    status: "active",
    createdAt: "2024-01-17",
    teacher: "Lê Văn C",
  },
  {
    id: 4,
    title: "Listening Test #4",
    type: "Listening",
    timeLimit: 25,
    totalQuestions: 12,
    description: "Audio-based listening comprehension test",
    status: "active",
    createdAt: "2024-01-18",
    teacher: "Phạm Thị D",
  },
  {
    id: 5,
    title: "Speaking Assessment #5",
    type: "Speaking",
    timeLimit: 15,
    totalQuestions: 5,
    description: "Oral communication skills assessment",
    status: "inactive",
    createdAt: "2024-01-19",
    teacher: "Nguyễn Thị E",
  },
];

const DailyChallengeList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { classId } = useParams(); // Get classId from URL params
  const { theme } = useTheme();
  const { user } = useSelector((state) => state.auth);
  const { enterDailyChallengeMenu, exitDailyChallengeMenu, updateChallengeCount } = useDailyChallengeMenu();
  
  // Set page title based on whether it's class-specific or general
  usePageTitle(classId ? `Class ${classId} Daily Challenges` : 'Daily Challenge Management');
  
  const [loading, setLoading] = useState(false);
  const [dailyChallenges, setDailyChallenges] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalData, setCreateModalData] = useState(null); // Store lesson data for create modal
  const [searchDebounce, setSearchDebounce] = useState("");
  const [deleteModal, setDeleteModal] = useState({
    visible: false,
    challengeId: null,
    challengeTitle: '',
  });
  const [editModal, setEditModal] = useState({
    visible: false,
    challengeId: null,
    challengeData: null,
  });

  // AccountList-style filter dropdown state and refs
  const [filterDropdown, setFilterDropdown] = useState({
    visible: false,
    selectedTypes: [],
    selectedStatuses: [],
  });
  const filterContainerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdown.visible && filterContainerRef.current) {
        if (!filterContainerRef.current.contains(event.target)) {
          setFilterDropdown((prev) => ({ ...prev, visible: false }));
        }
      }
    };

    if (filterDropdown.visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filterDropdown.visible]);

  // Filter option lists - Updated for new data structure
  const typeOptions = [
    "GV", // Grammar & Vocabulary
    "Reading",
    "Writing", 
    "Listening",
    "Speaking",
  ];
  const statusOptions = ["DRAFT", "PUBLISHED"];

  const fetchDailyChallenges = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      
      if (classId) {
        // Lấy daily challenges cho class cụ thể
        response = await dailyChallengeApi.getDailyChallengesByClass(classId, {
          page: currentPage - 1, // API sử dụng 0-based pagination
          size: pageSize,
          text: searchDebounce || undefined, // Chỉ gửi text nếu có giá trị
          sortBy: 'createdAt',
          sortDir: 'desc'
        });
      } else {
        // Lấy tất cả daily challenges của teacher
        response = await dailyChallengeApi.getAllDailyChallenges({
          page: currentPage - 1, // API sử dụng 0-based pagination
          size: pageSize,
          text: searchDebounce || undefined, // Chỉ gửi text nếu có giá trị
          sortBy: 'createdAt',
          sortDir: 'desc'
        });
      }

      console.log('Daily Challenges API Response:', response.data);
      
      // Xử lý response data - Data structure: lessons with dailyChallenges array
      if (response.data && Array.isArray(response.data)) {
        // Flatten lessons and their daily challenges into a single array for table display
        const flattenedData = [];
        
        response.data.forEach((lesson, lessonIndex) => {
          if (lesson.dailyChallenges && lesson.dailyChallenges.length > 0) {
            lesson.dailyChallenges.forEach((challenge, challengeIndex) => {
              flattenedData.push({
                ...challenge,
                // Challenge fields
                id: challenge.id,
                title: challenge.challengeName || 'Untitled Challenge',
                type: challenge.challengeType || 'Unknown',
                status: challenge.challengeStatus || 'DRAFT',
                startDate: challenge.startDate,
                endDate: challenge.endDate,
                // Lesson fields for display
                lessonId: lesson.id,
                lessonName: lesson.classLessonName || 'Untitled Lesson',
                lessonOrder: lesson.orderNumber || lessonIndex + 1,
                // Row metadata for merge cell logic
                isFirstChallengeInLesson: challengeIndex === 0,
                totalChallengesInLesson: lesson.dailyChallenges.length,
                rowSpan: challengeIndex === 0 ? lesson.dailyChallenges.length : 0,
                // Additional fields for compatibility
                description: '',
                teacher: 'Unknown Teacher',
                timeLimit: 30,
                totalQuestions: 0,
                createdAt: new Date().toISOString().split('T')[0],
              });
            });
          } else {
            // Lesson without challenges - still show lesson row
            flattenedData.push({
              id: `lesson-${lesson.id}`,
              title: 'No challenges',
              type: 'N/A',
              status: 'DRAFT',
              lessonId: lesson.id,
              lessonName: lesson.classLessonName || 'Untitled Lesson',
              lessonOrder: lesson.orderNumber || lessonIndex + 1,
              isFirstChallengeInLesson: true,
              totalChallengesInLesson: 0,
              rowSpan: 1,
              description: '',
              teacher: 'Unknown Teacher',
              timeLimit: 0,
              totalQuestions: 0,
              createdAt: new Date().toISOString().split('T')[0],
            });
          }
        });
        
        setDailyChallenges(flattenedData);
        setTotalItems(flattenedData.length);
      } else {
        setDailyChallenges([]);
        setTotalItems(0);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching daily challenges:', error);
      
      // Fallback to mock data if API fails
      console.log('Falling back to mock data due to API error');
      setDailyChallenges(mockDailyChallenges);
      
      const errorMessage = error.response?.data?.error || error.message || t('dailyChallenge.loadChallengesError');
      spaceToast.error(errorMessage);
      setLoading(false);
    }
  }, [classId, currentPage, pageSize, searchDebounce, t]);

  useEffect(() => {
    fetchDailyChallenges();
  }, [fetchDailyChallenges]);

  // Debug logging for dailyChallenges data
  useEffect(() => {
    if (dailyChallenges.length > 0) {
      console.log('Daily Challenges Data:', dailyChallenges);
      console.log('First Challenge:', dailyChallenges[0]);
    }
  }, [dailyChallenges]);

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchText);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Enter/exit daily challenge menu mode
  useEffect(() => {
    // Get classId from URL params or location state
    const currentClassId = classId || location.state?.classId;
    
    // Determine back path based on user role and classId
    const getBackPath = () => {
      if (currentClassId) {
        // If coming from class menu, go back to that class menu
        const userRole = user?.role?.toLowerCase();
        const routePrefix = userRole === 'teacher' || userRole === 'teaching_assistant' 
          ? '/teacher/classes' 
          : '/manager/classes';
        return `${routePrefix}/menu/${currentClassId}`;
      } else {
        // Otherwise, go back to classes list
        const userRole = user?.role?.toLowerCase();
        return userRole === 'teacher' || userRole === 'teaching_assistant' 
          ? '/teacher/classes' 
          : '/manager/classes';
      }
    };
    
    // Enter daily challenge menu mode when component mounts
    enterDailyChallengeMenu(0, null, getBackPath());
    
    // Exit daily challenge menu mode when component unmounts
    return () => {
      exitDailyChallengeMenu();
    };
  }, [enterDailyChallengeMenu, exitDailyChallengeMenu, classId, location.state, user]);

  // Update challenge count when filters change
  useEffect(() => {
    // Calculate filtered challenges count
    const filteredCount = dailyChallenges.filter((challenge) => {
      try {
        const matchesSearch =
          searchText === "" ||
          (challenge.title && challenge.title.toLowerCase().includes(searchText.toLowerCase())) ||
          (challenge.lessonName && challenge.lessonName.toLowerCase().includes(searchText.toLowerCase())) ||
          (challenge.description && challenge.description.toLowerCase().includes(searchText.toLowerCase()));

        const matchesType = typeFilter.length === 0 || typeFilter.includes(challenge.type);
        const matchesStatus = statusFilter.length === 0 || statusFilter.includes(challenge.status);

        return matchesSearch && matchesType && matchesStatus;
      } catch (error) {
        console.error('Error filtering challenge:', error, challenge);
        return false;
      }
    }).length;
    
    // Update count in context
    updateChallengeCount(filteredCount);
  }, [dailyChallenges, searchText, typeFilter, statusFilter, updateChallengeCount]);

  const handleSearch = (value) => {
    setSearchText(value);
    setCurrentPage(1);
    // fetchDailyChallenges will be called automatically due to dependency on searchText
  };
  // Filter dropdown handlers (AccountList-style)
  const handleFilterToggle = () => {
    setFilterDropdown((prev) => ({ ...prev, visible: !prev.visible }));
  };

  const handleFilterSubmit = () => {
    setTypeFilter(filterDropdown.selectedTypes);
    setStatusFilter(filterDropdown.selectedStatuses);
    setCurrentPage(1);
    setFilterDropdown((prev) => ({ ...prev, visible: false }));
  };

  const handleFilterReset = () => {
    setFilterDropdown((prev) => ({ ...prev, selectedTypes: [], selectedStatuses: [] }));
    setTypeFilter([]);
    setStatusFilter([]);
    setCurrentPage(1);
  };


  const handleCreateClick = () => {
    setCreateModalData(null); // No specific lesson
    setShowCreateModal(true);
  };

  const handleCreateClickWithLesson = (lessonRecord) => {
    setCreateModalData({
      lessonId: lessonRecord.lessonId,
      lessonName: lessonRecord.lessonName,
      classLessonId: lessonRecord.lessonId
    });
    setShowCreateModal(true);
  };

  const handleCreateModalCancel = () => {
    setShowCreateModal(false);
  };

  const handleCreateSuccess = async (newChallenge) => {
    try {
      // Call API to create challenge
      await dailyChallengeApi.createDailyChallenge(newChallenge);
      
      // Refresh the list from API
      await fetchDailyChallenges();
      
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating challenge:', error);
      const errorMessage = error.response?.data?.error || error.message || t('dailyChallenge.createError');
      spaceToast.error(errorMessage);
    }
  };

  const handleViewClick = (challenge) => {
    navigate(`/teacher/daily-challenges/detail/${challenge.id}`);
  };

  const handleToggleStatus = async (id) => {
    const challenge = dailyChallenges.find(c => c.id === id);
    const newStatus = challenge.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    
    try {
      // Call API to update status with specific challengeStatus parameter
      await dailyChallengeApi.updateDailyChallengeStatus(id, newStatus);
      
      // Update local state on success
      setDailyChallenges(
        dailyChallenges.map((c) =>
          c.id === id ? { ...c, status: newStatus } : c
        )
      );
      
      spaceToast.success(
        `Challenge ${newStatus === 'PUBLISHED' ? 'published' : 'drafted'} successfully`
      );
    } catch (error) {
      console.error('Error updating challenge status:', error);
      const errorMessage = error.response?.data?.error || error.message || t('dailyChallenge.toggleStatusError');
      spaceToast.error(errorMessage);
    }
  };

  const handleDeleteClick = (challenge) => {
    setDeleteModal({
      visible: true,
      challengeId: challenge.id,
      challengeTitle: challenge.title,
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      // Call API to delete challenge
      await dailyChallengeApi.deleteDailyChallenge(deleteModal.challengeId);
      
      // Refresh the entire list to recalculate rowSpan and metadata
      await fetchDailyChallenges();
      
      // Close modal
      setDeleteModal({ visible: false, challengeId: null, challengeTitle: '' });
      
      spaceToast.success(t('dailyChallenge.deleteSuccess'));
    } catch (error) {
      console.error('Error deleting challenge:', error);
      const errorMessage = error.response?.data?.error || error.message || t('dailyChallenge.deleteError');
      spaceToast.error(errorMessage);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ visible: false, challengeId: null, challengeTitle: '' });
  };

  const handleEditClick = (challenge) => {
    setEditModal({
      visible: true,
      challengeId: challenge.id,
      challengeData: challenge,
    });
  };

  const handleEditModalCancel = () => {
    setEditModal({ visible: false, challengeId: null, challengeData: null });
  };

  const handleEditSuccess = async (updatedChallenge) => {
    try {
      // Call API to update challenge
      await dailyChallengeApi.updateDailyChallenge(editModal.challengeId, updatedChallenge);
      
      // Refresh the list from API
      await fetchDailyChallenges();
      
      setEditModal({ visible: false, challengeId: null, challengeData: null });
      spaceToast.success(t('dailyChallenge.updateSuccess'));
    } catch (error) {
      console.error('Error updating challenge:', error);
      const errorMessage = error.response?.data?.error || error.message || t('dailyChallenge.updateError');
      spaceToast.error(errorMessage);
    }
  };


  // Filter data based on type and status filters (search is handled by API)
  const filteredChallenges = dailyChallenges.filter((challenge) => {
    const matchesType = typeFilter.length === 0 || typeFilter.includes(challenge.type);
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(challenge.status);

    return matchesType && matchesStatus;
  });


  const columns = [
    {
      title: 'No',
      key: 'stt',
      width: 70,
      align: 'center',
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: 'Lesson',
      dataIndex: 'lessonName',
      key: 'lessonName',
      width: 200,
      align: 'center',
      render: (text, record) => {
        // Only render lesson name for the first challenge in each lesson
        if (record.isFirstChallengeInLesson) {
          return {
            children: (
              <div 
                className="lesson-cell-container"
                style={{
                  fontSize: '18px',
                  color: '#333',
                  padding: '8px 12px',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  borderRadius: '4px',
                  textAlign: 'center',
                  position: 'relative',
                  cursor: 'pointer',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span className="lesson-text" style={{ transition: 'opacity 0.3s ease' }}>
                  {text}
                </span>
                <Button
                  className="lesson-create-btn"
                  icon={<PlusOutlined />}
                  style={{
                    fontSize: '16px',
                    height: '40px',
                    padding: '0 20px',
                    borderRadius: '8px',
                    background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
                    borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
                    color: theme === 'sun' ? '#000' : '#000',
                    fontWeight: '500',
                    border: 'none',
                    minWidth: '160px',
                    margin: '0'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateClickWithLesson(record);
                  }}
                  title={`Create Daily Challenge for ${text}`}
                >
                  Create Challenge
                </Button>
              </div>
            ),
            props: {
              rowSpan: record.rowSpan,
            },
          };
        }
        return {
          children: null,
          props: {
            rowSpan: 0,
          },
        };
      },
    },
    {
      title: t('dailyChallenge.challengeTitle'),
      dataIndex: 'title',
      key: 'title',
      width: 300,
      align: 'left',
      ellipsis: {
        showTitle: false,
      },
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          <span style={{ 
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'left',
          }}>
            {text}
          </span>
        </Tooltip>
      ),
    },
    {
      title: t('dailyChallenge.type'),
      dataIndex: 'type',
      key: 'type',
      width: 150,
      align: 'center',
      render: (type) => {
        const getTypeLabel = (typeCode) => {
          switch(typeCode) {
            case 'GV': return 'Grammar & Vocabulary';
            case 'RE': return 'Reading';
            case 'LI': return 'Listening';
            case 'WR': return 'Writing';
            case 'SP': return 'Speaking';
            default: return typeCode;
          }
        };

        return (
          <span style={{
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '18px',
            color: '#000000'
          }}>
            {getTypeLabel(type)}
          </span>
        );
      },
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      align: 'center',
      render: (startDate) => startDate ? new Date(startDate).toLocaleDateString() : '-',
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
      align: 'center',
      render: (endDate) => endDate ? new Date(endDate).toLocaleDateString() : '-',
    },
    {
      title: t('dailyChallenge.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status, record) => (
        <span style={{
          fontSize: '20px',
          color: '#000000'
        }}>
          {status === 'PUBLISHED' ? t('dailyChallenge.published') : t('dailyChallenge.draft')}
        </span>
      ),
    },
    {
      title: t('dailyChallenge.actions'),
      key: 'actions',
      width: 180,
      align: 'center',
      render: (_, record) => {
        // Ẩn action buttons nếu lesson không có challenge (title = "No challenges")
        if (record.title === 'No challenges') {
          return <span style={{ color: '#999', fontSize: '14px' }}>-</span>;
        }
        
        return (
          <Space size="small">
            <Button
              type="text"
              icon={<EyeOutlined style={{ fontSize: '24px' }} />}
              onClick={() => handleViewClick(record)}
              title={t('dailyChallenge.viewDetails')}
              className="action-btn-view"
            />
            <Button
              type="text"
              icon={<EditOutlined style={{ fontSize: '24px' }} />}
              onClick={() => handleEditClick(record)}
              title={t('dailyChallenge.editChallenge')}
              className="action-btn-edit"
              style={{ color: '#1890ff' }}
            />
            {record.status === 'DRAFT' && (
              <Button
                type="text"
                icon={<CheckCircleOutlined style={{ fontSize: '24px'}} />}
                onClick={() => handleToggleStatus(record.id)}
                title="Publish"
                className="action-btn-status"
              />
            )}
            <Button
              type="text"
              icon={<DeleteOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />}
              onClick={() => handleDeleteClick(record)}
              title={t('dailyChallenge.deleteChallenge')}
              className="action-btn-delete"
              style={{ color: '#ff4d4f' }}
            />
          </Space>
        );
      },
    },
  ];

  return (
    <ThemedLayout>
      <div className="daily-challenge-list-wrapper">
        {/* Search and Action Section */}
        <div className="search-action-section" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px', padding: '24px 24px 0 24px' }}>
          <Input
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            className={`search-input ${theme}-search-input`}
            style={{ flex: '1', minWidth: '250px', maxWidth: '400px', width: '350px', height: '40px', fontSize: '16px' }}
            allowClear
          />
          <div ref={filterContainerRef} style={{ position: 'relative' }}>
            <Button 
              icon={<FilterOutlined />}
              onClick={handleFilterToggle}
              className={`filter-button ${theme}-filter-button ${filterDropdown.visible ? 'active' : ''} ${(statusFilter.length > 0 || typeFilter.length > 0) ? 'has-filters' : ''}`}
            >
              Filter
            </Button>
            
            {/* Filter Dropdown Panel */}
            {filterDropdown.visible && (
              <div className={`filter-dropdown-panel ${theme}-filter-dropdown`}>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                    {/* Type Filter */}
                    <div style={{ flex: 1 }}>
                      <Typography.Title level={5} style={{ marginBottom: '12px', fontSize: '16px' }}>
                        {t('dailyChallenge.type')}
                      </Typography.Title>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {typeOptions.map((opt) => (
                          <Button
                            key={opt}
                            onClick={() => {
                              const newTypes = filterDropdown.selectedTypes.includes(opt)
                                ? filterDropdown.selectedTypes.filter((t) => t !== opt)
                                : [...filterDropdown.selectedTypes, opt];
                              setFilterDropdown((prev) => ({ ...prev, selectedTypes: newTypes }));
                            }}
                            className={`filter-option ${filterDropdown.selectedTypes.includes(opt) ? 'selected' : ''}`}
                          >
                            {opt === 'GV' ? 'Grammar & Vocabulary' : opt}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div style={{ flex: 1 }}>
                      <Typography.Title level={5} style={{ marginBottom: '12px', fontSize: '16px' }}>
                        {t('dailyChallenge.status')}
                      </Typography.Title>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {statusOptions.map((statusKey) => (
                          <Button
                            key={statusKey}
                            onClick={() => {
                              const newStatuses = filterDropdown.selectedStatuses.includes(statusKey)
                                ? filterDropdown.selectedStatuses.filter((s) => s !== statusKey)
                                : [...filterDropdown.selectedStatuses, statusKey];
                              setFilterDropdown((prev) => ({ ...prev, selectedStatuses: newStatuses }));
                            }}
                            className={`filter-option ${filterDropdown.selectedStatuses.includes(statusKey) ? 'selected' : ''}`}
                          >
                            {t(`dailyChallenge.${statusKey}`)}
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
          <div className="action-buttons" style={{ marginLeft: 'auto' }}>
            <Button 
              icon={<PlusOutlined />}
              className={`create-button ${theme}-create-button`}
              onClick={handleCreateClick}
            >
              {t('dailyChallenge.createChallenge')}
            </Button>
          </div>
        </div>

        {/* Table Section */}
        <div className={`table-section ${theme}-table-section`} style={{ paddingBottom: '24px' }}>
          <LoadingWithEffect loading={loading} message={t('dailyChallenge.loadingChallenges')}>
            <Table
              columns={columns}
              dataSource={filteredChallenges}
              rowKey="id"
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalItems,
                onChange: (page, size) => {
                  setCurrentPage(page);
                  if (size !== pageSize) {
                    setPageSize(size);
                  }
                },
                onShowSizeChange: (current, size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                },
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} ${t('dailyChallenge.of')} ${total} ${t('dailyChallenge.challenges')}`,
                className: `${theme}-pagination`,
                pageSizeOptions: ['10', '20', '50', '100'],
              }}
              scroll={{ x: 800 }}
              className={`daily-challenge-table ${theme}-daily-challenge-table`}
            />
          </LoadingWithEffect>
        </div>

        {/* Create Daily Challenge Modal - Using Simple Modal */}
        <SimpleDailyChallengeModal
          visible={showCreateModal}
          onCancel={handleCreateModalCancel}
          onCreateSuccess={handleCreateSuccess}
          lessonData={createModalData}
        />

        {/* Edit Daily Challenge Modal */}
        <EditDailyChallengeModal
          visible={editModal.visible}
          onCancel={handleEditModalCancel}
          onUpdateSuccess={handleEditSuccess}
          challengeData={{
            ...editModal.challengeData,
            lessonId: editModal.challengeData?.lessonId,
            lessonName: editModal.challengeData?.lessonName,
            classLessonId: editModal.challengeData?.lessonId,
          }}
        />

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
              {t('dailyChallenge.deleteChallenge')}
            </div>
          }
          open={deleteModal.visible}
          onOk={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
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
              background: '#ff4d4f',
              borderColor: '#ff4d4f',
              color: '#fff',
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
              🗑️
            </div>
            <p style={{
              fontSize: '18px',
              color: '#333',
              margin: 0,
              fontWeight: '500'
            }}>
              {t('dailyChallenge.confirmDeleteChallenge')} "{deleteModal.challengeTitle}"?
            </p>
            <p style={{
              fontSize: '14px',
              color: '#666',
              margin: 0,
              fontStyle: 'italic'
            }}>
              {t('dailyChallenge.deleteWarning')}
            </p>
          </div>
        </Modal>
        
        {/* Old CreateDailyChallengeModal - Kept for reference (not deleted) */}
        {/* <CreateDailyChallengeModal
          visible={showCreateModal}
          onCancel={handleCreateModalCancel}
          onCreateSuccess={handleCreateSuccess}
        /> */}
      </div>
    </ThemedLayout>
  );
};

export default DailyChallengeList;
