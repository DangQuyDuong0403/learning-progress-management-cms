import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  Input,
  Space,
  Table,
  Typography,
  Modal,
  Card,
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

// Challenge types constant (base metadata; labels are translated at render-time)
const challengeTypes = [
  { id: 1, type: "GV", icon: "🌟", label: "Grammar & Vocabulary" },
  { id: 2, type: "RE", icon: "📝", label: "Reading" },
  { id: 3, type: "LI", icon: "🎵", label: "Listening" },
  { id: 4, type: "WR", icon: "✏️", label: "Writing" },
  { id: 5, type: "SP", icon: "💬", label: "Speaking" },
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
  const isTeachingAssistant = (user?.role || '').toUpperCase() === 'TEACHING_ASSISTANT';
  
  // Set page title based on whether it's class-specific or general
  usePageTitle(classId ? `Class ${classId} Daily Challenges` : 'Daily Challenge Management');
  
  const [loading, setLoading] = useState(false);
  const [dailyChallenges, setDailyChallenges] = useState([]);
  const [classData, setClassData] = useState(null); // Store class data
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  // Restore currentPage from location.state if available (when navigating back)
  const [currentPage, setCurrentPage] = useState(() => {
    const initialPage = location.state?.currentPage || 1;
    console.log('🔵 DailyChallengeList - Initial currentPage from state:', initialPage, 'location.state:', location.state);
    return initialPage;
  });
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [allChallenges, setAllChallenges] = useState([]); // Full flattened list for lesson-aware pagination
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalData, setCreateModalData] = useState(null); // Store lesson data for create modal
  const [challengeTypeModalVisible, setChallengeTypeModalVisible] = useState(false);
  const [pendingLessonData, setPendingLessonData] = useState(null); // Lesson data awaiting type selection
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
  const [publishDetails, setPublishDetails] = useState(null);
  const [performanceByChallengeId, setPerformanceByChallengeId] = useState({});
  const hasRestoredState = useRef(false); // Track if we've already restored state from location

  // Build unique lesson list from current allChallenges to avoid extra API calls
  const availableLessons = React.useMemo(() => {
    const unique = new Map();
    for (const rec of allChallenges) {
      const lessonIdKey = rec.lessonId || rec.classLessonId;
      const lessonNameVal = rec.lessonName || rec.classLessonName;
      if (lessonIdKey && lessonNameVal && !unique.has(lessonIdKey)) {
        unique.set(lessonIdKey, { id: lessonIdKey, lessonName: lessonNameVal, name: lessonNameVal });
      }
    }
    return Array.from(unique.values());
  }, [allChallenges]);

  // Simple status display mapping removed (labels handled by getStatusLabel)

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
    "GV",
    "RE",
    "WR",
    "LI",
    "SP",
  ];
  const statusOptions = ["DRAFT", "PUBLISHED", "IN_PROGRESS", "FINISHED"];
  const getStatusLabel = (statusKey) => {
    switch (statusKey) {
      case 'DRAFT':
        return t('dailyChallenge.DRAFT', 'Draft');
      case 'PUBLISHED':
        return t('dailyChallenge.PUBLISHED', 'Published');
      case 'IN_PROGRESS':
        return t('dailyChallenge.IN_PROGRESS', 'In Progress');
      case 'FINISHED':
        return t('dailyChallenge.FINISHED', 'Finished');
      default:
        return statusKey;
    }
  };

  // Helper to translate type codes to labels
  const getTypeLabelByCode = useCallback((typeCode) => {
    const map = {
      GV: t('dailyChallenge.typeNames.GV', 'Grammar & Vocabulary'),
      RE: t('dailyChallenge.typeNames.RE', 'Reading'),
      LI: t('dailyChallenge.typeNames.LI', 'Listening'),
      WR: t('dailyChallenge.typeNames.WR', 'Writing'),
      SP: t('dailyChallenge.typeNames.SP', 'Speaking'),
    };
    return map[typeCode] || typeCode;
  }, [t]);

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
      
      // Get effective classId from URL params or location.state
      const effectiveClassId = classId || location.state?.classId;
      
      // Ensure searchDebounce is properly trimmed and converted to undefined if empty
      const searchTextParam = searchDebounce && searchDebounce.trim() !== '' ? searchDebounce.trim() : undefined;
      
      if (effectiveClassId) {
        // Lấy daily challenges cho class cụ thể (truy vấn nhanh để nhận diện cấu trúc dữ liệu)
        response = await dailyChallengeApi.getDailyChallengesByClass(effectiveClassId, {
          page: 0,
          size: 10,
          text: searchTextParam,
          sortBy: 'createdAt',
          sortDir: 'desc'
        });
      } else {
        // Lấy daily challenges của teacher (truy vấn nhanh để nhận diện cấu trúc dữ liệu)
        response = await dailyChallengeApi.getAllDailyChallenges({
          page: 0,
          size: 10,
          text: searchTextParam,
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
                  description: challenge.description || '',
                  teacher: 'Unknown Teacher',
                  timeLimit: challenge.durationMinutes || challenge.timeLimit || 30,
                  totalQuestions: 0,
                  createdAt: new Date().toISOString().split('T')[0],
                  hasAntiCheat: !!challenge.hasAntiCheat,
                  shuffleQuestion: !!challenge.shuffleQuestion,
                  translateOnScreen: !!challenge.translateOnScreen,
                  challengeMode: challenge.challengeMethod === 'TEST' ? 'exam' : 'normal',
                  // Completion info from API (prefer direct fields)
                  submittedCount: typeof challenge.submittedCount === 'number' ? challenge.submittedCount : 0,
                  totalStudents: typeof lesson.totalStudents === 'number' ? lesson.totalStudents : (typeof lesson.totalStudent === 'number' ? lesson.totalStudent : 0),
                  originalChallenge: challenge,
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
            text: searchTextParam,
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
        // Items are already challenges -> để phân trang phía client mượt, luôn lấy FULL danh sách đã lọc
        const fullParams = {
          page: 0,
          size: 100,
          text: searchTextParam,
          sortBy: 'createdAt',
          sortDir: 'desc',
        };

        const fullResponse = classId
          ? await dailyChallengeApi.getDailyChallengesByClass(classId, fullParams)
          : await dailyChallengeApi.getAllDailyChallenges(fullParams);

        let allChallengesRaw = [];
        if (Array.isArray(fullResponse)) {
          allChallengesRaw = fullResponse;
        } else if (Array.isArray(fullResponse.data)) {
          allChallengesRaw = fullResponse.data;
        } else if (Array.isArray(fullResponse.content)) {
          allChallengesRaw = fullResponse.content;
        } else if (fullResponse?.success && Array.isArray(fullResponse.data)) {
          allChallengesRaw = fullResponse.data;
        }

        const mapped = allChallengesRaw.map((challenge, idx) => ({
          ...challenge,
          id: challenge.id,
          title: challenge.challengeName || challenge.title || 'Untitled Challenge',
          type: challenge.challengeType || challenge.type || 'Unknown',
          status: challenge.challengeStatus || challenge.status || 'DRAFT',
          startDate: challenge.startDate,
          endDate: challenge.endDate,
          lessonId: challenge.lessonId || challenge.classLessonId || challenge.classLesson?.id,
          lessonName: challenge.lessonName || challenge.classLessonName || challenge.classLesson?.classLessonName || challenge.classLesson?.name || '',
          lessonOrder: challenge.lessonOrder || idx + 1,
          isFirstChallengeInLesson: true,
          totalChallengesInLesson: 1,
          rowSpan: 1,
          description: challenge.description || '',
          teacher: challenge.teacher || 'Unknown Teacher',
          timeLimit: challenge.durationMinutes || challenge.timeLimit || 30,
          totalQuestions: challenge.totalQuestions || 0,
          createdAt: challenge.createdAt || new Date().toISOString().split('T')[0],
          hasAntiCheat: !!challenge.hasAntiCheat,
          shuffleQuestion: !!challenge.shuffleQuestion,
          translateOnScreen: !!challenge.translateOnScreen,
          challengeMode: challenge.challengeMethod === 'TEST' ? 'exam' : 'normal',
          submittedCount: typeof challenge.submittedCount === 'number' ? challenge.submittedCount : undefined,
          totalStudents: typeof challenge.totalStudents === 'number' ? challenge.totalStudents : (challenge.classLesson?.totalStudents),
          originalChallenge: challenge,
        }));

        setAllChallenges(mapped);
        setTotalItems(mapped.length);
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
  // Build filtered full list (type/status and search text). 
  // Frontend filter ensures exact match even if API returns partial matches.
  const filteredAllChallenges = React.useMemo(() => {
    return allChallenges.filter((challenge) => {
      // Filter by type
      const matchesType = typeFilter.length === 0 || typeFilter.includes(challenge.type);
      
      // Filter by status
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(challenge.status);
      
      // Filter by search text - ensure title contains the entire search phrase (case-insensitive)
      const matchesSearch = !searchDebounce || !searchDebounce.trim() || 
        (challenge.title && challenge.title.toLowerCase().includes(searchDebounce.toLowerCase().trim()));
      
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [allChallenges, typeFilter, statusFilter, searchDebounce]);

  // Recompute page data whenever pagination or filtered full list changes
  useEffect(() => {
    const paged = computePagedRows(filteredAllChallenges, currentPage, pageSize);
    setDailyChallenges(paged);
  }, [filteredAllChallenges, currentPage, pageSize, computePagedRows]);

  // Fetch completion performance for visible challenges (lazy per page)
  useEffect(() => {
    const fetchPerformanceForPage = async () => {
      const idsToFetch = dailyChallenges
        .filter((rec) => rec && !rec.isEmptyLesson && rec.id && performanceByChallengeId[rec.id] === undefined)
        .filter((rec) => rec.submittedCount === undefined || rec.totalStudents === undefined)
        .map((rec) => rec.id);
      if (idsToFetch.length === 0) return;
      // Mark as loading to avoid duplicate calls
      setPerformanceByChallengeId((prev) => {
        const next = { ...prev };
        idsToFetch.forEach((id) => { next[id] = next[id] ?? { loading: true }; });
        return next;
      });
      try {
        const results = await Promise.allSettled(
          idsToFetch.map(async (id) => {
            try {
              const res = await dailyChallengeApi.getDailyChallengePerformance(id);
              const data = res?.data || res || {};
              // Normalize potential shapes (prefer new fields submittedCount/totalStudents)
              const completed =
                data.submittedCount ?? data.completedStudents ?? data.completed ?? data.numCompleted ?? 0;
              const total =
                data.totalStudents ?? data.total ?? data.numTotal ?? 0;
              return { id, completed, total };
            } catch (e) {
              return { id, completed: null, total: null, error: true };
            }
          })
        );
        setPerformanceByChallengeId((prev) => {
          const next = { ...prev };
          results.forEach((r) => {
            if (r.status === 'fulfilled' && r.value) {
              const { id, completed, total } = r.value;
              next[id] = { completed, total };
            } else if (r.status === 'rejected') {
              // Keep placeholder to avoid refetch loops
              const id = idsToFetch[results.indexOf(r)];
              next[id] = { completed: null, total: null, error: true };
            }
          });
          return next;
        });
      } catch (_) {
        // noop, placeholders already set
      }
    };
    fetchPerformanceForPage();
  }, [dailyChallenges, performanceByChallengeId]);

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
  }, [filteredAllChallenges, pageSize, currentPage]);

  // Reset hasRestoredState when location.state changes from having currentPage to not having it
  // This allows restoring again when navigating back with new state
  useEffect(() => {
    // If location.state no longer has currentPage, reset the flag
    if (!location.state?.currentPage && hasRestoredState.current) {
      console.log('🔄 DailyChallengeList - Resetting hasRestoredState (no saved state)');
      hasRestoredState.current = false;
    }
  }, [location.state]);

  // Restore pagination and filters from location.state when navigating back
  // Only restore once when component mounts with saved state
  useEffect(() => {
    console.log('🟢 DailyChallengeList - Location state changed:', location.state);
    console.log('🟢 DailyChallengeList - hasRestoredState.current:', hasRestoredState.current);
    console.log('🟢 DailyChallengeList - Current page before restore:', currentPage);
    
    if (location.state?.currentPage) {
      const savedPage = location.state.currentPage;
      const savedPageSize = location.state.pageSize;
      const savedSearchText = location.state.searchText;
      const savedTypeFilter = location.state.typeFilter;
      const savedStatusFilter = location.state.statusFilter;
      
      console.log('🟡 DailyChallengeList - Found saved state to restore:', {
        savedPage,
        savedPageSize,
        savedSearchText,
        savedTypeFilter,
        savedStatusFilter,
        hasRestored: hasRestoredState.current
      });
      
      // Only restore if we haven't restored yet OR if the saved page is different from current
      // This allows restoring even if component didn't unmount
      if (!hasRestoredState.current || (savedPage !== currentPage)) {
        console.log('✅ DailyChallengeList - Restoring state...');
        
        // Restore page and pageSize
        if (savedPage && savedPage > 0) {
          console.log('📄 Restoring page from', currentPage, 'to', savedPage);
          setCurrentPage(savedPage);
        }
        if (savedPageSize && savedPageSize > 0) {
          console.log('📏 Restoring pageSize to', savedPageSize);
          setPageSize(savedPageSize);
        }
        
        // Restore search text if available
        if (savedSearchText !== undefined) {
          console.log('🔍 Restoring searchText:', savedSearchText);
          setSearchText(savedSearchText);
          setSearchDebounce(savedSearchText);
        }
        
        // Restore filters if available
        if (savedTypeFilter && Array.isArray(savedTypeFilter)) {
          console.log('🏷️ Restoring typeFilter:', savedTypeFilter);
          setTypeFilter(savedTypeFilter);
          setFilterDropdown(prev => ({ ...prev, selectedTypes: savedTypeFilter }));
        }
        if (savedStatusFilter && Array.isArray(savedStatusFilter)) {
          console.log('📊 Restoring statusFilter:', savedStatusFilter);
          setStatusFilter(savedStatusFilter);
          setFilterDropdown(prev => ({ ...prev, selectedStatuses: savedStatusFilter }));
        }
        
        // Mark as restored to avoid restoring again
        hasRestoredState.current = true;
        console.log('✅ DailyChallengeList - State restored successfully');
      } else {
        console.log('⏭️ DailyChallengeList - Skipping restore (already restored or same page)');
      }
    } else {
      console.log('ℹ️ DailyChallengeList - No saved state found in location.state');
    }
  }, [location.state, currentPage]);

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

  // Debounce search text - trim spaces at beginning and end
  useEffect(() => {
    const timer = setTimeout(() => {
      // Trim spaces at the beginning and end before setting debounced value
      // This allows users to type spaces normally, but trims when they stop typing
      const trimmedValue = searchText.trim();
      setSearchDebounce(trimmedValue);
      setCurrentPage(1);
    }, 400); // Reduced delay for better responsiveness

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
    // Priority: Use location.state if available (when navigating back from Performance)
    // Otherwise use classData or dailyChallengeData
    const getSubtitle = () => {
      // First priority: Use location.state if available (when navigating back from Performance)
      if (location?.state?.className && location?.state?.challengeName) {
        return `${location.state.className} / ${location.state.challengeName}`;
      } else if (location?.state?.challengeName) {
        return location.state.challengeName;
      } else if (location?.state?.className) {
        return location.state.className;
      }
      // Fallback: no subtitle for list page (shows class name in header via displayName)
      return null;
    };
    
    const displayName = location?.state?.className || classData?.name || null;
    const subtitle = getSubtitle();
    console.log('DailyChallengeList - Display name for header:', displayName, 'Subtitle:', subtitle);
    enterDailyChallengeMenu(0, subtitle, getBackPath(), displayName);
    
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
    // If user initiated from a lesson, include lesson info
    if (pendingLessonData) {
      setCreateModalData({
        ...pendingLessonData,
        challengeType: challengeType.type,
        challengeTypeName: getTypeLabelByCode(challengeType.type),
      });
      setPendingLessonData(null);
    } else {
      setCreateModalData({
        challengeType: challengeType.type,
        challengeTypeName: getTypeLabelByCode(challengeType.type),
      });
    }
    setChallengeTypeModalVisible(false);
    setShowCreateModal(true);
  };

  const handleChallengeTypeModalCancel = () => {
    setChallengeTypeModalVisible(false);
    setPendingLessonData(null);
  };

  const handleCreateClickWithLesson = (lessonRecord) => {
    // Save lesson info and open type selection first
    setPendingLessonData({
      lessonId: lessonRecord.lessonId,
      lessonName: lessonRecord.lessonName,
      classLessonId: lessonRecord.lessonId,
    });
    setChallengeTypeModalVisible(true);
  };

  const handleCreateModalCancel = () => {
    setShowCreateModal(false);
  };

  const handleCreateSuccess = async (newChallenge) => {
    try {
      // Challenge has already been created by the modal, just extract ID and redirect
      let challengeId = null;
      
      // Extract challenge ID from the already created challenge data
      if (newChallenge?.id) {
        challengeId = newChallenge.id;
      } else if (newChallenge?.data?.id) {
        challengeId = newChallenge.data.id;
      }
      
      console.log('Created challenge data received:', newChallenge);
      console.log('Extracted challenge ID:', challengeId);
      
      if (challengeId) {
        // Redirect to performance screen of the newly created challenge
        navigate(`/teacher/daily-challenges/detail/${challengeId}`, {
          state: {
            classId: classId,
            className: classData?.name,
            challengeId: challengeId,
            challengeName: newChallenge.challengeName,
            lessonName: newChallenge.lessonName,
            fromCreate: true // Flag to indicate this came from creation
          }
        });
      } else {
        // If no ID found, refresh the list and show success message
        await fetchDailyChallenges();
        spaceToast.success(t('dailyChallenge.createSuccess'));
      }
      
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error handling create success:', error);
      const errorMessage = error.response?.data?.error || error.message || t('dailyChallenge.createError');
      spaceToast.error(errorMessage);
    }
  };

  const handleViewClick = (challenge) => {
    // Navigate with state containing class and challenge information
    // Also save currentPage to restore when navigating back
    const savedState = {
      classId: classId,
      className: classData?.name,
      challengeId: challenge.id,
      challengeName: challenge.title,
      lessonName: challenge.lessonName,
      currentPage: currentPage, // Save current page to restore later
      pageSize: pageSize, // Also save pageSize for consistency
      searchText: searchText, // Save search text
      typeFilter: typeFilter, // Save type filter
      statusFilter: statusFilter, // Save status filter
    };
    console.log('🔵 DailyChallengeList - Navigating to detail, saving state:', savedState);
    navigate(`/teacher/daily-challenges/detail/${challenge.id}`, {
      state: savedState
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
      // Fetch challenge details to display in confirm modal (mode/duration/dates/settings)
      try {
        const detailRes = await dailyChallengeApi.getDailyChallengeById(id);
        const data = detailRes?.data || {};
        setPublishDetails({
          challengeMode: data.challengeMethod === 'TEST' ? 'exam' : 'normal',
          durationMinutes: data.durationMinutes,
          startDate: data.startDate,
          endDate: data.endDate,
          shuffleQuestion: !!(data.shuffleQuestion || data.shuffleAnswers),
          translateOnScreen: !!data.translateOnScreen,
          antiCheatModeEnabled: !!data.hasAntiCheat,
        });
      } catch (e) {
        console.warn('Failed to load challenge details for publish modal', e);
        setPublishDetails(null);
      }
    } else {
      // Unpublish not supported; show notice
      spaceToast.warning('Unpublish is not supported');
    }
  };

  const handlePublishConfirm = async (id, newStatus) => {
    try {
      // Publish via new endpoint; unpublish is not supported by API
      if (newStatus === 'PUBLISHED') {
        await dailyChallengeApi.publishDailyChallenge(id);
      } else {
        spaceToast.warning('Unpublish is not supported');
        return;
      }
      
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
    // Ensure we pass the freshest data available and prefer raw API object
    const latest = allChallenges.find((c) => c.id === challenge.id) || challenge;
    const raw = latest.originalChallenge || latest;
    setEditModal({
      visible: true,
      challengeId: raw.id || latest.id,
      challengeData: raw,
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
    setPublishDetails(null);
  };

  const handlePublishModalConfirm = async () => {
    await handlePublishConfirm(publishModal.challengeId, 'PUBLISHED');
    setPublishModal({ visible: false, challengeId: null, challengeTitle: '' });
    setPublishDetails(null);
  };

  const columns = [
    {
      title: t('dailyChallenge.no'),
      key: 'stt',
      width: '5%',
      align: 'center',
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: t('dailyChallenge.lesson'),
      dataIndex: 'lessonName',
      key: 'lessonName',
      width: '15%',
      align: 'left',
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
                  borderRadius: '4px',
                  textAlign: 'left',
                  position: 'relative',
                  cursor: 'pointer',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  width: '100%'
                }}
              >
                <span className="lesson-text" style={{ transition: 'opacity 0.3s ease', display: 'block', whiteSpace: 'normal', wordBreak: 'break-word', maxWidth: '100%', lineHeight: '1.4' }}>
                  {text}
                </span>
                {!readOnly && !isTeachingAssistant && (
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
                    {t('dailyChallenge.createChallenge')}
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
      width: '15%',
      align: 'left',
      render: (text, record) => {
        // Show empty state for lessons without challenges
        if (record.isEmptyLesson) {
          return (
            <span >
            </span>
          );
        }
        
        return (
          <span style={{ 
            display: 'block',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            textAlign: 'left',
            lineHeight: '1.4',
          }}>
            {text}
          </span>
        );
      },
    },
    {
      title: t('dailyChallenge.type'),
      dataIndex: 'type',
      key: 'type',
      width:'10%',
      align: 'center',
      ellipsis: {
        showTitle: false,
      },
      render: (type, record) => {
        // Show empty state for lessons without challenges
        if (record.isEmptyLesson) {
          return (
            <span >
            </span>
          );
        }

        return (
          <span
            title={getTypeLabelByCode(type)}
            style={{
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
              fontSize: '18px',
              color: '#000000'
            }}
          >
            {getTypeLabelByCode(type)}
          </span>
        );
      },
    },
    {
      title: t('dailyChallenge.startDate'),
      dataIndex: 'startDate',
      key: 'startDate',
      width: '10%',
      align: 'center',
      render: (startDate, record) => {
        if (record.isEmptyLesson) {
          return (
            <span>
            </span>
          );
        }
        if (!startDate) return '';
        const d = new Date(startDate);
        return (
          <div style={{ lineHeight: 1.2 }}>
            <div>{d.toLocaleDateString()}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
          </div>
        );
      },
    },
    {
      title: t('dailyChallenge.endDate'),
      dataIndex: 'endDate',
      key: 'endDate',
      width: "10%",
      align: 'center',
      render: (endDate, record) => {
        if (record.isEmptyLesson) {
          return (
            <span>
            </span>
          );
        }
        if (!endDate) return '';
        const d = new Date(endDate);
        return (
          <div style={{ lineHeight: 1.2 }}>
            <div>{d.toLocaleDateString()}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
          </div>
        );
      },
    },
    {
      title: t('dailyChallenge.completion') || 'Completion',
      key: 'completion',
      width: '10%',
      align: 'center',
      render: (_, record) => {
        if (record.isEmptyLesson) {
          return (
            <span >
            </span>
          );
        }
        // Prefer direct values from record if provided by API
        const directCompleted = record.submittedCount;
        const directTotal = record.totalStudents;
        let completed;
        let total;
        if (typeof directCompleted === 'number' && typeof directTotal === 'number') {
          completed = directCompleted;
          total = directTotal;
        } else {
          const perf = performanceByChallengeId[record.id];
          if (!perf) return '...';
          if (perf.error) return '-';
          completed = (perf.completed ?? 0);
          total = (perf.total ?? 0);
        }
        return (
          <span style={{ fontWeight: 500 }}>
            {completed}/{total}
          </span>
        );
      }
    },
    {
      title: t('dailyChallenge.status'),
      dataIndex: 'status',
      key: 'status',
      width: '10%',
      align: 'center',
      render: (status, record) => {
        if (record.isEmptyLesson) {
          return (
            <span>
            </span>
          );
        }
        
        // Define status colors
        const getStatusColor = (status) => {
          switch (status) {
            case 'DRAFT':
              return 'rgb(223, 175, 56)';
            case 'PUBLISHED':
              return 'rgb(20, 150, 26)';
            case 'IN_PROGRESS':
              return '#1890ff';
            case 'FINISHED':
              return 'rgb(229,79,79)';
            default:
              return '#000000';
          }
        };
        
        if (status === 'DRAFT') {
          return (
            <div 
              className="status-cell-container"
              style={{
                fontSize: '20px',
                color: getStatusColor(status),
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
              <span className="status-text" style={{ transition: 'opacity 0.3s ease' }}>
                {getStatusLabel(status)}
              </span>
              <Button
                className="status-publish-btn"
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
                  minWidth: '120px',
                  margin: '0',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) scale(0.9)',
                  opacity: 0,
                  transition: 'all 0.2s ease',
                  pointerEvents: 'none'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleStatus(record.id);
                }}
                title={t('dailyChallenge.publishNow') || 'Publish'}
              >
                {t('dailyChallenge.publishNow') || 'Publish'}
              </Button>
            </div>
          );
        }
        
        return (
          <span style={{
            fontSize: '20px',
            color: getStatusColor(status),
            fontWeight: 500,
          }}>
            {getStatusLabel(status)}
          </span>
        );
      },
    },
    {
      title: t('dailyChallenge.actions'),
      key: 'actions',
      width: '10%',
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
            {!readOnly && !isTeachingAssistant && (
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
                    icon={<DeleteOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />}
                    onClick={() => handleDeleteClick(record)}
                    title={t('dailyChallenge.deleteChallenge')}
                    className="action-btn-delete"
                    style={{ color: '#ff4d4f' }}
                  />
                )}
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
              {t('common.filter') || 'Filter'}
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
                            {getTypeLabelByCode(opt)}
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
                            {getStatusLabel(statusKey)}
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
          {!readOnly && !isTeachingAssistant && (
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
              {t('dailyChallenge.chooseChallengeTypeTitle')}
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
                    <div className="challenge-type-name">{getTypeLabelByCode(challengeType.type)}</div>
                    <div className="challenge-type-description">
                      {t(`dailyChallenge.typeDescriptions.${challengeType.type}`)}
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
          lessonsFromList={availableLessons}
        />

        {/* Edit Daily Challenge Modal */}
        <EditDailyChallengeModal
          visible={editModal.visible}
          onCancel={handleEditModalCancel}
          onUpdateSuccess={handleEditSuccess}
          challengeData={editModal.challengeData}
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
              background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
              borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
              color: theme === 'sun' ? '#000' : '#fff',
              borderRadius: '6px',
              height: '40px',
              fontWeight: '500',
              fontSize: '16px',
              padding: '0 30px',
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
              color: theme === 'sun' ? 'rgb(113, 179, 253)' : 'rgb(138, 122, 255)',
              textAlign: 'center',
              padding: '10px 0'
            }}>
              {t('dailyChallenge.confirmPublishChallenge') || 'Confirm publish challenge'}
            </div>
          }
          open={publishModal.visible}
          onOk={handlePublishModalConfirm}
          onCancel={handlePublishModalCancel}
          okText={t('dailyChallenge.publishNow') || 'Publish now'}
          cancelText={t('common.cancel') || 'Cancel'}
          width={600}
          centered
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
          <div style={{ padding: '8px 4px' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <Card size="small" style={{ background: theme === 'sun' ? '#fafafa' : 'rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography.Text strong>{t('dailyChallenge.mode') || 'Challenge Mode'}</Typography.Text>
                  <span style={{ 
                    
                    color: (publishDetails?.challengeMode === 'exam') ? '#ff4d4f' : '#52c41a',
                    fontSize: '13px'
                  }}>
                    {(publishDetails?.challengeMode === 'exam') 
                      ? (t('dailyChallenge.examMode') || 'Exam Mode')
                      : (t('dailyChallenge.normalMode') || 'Normal Mode')}
                  </span>
                </div>
              </Card>
              <Card size="small" style={{ background: theme === 'sun' ? '#fafafa' : 'rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography.Text strong>{t('dailyChallenge.duration') || 'Duration'}</Typography.Text>
                  <span style={{  fontSize: '13px', color: theme === 'sun' ? '#333' : '#000000' }}>
                    {publishDetails?.durationMinutes 
                      ? `${publishDetails.durationMinutes} ${t('dailyChallenge.minutes') || 'minutes'}`
                      : t('common.notSet') || 'Not Set'}
                  </span>
                </div>
              </Card>
              <Card size="small" style={{ background: theme === 'sun' ? '#fafafa' : 'rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography.Text strong>{t('dailyChallenge.startDate') || 'Start Date'}</Typography.Text>
                  <span style={{ fontSize: '13px', color: theme === 'sun' ? '#333' : '#000000' }}>
                    {publishDetails?.startDate 
                      ? new Date(publishDetails.startDate).toLocaleDateString('vi-VN', { 
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })
                      : t('common.notSet') || 'Not Set'}
                  </span>
                </div>
              </Card>
              <Card size="small" style={{ background: theme === 'sun' ? '#fafafa' : 'rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography.Text strong>{t('dailyChallenge.endDate') || 'End Date'}</Typography.Text>
                  <span style={{ fontSize: '13px', color: theme === 'sun' ? '#333' : '#000000' }}>
                    {publishDetails?.endDate 
                      ? new Date(publishDetails.endDate).toLocaleDateString('vi-VN', { 
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })
                      : t('common.notSet') || 'Not Set'}
                  </span>
                </div>
              </Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <Card size="small" style={{ background: theme === 'sun' ? '#fafafa' : 'rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography.Text strong>{t('dailyChallenge.shuffleQuestion') || t('dailyChallenge.shuffleAnswers') || 'Shuffle questions'}</Typography.Text>
                  <span style={{ color: publishDetails?.shuffleQuestion ? '#52c41a' : '#ff4d4f' }}>
                    {publishDetails?.shuffleQuestion ? (t('common.on') || 'ON') : (t('common.off') || 'OFF')}
                  </span>
                </div>
              </Card>
              <Card size="small" style={{ background: theme === 'sun' ? '#fafafa' : 'rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography.Text strong>{t('dailyChallenge.antiCheatMode') || 'Anti-cheat mode'}</Typography.Text>
                  <span style={{ color: publishDetails?.antiCheatModeEnabled ? '#52c41a' : '#ff4d4f' }}>
                    {publishDetails?.antiCheatModeEnabled ? (t('common.on') || 'ON') : (t('common.off') || 'OFF')}
                  </span>
                </div>
              </Card>
              <Card size="small" style={{ gridColumn: '1 / span 2', background: theme === 'sun' ? '#fafafa' : 'rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography.Text strong>{t('dailyChallenge.translateOnScreen') || 'Translate on screen'}</Typography.Text>
                  <span style={{ color: publishDetails?.translateOnScreen ? '#52c41a' : '#ff4d4f' }}>
                    {publishDetails?.translateOnScreen ? (t('common.on') || 'ON') : (t('common.off') || 'OFF')}
                  </span>
                </div>
              </Card>
            </div>

            <Typography.Paragraph style={{ marginTop: 12, color: 'black', textAlign: 'center', fontStyle: 'italic' }}>
              {t('dailyChallenge.publishWarningMessage') || 'Once published, students will be able to access this challenge. This action cannot be undone.'}
            </Typography.Paragraph>
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
