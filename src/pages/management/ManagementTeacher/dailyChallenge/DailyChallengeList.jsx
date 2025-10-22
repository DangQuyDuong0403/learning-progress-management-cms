import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  Input,
  Space,
  Tag,
  Table,
  Pagination,
  Typography,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import CreateDailyChallengeModal from "./CreateDailyChallengeModal";
import "./DailyChallengeList.css";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useDailyChallengeMenu } from "../../../../contexts/DailyChallengeMenuContext";
import usePageTitle from "../../../../hooks/usePageTitle";

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
  const { theme } = useTheme();
  const { enterDailyChallengeMenu, exitDailyChallengeMenu, updateChallengeCount } = useDailyChallengeMenu();
  
  // Set page title
  usePageTitle('Daily Challenge Management');
  
  const [loading, setLoading] = useState(false);
  const [dailyChallenges, setDailyChallenges] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
  const statusOptions = ["active", "inactive", "draft"];

  const fetchDailyChallenges = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setDailyChallenges(mockDailyChallenges);
        setLoading(false);
      }, 1000);
    } catch (error) {
      spaceToast.error(t('dailyChallenge.loadChallengesError'));
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchDailyChallenges();
  }, [fetchDailyChallenges]);

  // Enter/exit daily challenge menu mode
  useEffect(() => {
    // Enter daily challenge menu mode when component mounts
    enterDailyChallengeMenu(0);
    
    // Exit daily challenge menu mode when component unmounts
    return () => {
      exitDailyChallengeMenu();
    };
  }, [enterDailyChallengeMenu, exitDailyChallengeMenu]);

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
    
    updateChallengeCount(filteredCount);
  }, [dailyChallenges, searchText, typeFilter, statusFilter, updateChallengeCount]);

  const handleSearch = (value) => {
    setSearchText(value);
    setCurrentPage(1);
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

  const handleCreateSuccess = (newChallenge) => {
    // Add new challenge to the list
    const updatedChallenges = [
      {
        ...newChallenge,
        id: Math.max(...dailyChallenges.map(c => c.id)) + 1,
        teacher: "Current Teacher", // Would be from user context
      },
      ...dailyChallenges,
    ];
    setDailyChallenges(updatedChallenges);
    setShowCreateModal(false);
  };

  const handleViewClick = (challenge) => {
    navigate(`/teacher/daily-challenges/detail/${challenge.id}`);
  };

  const handleEditClick = (challenge) => {
    navigate(`/teacher/daily-challenges/edit/${challenge.id}`);
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      active: { color: "green", text: t('dailyChallenge.active') },
      inactive: { color: "red", text: t('dailyChallenge.inactive') },
      draft: { color: "orange", text: t('dailyChallenge.draft') },
    };

    const config = statusConfig[status] || statusConfig.inactive;
    return <Tag color={config.color}>{config.text}</Tag>;
  };


  const getTypeTag = (type) => {
    const typeConfig = {
      "Grammar & Vocabulary": { color: "purple", text: type },
      "Reading": { color: "blue", text: type },
      "Writing": { color: "green", text: type },
      "Listening": { color: "orange", text: type },
      "Speaking": { color: "red", text: type },
    };

    const config = typeConfig[type] || { color: "default", text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // Filter data based on search and filters
  const filteredChallenges = dailyChallenges.filter((challenge) => {
    const matchesSearch =
      searchText === "" ||
      challenge.title.toLowerCase().includes(searchText.toLowerCase()) ||
      challenge.description.toLowerCase().includes(searchText.toLowerCase()) ||
      challenge.teacher.toLowerCase().includes(searchText.toLowerCase());

    const matchesType = typeFilter.length === 0 || typeFilter.includes(challenge.type);
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(challenge.status);

    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pagChallenges = filteredChallenges.slice(startIndex, endIndex);

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 70,
      align: 'center',
      render: (_, __, index) => startIndex + index + 1,
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
      render: (type) => getTypeTag(type),
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
      render: (status) => getStatusTag(status),
    },
    {
      title: t('dailyChallenge.actions'),
      key: 'actions',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewClick(record)}
            title={t('dailyChallenge.viewDetails')}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditClick(record)}
            title={t('dailyChallenge.editChallenge')}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            title={t('dailyChallenge.deleteChallenge')}
          />
        </Space>
      ),
    },
  ];

  return (
    <ThemedLayout>
      {/* Main Content Panel */}
      <div className={`main-content-panel ${theme}-main-panel`} style={{ 
        margin: 0, 
        padding: 0,
        width: '100%',
        maxWidth: '100%'
      }}>
        {/* Search and Action Section */}
        <div className="search-action-section" style={{ 
          display: 'flex', 
          gap: '8px', 
          alignItems: 'center', 
          marginBottom: 0,
          padding: '20px',
          borderRadius: 0
        }}>
          <Input
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t('dailyChallenge.searchChallenges')}
            className={`search-input ${theme}-search-input`}
            style={{ flex: '1', minWidth: '250px', maxWidth: '400px', width: '350px', height: '40px', fontSize: '16px' }}
            allowClear
          />
          {/* AccountList-style Filter Dropdown */}
          <div ref={filterContainerRef} style={{ position: 'relative' }}>
            <Button 
              icon={<FilterOutlined />} 
              onClick={handleFilterToggle}
              className={`filter-button ${theme}-filter-button ${filterDropdown.visible ? 'active' : ''} ${(statusFilter.length > 0 || typeFilter.length > 0) ? 'has-filters' : ''}`}
            >
              {t('filter')}
            </Button>

            {filterDropdown.visible && (
              <div className={`filter-dropdown-panel ${theme}-filter-dropdown`}>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    {/* Type Filter */}
                    <div style={{ flex: 1 }}>
                      <Typography.Title level={5} style={{ marginBottom: '10px', fontSize: '15px' }}>
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
                      <Typography.Title level={5} style={{ marginBottom: '10px', fontSize: '15px' }}>
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

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
                    <Button onClick={handleFilterReset} className='filter-reset-button'>
                      {t('reset')}
                    </Button>
                    <Button type='primary' onClick={handleFilterSubmit} className='filter-submit-button'>
                      {t('viewResults')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div style={{ marginLeft: 'auto' }}>
            <Button
              icon={<PlusOutlined />}
              onClick={handleCreateClick}
              className={`create-button ${theme}-create-button`}
              style={{ height: '40px', fontSize: '16px', fontWeight: '500' }}
            >
              {t('dailyChallenge.createChallenge')}
            </Button>
          </div>
        </div>

        {/* Table Section */}
        <div className={`table-section ${theme}-table-section`} style={{
          margin: 0,
          padding: 0,
          borderRadius: 0
        }}>
          <LoadingWithEffect loading={loading}>
            <Table
              columns={columns}
              dataSource={pagChallenges}
              pagination={false}
              rowKey="id"
              className={`custom-table ${theme}-table`}
              scroll={{ x: 'max-content' }}
              style={{
                borderRadius: 0
              }}
            />
            
            {/* Pagination */}
            {filteredChallenges.length > 0 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                padding: '16px 20px',
                margin: 0
              }}>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={filteredChallenges.length}
                  onChange={setCurrentPage}
                  onShowSizeChange={(current, size) => setPageSize(size)}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) =>
                    `${range[0]}-${range[1]} ${t('dailyChallenge.of')} ${total} ${t('dailyChallenge.challenges')}`
                  }
                />
              </div>
            )}
          </LoadingWithEffect>
        </div>

        {/* Create Daily Challenge Modal */}
        <CreateDailyChallengeModal
          visible={showCreateModal}
          onCancel={handleCreateModalCancel}
          onCreateSuccess={handleCreateSuccess}
        />
      </div>
    </ThemedLayout>
  );
};

export default DailyChallengeList;
