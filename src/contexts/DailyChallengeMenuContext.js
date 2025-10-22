import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DailyChallengeMenuContext = createContext();

export const useDailyChallengeMenu = () => {
  const context = useContext(DailyChallengeMenuContext);
  if (!context) {
    throw new Error('useDailyChallengeMenu must be used within a DailyChallengeMenuProvider');
  }
  return context;
};

export const DailyChallengeMenuProvider = ({ children }) => {
  const [isInDailyChallengeMenu, setIsInDailyChallengeMenu] = useState(false);
  const [dailyChallengeData, setDailyChallengeData] = useState(null);

  // Function to enter daily challenge menu mode
  const enterDailyChallengeMenu = useCallback((challengeCount, subtitle = null, backPath = null) => {
    // Set daily challenge menu mode
    setIsInDailyChallengeMenu(true);
    setDailyChallengeData({
      count: challengeCount,
      subtitle: subtitle,
      backPath: backPath,
    });
  }, []);

  // Function to exit daily challenge menu mode
  const exitDailyChallengeMenu = useCallback(() => {
    // Reset daily challenge menu mode
    setIsInDailyChallengeMenu(false);
    setDailyChallengeData(null);
  }, []);

  // Function to update challenge count
  const updateChallengeCount = useCallback((count) => {
    setDailyChallengeData(prev => ({
      ...prev,
      count: count
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInDailyChallengeMenu) {
        exitDailyChallengeMenu();
      }
    };
  }, [isInDailyChallengeMenu, exitDailyChallengeMenu]);

  const value = {
    isInDailyChallengeMenu,
    dailyChallengeData,
    enterDailyChallengeMenu,
    exitDailyChallengeMenu,
    updateChallengeCount,
  };

  return (
    <DailyChallengeMenuContext.Provider value={value}>
      {children}
    </DailyChallengeMenuContext.Provider>
  );
};

