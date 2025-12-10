import React, { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Pagination,
  DatePicker,
} from "antd";
import ThemedLayoutWithSidebar from "../../../../component/ThemedLayout";
import ThemedLayoutNoSidebar from "../../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./ClassActivities.css";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useClassMenu } from "../../../../contexts/ClassMenuContext";
import usePageTitle from "../../../../hooks/usePageTitle";
import classManagementApi from "../../../../apis/backend/classManagement";

// Helper function to format timestamp
const formatTimestamp = (timestamp) => {
  try {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return timestamp;
  }
};

// Helper function to get a brighter color palette per activity type
const getActivityColorPalette = (actionType) => {
  const palette = {
    CREATE_STUDENT: { primary: '#0ea5e9', soft: 'rgba(14, 165, 233, 0.15)' },
    ADD_STUDENT: { primary: '#0ea5e9', soft: 'rgba(14, 165, 233, 0.15)' },
    CREATE_CHAPTER: { primary: '#6366f1', soft: 'rgba(99, 102, 241, 0.16)' },
    CREATE_LESSON: { primary: '#6366f1', soft: 'rgba(99, 102, 241, 0.16)' },
    ADD_LESSON: { primary: '#6366f1', soft: 'rgba(99, 102, 241, 0.16)' },
    CREATE_TEACHER: { primary: '#ec4899', soft: 'rgba(236, 72, 153, 0.16)' },
    ADD_TEACHER: { primary: '#ec4899', soft: 'rgba(236, 72, 153, 0.16)' },
    UPDATE_CLASS: { primary: '#f97316', soft: 'rgba(249, 115, 22, 0.18)' },
    UPDATE_STUDENT: { primary: '#f97316', soft: 'rgba(249, 115, 22, 0.18)' },
    UPDATE_TEACHER: { primary: '#f97316', soft: 'rgba(249, 115, 22, 0.18)' },
    DELETE_STUDENT: { primary: '#ef4444', soft: 'rgba(239, 68, 68, 0.18)' },
    DELETE_TEACHER: { primary: '#ef4444', soft: 'rgba(239, 68, 68, 0.18)' },
    DELETE_CHAPTER: { primary: '#ef4444', soft: 'rgba(239, 68, 68, 0.18)' },
    DELETE_LESSON: { primary: '#ef4444', soft: 'rgba(239, 68, 68, 0.18)' },
  };

  return palette[actionType] ?? { primary: '#14b8a6', soft: 'rgba(20, 184, 166, 0.16)' };
};

