import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ClassMenuContext = createContext();

export const useClassMenu = () => {
  const context = useContext(ClassMenuContext);
  if (!context) {
    throw new Error('useClassMenu must be used within a ClassMenuProvider');
  }
  return context;
};

export const ClassMenuProvider = ({ children }) => {
  const [isInClassMenu, setIsInClassMenu] = useState(false);
  const [classData, setClassData] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Function to enter class menu mode
  const enterClassMenu = useCallback((classInfo) => {
    const resolvedStatus =
      classInfo?.status ||
      classInfo?.classStatus ||
      classInfo?.class_status ||
      null;
    const viewOnly = resolvedStatus === 'FINISHED';

    // Set class menu mode
    setIsInClassMenu(true);
    setClassData({
      ...classInfo,
      status: resolvedStatus,
      isViewOnly: viewOnly,
      backUrl: classInfo.backUrl || null, // Support custom back URL
    });
    setIsViewOnly(viewOnly);
    
    // Auto-collapse sidebar when entering class menu mode
    localStorage.setItem('sidebarCollapsed', JSON.stringify(true));
    
    // Dispatch custom event to notify ThemedLayout
    window.dispatchEvent(new CustomEvent('sidebarStateChanged'));
  }, []);

  // Function to exit class menu mode
  const exitClassMenu = useCallback(() => {
    // Reset class menu mode
    setIsInClassMenu(false);
    setClassData(null);
    setIsViewOnly(false);
    
    // Don't restore sidebar state - let it stay as user left it
  }, []);

  const updateClassStatus = useCallback((status) => {
    const viewOnly = status === 'FINISHED';
    setClassData(prev => ({
      ...(prev || {}),
      status,
      isViewOnly: viewOnly,
    }));
    setIsViewOnly(viewOnly);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInClassMenu) {
        exitClassMenu();
      }
    };
  }, [isInClassMenu, exitClassMenu]);

  const value = {
    isInClassMenu,
    classData,
    isViewOnly,
    enterClassMenu,
    exitClassMenu,
    updateClassStatus,
  };

  return (
    <ClassMenuContext.Provider value={value}>
      {children}
    </ClassMenuContext.Provider>
  );
};
