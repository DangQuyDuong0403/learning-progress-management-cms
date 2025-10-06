import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Input,
  Space,
  Card,
  Row,
  Col,
  Select,
  Tag,
  Table,
  Pagination,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import CreateDailyChallengeModal from "./CreateDailyChallengeModal";
import "./DailyChallengeList.css";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const { Option } = Select;

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
  const [loading, setLoading] = useState(false);
  const [dailyChallenges, setDailyChallenges] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const handleSearch = (value) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleTypeFilter = (value) => {
    setTypeFilter(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
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

    const matchesType = typeFilter === "all" || challenge.type === typeFilter;
    const matchesStatus = statusFilter === "all" || challenge.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pagChallenges = filteredChallenges.slice(startIndex, endIndex);

  const columns = [
    {
      title: t('dailyChallenge.challengeTitle'),
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div className="challenge-title">{text}</div>
          <div className="challenge-description">{record.description}</div>
        </div>
      ),
    },
    {
      title: t('dailyChallenge.type'),
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type) => getTypeTag(type),
    },
    {
      title: t('dailyChallenge.timeLimit'),
      dataIndex: 'timeLimit',
      key: 'timeLimit',
      width: 100,
      render: (timeLimit) => `${timeLimit} ${t('dailyChallenge.minutes')}`,
    },
    {
      title: t('dailyChallenge.totalQuestions'),
      dataIndex: 'totalQuestions',
      key: 'totalQuestions',
      width: 130,
    },
    {
      title: t('dailyChallenge.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: t('dailyChallenge.actions'),
      key: 'actions',
      width: 150,
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
      <div className="daily-challenge-list-container">
        {/* Header */}
        <Card className="header-card">
          <Row justify="space-between" align="middle">
            <Col>
              <h2
                style={{
                  margin: 0,
                  background:
                    "linear-gradient(135deg, #00d4ff 0%, #9c88ff 50%, #ff6b35 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 800,
                  fontSize: "32px",
                  letterSpacing: "-0.5px",
                  textShadow: "0 0 30px rgba(0, 212, 255, 0.3)",
                }}
              >
                {t('dailyChallenge.dailyChallengeManagement')}
              </h2>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateClick}
              >
                {t('dailyChallenge.createChallenge')}
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Filters */}
        <Card className="filter-card">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6} lg={5}>
              <Input
                placeholder={t('dailyChallenge.searchChallenges')}
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6} lg={5}>
              <Select
                placeholder={t('dailyChallenge.filterByType')}
                value={typeFilter}
                onChange={handleTypeFilter}
                style={{ width: "100%" }}
              >
                <Option value="all">{t('dailyChallenge.allTypes')}</Option>
                <Option value="Grammar & Vocabulary">Grammar & Vocabulary</Option>
                <Option value="Reading">Reading</Option>
                <Option value="Writing">Writing</Option>
                <Option value="Listening">Listening</Option>
                <Option value="Speaking">Speaking</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6} lg={5}>
              <Select
                placeholder={t('dailyChallenge.filterByStatus')}
                value={statusFilter}
                onChange={handleStatusFilter}
                style={{ width: "100%" }}
              >
                <Option value="all">{t('dailyChallenge.allStatuses')}</Option>
                <Option value="active">{t('dailyChallenge.active')}</Option>
                <Option value="inactive">{t('dailyChallenge.inactive')}</Option>
                <Option value="draft">{t('dailyChallenge.draft')}</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchDailyChallenges}
                >
                  {t('dailyChallenge.refresh')}
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>


        {/* Challenges Table */}
        <Card className="table-card">
          <LoadingWithEffect loading={loading} message={t('dailyChallenge.loadingChallenges')}>
            <Table
              columns={columns}
              dataSource={pagChallenges}
              pagination={false}
              rowKey="id"
              className="daily-challenge-table"
            />
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
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
          </LoadingWithEffect>
        </Card>

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
