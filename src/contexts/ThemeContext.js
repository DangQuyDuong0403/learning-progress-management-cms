import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Lấy theme từ localStorage hoặc mặc định là 'space' (vũ trụ)
    return localStorage.getItem('theme') || 'space';
  });

  useEffect(() => {
    // Lưu theme vào localStorage khi thay đổi
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'sun' ? 'space' : 'sun');
  };

  const value = {
    theme,
    toggleTheme,
    isSunTheme: theme === 'sun',
    isSpaceTheme: theme === 'space'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
