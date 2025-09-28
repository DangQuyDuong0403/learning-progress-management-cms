import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Space,
  Modal,
  Form,
  DatePicker,
  Select,
  Input,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import Layout from "../../../../component/Layout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { spaceToast } from "../../../../component/SpaceToastify";

const { Option } = Select;

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
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [classData, setClassData] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchClassData();
    fetchActivities();
  }, [id]);

  const fetchClassData = async () => {
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
  };

  const fetchActivities = async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        setActivities(mockActivities);
      }, 500);
    } catch (error) {
      spaceToast.error(t('classActivities.loadingActivities'));
    }
  };

  const handleAddActivity = () => {
    setEditingActivity(null);
    form.resetFields();
    setIsModalVisible(true);
  };


  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingActivity) {
        // Update existing activity
        setActivities(
          activities.map((activity) =>
            activity.id === editingActivity.id
              ? { ...activity, ...values, date: values.date.format('YYYY-MM-DD') }
              : activity
          )
        );
        spaceToast.success(t('classActivities.activityUpdatedSuccess'));
      } else {
        // Add new activity
        const newActivity = {
          id: Date.now(),
          ...values,
          date: values.date.format('YYYY-MM-DD'),
          status: "upcoming",
        };
        setActivities([newActivity, ...activities]);
        spaceToast.success(t('classActivities.activityAddedSuccess'));
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      spaceToast.error(t('classActivities.checkInfoError'));
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };




  if (loading) {
    return (
      <Layout>
        <div className="class-detail-container">
          <LoadingWithEffect loading={true} message={t('classActivities.loadingClassInfo')} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="class-detail-container">
        {/* Header */}
        <Card className="header-card">
          <div className="header-content">
            <div className="header-left">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
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
                  icon={<ReloadOutlined />}
                  onClick={fetchActivities}
                  className="refresh-button"
                >
                  {t('classActivities.refresh')}
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddActivity}
                  className="add-activity-button"
                >
                  {t('classActivities.addActivity')}
                </Button>
              </Space>
            </div>
          </div>
        </Card>

        {/* Main Content Card */}
        <Card className="main-content-card">
          {/* Navigation Tabs */}
          <div className="nav-tabs">
            <div 
              className="nav-tab"
              onClick={() => navigate(`/manager/classes/student/${id}`)}
            >
              <span>{t('classActivities.students')}</span>
            </div>
            <div 
              className="nav-tab"
              onClick={() => navigate(`/manager/classes/teachers/${id}`)}
            >
              <span>{t('classActivities.teachers')}</span>
            </div>
            <div className="nav-tab active">
              <span>{t('classActivities.activities')} ({activities.length})</span>
            </div>
          </div>


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

        {/* Add/Edit Modal */}
        <Modal
          title={editingActivity ? t('classActivities.editActivity') : t('classActivities.addNewActivity')}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={600}
          okText={t('classActivities.save')}
          cancelText={t('common.cancel')}
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              status: "upcoming",
              type: "classroom",
            }}
          >
            <Form.Item
              label={t('classActivities.activityName')}
              name="title"
              rules={[
                { required: true, message: t('classActivities.activityNameRequired') },
              ]}
            >
              <Input 
                placeholder={t('classActivities.enterActivityName')} 
                style={{
                  fontSize: "15px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "2px solid #e2e8f0",
                  transition: "all 0.3s ease",
                }}
              />
            </Form.Item>

            <Form.Item
              label={t('classActivities.description')}
              name="description"
              rules={[
                { required: true, message: t('classActivities.descriptionRequired') },
              ]}
            >
              <Input.TextArea 
                placeholder={t('classActivities.enterDescription')} 
                rows={3}
                style={{
                  fontSize: "15px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "2px solid #e2e8f0",
                  transition: "all 0.3s ease",
                }}
              />
            </Form.Item>

            <Form.Item
              label={t('classActivities.activityType')}
              name="type"
              rules={[
                { required: true, message: t('classActivities.activityTypeRequired') },
              ]}
            >
              <Select 
                placeholder={t('classActivities.selectActivityType')}
                style={{
                  fontSize: "15px",
                }}
              >
                <Option value="classroom">{t('classActivities.classroom')}</Option>
                <Option value="quiz">{t('classActivities.quiz')}</Option>
                <Option value="discussion">{t('classActivities.discussion')}</Option>
                <Option value="homework">{t('classActivities.homework')}</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={t('classActivities.date')}
              name="date"
              rules={[
                { required: true, message: t('classActivities.dateRequired') },
              ]}
            >
              <DatePicker 
                placeholder={t('classActivities.selectDate')}
                style={{
                  fontSize: "15px",
                  width: "100%",
                }}
                format="DD/MM/YYYY"
              />
            </Form.Item>

            <Form.Item
              label={t('classActivities.status')}
              name="status"
              rules={[
                { required: true, message: t('classActivities.statusRequired') },
              ]}
            >
              <Select 
                placeholder={t('classActivities.selectStatus')}
                style={{
                  fontSize: "15px",
                }}
              >
                <Option value="upcoming">{t('classActivities.upcoming')}</Option>
                <Option value="completed">{t('classActivities.completed')}</Option>
                <Option value="cancelled">{t('classActivities.cancelled')}</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
};

export default ClassActivities;
