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

// Challenge types constant
const challengeTypes = [
  { id: 1, name: "Grammar & Vocabulary", type: "GV", icon: "🌟", description: "Test grammar rules and vocabulary knowledge" },
  { id: 2, name: "Reading", type: "RE", icon: "📝", description: "Reading comprehension exercises" },
  { id: 3, name: "Listening", type: "LI", icon: "🎵", description: "Audio-based listening comprehension" },
  { id: 4, name: "Writing", type: "WR", icon: "✏️", description: "Writing topics and exercises" },
  { id: 5, name: "Speaking", type: "SP", icon: "💬", description: "Oral communication practice" },
];

// Select removed in favor of AccountList-style filter dropdown


const DailyChallengeList = ({ readOnly = false }) => {
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
  const [classData, setClassData] = useState(null); // Store class data
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [allChallenges, setAllChallenges] = useState([]); // Full flattened list for lesson-aware pagination
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalData, setCreateModalData] = useState(null); // Store lesson data for create modal
  const [challengeTypeModalVisible, setChallengeTypeModalVisible] = useState(false);
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
  const [publishModal, setPublishModal] = useState({
    visible: false,
    challengeId: null,
    challengeTitle: '',
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

  // Fetch class data if classId exists
  const fetchClassData = useCallback(async () => {
    if (!classId) {
      setClassData(null);
      return;
    }
    
    try {
      const { classManagementApi } = require('../../../../apis/apis');
      const response = await classManagementApi.getClassDetail(classId);
      console.log('DailyChallengeList - Class detail response:', response);
      const data = response?.data?.data ?? response?.data ?? null;
      if (data) {
        const mapped = {
          id: data.id ?? classId,
          name:
            data.name ??
            data.className ??
            data.classname ??
            data.class_name ??
            data.title ??
            data.classTitle ??
            `Class ${classId}`, // Fallback name
        };
        console.log('DailyChallengeList - Setting classData:', mapped);
        setClassData(mapped);
      } else {
        // If no data returned, set a fallback
        console.log('DailyChallengeList - No class data, using fallback');
        setClassData({
          id: classId,
          name: `Class ${classId}`
        });
      }
    } catch (error) {
      console.error('DailyChallengeList - Error fetching class data:', error);
      // Set fallback class data even on error
      setClassData({
        id: classId,
        name: `Class ${classId}`
      });
    }
  }, [classId]);

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

      // axios interceptor already returns response.data
      console.log('Daily Challenges API Response (normalized):', response);

      // Normalize different possible response shapes
      let items = [];
      let total = 0;

      // Common shapes:
      // 1) { success, data: [...], totalElements }
      // 2) { content: [...], totalElements }
      // 3) [...]
      if (response) {
        if (Array.isArray(response)) {
          items = response;
          total = response.length;
        } else if (Array.isArray(response.data)) {
          items = response.data;
          total = response.totalElements || response.total || response.data.length || 0;
        } else if (Array.isArray(response.content)) {
          items = response.content;
          total = response.totalElements || response.total || response.content.length || 0;
        } else if (response.success && Array.isArray(response.data)) {
          items = response.data;
          total = response.totalElements || response.total || response.data.length || 0;
        } else {
          items = [];
          total = 0;
        }
      }

      // Detect if items are lessons containing dailyChallenges; otherwise treat as challenges
      const looksLikeLessons = items.length > 0 && (items[0].dailyChallenges || items.some(it => Array.isArray(it.dailyChallenges)));

      if (looksLikeLessons) {
        // Flatten lessons and their daily challenges into a single array for table display
        const flattenLessons = (lessons) => {
          const out = [];
          lessons.forEach((lesson, lessonIndex) => {
            if (lesson.dailyChallenges && lesson.dailyChallenges.length > 0) {
              lesson.dailyChallenges.forEach((challenge, challengeIndex) => {
                out.push({
                  ...challenge,
                  id: challenge.id,
                  title: challenge.challengeName || 'Untitled Challenge',
                  type: challenge.challengeType || 'Unknown',
                  status: challenge.challengeStatus || 'DRAFT',
                  startDate: challenge.startDate,
                  endDate: challenge.endDate,
                  lessonId: lesson.id,
                  lessonName: lesson.classLessonName || 'Untitled Lesson',
                  lessonOrder: lesson.orderNumber || lessonIndex + 1,
                  isFirstChallengeInLesson: challengeIndex === 0,
                  totalChallengesInLesson: lesson.dailyChallenges.length,
                  rowSpan: challengeIndex === 0 ? lesson.dailyChallenges.length : 0,
                  description: '',
                  teacher: 'Unknown Teacher',
                  timeLimit: 30,
                  totalQuestions: 0,
                  createdAt: new Date().toISOString().split('T')[0],
                });
              });
            } else {
              out.push({
                id: `lesson-${lesson.id}`,
                title: '',
                type: '',
                status: '',
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
                isEmptyLesson: true,
              });
            }
          });
          return out;
        };

        // If total is not reliable for challenge-level pagination, fetch all lessons to compute total challenges
        const shouldFetchAll = true; // Always fetch all to ensure correct total/page count for challenges
        if (shouldFetchAll) {
          const fullParams = {
            page: 0,
            size: 100,
            text: searchDebounce || undefined,
            sortBy: 'createdAt',
            sortDir: 'desc',
          };
          const fullResponse = classId
            ? await dailyChallengeApi.getDailyChallengesByClass(classId, fullParams)
            : await dailyChallengeApi.getAllDailyChallenges(fullParams);

          let allLessons = [];
          if (Array.isArray(fullResponse)) {
            allLessons = fullResponse;
          } else if (Array.isArray(fullResponse.data)) {
            allLessons = fullResponse.data;
          } else if (Array.isArray(fullResponse.content)) {
            allLessons = fullResponse.content;
          } else if (fullResponse.success && Array.isArray(fullResponse.data)) {
            allLessons = fullResponse.data;
          }

          const flattenedAll = flattenLessons(allLessons);
          setAllChallenges(flattenedAll);
          setTotalItems(flattenedAll.length);
        } else {
          const flattenedData = flattenLessons(items);
          setAllChallenges(flattenedData);
          setTotalItems(total || flattenedData.length);
        }
      } else if (items && items.length >= 0) {
        // Items are already challenges
        const mapped = items.map((challenge, idx) => ({
          ...challenge,
          id: challenge.id,
          title: challenge.challengeName || challenge.title || 'Untitled Challenge',
          type: challenge.challengeType || challenge.type || 'Unknown',
          status: challenge.challengeStatus || challenge.status || 'DRAFT',
          startDate: challenge.startDate,
          endDate: challenge.endDate,
          lessonId: challenge.lessonId || challenge.classLessonId,
          lessonName: challenge.lessonName || '',
          lessonOrder: challenge.lessonOrder || idx + 1,
          isFirstChallengeInLesson: true,
          totalChallengesInLesson: 1,
          rowSpan: 1,
          description: challenge.description || '',
          teacher: challenge.teacher || 'Unknown Teacher',
          timeLimit: challenge.timeLimit || 30,
          totalQuestions: challenge.totalQuestions || 0,
          createdAt: challenge.createdAt || new Date().toISOString().split('T')[0],
        }));

        setAllChallenges(mapped);
        setTotalItems(total || mapped.length);
      } else {
        setAllChallenges([]);
        setTotalItems(0);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching daily challenges:', error);
      

      
      const errorMessage = error.response?.data?.error || error.message || t('dailyChallenge.loadChallengesError');
      spaceToast.error(errorMessage);
      setLoading(false);
    }
  }, [classId, searchDebounce, t]);

  // Compute lesson-aware pagination: recalculate rowSpan and first-in-lesson within the current page window
  const computePagedRows = useCallback((fullList, page, size) => {
    if (!Array.isArray(fullList) || fullList.length === 0) return [];
    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size; // exclusive

    const slice = fullList.slice(startIndex, endIndex);

    // Build map of lessonId to indices in the full list for quick remaining count
    const lessonToIndices = new Map();
    for (let i = 0; i < fullList.length; i++) {
      const rec = fullList[i];
      const key = rec.lessonId ?? rec.lessonID ?? `no-lesson-${i}`;
      if (!lessonToIndices.has(key)) lessonToIndices.set(key, []);
      lessonToIndices.get(key).push(i);
    }

    // For each contiguous group by lessonId within the slice, mark the first item and set rowSpan = count within the slice
    const result = slice.map((rec, idxInSlice) => ({ ...rec }));
    let i = 0;
    while (i < result.length) {
      const current = result[i];
      const lessonKey = current.lessonId ?? current.lessonID ?? `no-lesson-${startIndex + i}`;

      // Find how many rows in this slice share the same lesson consecutively starting at i
      let j = i;
      while (
        j < result.length &&
        (result[j].lessonId ?? result[j].lessonID ?? `no-lesson-${startIndex + j}`) === lessonKey &&
        !result[j].isEmptyLesson
      ) {
        j++;
      }
      const countInSlice = j - i;

      if (countInSlice > 0) {
        // Mark first-in-page for this lesson group
        result[i].isFirstChallengeInLesson = true;
        result[i].rowSpan = countInSlice;

        // Ensure subsequent rows in this page do not render lesson cell
        for (let k = i + 1; k < j; k++) {
          result[k].isFirstChallengeInLesson = false;
          result[k].rowSpan = 0;
        }
      } else {
        // For empty lesson rows, keep as is
        result[i].isFirstChallengeInLesson = true;
        result[i].rowSpan = 1;
      }

      i = Math.max(j, i + 1);
    }

    return result;
  }, []);

  // Build filtered full list (type/status only). Search is handled by API already.
  const filteredAllChallenges = React.useMemo(() => {
    return allChallenges.filter((challenge) => {
      const matchesType = typeFilter.length === 0 || typeFilter.includes(challenge.type);
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(challenge.status);
      return matchesType && matchesStatus;
    });
  }, [allChallenges, typeFilter, statusFilter]);

  // Recompute page data whenever pagination or filtered full list changes
  useEffect(() => {
    const paged = computePagedRows(filteredAllChallenges, currentPage, pageSize);
    setDailyChallenges(paged);
  }, [filteredAllChallenges, currentPage, pageSize, computePagedRows]);

  // Keep totalItems in sync with filtered total and correct currentPage bounds
  useEffect(() => {
    const total = filteredAllChallenges.length;
    setTotalItems(total);
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    console.log('🔍 Pagination check:', { currentPage, maxPage, total, pageSize });
    // Only reset currentPage if we have data and currentPage exceeds maxPage
    if (total > 0 && currentPage > maxPage) {
      console.log('⚠️ RESETTING currentPage from', currentPage, 'to', maxPage);
      setCurrentPage(maxPage);
    }
  }, [filteredAllChallenges, pageSize]);

  // Fetch class data on component mount if classId exists
  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);

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
    console.log('DailyChallengeList - Entering daily challenge menu mode', {
      classId,
      classData,
      locationState: location.state
    });
    
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
    // Pass class name if available
    const displayName = classData?.name || null;
    console.log('DailyChallengeList - Display name for header:', displayName);
    enterDailyChallengeMenu(0, null, getBackPath(), displayName);
    
    // Exit daily challenge menu mode when component unmounts
    return () => {
      console.log('DailyChallengeList - Exiting daily challenge menu mode');
      exitDailyChallengeMenu();
    };
  }, [enterDailyChallengeMenu, exitDailyChallengeMenu, classId, location.state, user, classData]);

  // Update challenge count (for header bar) when filters/data change
  useEffect(() => {
    updateChallengeCount(filteredAllChallenges.length);
  }, [filteredAllChallenges, updateChallengeCount]);

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
    setChallengeTypeModalVisible(true);
  };

  const handleChallengeTypeClick = (challengeType) => {
    setCreateModalData({
      challengeType: challengeType.type,
      challengeTypeName: challengeType.name
    });
    setChallengeTypeModalVisible(false);
    setShowCreateModal(true);
  };

  const handleChallengeTypeModalCancel = () => {
    setChallengeTypeModalVisible(false);
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
    // Navigate with state containing class and challenge information
    navigate(`/teacher/daily-challenges/detail/${challenge.id}`, {
      state: {
        classId: classId,
        className: classData?.name,
        challengeId: challenge.id,
        challengeName: challenge.title,
        lessonName: challenge.lessonName,
      }
    });
  };

  const handleToggleStatus = async (id) => {
    const challenge = dailyChallenges.find(c => c.id === id);
    
    if (challenge.status === 'DRAFT') {
      // Show publish confirmation modal for DRAFT challenges
      setPublishModal({
        visible: true,
        challengeId: id,
        challengeTitle: challenge.title,
      });
    } else {
      // Direct unpublish for PUBLISHED challenges
      await handlePublishConfirm(id, 'DRAFT');
    }
  };

  const handlePublishConfirm = async (id, newStatus) => {
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

  const handlePublishModalCancel = () => {
    setPublishModal({ visible: false, challengeId: null, challengeTitle: '' });
  };

  const handlePublishModalConfirm = async () => {
    await handlePublishConfirm(publishModal.challengeId, 'PUBLISHED');
    setPublishModal({ visible: false, challengeId: null, challengeTitle: '' });
  };

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
                {!readOnly && (
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
                )}
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
      render: (text, record) => {
        // Show empty state for lessons without challenges
        if (record.isEmptyLesson) {
          return (
            <span >
            </span>
          );
        }
        
        return (
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
        );
      },
    },
    {
      title: t('dailyChallenge.type'),
      dataIndex: 'type',
      key: 'type',
      width: 150,
      align: 'center',
      render: (type, record) => {
        // Show empty state for lessons without challenges
        if (record.isEmptyLesson) {
          return (
            <span >
            </span>
          );
        }

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
      render: (startDate, record) => {
        if (record.isEmptyLesson) {
          return (
            <span>
            </span>
          );
        }
        return startDate ? new Date(startDate).toLocaleDateString() : '-';
      },
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
      align: 'center',
      render: (endDate, record) => {
        if (record.isEmptyLesson) {
          return (
            <span>
            </span>
          );
        }
        return endDate ? new Date(endDate).toLocaleDateString() : '-';
      },
    },
    {
      title: t('dailyChallenge.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status, record) => {
        if (record.isEmptyLesson) {
          return (
            <span>
            </span>
          );
        }
        
        return (
          <span style={{
            fontSize: '20px',
            color: '#000000'
          }}>
            {status === 'PUBLISHED' ? t('dailyChallenge.published') : t('dailyChallenge.draft')}
          </span>
        );
      },
    },
    {
      title: t('dailyChallenge.actions'),
      key: 'actions',
      width: 180,
      align: 'center',
      render: (_, record) => {
        // Show empty state for lessons without challenges
        if (record.isEmptyLesson) {
          return (
            <span >
            </span>
          );
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
            {!readOnly && (
              <>
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
              </>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <ThemedLayout>
      <div className="daily-challenge-list-wrapper">
        {/* Page Title */}
        <div className="page-title-container" style={{ padding: '24px 24px 0 24px' }}>
          <Typography.Title 
            level={1} 
            className="page-title"
            style={{
              fontSize: '32px',
              fontWeight: '600',
              margin: '0 0 24px 0',
              color: theme === 'sun' ? '#1e40af' : '#fff'
            }}
          >
            {t('dailyChallenge.dailyChallengeManagement')} <span className="student-count" style={{
              fontSize: '24px',
              fontWeight: '500',
          
            }}>({totalItems})</span>
          </Typography.Title>
        </div>

        {/* Search and Action Section */}
        <div className="search-action-section" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px', padding: '0 24px' }}>
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
          {!readOnly && (
            <div className="action-buttons" style={{ marginLeft: 'auto' }}>
              <Button 
                icon={<PlusOutlined />}
                className={`create-button ${theme}-create-button`}
                onClick={handleCreateClick}
              >
                {t('dailyChallenge.createChallenge')}
              </Button>
            </div>
          )}
        </div>

        {/* Table Section */}
        <div className={`table-section ${theme}-table-section`} style={{ paddingBottom: '24px' }}>
          <LoadingWithEffect loading={loading} message={t('dailyChallenge.loadingChallenges')}>
            <Table
              columns={columns}
              dataSource={dailyChallenges}
              rowKey="id"
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalItems,
                onChange: (page, size) => {
                  console.log('📄 Page changed to:', page, 'from:', currentPage);
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

        {/* Challenge Type Selection Modal */}
        <Modal
          title={
            <div style={{ 
              fontSize: '22px', 
              fontWeight: 700, 
              color: 'rgb(24, 144, 255)',
              display: 'block', 
              textAlign: 'center',
              marginBottom: '4px'
            }}>
              Choose Challenge Type
            </div>
          }
          open={challengeTypeModalVisible}
          onCancel={handleChallengeTypeModalCancel}
          footer={null}
          width={720}
          className={`challenge-type-modal ${theme}-challenge-type-modal`}
        >
          <div className="challenge-type-modal-container">
            {/* Challenge Types */}
            <div className="challenge-type-category">
              <div className="category-grid">
                {challengeTypes.map((challengeType) => (
                  <div
                    key={challengeType.id}
                    className={`challenge-type-card ${theme}-challenge-type-card`}
                    onClick={() => handleChallengeTypeClick(challengeType)}
                  >
                    <div className="challenge-type-icon-wrapper">
                      <span style={{ fontSize: '48px' }}>{challengeType.icon}</span>
                    </div>
                    <div className="challenge-type-name">{challengeType.name}</div>
                    <div className="challenge-type-description">
                      {challengeType.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>

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

        {/* Publish Confirmation Modal */}
        <Modal
          title={
            <div style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: 'rgb(24, 144, 255)',
              textAlign: 'center',
              padding: '10px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}>
              <CheckCircleOutlined style={{ color: 'rgb(24, 144, 255)' }} />
              Confirm Publish Challenge
            </div>
          }
          open={publishModal.visible}
          onOk={handlePublishModalConfirm}
          onCancel={handlePublishModalCancel}
          okText="Publish Now"
          cancelText="Cancel"
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
              fontWeight: '500',
              height: '40px',
              borderRadius: '6px',
              padding: '0 30px'
            }
          }}
          cancelButtonProps={{
            style: {
              height: '40px',
              borderRadius: '6px',
              padding: '0 30px'
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
              Are you sure you want to publish this challenge?
            </p>
            <p style={{
              fontSize: '16px',
              color: '#666',
              margin: 0,
              lineHeight: '1.5'
            }}>
              Once published, students will be able to access this challenge. This action cannot be undone.
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
