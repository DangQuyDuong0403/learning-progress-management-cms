import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  Input,
  Space,
  Table,
  Typography,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./DailyChallengeList.css";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useDailyChallengeMenu } from "../../../../contexts/DailyChallengeMenuContext";
import usePageTitle from "../../../../hooks/usePageTitle";

// Mock data - danh sách học sinh đã làm bài
const mockSubmissions = [
  {
    id: 1,
    studentId: "SE12345",
    studentName: "Nguyễn Văn A",
    email: "anvn@example.com",
    status: "completed",
    score: 8.5,
    submittedAt: "2024-01-15 10:30:00",
    timeSpent: 25, // minutes
  },
  {
    id: 2,
    studentId: "SE12346",
    studentName: "Trần Thị B",
    email: "btt@example.com",
    status: "completed",
    score: 9.0,
    submittedAt: "2024-01-15 11:00:00",
    timeSpent: 28,
  },
  {
    id: 3,
    studentId: "SE12347",
    studentName: "Lê Văn C",
    email: "clv@example.com",
    status: "not_started",
    score: null,
    submittedAt: null,
    timeSpent: null,
  },
  {
    id: 4,
    studentId: "SE12348",
    studentName: "Phạm Thị D",
    email: "dpt@example.com",
    status: "in_progress",
    score: null,
    submittedAt: null,
    timeSpent: null,
  },
  {
    id: 5,
    studentId: "SE12349",
    studentName: "Hoàng Văn E",
    email: "ehv@example.com",
    status: "completed",
    score: 7.5,
    submittedAt: "2024-01-15 14:20:00",
    timeSpent: 30,
  },
];

