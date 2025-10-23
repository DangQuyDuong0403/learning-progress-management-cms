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
        description: classData.name
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
          {/* Main Container */}
          <div className={`overview-main-container ${theme}-overview-main-container`}>
            {/* Page Title */}
            <div className="page-title-container">
              <Typography.Title 
                level={1} 
                className="page-title"
              >
                {t('classMenu.overview')}
              </Typography.Title>
            </div>

            {/* Overview Content */}
            <div className={`overview-content ${theme}-overview-content`}>
          {/* Class Information Section */}
          <div className={`info-section ${theme}-info-section`}>
            <div className={`section-content ${theme}-section-content`}>
              <h2 className={`section-title ${theme}-section-title`}>
                {t('classOverview.classInformation')}
              </h2>
              <div className={`personal-info-grid-new ${theme}-personal-info-grid-new`}>
                <div className={`info-item-new ${theme}-info-item-new`}>
                  <span className={`info-label-new ${theme}-info-label-new`}>{t('classOverview.className')}</span>
                  <span className={`info-value-new ${theme}-info-value-new`}>{classData?.name}</span>
                </div>
                <div className={`info-item-new ${theme}-info-item-new`}>
                  <span className={`info-label-new ${theme}-info-label-new`}>{t('classOverview.classCode')}</span>
                  <span className={`info-value-new ${theme}-info-value-new`}>{classData?.classCode}</span>
                </div>
                <div className={`info-item-new ${theme}-info-item-new`}>
                  <span className={`info-label-new ${theme}-info-label-new`}>{t('classOverview.status')}</span>
                  <span className={`info-value-new ${theme}-info-value-new`}>{classData?.status}</span>
                </div>
                <div className={`info-item-new ${theme}-info-item-new`}>
                  <span className={`info-label-new ${theme}-info-label-new`}>{t('classOverview.syllabus')}</span>
                  <span className={`info-value-new ${theme}-info-value-new`}>{classData?.syllabus}</span>
                </div>
                <div className={`info-item-new ${theme}-info-item-new`}>
                  <span className={`info-label-new ${theme}-info-label-new`}>{t('classOverview.level')}</span>
                  <span className={`info-value-new ${theme}-info-value-new`}>{classData?.level}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Teachers Section */}
          <div className={`info-section ${theme}-info-section`}>
            <div className={`section-content ${theme}-section-content`}>
              <h2 className={`section-title ${theme}-section-title`}>
                {t('classOverview.teachers')}
              </h2>
              <div className={`personal-info-grid-new ${theme}-personal-info-grid-new`}>
                <div className={`info-item-new ${theme}-info-item-new`}>
                  <span className={`info-label-new ${theme}-info-label-new`}>{t('classOverview.teacher')}</span>
                  <span className={`info-value-new ${theme}-info-value-new`}>{classData?.teachers ? 'Available' : '-'}</span>
                </div>
                <div className={`info-item-new ${theme}-info-item-new`}>
                  <span className={`info-label-new ${theme}-info-label-new`}>{t('classOverview.teachingAssistants')}</span>
                  <span className={`info-value-new ${theme}-info-value-new`}>{classData?.teachingAssistants?.length > 0 ? `${classData.teachingAssistants.length} assistant(s)` : '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Section */}
          <div className={`info-section ${theme}-info-section`}>
            <div className={`section-content ${theme}-section-content`}>
              <h2 className={`section-title ${theme}-section-title`}>
                {t('classOverview.schedule')}
              </h2>
              <div className={`personal-info-grid-new ${theme}-personal-info-grid-new`}>
                <div className={`info-item-new ${theme}-info-item-new`}>
                  <span className={`info-label-new ${theme}-info-label-new`}>{t('classOverview.startDateLabel')}</span>
                  <span className={`info-value-new ${theme}-info-value-new`}>{classData?.startDate}</span>
                </div>
                <div className={`info-item-new ${theme}-info-item-new`}>
                  <span className={`info-label-new ${theme}-info-label-new`}>{t('classOverview.endDateLabel')}</span>
                  <span className={`info-value-new ${theme}-info-value-new`}>{classData?.endDate}</span>
                </div>
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