const ClassActivities = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { theme } = useTheme();
  const { user } = useSelector((state) => state.auth);
  const { enterClassMenu, exitClassMenu } = useClassMenu();
  
  // Determine which layout to use based on user role
  const userRole = user?.role?.toLowerCase();
  const ThemedLayout = (userRole === 'teacher' || userRole === 'teaching_assistant') 
    ? ThemedLayoutNoSidebar 
    : ThemedLayoutWithSidebar;
  
  // Set page title
  usePageTitle('Class Activities');
  
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [classData, setClassData] = useState(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const { current: paginationCurrent, pageSize: paginationPageSize } = pagination;
  
  // Filter state
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
  });

  const fetchClassData = useCallback(async () => {
    try {
      const response = await classManagementApi.getClassDetail(id);
      // Normalize different possible response shapes
      const data =
        response?.data?.data ??
        response?.data ??
        response?.class ??
        null;
      if (data) {
        const mapped = {
          id: data.id ?? id,
          name:
            data.name ??
            data.className ??
            data.classname ??
            data.class_name ??
            data.title ??
            data.classTitle ??
            '',
        };
        setClassData(mapped);
      }
    } catch (error) {
      console.error('Error fetching class data:', error);
      spaceToast.error(t('classActivities.loadingClassInfo'));
    }
  }, [id, t]);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const apiParams = {
        page: paginationCurrent - 1,
        size: paginationPageSize,
        sortBy: 'actionAt',
        sortDir: 'desc',
        startDate: filters.startDate ? filters.startDate.startOf('day').toISOString() : undefined,
        endDate: filters.endDate ? filters.endDate.endOf('day').toISOString() : undefined,
      };

      const response = await classManagementApi.getClassHistory(id, apiParams);
      // Response structure from API: { data: [...], totalElements: 39, totalPages: 4, ... }
      // Axios response: response = { data: { data: [...], totalElements: 39, totalPages: 4, ... } }
      let activitiesData = [];
      let totalElements = 0;
      const responseData = response?.data ?? response;

      // Check response structure
      if (responseData) {
        // Case 1: responseData.data is array (most common case)
        // Structure: { data: [...], totalElements: 39, totalPages: 4, ... }
        // totalElements is at responseData level (same level as data array)
        if (Array.isArray(responseData.data)) {
          activitiesData = responseData.data;
          totalElements = responseData.totalElements ?? responseData.total ?? 0;
        }
        // Case 2: responseData itself is array (unwrapped)
        // Structure: response.data = [...]
        // totalElements might be at response level
        else if (Array.isArray(responseData)) {
          activitiesData = responseData;
          // Try to get totalElements from response object (one level up)
          totalElements = response?.totalElements ?? response?.total ?? responseData.length;
        }
        // Case 3: Nested structure with content array (Spring Page format)
        else if (responseData.data && Array.isArray(responseData.data.content)) {
          activitiesData = responseData.data.content;
          totalElements = responseData.data.totalElements ?? responseData.data.total ?? 0;
        }
        // Case 4: content array at root
        else if (Array.isArray(responseData.content)) {
          activitiesData = responseData.content;
          totalElements = responseData.totalElements ?? responseData.total ?? 0;
        }
      }

      // Fallback: if totalElements is still 0 or not found, check response object directly
      if ((!totalElements || totalElements === 0) && response) {
        totalElements = response.totalElements ?? response.total ?? 0;
      }

      setActivities(activitiesData);
      // Update pagination with total from API
      setPagination(prev => ({
        ...prev,
        total: totalElements,
      }));
    } catch (error) {
      console.error('Error fetching class history:', error);
      spaceToast.error(t('classActivities.loadingActivities'));
      setActivities([]);
      setPagination(prev => ({
        ...prev,
        total: 0
      }));
    } finally {
      setLoading(false);
    }
  }, [
    id,
    t,
    paginationCurrent,
    paginationPageSize,
    filters.startDate,
    filters.endDate,
  ]);

  // Initial data loading
  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Ensure header back button appears immediately while class info loads
  useEffect(() => {
    if (id) {
      enterClassMenu({ id });
    }
    return () => {
      exitClassMenu();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classData?.id, classData?.name]);

  // Handle pagination change
  const handlePaginationChange = (page, pageSize) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize: pageSize || prev.pageSize,
    }));
  };

  // Handle date filter changes
  const handleDateChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setPagination(prev => ({
      ...prev,
      current: 1,
    }));
  };

  // Use activities directly from API
  const displayedActivities = activities;





  // Remove the loading check here since we'll show loading only for activities

  return (
    <ThemedLayout>
      {/* Main Content Panel */}
      <div className={`main-content-panel ${theme}-main-panel`}>
        {/* Page Title */}
        <div className="page-title-container">
            <Typography.Title 
              level={1} 
              className="page-title"
            >
              {t('classActivities.title')} <span className="student-count">({pagination.total})</span>
            </Typography.Title>
        </div>

        {/* Date Filter Section */}
        <div className="date-filter-section" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span className="filter-text" style={{ fontWeight: 600, fontSize: '14px' }}>
              {t('classActivities.startDate', { defaultValue: 'Start date' })}
            </span>
            <DatePicker
              value={filters.startDate}
              onChange={(date) => handleDateChange('startDate', date)}
              placeholder={t('classActivities.selectStartDate', { defaultValue: 'Select start date' })}
              format="YYYY-MM-DD"
              allowClear
              style={{ height: '40px', width: '200px' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span className="filter-text" style={{ fontWeight: 600, fontSize: '14px' }}>
              {t('classActivities.endDate', { defaultValue: 'End date' })}
            </span>
            <DatePicker
              value={filters.endDate}
              onChange={(date) => handleDateChange('endDate', date)}
              placeholder={t('classActivities.selectEndDate', { defaultValue: 'Select end date' })}
              format="YYYY-MM-DD"
              allowClear
              style={{ height: '40px', width: '200px' }}
            />
          </div>
        </div>

        {/* Activities Timeline Section */}
        <div className={`timeline-section ${theme}-timeline-section`}>
          <LoadingWithEffect loading={loading} message={t('classActivities.loadingActivities')}>
            <div style={{ 
              maxHeight: '600px', 
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '20px 0',
              paddingRight: '12px'
            }}
            className="activity-timeline-scroll"
            >
              {displayedActivities.map((activity, index) => (
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
                  {index < displayedActivities.length - 1 && (
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
                  {(() => {
                    const palette = getActivityColorPalette(activity.actionType);
                    return (
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: palette.primary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '20px',
                          flexShrink: 0,
                          zIndex: 1,
                          boxShadow: '0 8px 18px rgba(15, 23, 42, 0.18)',
                        }}
                      >
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: '#ffffff',
                          }}
                        />
                      </div>
                    );
                  })()}
                  
                  {/* Activity content */}
                  <div style={{ flex: 1, minWidth: 0, paddingLeft: '8px' }}>
                    {(() => {
                      const palette = getActivityColorPalette(activity.actionType);
                      return (
                        <>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            marginBottom: '6px'
                          }}>
                            <span style={{ 
                              fontSize: '15px', 
                              fontWeight: '600',
                              color: '#0f172a'
                            }}>
                              {activity.actionByFullName || activity.actionByUsername || activity.actionByEmailPrefix || 'Unknown User'}
                            </span>
                            <span style={{ 
                              fontSize: '14px', 
                              color: '#334155'
                            }}>
                              {activity.actionDetails || 'No details available'}
                            </span>
                          </div>
                          
                          {(activity.actionByUsername || activity.actionByEmailPrefix) && (
                            <div
                              title={`${activity.actionByUsername || ''}${activity.actionByUsername && activity.actionByEmailPrefix ? ' • ' : ''}${activity.actionByEmailPrefix || ''}`}
                              style={{
                                fontSize: '12px',
                                color: '#475569',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '6px'
                              }}
                            >
                              {activity.actionByUsername && (
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: '999px',
                                  background: 'rgba(59, 130, 246, 0.14)',
                                  color: '#1d4ed8',
                                  fontWeight: 500
                                }}>
                                  {activity.actionByUsername}
                                </span>
                              )}
                              {activity.actionByEmailPrefix && (
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: '999px',
                                  background: 'rgba(15, 23, 42, 0.07)',
                                  color: '#0f172a'
                                }}>
                                  {activity.actionByEmailPrefix}
                                </span>
                              )}
                            </div>
                          )}
                          
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#475569',
                            marginLeft: '0'
                          }}>
                            {formatTimestamp(activity.actionAt)}
                          </div>
                          
                          {/* Action Type Badge */}
                          <div style={{ 
                            marginTop: '8px',
                            display: 'inline-flex'
                          }}>
                            <span style={{
                              fontSize: '11px',
                              padding: '4px 12px',
                              borderRadius: '999px',
                              backgroundColor: palette.soft,
                              color: palette.primary,
                              fontWeight: 600,
                              letterSpacing: '0.02em'
                            }}>
                              {t(`classActivities.actionTypes.${activity.actionType}`, activity.actionType || 'UNKNOWN')}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              ))}
              
              {displayedActivities.length === 0 && (
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

        {/* Pagination Controls - Outside timeline section */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          marginTop: '24px',
          padding: '16px 0'
        }}>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={handlePaginationChange}
            onShowSizeChange={handlePaginationChange}
            showSizeChanger={true}
            showQuickJumper={true}
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} of ${total} ${t('classActivities.activities')}`
            }
            pageSizeOptions={['10', '20', '50', '100']}
            className={`${theme}-pagination`}
          />
        </div>
      </div>
    </ThemedLayout>
  );
};

export default ClassActivities;
