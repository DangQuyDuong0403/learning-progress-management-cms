import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  Input,
  Space,
  Table,
  Typography,
  Tooltip,
  Switch,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
// import CreateDailyChallengeModal from "./CreateDailyChallengeModal"; // Keep old modal (not deleted, just commented)
import SimpleDailyChallengeModal from "./SimpleDailyChallengeModal"; // New simple modal
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
  const [searchDebounce, setSearchDebounce] = useState("");

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

  // Filter option lists
  const typeOptions = [
    "Grammar & Vocabulary",
    "Reading",
    "Writing",
    "Listening",
    "Speaking",
  ];
  const statusOptions = ["active", "inactive", "pending"];

  const fetchDailyChallenges = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      
      if (classId) {
        // Lấy daily challenges cho class cụ thể
        response = await dailyChallengeApi.getDailyChallengesByClass(classId, {
          page: currentPage - 1, // API sử dụng 0-based pagination
          size: pageSize,
          text: searchDebounce,
          sortBy: 'createdAt',
          sortDir: 'desc'
        });
      } else {
        // Lấy tất cả daily challenges của teacher
        response = await dailyChallengeApi.getAllDailyChallenges({
          page: currentPage - 1, // API sử dụng 0-based pagination
          size: pageSize,
          text: searchDebounce,
          sortBy: 'createdAt',
          sortDir: 'desc'
        });
      }

      console.log('Daily Challenges API Response:', response.data);
      
      // Xử lý response data
      if (response.data && response.data.content) {
        setDailyChallenges(response.data.content);
        setTotalItems(response.data.totalElements || 0);
      } else if (response.data && Array.isArray(response.data)) {
        setDailyChallenges(response.data);
        setTotalItems(response.data.length);
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
      
      spaceToast.error(t('dailyChallenge.loadChallengesError'));
      setLoading(false);
    }
  }, [classId, currentPage, pageSize, searchDebounce, t]);

  useEffect(() => {
    fetchDailyChallenges();
  }, [fetchDailyChallenges]);

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
      const matchesSearch =
        searchText === "" ||
        challenge.title.toLowerCase().includes(searchText.toLowerCase()) ||
        challenge.description.toLowerCase().includes(searchText.toLowerCase()) ||
        challenge.teacher.toLowerCase().includes(searchText.toLowerCase());

      const matchesType = typeFilter.length === 0 || typeFilter.includes(challenge.type);
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(challenge.status);

      return matchesSearch && matchesType && matchesStatus;
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
      spaceToast.success(t('dailyChallenge.createSuccess'));
    } catch (error) {
      console.error('Error creating challenge:', error);
      spaceToast.error(t('dailyChallenge.createError'));
    }
  };

  const handleViewClick = (challenge) => {
    navigate(`/teacher/daily-challenges/detail/${challenge.id}`);
  };

  const handleToggleStatus = async (id) => {
    const challenge = dailyChallenges.find(c => c.id === id);
    const newStatus = challenge.status === 'active' ? 'inactive' : 'active';
    
    try {
      // Call API to toggle status
      await dailyChallengeApi.toggleDailyChallengeStatus(id);
      
      // Update local state on success
      setDailyChallenges(
        dailyChallenges.map((c) =>
          c.id === id ? { ...c, status: newStatus } : c
        )
      );
      
      spaceToast.success(
        `Challenge ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`
      );
    } catch (error) {
      console.error('Error toggling challenge status:', error);
      spaceToast.error(t('dailyChallenge.toggleStatusError'));
    }
  };

  const getTypeText = (type) => {
    return type.toLowerCase();
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
            textAlign: 'left'
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
      width: 200,
      align: 'center',
      render: (type) => getTypeText(type),
    },
    {
      title: t('dailyChallenge.timeLimit'),
      dataIndex: 'timeLimit',
      key: 'timeLimit',
      width: 120,
      align: 'center',
      render: (timeLimit) => `${timeLimit} ${t('dailyChallenge.minutes')}`,
    },
    {
      title: t('dailyChallenge.totalQuestions'),
      dataIndex: 'totalQuestions',
      key: 'totalQuestions',
      width: 150,
      align: 'center',
    },
    {
      title: t('dailyChallenge.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status, record) => (
        <Switch
          checked={status === 'active'}
          onChange={() => handleToggleStatus(record.id)}
          size="large"
          style={{
            transform: 'scale(1.2)',
          }}
          className={`status-switch ${theme}-status-switch`}
        />
      ),
    },
    {
      title: t('dailyChallenge.actions'),
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined style={{ fontSize: '18px' }} />}
            onClick={() => handleViewClick(record)}
            title={t('dailyChallenge.viewDetails')}
            className="action-btn-view"
          />
        </Space>
      ),
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
                            {opt}
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
        />
        
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
