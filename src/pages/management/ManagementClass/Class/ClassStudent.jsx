import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Button,
  Table,
  Space,
  Input,
  Modal,
  Upload,
  Typography,
  Select,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
  FilterOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import ThemedLayoutWithSidebar from "../../../../component/ThemedLayout";
import ThemedLayoutNoSidebar from "../../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./ClassStudent.css";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useClassMenu } from "../../../../contexts/ClassMenuContext";
import classManagementApi from "../../../../apis/backend/classManagement";
import studentManagementApi from "../../../../apis/backend/StudentManagement";
import usePageTitle from "../../../../hooks/usePageTitle";
import ROUTER_PAGE from "../../../../constants/router";
import { FILE_NAME_PREFIXES, formatDateForFilename } from "../../../../constants/fileNames";

const { Title } = Typography;
const { Option } = Select;



const ClassStudent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  // State for available students from API
  const [availableStudents, setAvailableStudents] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [availableStudentsPagination, setAvailableStudentsPagination] = useState({
    page: 0,
    size: 10, // Load 10 students per page for better infinite scroll experience
    total: 0,
    hasMore: true,
    currentLoaded: 0, // Track how many students are currently loaded
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const { id } = useParams();
  const { theme } = useTheme();
  const { user } = useSelector((state) => state.auth);
  const { enterClassMenu, exitClassMenu } = useClassMenu();
  const currentPath = useMemo(() => `${location.pathname}${location.search}`, [location.pathname, location.search]);
  const userRole = user?.role?.toLowerCase();
  const classMenuBackUrl = useMemo(() => {
    if (!id) return null;
    if (userRole === 'manager') {
      return ROUTER_PAGE.MANAGER_CLASS_MENU.replace(':id', String(id));
    }
    if (userRole === 'teacher') {
      return ROUTER_PAGE.TEACHER_CLASS_MENU.replace(':id', String(id));
    }
    if (userRole === 'teaching_assistant') {
      return ROUTER_PAGE.TEACHING_ASSISTANT_CLASS_MENU.replace(':id', String(id));
    }
    return null;
  }, [userRole, id]);
  
  // Determine which layout to use based on user role
  const ThemedLayout = (userRole === 'teacher' || userRole === 'teaching_assistant') 
    ? ThemedLayoutNoSidebar 
    : ThemedLayoutWithSidebar;
  
  // Check if user is read-only (TEACHER or TEACHING_ASSISTANT)
  const isReadOnly = userRole === 'teacher' || userRole === 'teaching_assistant';
  
  // Set page title
  usePageTitle('Class Students');
  
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [classData, setClassData] = useState(null);
  
  // Check if class is finished (hide add, import, delete buttons)
  const isClassFinished = classData?.status === 'FINISHED';
  const [searchText, setSearchText] = useState("");
  const [studentSearchText, setStudentSearchText] = useState(""); // Search text for student modal
  const [statusFilter, setStatusFilter] = useState(['ACTIVE','INACTIVE']); // Changed to array to support multiple statuses
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const searchTimeoutRef = useRef(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [importModal, setImportModal] = useState({
    visible: false,
    fileList: [],
    uploading: false,
    validating: false
  });
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [buttonLoading, setButtonLoading] = useState({
    add: false,
    delete: false,
    import: false,
    export: false,
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [filterDropdown, setFilterDropdown] = useState({
    visible: false,
    selectedStatuses: [],
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  // Sort state
  const [sortConfig, setSortConfig] = useState({
    sortBy: 'joinedAt',
    sortDir: 'desc',
  });
  
  // Refs for click outside detection
  const filterContainerRef = useRef(null);
  const hasInitialized = useRef(false);

  // Status options for filter
  const statusOptions = [
    { key: "ACTIVE", label: t('classDetail.active') },
    { key: "INACTIVE", label: t('classDetail.inactive') },
  ];

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

  // Handle filter dropdown toggle
  const handleFilterToggle = () => {
    setFilterDropdown(prev => ({
      ...prev,
      visible: !prev.visible,
      selectedStatuses: prev.visible ? prev.selectedStatuses : statusFilter.length > 0 ? [...statusFilter] : [],
    }));
  };

  // Handle filter submission
  const handleFilterSubmit = () => {
    // Save all selected statuses as array
    setStatusFilter(filterDropdown.selectedStatuses.length > 0 ? [...filterDropdown.selectedStatuses] : []);
    setFilterDropdown(prev => ({
      ...prev,
      visible: false,
    }));
  };

  // Handle filter reset
  const handleFilterReset = () => {
    setFilterDropdown(prev => ({
      ...prev,
      selectedStatuses: [],
    }));
  };

  const fetchClassData = useCallback(async () => {
    try {
      const response = await classManagementApi.getClassDetail(id);
      console.log('Class detail response:', response);
      const data = response?.data?.data ?? response?.data ?? null;
      if (data) {
        const mapped = {
          id: data.id ?? id,
          name:
            data.name ??
            data.className ??
            data.classname ??
            data.class_name ??
            data.title ??
            data.classTitle ??
            '',
          status: data.status ?? data.classStatus ?? null,
        };
        setClassData(mapped);
      }
    } catch (error) {
      console.error('Error fetching class data:', error);
      spaceToast.error(error.response?.data?.error);
    }
  }, [id]);

  const fetchStudents = useCallback(async (params = {}) => {
    try {
      // Convert status to array format for API
      let statusParam = 'all';
      if (params.status !== undefined) {
        if (Array.isArray(params.status)) {
          statusParam = params.status.length > 0 ? params.status : 'all';
        } else if (params.status !== 'all') {
          statusParam = [params.status];
        }
      }
      
      const apiParams = {
        page: params.page !== undefined ? params.page : 0, // Default to first page
        size: params.size !== undefined ? params.size : 10, // Default page size
        text: params.text !== undefined ? params.text : '',
        status: statusParam,
        sortBy: params.sortBy !== undefined ? params.sortBy : 'joinedAt',
        sortDir: params.sortDir !== undefined ? params.sortDir : 'desc',
      };
      
      console.log('Fetching students with params:', apiParams);
      const response = await classManagementApi.getClassStudents(id, apiParams);
      console.log('Students response:', response);
      
      if (response.success) {
        setStudents(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.totalElements || 0,
          current: (response.page || 0) + 1, // Convert 0-based to 1-based
        }));
      } 
    } catch (error) {
      console.error('Error fetching students:', error);
      spaceToast.error(error.response?.data?.error );
      setStudents([]);
    }
  }, [id]);

  // Fetch available students for adding to class
  const fetchAvailableStudents = useCallback(async (searchText = '', page = 0, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setSearchLoading(true);
      }
      
      const params = {
        page: page,
        size: availableStudentsPagination.size,
        text: searchText,
        status: ['ACTIVE'], // Only get active students
        roleName: ['STUDENT', 'TEST_TAKER'], // Get both students and test takers
      };
      
      console.log('=== FETCHING AVAILABLE STUDENTS ===');
      console.log('Params sent to API:', JSON.stringify(params, null, 2));
      console.log('Page (0-based):', page);
      console.log('Size:', availableStudentsPagination.size);
      
      const response = await studentManagementApi.getStudents(params);
      console.log('=== Available students response (FULL) ===', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));
      console.log('Response.success:', response?.success);
      console.log('Response.data:', response?.data);
      console.log('Response.totalElements:', response?.totalElements);
      console.log('Response.page:', response?.page);
      console.log('Response.size:', response?.size);
      
      // Check if response structure is correct
      if (!response) {
        console.error('❌ Response is null or undefined!');
        return;
      }
      
      if (!response.success) {
        console.error('❌ API returned success=false:', response);
        if (!append) {
          setAvailableStudents([]);
        }
        return;
      }
      
      // Handle different response structures
      let allStudents = [];
      let totalElements = 0;
      
      // Check if data is directly in response or nested
      if (Array.isArray(response.data)) {
        allStudents = response.data;
      } else if (Array.isArray(response)) {
        // Response might be array directly
        allStudents = response;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        allStudents = response.data.data;
      }
      
      totalElements = response.totalElements || response.data?.totalElements || 0;
      const responsePage = response.page || response.data?.page || 0;
      const responseSize = response.size || response.data?.size || 10;
      
      console.log('=== PARSED RESPONSE ===');
      console.log('All students (raw from API):', allStudents);
      console.log('All students count:', allStudents.length);
      console.log('Total elements:', totalElements);
      console.log('Response page:', responsePage);
      console.log('Response size:', responseSize);
      
      if (allStudents.length === 0 && totalElements > 0) {
        console.warn('⚠️ WARNING: API returned 0 students but totalElements > 0!');
        console.warn('This might indicate a pagination issue or filter problem');
      }
      
      // Filter out students who are already in the class
      const currentStudentIds = students.map(s => s.userId);
      console.log('Current student IDs in class:', currentStudentIds);
      console.log('Current students count in class:', currentStudentIds.length);
      
      const filteredStudents = allStudents.filter(student => 
        !currentStudentIds.includes(student.userId)
      );
      
      console.log('Filtered students count (after removing existing):', filteredStudents.length);
      console.log('Filtered students:', filteredStudents);
      
      // Map the response to match our expected format
      const mappedStudents = filteredStudents.map(student => {
          console.log('Mapping student:', student);
          const userId = student.userId || student.id;
          if (!userId) {
            console.warn('Student without userId:', student);
          }
        return {
          id: userId,
          userId: userId,
          code: student.studentCode || student.code,
          name: student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          fullName: student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          email: student.email,
          firstName: student.firstName,
          lastName: student.lastName,
          status: student.status,
        };
      });
      
      if (append) {
        // Append new students to existing list
        setAvailableStudents(prev => [...prev, ...mappedStudents]);
      } else {
        // Replace with new search results
        setAvailableStudents(mappedStudents);
      }
      
      // Update pagination state
      setAvailableStudentsPagination(prev => {
        const currentLoaded = append 
          ? prev.currentLoaded + mappedStudents.length 
          : mappedStudents.length;
        
        // Check if we have more data to load
        // hasMore should be true if:
        // 1. API returned full page (allStudents.length === prev.size) - means there might be more
        // 2. OR if we haven't reached the total yet ((page + 1) * prev.size < totalElements)
        // But we need to be careful: if all students in this page are filtered out, we should still try next page
        const hasMore = allStudents.length === prev.size || (page + 1) * prev.size < totalElements;
        
        console.log('Pagination update:', {
          page,
          currentLoaded,
          totalElements,
          allStudentsLength: allStudents.length,
          mappedStudentsLength: mappedStudents.length,
          hasMore,
          size: prev.size,
          condition1: allStudents.length === prev.size,
          condition2: (page + 1) * prev.size < totalElements
        });
        
        return {
          ...prev,
          page: page,
          total: totalElements,
          hasMore: hasMore,
          currentLoaded: currentLoaded,
        };
      });
    } catch (error) {
      console.error('Error fetching available students:', error);
      if (!append) {
        setAvailableStudents([]);
      }
      spaceToast.error(error.response?.data?.error);
    } finally {
      setSearchLoading(false);
      setLoadingMore(false);
    }
  }, [students, availableStudentsPagination.size]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Initial data loading
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchClassData(),
      fetchStudents()
    ]).finally(() => {
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only run when id changes

  // Ensure header back button appears immediately while class info loads
  useEffect(() => {
    if (id) {
      enterClassMenu({ id, backUrl: classMenuBackUrl });
    }
    return () => {
      exitClassMenu();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, classMenuBackUrl]); // Only run when id changes

  // Enter class menu mode when component mounts
  useEffect(() => {
    if (classData) {
      enterClassMenu({
        id: classData.id,
        name: classData.name,
        description: classData.name,
        backUrl: classMenuBackUrl,
      });
    }
    
    // Cleanup function to exit class menu mode when leaving
    return () => {
      exitClassMenu();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classData?.id, classData?.name, classMenuBackUrl]); // Only run when these specific values change

  const handleAddStudent = () => {
    setButtonLoading(prev => ({ ...prev, add: true }));
    setTimeout(() => {
      setSelectedStudents([]);
      setIsModalVisible(true);
      // Reset pagination when opening modal
      setAvailableStudentsPagination({
        page: 0,
        size: 10,
        total: 0,
        hasMore: true,
        currentLoaded: 0,
      });
      // Fetch available students when opening modal
      fetchAvailableStudents("", 0, false);
      setButtonLoading(prev => ({ ...prev, add: false }));
    }, 100);
  };


  const handleStudentSearch = (value) => {
    console.log('Search input:', value);
    setStudentSearchText(value); // Save search text to state
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      console.log('Executing search after timeout for:', value);
      // Reset pagination on new search
      setAvailableStudentsPagination({
        page: 0,
        size: 10,
        total: 0,
        hasMore: true,
        currentLoaded: 0,
      });
      
      if (value.length >= 2) {
        fetchAvailableStudents(value, 0, false);
      } else if (value.length === 0) {
        fetchAvailableStudents("", 0, false);
      }
      // Don't call API for single character
    }, 500);
  };

  // Handle scroll to load more students using useEffect with MutationObserver
  useEffect(() => {
    if (!isModalVisible) return;

    let scrollableElement = null;
    let observer = null;
    let scrollHandler = null;

    // Find the dropdown scrollable element with retry
    const findScrollableElement = () => {
      // Try multiple selectors for Ant Design Select dropdown
      const selectors = [
        '.rc-virtual-list-holder',
        '.rc-select-list',
        '.ant-select-dropdown .rc-select-list',
        '.ant-select-dropdown .rc-virtual-list-holder',
        '.ant-select-dropdown .rc-select-dropdown',
        '[class*="rc-select-list"]',
        '[class*="virtual-list-holder"]'
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.scrollHeight > element.clientHeight) {
          console.log('Found scrollable element:', selector);
          return element;
        }
      }
      return null;
    };

    const attachScrollListener = () => {
      scrollableElement = findScrollableElement();
      
      if (!scrollableElement) {
        console.log('Scrollable element not found, will retry...');
        return false;
      }

      scrollHandler = (e) => {
        const target = e.target;
        const scrollTop = target.scrollTop;
        const scrollHeight = target.scrollHeight;
        const clientHeight = target.clientHeight;
        
        // Load more when scrolled to 70% of the list
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
        
        console.log('Scroll detected:', {
          scrollTop,
          scrollHeight,
          clientHeight,
          scrollPercentage,
          hasMore: availableStudentsPagination.hasMore,
          loadingMore,
          searchLoading
        });
        
        if (scrollPercentage >= 0.7) {
          if (availableStudentsPagination.hasMore && !loadingMore && !searchLoading) {
            console.log('Loading more students from scroll listener...', {
              hasMore: availableStudentsPagination.hasMore,
              loadingMore,
              searchLoading,
              nextPage: availableStudentsPagination.page + 1,
              scrollPercentage
            });
            const nextPage = availableStudentsPagination.page + 1;
            fetchAvailableStudents(studentSearchText, nextPage, true);
          }
        }
      };

      scrollableElement.addEventListener('scroll', scrollHandler, { passive: true });
      console.log('Scroll listener attached to:', scrollableElement);
      return true;
    };

    // Try to attach immediately
    if (!attachScrollListener()) {
      // Use MutationObserver to watch for dropdown appearance
      observer = new MutationObserver(() => {
        if (!scrollableElement && attachScrollListener()) {
          observer.disconnect();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    // Also try after a delay
    const timer = setTimeout(() => {
      if (!scrollableElement) {
        attachScrollListener();
      }
    }, 500);

    return () => {
      if (scrollableElement && scrollHandler) {
        scrollableElement.removeEventListener('scroll', scrollHandler);
      }
      if (observer) {
        observer.disconnect();
      }
      clearTimeout(timer);
    };
  }, [isModalVisible, availableStudentsPagination.hasMore, availableStudentsPagination.page, loadingMore, searchLoading, studentSearchText, fetchAvailableStudents]);

  const handleSelectStudent = (selectedIds) => {
    console.log("Students selected:", selectedIds);
    
    // Convert selected IDs to student objects
    const newSelectedStudents = selectedIds.map(id => 
      availableStudents.find(s => s.userId === id)
    ).filter(Boolean); // Remove any undefined values
    
    setSelectedStudents(newSelectedStudents);
  };


  const handleDeleteStudent = (student) => {
    console.log("Delete button clicked for student:", student);
    setButtonLoading(prev => ({ ...prev, delete: true }));
    setTimeout(() => {
      setStudentToDelete(student);
      setIsDeleteModalVisible(true);
      setButtonLoading(prev => ({ ...prev, delete: false }));
    }, 100);
  };

  const handleConfirmDelete = async () => {
    if (studentToDelete) {
      try {
        console.log("Confirm delete for student:", studentToDelete);
        
        // Call API to remove student from class
        const response = await classManagementApi.removeStudentFromClass(id, studentToDelete.userId);
        console.log("Remove student response:", response);
        
        if (response.success) {
          // Remove student from local state for better UX
          const updatedStudents = students.filter(s => s.userId !== studentToDelete.userId);
          setStudents(updatedStudents);
          
          // Update pagination total
          setPagination(prev => ({
            ...prev,
            total: prev.total - 1,
          }));
          
          const fullName = studentToDelete.fullName || `${studentToDelete.firstName || ''} ${studentToDelete.lastName || ''}`.trim();
          spaceToast.success(`${t('classDetail.deleteSuccess')} "${fullName}" ${t('classDetail.fromClass')}`);
        }
      } catch (error) {
        console.error("Error removing student:", error);
        spaceToast.error(error.response?.data?.error);
      } finally {
        setIsDeleteModalVisible(false);
        setStudentToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    console.log("Delete cancelled");
    setIsDeleteModalVisible(false);
    setStudentToDelete(null);
  };

  const handleImport = () => {
    setButtonLoading(prev => ({ ...prev, import: true }));
    setTimeout(() => {
      setImportModal(prev => ({
        ...prev,
        visible: true,
        fileList: [],
        uploading: false
      }));
      setButtonLoading(prev => ({ ...prev, import: false }));
    }, 100);
  };

  const handleValidateImport = async () => {
    // Validate file selection
    if (importModal.fileList.length === 0 || !importModal.fileList[0]) {
      spaceToast.error(t('classDetail.selectFileToImportError'));
      return;
    }

    const file = importModal.fileList[0];
    
    // Validate Excel file
    const validation = validateExcelFile(file);
    if (!validation.valid) {
      spaceToast.error(validation.message);
      return;
    }

    setImportModal(prev => ({ ...prev, validating: true }));

    try {
      // Create FormData object
      const formData = new FormData();
      formData.append('file', file);
      
      // Call validate API with FormData
      const response = await classManagementApi.validateClassStudentsImport(id, formData);

      console.log('DEBUG - Validation response:', response);
      console.log('DEBUG - Response type:', typeof response);
      console.log('DEBUG - Response data:', response?.data);

      // API returns full response object when responseType: 'blob' is set
      // The blob data is in response.data
      if (response && response.data && response.data instanceof Blob) {
        console.log('DEBUG - Response data is blob, creating download...');
        
        // Create download link directly from blob
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `validation_result_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        
        // Track download start time
        const downloadStartTime = Date.now();
        
        // Monitor for download completion
        const checkDownloadProgress = () => {
          const elapsed = Date.now() - downloadStartTime;
          
          if (elapsed > 2000) { // 2 seconds should be enough for most files
            console.log('DEBUG - Validation download completed');
            setImportModal(prev => ({ ...prev, validating: false }));
            spaceToast.success('Validation completed successfully');
            document.body.removeChild(link);
            return;
          }
          
          // Continue checking
          setTimeout(checkDownloadProgress, 500);
        };
        
        // Start download
        link.click();
        
        // Start monitoring download progress
        setTimeout(checkDownloadProgress, 500);
        
        // Fallback: if still loading after 15 seconds, assume download completed
        setTimeout(() => {
          if (importModal.validating) {
            console.log('DEBUG - Fallback timeout reached for validation');
            setImportModal(prev => ({ ...prev, validating: false }));
            spaceToast.success('Validation download completed');
            document.body.removeChild(link);
          }
        }, 15000);
        
      } else {
        console.error('DEBUG - Unexpected response format:', response);
        throw new Error('No validation file received from server');
      }
    } catch (error) {
      console.error('DEBUG - Error validating import file:', error);
      console.error('DEBUG - Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      spaceToast.error(error.response?.data?.error);
      setImportModal(prev => ({ ...prev, validating: false }));
    }
  };

  const handleImportOk = async () => {
    // Validate file selection
    if (importModal.fileList.length === 0 || !importModal.fileList[0]) {
      spaceToast.error(t('classDetail.selectFileToImportError'));
      return;
    }

    const file = importModal.fileList[0];
    
    // Validate Excel file
    const validation = validateExcelFile(file);
    if (!validation.valid) {
      spaceToast.error(validation.message);
      return;
    }

    setImportModal(prev => ({ ...prev, uploading: true }));

    try {
      // Create FormData object
      const formData = new FormData();
      formData.append('file', file);
      
      // Call import API with FormData
      const response = await classManagementApi.importClassStudents(id, formData);

      if (response.success) {
        // Close modal first
        setImportModal(prev => ({
          ...prev,
          visible: false,
          fileList: [],
          uploading: false,
          validating: false
        }));
        
        // Use backend message if available, otherwise fallback to translation
        const successMessage = response.message || t('classDetail.importSuccess');
        spaceToast.success(successMessage);
        
        // Refresh the students list
        fetchStudents({
          page: pagination.current - 1,
          size: pagination.pageSize,
          text: searchText,
          status: statusFilter,
          sortBy: sortConfig.sortBy,
          sortDir: sortConfig.sortDir
        });
      } else {
        throw new Error(response.message || 'Import failed');
      }
    } catch (error) {
      console.error('Error importing class students:', error);
      spaceToast.error(error.response?.data?.error);
    } finally {
      setImportModal(prev => ({ ...prev, uploading: false }));
    }
  };

  const handleImportCancel = () => {
    setImportModal(prev => ({
      ...prev,
      visible: false,
      fileList: [],
      uploading: false
    }));
  };

  // Helper function to validate Excel file
  const validateExcelFile = (file) => {
    if (!file || !(file instanceof File)) {
      return { valid: false, message: t('classDetail.invalidFileError') };
    }

    // Validate file type - only Excel files
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];
    
    // Also check by file extension as fallback (some browsers may not set MIME type correctly)
    const fileName = file.name.toLowerCase();
    const allowedExtensions = ['.xlsx', '.xls'];
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!allowedTypes.includes(file.type) && !hasValidExtension) {
      return { valid: false, message: t('classDetail.invalidExcelFileError') };
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { valid: false, message: t('classDetail.fileSizeExceededError') };
    }

    if (file.size === 0) {
      return { valid: false, message: t('classDetail.emptyFileError') };
    }
    
    return { valid: true, message: '' };
  };

  // Handle file selection with validation
  const handleFileSelect = (file) => {
    const validation = validateExcelFile(file);
    
    if (!validation.valid) {
      spaceToast.error(validation.message);
      return false;
    }
    
    setImportModal(prev => ({
      ...prev,
      fileList: [file]
    }));
    
    return false; // Prevent default upload behavior
  };

  const handleDownloadTemplate = async () => {
    setTemplateLoading(true);
    
    try {
      const response = await classManagementApi.downloadClassStudentsTemplate(id);
      
      // API returns SAS URL directly (due to axios interceptor returning response.data)
      let downloadUrl;
      if (typeof response === 'string') {
        downloadUrl = response;
      } else if (response && typeof response.data === 'string') {
        downloadUrl = response.data;
      } else if (response && response.data && response.data.url) {
        downloadUrl = response.data.url;
      } else {
        console.error('Unexpected response format:', response);
        throw new Error('No download URL received from server');
      }
      
      // Create download link directly from SAS URL
      const link = document.createElement('a');
      link.setAttribute('href', downloadUrl);
      link.setAttribute('download', 'class_students_import_template.xlsx');
      link.setAttribute('target', '_blank');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      
      // Track download start time
      const downloadStartTime = Date.now();
      
      // Monitor for download completion by checking if file appears in downloads
      const checkDownloadProgress = () => {
        // Check if download has started by monitoring network activity or file system
        // For now, we'll use a shorter timeout since the file should download quickly
        const elapsed = Date.now() - downloadStartTime;
        
        if (elapsed > 2000) { // 2 seconds should be enough for most files
          setTemplateLoading(false);
          spaceToast.success('Template downloaded successfully');
          document.body.removeChild(link);
          return;
        }
        
        // Continue checking
        setTimeout(checkDownloadProgress, 500);
      };
      
      // Start download
      link.click();
      
      // Start monitoring download progress
      setTimeout(checkDownloadProgress, 500);
      
      // Fallback: if still loading after 15 seconds, assume download completed
      setTimeout(() => {
        if (templateLoading) {
          console.log('DEBUG - Fallback timeout reached, removing loading state');
          setTemplateLoading(false);
          spaceToast.success('Template download completed');
          document.body.removeChild(link);
        }
      }, 15000);
      
    } catch (error) {
   
      spaceToast.error(error.response?.data?.error);
      setTemplateLoading(false);
    }
  };

  const handleExport = () => {
    setButtonLoading(prev => ({ ...prev, export: true }));
    setTimeout(() => {
      setIsExportModalVisible(true);
      setButtonLoading(prev => ({ ...prev, export: false }));
    }, 100);
  };

  const handleExportModalClose = () => {
    setIsExportModalVisible(false);
  };

  const handleExportAll = async () => {
    setExportLoading(true);
    
    try {
      // Prepare export parameters using the new API format
      const exportParams = {
        classIds: [id], // Filter by current class ID
      };

      // Add text search if available
      if (searchText) {
        exportParams.text = searchText;
      }

      // Add status filter if not empty
      if (statusFilter.length > 0) {
        exportParams.status = statusFilter;
      }

      // Add roleName filter for students
      exportParams.roleName = ['STUDENT', 'TEST_TAKER'];

      console.log('Exporting all class students with current filters:', exportParams);
      
      const response = await studentManagementApi.exportStudents(exportParams);
      
      // response.data is already a Blob from the API
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      const formattedDate = formatDateForFilename();
      const normalizedClassName = (classData?.name || `class_${id}`)
        .trim()
        .replace(/\s+/g, '_');
      link.download = `${FILE_NAME_PREFIXES.STUDENT_LIST}${normalizedClassName}_${formattedDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      spaceToast.success('Export file successfully');
      setIsExportModalVisible(false);
    } catch (error) {
      console.error('Error exporting class students:', error);
      spaceToast.error(error.response?.data?.error);
    } finally {
      setExportLoading(false);
    }
  };

  const handleModalOk = async () => {
    setButtonLoading(prev => ({ ...prev, add: true }));
    try {
      console.log("Add students clicked");
      console.log("selectedStudents:", selectedStudents);
      
      if (selectedStudents.length === 0) {
        spaceToast.error(t('classDetail.selectAtLeastOne'));
        return;
      }

      // Extract userIds from selected students
      const userIds = selectedStudents.map(student => student.userId);
      console.log("Adding students with userIds:", userIds);

      // Call API to add students to class
      const response = await classManagementApi.addStudentsToClass(id, userIds);
      console.log("Add students response:", response);

      if (response.success) {
        spaceToast.success(`${t('classDetail.addStudentsSuccess')} ${selectedStudents.length} ${t('classDetail.studentsToClass')}`);
        
        // Refresh the students list
        await fetchStudents({
          page: pagination.current - 1,
          size: pagination.pageSize,
          text: searchText,
          status: statusFilter,
          sortBy: sortConfig.sortBy,
          sortDir: sortConfig.sortDir
        });
      } else {
        spaceToast.error(response.message || t('classDetail.checkInfoError'));
      }

      setIsModalVisible(false);
      setSelectedStudents([]);
    } catch (error) {
      console.error("Error adding students:", error);
      spaceToast.error(error.response?.data?.error);
    } finally {
      setButtonLoading(prev => ({ ...prev, add: false }));
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setSelectedStudents([]);
    setStudentSearchText(""); // Reset search text
    // Clear any pending search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      ACTIVE: { text: t('classDetail.active') },
      INACTIVE: { text: t('classDetail.inactive') },
      DROPPED: { text: t('classDetail.dropped') },
    };

    const config = statusConfig[status] || statusConfig.INACTIVE;
    return <span style={{ color: '#000000', fontSize: '20px' }}>{config.text}</span>;
  };

  // Single useEffect to handle all changes with debounce (search, filter, sort, pagination)
  useEffect(() => {
    // Skip only the very first render (true initial load handled by initial effect)
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        // Convert statusFilter array to API format
        let statusParam = 'all';
        if (statusFilter.length > 0) {
          statusParam = statusFilter;
        }
        
        const apiParams = {
          page: (pagination.current - 1) < 0 ? 0 : (pagination.current - 1),
          size: pagination.pageSize,
          text: searchText,
          status: statusParam,
          sortBy: sortConfig.sortBy,
          sortDir: sortConfig.sortDir,
        };
        
        console.log('Fetching students with params:', apiParams);
        const response = await classManagementApi.getClassStudents(id, apiParams);
        console.log('Students response:', response);
        
        if (response.success) {
          setStudents(response.data || []);
          setPagination(prev => ({
            ...prev,
            total: response.totalElements || 0,
            current: (apiParams.page || 0) + 1,
          }));
        } else {
          spaceToast.error(response.message || t('classDetail.loadingStudents'));
          setStudents([]);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        spaceToast.error(error.response?.data?.error);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }, searchText ? 1000 : 0);
    
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, statusFilter, sortConfig.sortBy, sortConfig.sortDir, pagination.pageSize, pagination.current, id]);
  
  // Handle pagination change
  const handleTableChange = (paginationInfo, filters, sorter) => {
    console.log('Table change:', { paginationInfo, filters, sorter });
    
    // Handle pagination - only update state, don't call API here
    if (paginationInfo.current !== pagination.current || paginationInfo.pageSize !== pagination.pageSize) {
      setPagination(prev => ({
        ...prev,
        current: paginationInfo.current,
        pageSize: paginationInfo.pageSize,
      }));
    }
    
    // Handle sorting - this will trigger the main useEffect
    if (sorter && sorter.field) {
      const newSortConfig = {
        sortBy: sorter.field,
        sortDir: sorter.order === 'ascend' ? 'asc' : 'desc',
      };
      setSortConfig(newSortConfig);
    }
  };

  const handleViewProfile = (student) => {
    const studentId = student?.userId || student?.id;
    if (!studentId) return;
    // Route based on role
    let path = ROUTER_PAGE.MANAGER_STUDENT_PROFILE.replace(':id', String(studentId));
    if (userRole === 'teacher') {
      path = ROUTER_PAGE.TEACHER_STUDENT_PROFILE.replace(':id', String(studentId));
    } else if (userRole === 'teaching_assistant') {
      path = ROUTER_PAGE.TEACHING_ASSISTANT_STUDENT_PROFILE.replace(':id', String(studentId));
    }
    if (id) {
      localStorage.setItem('selectedClassId', String(id));
    }
    navigate(path, { state: { classId: id, returnTo: currentPath } });
  };

  const columns = [
    {
      title: t('classDetail.no'),
      key: 'no',
      width: 60,
      render: (_, record, index) => {
        const no = (pagination.current - 1) * pagination.pageSize + index + 1;
        return <span style={{ fontSize: "20px", fontWeight: 500 }}>{no}</span>;
      },
    },
    {
      title: t('classDetail.fullName'),
      dataIndex: "fullName",
      key: "fullName",
      render: (text, record) => (
        <div
          className="student-name-text"
          style={{ fontSize: "20px"}}
          title={t('classDetail.viewProfile')}
        >
          {text || '-'}
        </div>
      ),
    },
    {
      title: t('classDetail.email'),
      dataIndex: 'email',
      key: 'email',
      render: (text) => <span style={{ fontSize: "20px" }}>{text}</span>,
    },
    {
      title: t('classDetail.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: t('classDetail.joinedAt'),
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      render: (date) => (
        <span style={{ fontSize: "20px" }}>
          {new Date(date).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
    {
      title: t('classDetail.actions'),
      key: "actions",
      width: 140, 
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined style={{ fontSize: '24px' }} />}
            onClick={() => handleViewProfile(record)}
            title={t('classDetail.viewProfile')}
          />
          {!isReadOnly && !isClassFinished && (
            <Button
              type="text"
              icon={<DeleteOutlined style={{ fontSize: '24px' }} />}
              onClick={() => handleDeleteStudent(record)}
              style={{ color: "#ff4d4f" }}
              title={t('classDetail.removeFromClass')}
              loading={buttonLoading.delete}
            />
          )}
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <ThemedLayout>
        <div className={`main-content-panel ${theme}-main-panel`}>
          <LoadingWithEffect loading={true} message={t('classDetail.loadingClassInfo')} />
        </div>
      </ThemedLayout>
    );
  }

  return (
    <ThemedLayout>
        {/* Main Content Panel */}
        <div className={`main-content-panel ${theme}-main-panel`}>
          {/* Page Title */}
          <div className="page-title-container">
            <Typography.Title 
              level={1} 
              className="page-title"
            >
              {t('classDetail.studentManagement')} <span className="student-count">({pagination.total})</span>
            </Typography.Title>
          </div>

          {/* Search and Action Section */}
          <div className="search-action-section" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px' }}>
            <Input
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className={`search-input ${theme}-search-input`}
              style={{ flex: '1', minWidth: '250px', maxWidth: '400px', width: '350px', height: '40px', fontSize: '16px' }}
              allowClear
            />
            <div ref={filterContainerRef} style={{ position: 'relative' }}>
              <Button 
                icon={<FilterOutlined />}
                onClick={handleFilterToggle}
                className={`filter-button ${theme}-filter-button ${filterDropdown.visible ? 'active' : ''} ${(statusFilter.length > 0) ? 'has-filters' : ''}`}
              >
                {t('classDetail.filter')}
              </Button>
              
              {/* Filter Dropdown Panel */}
              {filterDropdown.visible && (
                <div className={`filter-dropdown-panel ${theme}-filter-dropdown`}>
                  <div style={{ padding: '20px' }}>
                    {/* Status Filter */}
                    <div style={{ marginBottom: '24px' }}>
                      <Title level={5} style={{ marginBottom: '12px', fontSize: '16px' }}>
                        {t('classDetail.status')}
                      </Title>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {statusOptions.map(option => (
                          <Button
                            key={option.key}
                            onClick={() => {
                              const newStatus = filterDropdown.selectedStatuses.includes(option.key)
                                ? filterDropdown.selectedStatuses.filter(status => status !== option.key)
                                : [...filterDropdown.selectedStatuses, option.key];
                              setFilterDropdown(prev => ({ ...prev, selectedStatuses: newStatus }));
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
                        {t('classDetail.reset')}
                      </Button>
                      <Button
                        type="primary"
                        onClick={handleFilterSubmit}
                        className="filter-submit-button"
                      >
                        {t('classDetail.viewResults')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {!isReadOnly && (
              <div className="action-buttons" style={{ marginLeft: 'auto' }}>
                <Button 
                  icon={<UploadOutlined />}
                  className={`export-button ${theme}-export-button`}
                  onClick={handleExport}
                  loading={buttonLoading.export}
                  disabled={buttonLoading.export || buttonLoading.import}
                >
                  {t('classDetail.exportData')}
                </Button>
                {!isClassFinished && (
                  <>
                    <Button 
                      icon={<DownloadOutlined />}
                      className={`import-button ${theme}-import-button`}
                      onClick={handleImport}
                      loading={buttonLoading.import}
                      disabled={buttonLoading.import || buttonLoading.export}
                    >
                      {t('classDetail.importData')}
                    </Button>
                    <Button 
                      icon={<PlusOutlined />}
                      className={`create-button ${theme}-create-button`}
                      onClick={handleAddStudent}
                      loading={buttonLoading.add}
                      disabled={buttonLoading.add || buttonLoading.import || buttonLoading.export}
                    >
                      {t('classDetail.addStudent')}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Table Section */}
          <div className={`table-section ${theme}-table-section`}>
            <LoadingWithEffect loading={loading} message={t('classDetail.loadingStudents')}>
              <Table
                columns={columns}
                dataSource={students}
                rowKey="userId"
                loading={loading}
                pagination={{
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: pagination.total,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} ${t('classDetail.students')}`,
                  className: `${theme}-pagination`,
                  pageSizeOptions: ['10', '20', '50', '100'],
                }}
                onChange={handleTableChange}
                scroll={{ x: 800 }}
                className={`student-table ${theme}-student-table`}
              />
            </LoadingWithEffect>
          </div>
        </div>

        {/* Add Student Modal */}
        <Modal
          title={
            <div style={{ 
              fontSize: '28px', 
              fontWeight: '600', 
              color: 'rgb(24, 144, 255)',
              textAlign: 'center',
              padding: '10px 0'
            }}>
              {`${t('classDetail.addStudentsToClass')} (${selectedStudents.length} ${t('classDetail.selectedStudents')})`}
            </div>
          }
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={600}
          okText={`${t('classDetail.addStudents')} ${selectedStudents.length} ${t('classDetail.studentsAdded')}`}
          cancelText={t('common.cancel')}
          okButtonProps={{
            
            style: {
              background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
              borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
              color: theme === 'sun' ? '#000' : '#fff',
              borderRadius: '6px',
              height: '32px',
              fontWeight: '500',
              fontSize: '16px',
              padding: '4px 15px',
              minWidth: '200px',
              transition: 'all 0.3s ease',
              boxShadow: 'none'
            },
          }}
          cancelButtonProps={{
            style: {
              height: '32px',
              fontWeight: '500',
              fontSize: '16px',
              padding: '4px 15px',
              width: '100px'
            },
          }}
        >
          <div style={{ position: 'relative' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: '#1e293b'
              }}>
                {t('classDetail.searchAndSelectStudents')}
              </label>
              <Select
                mode="multiple"
                showSearch
                placeholder={t('classDetail.typeStudentNameOrCode')}
                value={selectedStudents.map(s => s.userId)}
                onChange={handleSelectStudent}
                onSearch={handleStudentSearch}
                loading={searchLoading}
                style={{
                  width: '100%',
                  fontSize: "15px",
                }}
                optionFilterProp="children"
                filterOption={false} // Disable client-side filtering since we're using server-side search
                notFoundContent={
                  searchLoading 
                    ? t('common.loading') || 'Loading...' 
                    : availableStudents.length === 0 
                      ? t('classDetail.noStudentsFound') || 'No students found'
                      : loadingMore
                        ? t('common.loadingMore') || 'Loading more...'
                        : null
                }
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    {loadingMore && (
                      <div style={{ 
                        padding: '8px', 
                        textAlign: 'center', 
                        borderTop: '1px solid #f0f0f0',
                        background: '#fafafa'
                      }}>
                        {t('common.loadingMore') || 'Loading more...'}
                      </div>
                    )}
                    {!availableStudentsPagination.hasMore && availableStudents.length > 0 && !loadingMore && (
                      <div style={{ 
                        padding: '8px', 
                        textAlign: 'center', 
                        borderTop: '1px solid #f0f0f0',
                        color: '#999',
                        fontSize: '12px'
                      }}>
                        {t('classDetail.allStudentsLoaded') || 'All students loaded'}
                      </div>
                    )}
                  </>
                )}
                onPopupScroll={(e) => {
                  // This is a backup method, main scroll handling is in useEffect
                  const target = e.target || e.currentTarget;
                  if (!target) return;
                  
                  const scrollTop = target.scrollTop;
                  const scrollHeight = target.scrollHeight;
                  const clientHeight = target.clientHeight;
                  
                  // Load more when scrolled to 70% of the list
                  const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
                  
                  console.log('onPopupScroll event:', {
                    scrollTop,
                    scrollHeight,
                    clientHeight,
                    scrollPercentage,
                    hasMore: availableStudentsPagination.hasMore,
                    loadingMore,
                    searchLoading,
                    target: target.className
                  });
                  
                  if (scrollPercentage >= 0.7) {
                    if (availableStudentsPagination.hasMore && !loadingMore && !searchLoading) {
                      console.log('Loading more students from onPopupScroll...', {
                        hasMore: availableStudentsPagination.hasMore,
                        loadingMore,
                        searchLoading,
                        nextPage: availableStudentsPagination.page + 1,
                        scrollPercentage
                      });
                      const nextPage = availableStudentsPagination.page + 1;
                      fetchAvailableStudents(studentSearchText, nextPage, true);
                    }
                  }
                }}
              >
                {availableStudents.filter(student => student.userId).map((student) => (
                  <Option key={student.userId} value={student.userId}>
                    {student.code} {student.fullName} ({student.email})
                  </Option>
                ))}
              </Select>
            </div>

          </div>
        </Modal>

        {/* Import Modal */}
        <Modal
          title={
            <div
              style={{
                fontSize: '28px',
                fontWeight: '600',
                color: 'rgb(24, 144, 255)',
                textAlign: 'center',
                padding: '10px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}>
              <DownloadOutlined style={{ color: 'rgb(24, 144, 255)' }} />
              {t('classDetail.importStudentsList')}
            </div>
          }
          open={importModal.visible}
          onCancel={handleImportCancel}
          footer={[
            <Button 
              key="cancel" 
              onClick={handleImportCancel}
              style={{
                height: '32px',
                fontWeight: '500',
                fontSize: '16px',
                padding: '4px 15px',
                width: '100px'
              }}>
              {t('common.cancel')}
            </Button>,
            <Button 
              key="validate" 
              onClick={handleValidateImport}
              loading={importModal.validating}
              disabled={importModal.uploading || importModal.validating}
              style={{
                background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
                borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
                color: theme === 'sun' ? '#000' : '#fff',
                borderRadius: '6px',
                height: '32px',
                fontWeight: '500',
                fontSize: '16px',
                padding: '4px 15px',
                width: '120px',
                transition: 'all 0.3s ease',
                boxShadow: 'none'
              }}>
              {t('classDetail.validateFile')}
            </Button>,
            <Button 
              key="import" 
              type="primary"
              onClick={handleImportOk}
              loading={importModal.uploading}
              disabled={importModal.uploading || importModal.validating}
              style={{
                background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
                borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
                color: theme === 'sun' ? '#000' : '#fff',
                borderRadius: '6px',
                height: '32px',
                fontWeight: '500',
                fontSize: '16px',
                padding: '4px 15px',
                width: '200px',
                transition: 'all 0.3s ease',
                boxShadow: 'none'
              }}>
              {t('classDetail.importStudentsList')}
            </Button>
          ]}
          width={600}
          centered
        >
          <div style={{ padding: '20px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <Button
                type="dashed"
                icon={<DownloadOutlined />}
                onClick={handleDownloadTemplate}
                loading={templateLoading}
                disabled={templateLoading}
                style={{
                  borderColor: '#1890ff',
                  color: '#1890ff',
                  height: '36px',
                  fontSize: '14px',
                  fontWeight: '500',
                }}>
                {t('classDetail.downloadTemplate')}
              </Button>
            </div>
            
            <Typography.Title
              level={5}
              style={{
                textAlign: 'center',
                marginBottom: '20px',
                color: '#666',
              }}>
              {t('classDetail.importInstructions')}
            </Typography.Title>

            <Upload.Dragger
              name="file"
              multiple={false}
              beforeUpload={handleFileSelect}
              showUploadList={false}
              accept=".xlsx,.xls"
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
                {t('classDetail.clickOrDragFile')}
              </p>
              <p className='ant-upload-hint' style={{ color: '#999' }}>
                {t('classDetail.supportedFormats')}: Excel (.xlsx, .xls)
              </p>
            </Upload.Dragger>

            {importModal.fileList.length > 0 && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: '#e6f7ff',
                  border: '1px solid #91d5ff',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <div>
                  <Typography.Text style={{ color: '#1890ff', fontWeight: '500' }}>
                    ✅ {t('classDetail.fileSelected')}:{' '}
                    {importModal.fileList[0].name}
                  </Typography.Text>
                  <br />
                  <Typography.Text style={{ color: '#666', fontSize: '12px' }}>
                    Size: {importModal.fileList[0].size < 1024 * 1024 
                      ? `${(importModal.fileList[0].size / 1024).toFixed(1)} KB`
                      : `${(importModal.fileList[0].size / 1024 / 1024).toFixed(2)} MB`
                    }
                  </Typography.Text>
                </div>
                <Button
                  type="text"
                  size="small"
                  onClick={() => setImportModal(prev => ({ ...prev, fileList: [] }))}
                  style={{ color: '#ff4d4f' }}>
                  Remove
                </Button>
              </div>
            )}
          </div>
        </Modal>

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
              {t('classDetail.confirmDelete')}
            </div>
          }
          open={isDeleteModalVisible}
          onOk={handleConfirmDelete}
          onCancel={handleCancelDelete}
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
              ⚠️
            </div>
					<p style={{
						fontSize: '18px',
						color: '#333',
						margin: 0,
						fontWeight: '500'
					}}>
						{t('classDetail.confirmDeleteMessage')}
					</p>
					{studentToDelete && (
						<p style={{
							fontSize: '20px',
							color: '#000',
							margin: 0,
							fontWeight: '400'
						}}>
							<strong>"{studentToDelete.fullName || `${studentToDelete.firstName || ''} ${studentToDelete.lastName || ''}`.trim()}"</strong>
						</p>
					)}
          </div>
        </Modal>

        {/* Export Data Modal */}
        <Modal
          title={
            <div
              style={{
                fontSize: '28px',
                fontWeight: '600',
                color: 'rgb(24, 144, 255)',
                textAlign: 'center',
                padding: '10px 0',
              }}>
              {t('classDetail.exportData')}
            </div>
          }
          open={isExportModalVisible}
          onCancel={handleExportModalClose}
          width={500}
          footer={[
            <Button 
              key="cancel" 
              onClick={handleExportModalClose}
              style={{
                height: '32px',
                fontWeight: '500',
                fontSize: '16px',
                padding: '4px 15px',
                width: '100px'
              }}>
              {t('common.cancel')}
            </Button>
          ]}>
          <div style={{ padding: '20px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <UploadOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
              <Typography.Title level={4} style={{ color: theme === 'dark' ? '#cccccc' : '#666', marginBottom: '8px' }}>
                {t('classDetail.chooseExportOption')}
              </Typography.Title>
              <Typography.Text style={{ color: theme === 'dark' ? '#999999' : '#999' }}>
                {t('classDetail.exportDescription')}
              </Typography.Text>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={handleExportAll}
                loading={exportLoading}
                disabled={exportLoading}
                style={{
                  height: '48px',
                  fontSize: '16px',
                  fontWeight: '500',
                  background: theme === 'sun' 
                    ? 'linear-gradient(135deg, #FFFFFF, #B6D8FE 77%, #94C2F5)'
                    : 'linear-gradient(135deg, #FFFFFF 0%, #9F96B6 46%, #A79EBB 64%, #ACA5C0 75%, #6D5F8F 100%)',
                  borderColor: theme === 'sun' ? '#B6D8FE' : '#9F96B6',
                  color: '#000000',
                  borderRadius: '8px',
                }}>
                {t('classDetail.exportAll')} ({pagination.total} {t('classDetail.students')})
              </Button>
            </div>
          </div>
        </Modal>
    </ThemedLayout>
  );
};


export default ClassStudent;
  