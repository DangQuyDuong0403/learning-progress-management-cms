import React, { useState, useEffect, useCallback } from "react";
import { Button, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import ThemedLayout from "../../../../component/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./ClassOverview.css";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useClassMenu } from "../../../../contexts/ClassMenuContext";
import classManagementApi from "../../../../apis/backend/classManagement";
import usePageTitle from "../../../../hooks/usePageTitle";

const ClassOverview = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { enterClassMenu, exitClassMenu } = useClassMenu();
  
  // Set page title
  usePageTitle('Class Overview');
  
  const [loading, setLoading] = useState(false);
  const [classData, setClassData] = useState(null);
  const [dataCount, setDataCount] = useState(0);

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
          level: data.level ?? '-'
        };
        setClassData(mapped);
        
        // Count available data items
        let count = 0;
        if (mapped.name && mapped.name !== '-') count++;
        if (mapped.classCode && mapped.classCode !== '-') count++;
        if (mapped.status && mapped.status !== '-') count++;
        if (mapped.syllabus && mapped.syllabus !== '-') count++;
        if (mapped.level && mapped.level !== '-') count++;
        if (mapped.teachers) count++;
        if (mapped.teachingAssistants && mapped.teachingAssistants.length > 0) count++;
        if (mapped.startDate && mapped.startDate !== '-') count++;
        if (mapped.endDate && mapped.endDate !== '-') count++;
        setDataCount(count);
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
  }, [id]);

  // Ensure header back button appears immediately while class info loads
  useEffect(() => {
    if (id) {
      enterClassMenu({ id });
    }
    return () => {
      exitClassMenu();
    };
  }, [id]);

  // Enter class menu mode when component mounts
  useEffect(() => {
    if (classData) {
      enterClassMenu({
        id: classData.id,
        name: classData.name,
        description: t('classMenu.overviewDescription')
      });
    }
    
    // Cleanup function to exit class menu mode when leaving
    return () => {
      exitClassMenu();
    };
  }, [classData?.id, classData?.name]);

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <ThemedLayout>
        <div className={`class-overview ${theme}-class-overview`}>
          <div className="overview-container">
            <LoadingWithEffect loading={true} message={t('classDetail.loadingClassInfo')} />
          </div>
        </div>
      </ThemedLayout>
    );
  }

  return (
    <ThemedLayout>
      <div className={`class-overview ${theme}-class-overview`}>
        <div className="overview-container">
          {/* Page Title */}
          <div className="page-title-container">
            <Typography.Title 
              level={1} 
              className="page-title"
            >
              {t('classMenu.overview')} <span className="student-count">({dataCount})</span>
            </Typography.Title>
          </div>

          {/* Main Container */}
          <div className={`overview-main-container ${theme}-overview-main-container`}>

            {/* Overview Content */}
            <div className={`overview-content ${theme}-overview-content`}>
          {/* Class Information Section */}
          <div className={`info-section ${theme}-info-section`}>
            <h2 className={`section-title ${theme}-section-title`}>
              {t('classOverview.classInformation')}
            </h2>
            <div className={`section-content ${theme}-section-content`}>
              <div className="info-text">
                <span className="info-label">{t('classOverview.className')}:</span>
                <span className="info-value">{classData?.name}</span>
              </div>
              <div className="info-text">
                <span className="info-label">{t('classOverview.classCode')}:</span>
                <span className="info-value">{classData?.classCode}</span>
              </div>
              <div className="info-text">
                <span className="info-label">{t('classOverview.status')}:</span>
                <span className="info-value">{classData?.status}</span>
              </div>
              <div className="info-text">
                <span className="info-label">{t('classOverview.syllabus')}:</span>
                <span className="info-value">{classData?.syllabus}</span>
              </div>
              <div className="info-text">
                <span className="info-label">{t('classOverview.level')}:</span>
                <span className="info-value">{classData?.level}</span>
              </div>
            </div>
          </div>

          {/* Teachers Section */}
          <div className={`info-section ${theme}-info-section`}>
            <h2 className={`section-title ${theme}-section-title`}>
              {t('classOverview.teachers')}
            </h2>
            <div className={`section-content ${theme}-section-content`}>
              <div className="info-text">
                <span className="info-label">{t('classOverview.teacher')}:</span>
                <span className="info-value">{classData?.teachers ? 'Available' : '-'}</span>
              </div>
              <div className="info-text">
                <span className="info-label">{t('classOverview.teachingAssistants')}:</span>
                <span className="info-value">{classData?.teachingAssistants?.length > 0 ? `${classData.teachingAssistants.length} assistant(s)` : '-'}</span>
              </div>
            </div>
          </div>

          {/* Schedule Section */}
          <div className={`info-section ${theme}-info-section`}>
            <h2 className={`section-title ${theme}-section-title`}>
              {t('classOverview.schedule')}
            </h2>
            <div className={`section-content ${theme}-section-content`}>
              <div className="info-text">
                <span className="info-label">{t('classOverview.startDateLabel')}:</span>
                <span className="info-value">{classData?.startDate}</span>
              </div>
              <div className="info-text">
                <span className="info-label">{t('classOverview.endDateLabel')}:</span>
                <span className="info-value">{classData?.endDate}</span>
              </div>
            </div>
          </div>
           </div>
          </div>
        </div>
      </div>
    </ThemedLayout>
  );
};

export default ClassOverview;
