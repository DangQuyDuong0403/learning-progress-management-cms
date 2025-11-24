import React, { useState, useEffect, useCallback } from "react";
import { Typography } from "antd";
import { 
  BookOutlined,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  MailOutlined,
  PhoneOutlined
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/ThemedLayout";
import ThemedLayoutNoSidebar from "../../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./ClassOverview.css";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useClassMenu } from "../../../../contexts/ClassMenuContext";
import classManagementApi from "../../../../apis/backend/classManagement";
import usePageTitle from "../../../../hooks/usePageTitle";
import { useSelector } from "react-redux";

const ClassOverview = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { theme } = useTheme();
  const { enterClassMenu, exitClassMenu } = useClassMenu();
  const { user } = useSelector((state) => state.auth);
  const userRole = user?.role;
  const normalizedRole = (userRole || '').toLowerCase();
  const isStudent = normalizedRole === 'student';
  const isTestTaker = normalizedRole === 'test_taker';
  const isTeacher = normalizedRole === 'teacher';
  const isTeachingAssistant = normalizedRole === 'teaching_assistant';
  
  // Use ThemedLayout from teacherlayout (no sidebar) for students, test takers, teachers, and teaching assistants
  const LayoutComponent = (isStudent || isTestTaker || isTeacher || isTeachingAssistant) ? ThemedLayoutNoSidebar : ThemedLayout;
  
  // Set page title
  usePageTitle('Class Overview');
  
  const [loading, setLoading] = useState(false);
  const [classData, setClassData] = useState(null);

  const fetchClassData = useCallback(async () => {
    try {
      const response = await classManagementApi.getClassOverview(id);
      console.log('Class overview response:', response);
      const data = response?.data?.data ?? response?.data ?? null;
      if (data) {
        const mapped = {
          id: data.id ?? id,
          name: data.className ?? '-',
          classCode: data.classCode ?? '-',
          status: data.status ?? '-',
          syllabus: data.syllabus?.syllabusName ?? '-',
          teachers: data.teachers ?? null,
          teachingAssistants: data.teachingAssistants ?? [],
          startDate: data.startDate ? new Date(data.startDate).toLocaleDateString('vi-VN') : '-',
          endDate: data.endDate ? new Date(data.endDate).toLocaleDateString('vi-VN') : '-',
          level: data.level?.levelName ?? '-'
        };
        setClassData(mapped);
      }
    } catch (error) {
      console.error('Error fetching class overview data:', error);
      spaceToast.error(t('classDetail.loadingClassInfo'));
    }
  }, [id, t]);

  // Initial data loading
  useEffect(() => {
    setLoading(true);
    fetchClassData().finally(() => {
      setLoading(false);
    });
  }, [id, fetchClassData]);

  // Ensure header back button appears immediately while class info loads
  useEffect(() => {
    if (id) {
      enterClassMenu({ id });
    }
    return () => {
      exitClassMenu();
    };
  }, [id, enterClassMenu, exitClassMenu]);

  // Enter class menu mode when component mounts
  useEffect(() => {
    if (classData) {
      enterClassMenu({
        id: classData.id,
        name: classData.name,
        description: classData.name
      });
    }
    
    // Cleanup function to exit class menu mode when leaving
    return () => {
      exitClassMenu();
    };
  }, [classData, enterClassMenu, exitClassMenu]);

  // Calculate duration
  const calculateDuration = () => {
    if (!classData?.startDate || !classData?.endDate) return null;
    try {
      const start = new Date(classData.startDate.split('/').reverse().join('-'));
      const end = new Date(classData.endDate.split('/').reverse().join('-'));
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const months = Math.floor(diffDays / 30);
      return months > 0 ? `Approximately ${months} months` : `Approximately ${diffDays} days`;
    } catch (e) {
      return null;
    }
  };

  if (loading) {
    return (
      <LayoutComponent>
        <div className={`co-wrapper co-wrapper-${theme}`}>
          <div className="co-container">
            <LoadingWithEffect loading={true} message={t('classDetail.loadingClassInfo')} />
          </div>
        </div>
      </LayoutComponent>
    );
  }

  return (
    <LayoutComponent>
      <div className={`co-wrapper co-wrapper-${theme}`}>
        <div className="co-container">
          {/* Page Title */}
          <div className="co-page-title-wrapper">
            <Typography.Title level={1} className="co-page-title">
              {t('classMenu.overview')}
            </Typography.Title>
          </div>

          {/* Cards Grid */}
          <div className="co-cards-grid">
            {/* Class Information Card */}
            <div className={`co-card co-card-class-info co-card-${theme}`}>
              <div className="co-card-header co-card-header-blue">
                <BookOutlined className="co-card-header-icon" />
                <h3 className="co-card-header-title">{t('classOverview.classInformation')}</h3>
              </div>
              <div className="co-card-body">
                <div className="co-info-row">
                  <span className="co-info-label">{t('classOverview.className')}</span>
                  <span className="co-info-value">{classData?.name || '-'}</span>
                </div>
                <div className="co-info-row">
                  <span className="co-info-label">{t('classOverview.classCode')}</span>
                  <span className="co-info-value">{classData?.classCode || '-'}</span>
                </div>
                <div className="co-info-row">
                  <span className="co-info-label">{t('classOverview.status')}</span>
                  <span className="co-info-value">{classData?.status || '-'}</span>
                </div>
                <div className="co-info-row">
                  <span className="co-info-label">{t('classOverview.syllabus')}</span>
                  <span className="co-info-value">{classData?.syllabus || '-'}</span>
                </div>
                <div className="co-info-row">
                  <span className="co-info-label">{t('classOverview.level')}</span>
                  <span className="co-info-value">{classData?.level || '-'}</span>
                </div>
              </div>
            </div>

            {/* Schedule Card */}
            <div className={`co-card co-card-schedule co-card-${theme}`}>
              <div className="co-card-header co-card-header-orange">
                <CalendarOutlined className="co-card-header-icon" />
                <h3 className="co-card-header-title">{t('classOverview.schedule')}</h3>
              </div>
              <div className="co-card-body">
                <div className="co-schedule-timeline">
                  <div className="co-schedule-date-item">
                    <CalendarOutlined className="co-schedule-icon" />
                    <div>
                      <span className="co-schedule-label">{t('classOverview.startDateLabel')}</span>
                      <span className="co-schedule-value">{classData?.startDate || '-'}</span>
                    </div>
                  </div>
                  <div className="co-timeline-connector">
                    <div className="co-timeline-dot"></div>
                    <div className="co-timeline-line"></div>
                    <div className="co-timeline-dot"></div>
                  </div>
                  <div className="co-schedule-date-item">
                    <CalendarOutlined className="co-schedule-icon" />
                    <div>
                      <span className="co-schedule-label">{t('classOverview.endDateLabel')}</span>
                      <span className="co-schedule-value">{classData?.endDate || '-'}</span>
                    </div>
                  </div>
                </div>
                {calculateDuration() && (
                  <div className="co-duration-info">
                    <span className="co-duration-text">{calculateDuration()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Teachers Card */}
            <div className={`co-card co-card-teacher co-card-${theme}`}>
              <div className="co-card-header co-card-header-purple">
                <UserOutlined className="co-card-header-icon" />
                <h3 className="co-card-header-title">{t('classOverview.teachers')}</h3>
              </div>
              <div className="co-card-body">
                {classData?.teachers ? (
                  <>
                    <div className="co-info-row">
                      <span className="co-info-label">{t('classOverview.teacher')}</span>
                      <span className="co-info-value">{classData.teachers.fullName || '-'}</span>
                    </div>
                    <div className="co-info-row">
                      <span className="co-info-label">Email</span>
                      <span className="co-info-static">
                        <MailOutlined /> {classData.teachers.email || '-'}
                      </span>
                    </div>
                    <div className="co-info-row">
                      <span className="co-info-label">Phone</span>
                      <span className="co-info-static">
                        <PhoneOutlined /> {classData.teachers.phone || '-'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="co-empty-state">
                    <UserOutlined className="co-empty-icon" />
                    <span className="co-empty-text">No teacher assigned</span>
                  </div>
                )}
              </div>
            </div>

            {/* Teaching Assistants Card */}
            <div className={`co-card co-card-assistants co-card-${theme}`}>
              <div className="co-card-header co-card-header-green">
                <TeamOutlined className="co-card-header-icon" />
                <h3 className="co-card-header-title">{t('classOverview.teachingAssistants')}</h3>
              </div>
              <div className="co-card-body">
                {classData?.teachingAssistants && classData.teachingAssistants.length > 0 ? (
                  <div className="co-assistants-list">
                    {classData.teachingAssistants.map((assistant, index) => (
                      <div key={assistant.id || index} className="co-assistant-card">
                        <div className="co-assistant-name">{assistant.fullName || '-'}</div>
                        <div className="co-assistant-contact">
                          <span className="co-info-static">
                            <MailOutlined /> {assistant.email || '-'}
                          </span>
                          <span className="co-info-static">
                            <PhoneOutlined /> {assistant.phone || '-'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="co-empty-state">
                    <TeamOutlined className="co-empty-icon" />
                    <span className="co-empty-text">No teaching assistants assigned</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutComponent>
  );
};

export default ClassOverview;