const DailyChallengeSubmissionList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { id } = useParams();
  const { enterDailyChallengeMenu, exitDailyChallengeMenu, updateChallengeCount } = useDailyChallengeMenu();
  
  // Set page title
  usePageTitle('Daily Challenge Management / Submissions');
  
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter dropdown state and refs
  const [filterDropdown, setFilterDropdown] = useState({
    visible: false,
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
  const statusOptions = ["completed", "in_progress", "not_started"];

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setSubmissions(mockSubmissions);
        setLoading(false);
      }, 1000);
    } catch (error) {
      spaceToast.error(t('dailyChallenge.loadSubmissionsError'));
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Enter/exit daily challenge menu mode
  useEffect(() => {
    // Set backPath to performance page
    const backPath = `/teacher/daily-challenges/detail/${id}`;
    enterDailyChallengeMenu(0, null, backPath);
    
    return () => {
      exitDailyChallengeMenu();
    };
  }, [enterDailyChallengeMenu, exitDailyChallengeMenu, id]);

  // Update challenge count when filters change
  useEffect(() => {
    const filteredCount = submissions.filter((submission) => {
      const matchesSearch =
        searchText === "" ||
        submission.studentName.toLowerCase().includes(searchText.toLowerCase()) ||
        submission.studentId.toLowerCase().includes(searchText.toLowerCase()) ||
        submission.email.toLowerCase().includes(searchText.toLowerCase());

      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(submission.status);

      return matchesSearch && matchesStatus;
    }).length;
    
    updateChallengeCount(filteredCount);
  }, [submissions, searchText, statusFilter, updateChallengeCount]);

  const handleSearch = (value) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  // Filter dropdown handlers
  const handleFilterToggle = () => {
    setFilterDropdown((prev) => ({ ...prev, visible: !prev.visible }));
  };

  const handleFilterSubmit = () => {
    setStatusFilter(filterDropdown.selectedStatuses);
    setCurrentPage(1);
    setFilterDropdown((prev) => ({ ...prev, visible: false }));
  };

  const handleFilterReset = () => {
    setFilterDropdown((prev) => ({ ...prev, selectedStatuses: [] }));
    setStatusFilter([]);
    setCurrentPage(1);
  };

  const handleViewClick = (submission) => {
    navigate(`/teacher/daily-challenges/detail/${id}/submission/${submission.id}`);
  };

  const getStatusText = (status) => {
    const statusConfig = {
      completed: t('dailyChallenge.completed'),
      in_progress: t('dailyChallenge.inProgress'),
      not_started: t('dailyChallenge.notStarted'),
    };

    return statusConfig[status] || statusConfig.not_started;
  };

  // Filter data based on search and filters
  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      searchText === "" ||
      submission.studentName.toLowerCase().includes(searchText.toLowerCase()) ||
      submission.studentId.toLowerCase().includes(searchText.toLowerCase()) ||
      submission.email.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(submission.status);

    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: t('common.index'),
      key: 'stt',
      width: 70,
      align: 'center',
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: t('dailyChallenge.studentId'),
      dataIndex: 'studentId',
      key: 'studentId',
      width: 120,
      align: 'center',
    },
    {
      title: t('dailyChallenge.studentName'),
      dataIndex: 'studentName',
      key: 'studentName',
      width: 200,
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
      title: t('dailyChallenge.email'),
      dataIndex: 'email',
      key: 'email',
      width: 200,
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
      title: t('dailyChallenge.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status) => getStatusText(status),
    },
    {
      title: t('dailyChallenge.score'),
      dataIndex: 'score',
      key: 'score',
      width: 100,
      align: 'center',
      render: (score) => score !== null ? `${score}/10` : '-',
    },
    {
      title: t('dailyChallenge.submittedAt'),
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 180,
      align: 'center',
      render: (time) => time || '-',
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
            disabled={record.status === 'not_started'}
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
            placeholder={t('dailyChallenge.searchSubmissions')}
            className={`search-input ${theme}-search-input`}
            style={{ flex: '1', minWidth: '250px', maxWidth: '400px', width: '350px', height: '40px', fontSize: '16px' }}
            allowClear
          />
          <div ref={filterContainerRef} style={{ position: 'relative' }}>
            <Button 
              icon={<FilterOutlined />}
              onClick={handleFilterToggle}
              className={`filter-button ${theme}-filter-button ${filterDropdown.visible ? 'active' : ''} ${statusFilter.length > 0 ? 'has-filters' : ''}`}
            >
              {t('common.filter')}
            </Button>
            
            {/* Filter Dropdown Panel */}
            {filterDropdown.visible && (
              <div className={`filter-dropdown-panel ${theme}-filter-dropdown`}>
                <div style={{ padding: '20px' }}>
                  <div style={{ marginBottom: '24px' }}>
                    {/* Status Filter */}
                    <div>
                      <Typography.Title level={5} style={{ marginBottom: '12px', fontSize: '16px' }}>
                        {t('dailyChallenge.status')}
                      </Typography.Title>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {statusOptions.map((statusKey) => {
                          // Map status key to translation key
                          const statusTextMap = {
                            'completed': 'completed',
                            'in_progress': 'inProgress',
                            'not_started': 'notStarted'
                          };
                          return (
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
                              {t(`dailyChallenge.${statusTextMap[statusKey]}`)}
                            </Button>
                          );
                        })}
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
        </div>

        {/* Table Section */}
        <div className={`table-section ${theme}-table-section`} style={{ paddingBottom: '24px' }}>
          <LoadingWithEffect loading={loading} message={t('dailyChallenge.loadingSubmissions')}>
            <Table
              columns={columns}
              dataSource={filteredSubmissions}
              rowKey="id"
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: filteredSubmissions.length,
                onChange: setCurrentPage,
                onShowSizeChange: (current, size) => setPageSize(size),
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} ${t('dailyChallenge.of')} ${total} ${t('dailyChallenge.submissions')}`,
                className: `${theme}-pagination`,
                pageSizeOptions: ['10', '20', '50', '100'],
              }}
              scroll={{ x: 800 }}
              className={`daily-challenge-table ${theme}-daily-challenge-table`}
            />
          </LoadingWithEffect>
        </div>
      </div>
    </ThemedLayout>
  );
};

export default DailyChallengeSubmissionList;

