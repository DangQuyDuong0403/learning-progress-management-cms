import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Input,
  Card,
  Row,
  Col,
  Select,
  Tag,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./ClassList.css";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const { Option } = Select;

// Mock data - thay thế bằng API call thực tế
const mockClasses = [
  {
    id: 1,
    name: "Rising Stars 1",
    studentCount: 0,
    color: "#00d4ff", // space blue
    status: "active",
    createdAt: "2024-01-15",
    description: "Basic English course for beginners",
    teacher: "Nguyễn Văn A",
    syllabus: "Basic English",
    ageRange: "6-8",
    schoolYearStart: "2024-09-01",
    schoolYearEnd: "2025-06-30",
  },
  {
    id: 2,
    name: "Rising Stars 2",
    studentCount: 0,
    color: "#ff6b35", // mars orange
    status: "active",
    createdAt: "2024-01-16",
    description: "Intermediate English course",
    teacher: "Trần Thị B",
    syllabus: "Intermediate English",
    ageRange: "8-10",
    schoolYearStart: "2024-09-01",
    schoolYearEnd: "2025-06-30",
  },
  {
    id: 3,
    name: "Rising Stars 3",
    studentCount: 0,
    color: "#9c88ff", // nebula purple
    status: "active",
    createdAt: "2024-01-17",
    description: "Advanced English course",
    teacher: "Lê Văn C",
    syllabus: "Advanced English",
    ageRange: "10-12",
    schoolYearStart: "2024-09-01",
    schoolYearEnd: "2025-06-30",
  },
  {
    id: 4,
    name: "Rising Stars 4",
    studentCount: 0,
    color: "#00ff88", // alien green
    status: "active",
    createdAt: "2024-01-18",
    description: "English conversation club",
    teacher: "Phạm Thị D",
    syllabus: "Conversation English",
    ageRange: "12-14",
    schoolYearStart: "2024-09-01",
    schoolYearEnd: "2025-06-30",
  },
];



const ClassList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setClasses(mockClasses);
        setLoading(false);
      }, 1000);
    } catch (error) {
      spaceToast.error("Error loading classes list");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
  };

  const handleCardClick = (classItem) => {
    navigate(`/teacher/classes/menu/${classItem.id}`);
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      active: { color: "green", text: "Active" },
      inactive: { color: "red", text: "Inactive" },
      pending: { color: "orange", text: "Pending" },
    };

    const config = statusConfig[status] || statusConfig.inactive;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // Filter data based on search and filters
  const filteredClasses = classes.filter((classItem) => {
    const matchesSearch =
      searchText === "" ||
      classItem.name.toLowerCase().includes(searchText.toLowerCase()) ||
      classItem.description.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || classItem.status === statusFilter;

    return matchesSearch && matchesStatus;
  });


  return (
    <ThemedLayout>
      <div className="class-list-container">
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
                {t('classManagement.myClasses')}
              </h2>
            </Col>
          </Row>
        </Card>

        {/* Filters */}
        <Card className="filter-card">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8} lg={6}>
              <Input
                placeholder={t('classManagement.searchClasses')}
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Select
                placeholder="Filter by status"
                value={statusFilter}
                onChange={handleStatusFilter}
                style={{ width: "100%" }}
              >
                <Option value="all">All Status</Option>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="pending">Pending</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchClasses}
              >
                {t('classManagement.refresh')}
              </Button>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6} style={{ textAlign: 'right' }}>
              <Button icon={<ExportOutlined />}>
                {t('classManagement.exportClasses')}
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Class Cards */}
        <div className="classes-grid">
            <LoadingWithEffect loading={loading} message={t('classManagement.loadingClasses')}>
            {filteredClasses.length > 0 ? (
               <Row gutter={[24, 24]} justify="center" style={{ padding: '0 20px' }}>
                 {filteredClasses.map((classItem) => (
                   <Col xs={22} sm={20} md={12} lg={12} xl={12} key={classItem.id}>
                    <Card 
                      className="class-card" 
                      hoverable
                    >
                      <div className="class-card-header">
                        <div 
                          className="class-color-bar" 
                          style={{ backgroundColor: classItem.color }}
                        />
                      </div>
                      
                      <div className="class-card-content">
                        <h3 
                          className="class-name clickable-name"
                          onClick={() => handleCardClick(classItem)}
                          style={{
                            background: "linear-gradient(90deg, #5e17eb 0%, #4dd0ff 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            fontWeight: 700,
                            fontSize: "24px",
                            letterSpacing: "0.3px"
                          }}
                        >
                          {classItem.name}
                        </h3>
                        
                        <div className="class-info">
                          <div className="student-count">
                            <UserOutlined style={{ color: classItem.color }} />
                            <span>{classItem.studentCount}</span>
                          </div>
                          
                          <div className="class-stats">
                            {getStatusTag(classItem.status)}
                          </div>
                        </div>
                        
                        <div className="class-meta">
                          <span className="teacher">Teacher: {classItem.teacher}</span>
                          <span className="age-range">Age Range: {classItem.ageRange}</span>
                          <span className="school-year">
                            Start: {new Date(classItem.schoolYearStart).toLocaleDateString('vi-VN')} - {new Date(classItem.schoolYearEnd).toLocaleDateString('vi-VN')}
                          </span>
                          <span className="created-date">{classItem.createdAt}</span>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <div className="empty-state">
                <p>{t('classManagement.noClassesFound')}</p>
              </div>
            )}
          </LoadingWithEffect>
        </div>

      </div>
    </ThemedLayout>
  );
};

export default ClassList;
