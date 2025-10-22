import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Space,
  Typography,
  Input,
  Select,
  Pagination,
} from "antd";
import {
  SearchOutlined,
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
  
  // Sort state
  const [sortConfig, setSortConfig] = useState({
    sortBy: 'actionAt',
    sortDir: 'desc',
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

  const fetchActivities = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const apiParams = {
        page: params.page !== undefined ? params.page : pagination.current - 1,
        size: params.size !== undefined ? params.size : pagination.pageSize,
        sortBy: params.sortBy !== undefined ? params.sortBy : sortConfig.sortBy,
        sortDir: params.sortDir !== undefined ? params.sortDir : sortConfig.sortDir
      };
      
      const response = await classManagementApi.getClassActivities(id, apiParams);
      console.log('🔍 API Response:', response);
      console.log('🔍 Response total:', response?.total);
      console.log('🔍 Response data length:', response?.data?.length);
      
      // Check if response is successful
      if (response && response.success) {
        // Handle different response structures
        let activitiesData = [];
        if (response.data && Array.isArray(response.data)) {
          activitiesData = response.data;
        } else if (Array.isArray(response)) {
          activitiesData = response;
        }
        
        console.log('🔍 Activities data:', activitiesData);
        setActivities(activitiesData);
        
        // Update pagination if available
        if (response.total !== undefined) {
          console.log('🔍 Setting total to:', response.total);
          setPagination(prev => ({
            ...prev,
            total: response.total
          }));
        } else {
          console.log('🔍 No total in response, setting total to activities length:', activitiesData.length);
          setPagination(prev => ({
            ...prev,
            total: activitiesData.length
          }));
        }
      } else {
        spaceToast.error(t('classActivities.loadingActivities'));
        setActivities([]);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      spaceToast.error(t('classActivities.loadingActivities'));
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  // Initial data loading
  useEffect(() => {
    fetchClassData();
    fetchActivities();
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
        description: t('classActivities.title')
      });
    }
    
    // Cleanup function to exit class menu mode when leaving
    return () => {
      exitClassMenu();
    };
  }, [classData?.id, classData?.name]);

  // Handle pagination and sort changes
  useEffect(() => {
    if (pagination.current > 1 || sortConfig.sortBy !== 'actionAt' || sortConfig.sortDir !== 'desc') {
      fetchActivities({
        page: pagination.current - 1,
        size: pagination.pageSize,
        sortBy: sortConfig.sortBy,
        sortDir: sortConfig.sortDir
      });
    }
  }, [pagination.current, pagination.pageSize, sortConfig.sortBy, sortConfig.sortDir]);

  // Handle pagination change
  const handlePaginationChange = (page, pageSize) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize: pageSize || prev.pageSize,
    }));
  };

  // Handle sort change
  const handleSortChange = (sortBy, sortDir) => {
    setSortConfig({
      sortBy,
      sortDir,
    });
    // Reset to first page when sorting changes
    setPagination(prev => ({
      ...prev,
      current: 1,
    }));
  };

  // Filter activities based on search text
  const filteredActivities = activities.filter(activity => 
    (activity.actionByFullName && activity.actionByFullName.toLowerCase().includes(searchText.toLowerCase())) ||
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
              Activities <span className="student-count">({pagination.total})</span>
            </Typography.Title>
        </div>

        {/* Search and Sort Section */}
        <div className="search-section" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
          <Input
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className={`search-input ${theme}-search-input`}
            style={{ minWidth: '250px', maxWidth: '400px', width: '350px', height: '40px', fontSize: '16px' }}
            allowClear
          />
          
           {/* Sort Controls */}
           <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
             <span className="sort-by-text">
               {t('classActivities.sortBy')}:
             </span>
             <Select
               value={sortConfig.sortBy}
               onChange={(value) => handleSortChange(value, sortConfig.sortDir)}
               style={{ width: '140px', height: '40px' }}
               options={[
                 { value: 'actionAt', label: t('classActivities.actionAt') },
                 { value: 'actionType', label: t('classActivities.actionType') },
               ]}
             />
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
                        {activity.actionByFullName || 'Unknown User'}
                      </span>
                      <span style={{ 
                        fontSize: '14px', 
                        color: '#586069'
                      }}>
                        {activity.actionDetails || 'No details available'}
                      </span>
                    </div>
                    
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
            total={pagination.total || activities.length}
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
