import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Typography,
  Input,
  Pagination,
  DatePicker,
  Button,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
} from "@ant-design/icons";
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

// Helper function to get activity type color
const getActivityTypeColor = (actionType) => {
  switch (actionType) {
    case 'CREATE_STUDENT':
    case 'ADD_STUDENT':
      return '#10b981'; // green
    case 'CREATE_CHAPTER':
    case 'CREATE_LESSON':
    case 'ADD_LESSON':
      return '#3b82f6'; // blue
    case 'CREATE_TEACHER':
    case 'ADD_TEACHER':
      return '#8b5cf6'; // purple
    case 'UPDATE_CLASS':
    case 'UPDATE_STUDENT':
    case 'UPDATE_TEACHER':
      return '#f59e0b'; // amber
    case 'DELETE_STUDENT':
    case 'DELETE_TEACHER':
    case 'DELETE_CHAPTER':
    case 'DELETE_LESSON':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
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
  const [searchText, setSearchText] = useState("");
  
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
  const [filterDropdown, setFilterDropdown] = useState({
    visible: false,
    startDate: null,
    endDate: null,
  });
  const filterContainerRef = useRef(null);

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
      console.log('🔍 Class History API Response:', response);

      const payload = response?.data ?? response;
      let activitiesData = [];
      let totalElementsFromPayload = 0;

      if (payload) {
        if (Array.isArray(payload?.data)) {
          activitiesData = payload.data;
          totalElementsFromPayload = payload.totalElements ?? payload.total ?? payload.data.length;
        } else if (payload?.data && Array.isArray(payload.data?.content)) {
          activitiesData = payload.data.content;
          totalElementsFromPayload = payload.data.totalElements ?? payload.data.total ?? activitiesData.length;
        } else if (Array.isArray(payload?.content)) {
          activitiesData = payload.content;
          totalElementsFromPayload = payload.totalElements ?? payload.total ?? activitiesData.length;
        } else if (Array.isArray(payload)) {
          activitiesData = payload;
          totalElementsFromPayload = payload.length;
        }
      }

      const totalElements = totalElementsFromPayload || payload?.totalElements || payload?.total || activitiesData.length;

      setActivities(activitiesData);
      // Only update total to avoid triggering another fetch loop
      setPagination(prev => {
        if (prev.total === totalElements) return prev;
        return { ...prev, total: totalElements };
      });
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

  // Handle filter changes
  const handleFilterToggle = () => {
    setFilterDropdown(prev => ({
      ...prev,
      visible: !prev.visible,
      startDate: !prev.visible ? filters.startDate : prev.startDate,
      endDate: !prev.visible ? filters.endDate : prev.endDate,
    }));
  };

  const handleFilterDraftChange = (key, value) => {
    setFilterDropdown(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleFilterReset = () => {
    setFilterDropdown(prev => ({
      ...prev,
      startDate: null,
      endDate: null,
    }));
  };

  const handleFilterSubmit = () => {
    setFilters(prev => ({
      ...prev,
      startDate: filterDropdown.startDate,
      endDate: filterDropdown.endDate,
    }));
    setPagination(prev => ({
      ...prev,
      current: 1,
    }));
    setFilterDropdown(prev => ({
      ...prev,
      visible: false,
    }));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdown.visible && filterContainerRef.current && !filterContainerRef.current.contains(event.target)) {
        setFilterDropdown(prev => ({
          ...prev,
          visible: false,
        }));
      }
    };

    if (filterDropdown.visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filterDropdown.visible]);

  // Clear all filters
  // Filter activities based on search text
  const filteredActivities = activities.filter(activity => 
    (activity.actionByFullName && activity.actionByFullName.toLowerCase().includes(searchText.toLowerCase())) ||
    (activity.actionByUsername && String(activity.actionByUsername).toLowerCase().includes(searchText.toLowerCase())) ||
    (activity.actionByEmailPrefix && String(activity.actionByEmailPrefix).toLowerCase().includes(searchText.toLowerCase())) ||
    (activity.actionDetails && activity.actionDetails.toLowerCase().includes(searchText.toLowerCase())) ||
    (activity.actionType && activity.actionType.toLowerCase().includes(searchText.toLowerCase()))
  );

  // Debug logs
  console.log('🔍 Current pagination state:', pagination);
  console.log('🔍 Activities count:', activities.length);
  console.log('🔍 Filtered activities count:', filteredActivities.length);





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

        {/* Search and Filter Section */}
        <div className="search-section" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
          <Input
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className={`search-input ${theme}-search-input`}
            style={{ minWidth: '250px', maxWidth: '400px', width: '350px', height: '40px', fontSize: '16px' }}
            allowClear
            placeholder={t('classActivities.searchPlaceholder')}
          />
          <div ref={filterContainerRef} style={{ position: 'relative' }}>
            <Button
              icon={<FilterOutlined />}
              onClick={handleFilterToggle}
              className={`filter-button ${theme}-filter-button ${filterDropdown.visible ? 'active' : ''}`}
              style={{
                height: '40px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {t('classActivities.filter', { defaultValue: 'Filter' })}
            </Button>

            {filterDropdown.visible && (
              <div
                className={`filter-dropdown-panel ${theme}-filter-dropdown`}
                style={{
                  position: 'absolute',
                  top: '48px',
                  left: 0,
                  zIndex: 100,
                  background: theme === 'dark' ? '#1f2937' : '#ffffff',
                  border: '1px solid #d9d9d9',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.15)',
                  minWidth: '320px',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span className="filter-text" style={{ fontWeight: 600 }}>
                      {t('classActivities.startDate', { defaultValue: 'Start date' })}
                    </span>
                    <DatePicker
                      value={filterDropdown.startDate}
                      onChange={(date) => handleFilterDraftChange('startDate', date)}
                      placeholder={t('classActivities.selectStartDate', { defaultValue: 'Select start date' })}
                      format="YYYY-MM-DD"
                      allowClear
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span className="filter-text" style={{ fontWeight: 600 }}>
                      {t('classActivities.endDate', { defaultValue: 'End date' })}
                    </span>
                    <DatePicker
                      value={filterDropdown.endDate}
                      onChange={(date) => handleFilterDraftChange('endDate', date)}
                      placeholder={t('classActivities.selectEndDate', { defaultValue: 'Select end date' })}
                      format="YYYY-MM-DD"
                      allowClear
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '24px',
                    borderTop: '1px solid #f0f0f0',
                    paddingTop: '16px',
                  }}
                >
                  <Button
                    onClick={handleFilterReset}
                    className={`filter-reset-button ${theme}-filter-reset-button`}
                    style={{
                      height: '32px',
                      fontWeight: '500',
                      fontSize: '16px',
                      padding: '4px 15px',
                      width: '100px',
                    }}
                  >
                    {t('classActivities.reset', { defaultValue: 'Reset' })}
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleFilterSubmit}
                    className={`filter-submit-button ${theme}-filter-submit-button`}
                    style={{
                      background:
                        theme === 'sun'
                          ? 'rgb(113, 179, 253)'
                          : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
                      borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
                      color: theme === 'sun' ? '#000' : '#fff',
                      borderRadius: '6px',
                      height: '32px',
                      fontWeight: '500',
                      fontSize: '16px',
                      padding: '4px 15px',
                      width: '120px',
                      transition: 'all 0.3s ease',
                      boxShadow: 'none',
                    }}
                  >
                    {t('classActivities.apply', { defaultValue: 'Apply' })}
                  </Button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Activities Timeline Section */}
        <div className={`timeline-section ${theme}-timeline-section`}>
          <LoadingWithEffect loading={loading} message={t('classActivities.loadingActivities')}>
            <div style={{ 
              maxHeight: '600px', 
              overflowY: 'auto',
              padding: '20px 0'
            }}>
              {filteredActivities.map((activity, index) => (
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
                  {index < filteredActivities.length - 1 && (
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
                      backgroundColor: getActivityTypeColor(activity.actionType),
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
                        {activity.actionByFullName || activity.actionByUsername || activity.actionByEmailPrefix || 'Unknown User'}
                      </span>
                      <span style={{ 
                        fontSize: '14px', 
                        color: '#586069'
                      }}>
                        {activity.actionDetails || 'No details available'}
                      </span>
                    </div>
                    
                    {(activity.actionByUsername || activity.actionByEmailPrefix) && (
                      <div
                        title={`${activity.actionByUsername || ''}${activity.actionByUsername && activity.actionByEmailPrefix ? ' • ' : ''}${activity.actionByEmailPrefix || ''}`}
                        style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px'
                        }}
                      >
                        {activity.actionByUsername && (
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: '#eef2ff',
                            color: '#3730a3',
                            fontWeight: 500
                          }}>
                            {activity.actionByUsername}
                          </span>
                        )}
                        {activity.actionByEmailPrefix && (
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: '#f1f5f9',
                            color: '#334155'
                          }}>
                            {activity.actionByEmailPrefix}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#8b949e',
                      marginLeft: '0'
                    }}>
                      {formatTimestamp(activity.actionAt)}
                    </div>
                    
                    {/* Action Type Badge */}
                    <div style={{ 
                      marginTop: '4px',
                      display: 'inline-block'
                    }}>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: getActivityTypeColor(activity.actionType),
                        color: 'white',
                        fontWeight: '500'
                      }}>
                        {activity.actionType || 'UNKNOWN'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredActivities.length === 0 && (
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
        {console.log('🔍 Pagination render check - total:', pagination.total, 'should show:', pagination.total > 0)}
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
