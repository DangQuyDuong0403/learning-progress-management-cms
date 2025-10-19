import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Card,
  Space,
} from "antd";
import {
  ArrowLeftOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./ClassActivities.css";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useTheme } from "../../../../contexts/ThemeContext";
import usePageTitle from "../../../../hooks/usePageTitle";

// Mock data for activities (timeline format)
const mockActivities = [
  {
    id: 1,
    action: "added two new students, Thư and Dương to the class",
    actor: "Phạm Quang Minh",
    timestamp: "9h - 20/08/2025",
    type: "student_add",
  },
  {
    id: 2,
    action: "added new lesson 3 in chapter 1",
    actor: "Phạm Quang Minh",
    timestamp: "9h - 20/08/2025",
    type: "lesson_add",
  },
  {
    id: 3,
    action: "added two new students, Thư and Dương to the class",
    actor: "Phạm Quang Minh",
    timestamp: "9h - 20/08/2025",
    type: "student_add",
  },
  {
    id: 4,
    action: "added new lesson 3 in chapter 1",
    actor: "Phạm Quang Minh",
    timestamp: "9h - 20/08/2025",
    type: "lesson_add",
  },
  {
    id: 5,
    action: "added new lesson 3 in chapter 1",
    actor: "Phạm Quang Minh",
    timestamp: "9h - 20/08/2025",
    type: "lesson_add",
  },
];

// Mock class data
const mockClassData = {
  id: 1,
  name: "Rising star 1",
  color: "#00d4ff",
  status: "active",
  createdAt: "2024-01-15",
};

const ClassActivities = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  // Set page title
  usePageTitle('Class Activities');
  
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [classData, setClassData] = useState(null);

  const fetchClassData = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setClassData(mockClassData);
        setLoading(false);
      }, 500);
    } catch (error) {
      spaceToast.error(t('classActivities.loadingClassInfo'));
      setLoading(false);
    }
  }, [t]);

  const fetchActivities = useCallback(async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        setActivities(mockActivities);
      }, 500);
    } catch (error) {
      spaceToast.error(t('classActivities.loadingActivities'));
    }
  }, [t]);

  useEffect(() => {
    fetchClassData();
    fetchActivities();
  }, [id, fetchClassData, fetchActivities]);





  if (loading) {
    return (
      <ThemedLayout>
        <div className="class-detail-container">
          <LoadingWithEffect loading={true} message={t('classActivities.loadingClassInfo')} />
        </div>
      </ThemedLayout>
    );
  }

  return (
    <ThemedLayout>
      <div className="class-detail-container">
        {/* Header */}
        <Card className="header-card">
          <div className="header-content">
            <div className="header-left">
              <Button
                icon={<ArrowLeftOutlined style={{ fontSize: '18px' }} />}
                onClick={() => navigate(`/manager/classes/menu/${id}`)}
                className="back-button"
              >
                {t('common.back')}
              </Button>
            </div>
            
            <div className="header-center">
              <h2 className="class-title">
                {classData?.name}
              </h2>
            </div>
            
            <div className="header-right">
              <Space>
                <Button
                  icon={<ReloadOutlined style={{ fontSize: '18px' }} />}
                  onClick={fetchActivities}
                  className="refresh-button"
                >
                  {t('classActivities.refresh')}
                </Button>
              </Space>
            </div>
          </div>
        </Card>

        {/* Main Content Card */}
        <Card className="main-content-card">
          {/* Activities Timeline */}
          <div className="timeline-section">
            <LoadingWithEffect loading={loading} message={t('classActivities.loadingActivities')}>
              <div style={{ 
                maxHeight: '600px', 
                overflowY: 'auto',
                padding: '20px 0'
              }}>
                {activities.map((activity, index) => (
                  <div
                    key={activity.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: '24px',
                      position: 'relative',
                    }}
                  >
                    {/* Timeline line */}
                    {index < activities.length - 1 && (
                      <div
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '24px',
                          width: '2px',
                          height: 'calc(100% + 24px)',
                          backgroundColor: '#e1e4e8',
                        }}
                      />
                    )}
                    
                    {/* Timeline dot */}
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: activity.type === 'student_add' ? '#10b981' : 
                                        activity.type === 'lesson_add' ? '#3b82f6' : 
                                        activity.type === 'teacher_add' ? '#8b5cf6' : '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '20px',
                        flexShrink: 0,
                        zIndex: 1,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: 'white',
                        }}
                      />
                    </div>
                    
                    {/* Activity content */}
                    <div style={{ flex: 1, minWidth: 0, paddingLeft: '8px' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        <span style={{ 
                          fontSize: '14px', 
                          fontWeight: '600',
                          color: '#24292e'
                        }}>
                          {activity.actor}
                        </span>
                        <span style={{ 
                          fontSize: '14px', 
                          color: '#586069'
                        }}>
                          {activity.action}
                        </span>
                      </div>
                      
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#8b949e',
                        marginLeft: '0'
                      }}>
                        {activity.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
                
                {activities.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#8b949e',
                    fontSize: '14px'
                  }}>
                    {t('classActivities.noActivitiesFound')}
                  </div>
                )}
              </div>
            </LoadingWithEffect>
          </div>
        </Card>

      </div>
    </ThemedLayout>
  );
};

export default ClassActivities;
