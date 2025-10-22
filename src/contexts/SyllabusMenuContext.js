import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SyllabusMenuContext = createContext();

export const useSyllabusMenu = () => {
  const context = useContext(SyllabusMenuContext);
  if (!context) {
    throw new Error('useSyllabusMenu must be used within a SyllabusMenuProvider');
  }
  return context;
};

export const SyllabusMenuProvider = ({ children }) => {
  const [isInSyllabusMenu, setIsInSyllabusMenu] = useState(false);
  const [syllabusData, setSyllabusData] = useState(null);

  // Function to enter syllabus menu mode
  const enterSyllabusMenu = useCallback((syllabusInfo) => {
    // Set syllabus menu mode
    setIsInSyllabusMenu(true);
    setSyllabusData(syllabusInfo);
    
    // Auto-collapse sidebar when entering syllabus menu mode
    localStorage.setItem('sidebarCollapsed', JSON.stringify(true));
    
    // Dispatch custom event to notify ThemedLayout
    window.dispatchEvent(new CustomEvent('sidebarStateChanged'));
  }, []);

  // Function to exit syllabus menu mode
  const exitSyllabusMenu = useCallback(() => {
    // Reset syllabus menu mode
    setIsInSyllabusMenu(false);
    setSyllabusData(null);
    
    // Don't restore sidebar state - let it stay as user left it
  }, []);

  const value = {
    isInSyllabusMenu,
    syllabusData,
    enterSyllabusMenu,
    exitSyllabusMenu,
  };

  return (
    <SyllabusMenuContext.Provider value={value}>
      {children}
    </SyllabusMenuContext.Provider>
  );
};

