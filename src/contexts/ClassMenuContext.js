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

  // Function to enter class menu mode
  const enterClassMenu = (classInfo) => {
    // Set class menu mode
    setIsInClassMenu(true);
    setClassData(classInfo);
    
    // Auto-collapse sidebar when entering class menu mode
    localStorage.setItem('sidebarCollapsed', JSON.stringify(true));
    
    // Dispatch custom event to notify ThemedLayout
    window.dispatchEvent(new CustomEvent('sidebarStateChanged'));
  };

  // Function to exit class menu mode
  const exitClassMenu = useCallback(() => {
    // Reset class menu mode
    setIsInClassMenu(false);
    setClassData(null);
    
    // Don't restore sidebar state - let it stay as user left it
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
    enterClassMenu,
    exitClassMenu,
  };

  return (
    <ClassMenuContext.Provider value={value}>
      {children}
    </ClassMenuContext.Provider>
  );
};
