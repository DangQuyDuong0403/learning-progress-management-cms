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
    // Lấy theme từ localStorage hoặc mặc định là 'sun' (mặt trời)
    return localStorage.getItem('theme') || 'sun';
  });

  useEffect(() => {
    // Lưu theme vào localStorage khi thay đổi
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Thêm useEffect để theo dõi thay đổi localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Xử lý sự kiện storage từ tab khác
      if (e.key === 'theme' && !e.newValue) {
        setTheme('sun');
      }
    };

    // Override localStorage.removeItem để theo dõi khi theme bị xóa
    const originalRemoveItem = localStorage.removeItem;
    localStorage.removeItem = function(key) {
      originalRemoveItem.call(this, key);
      if (key === 'theme') {
        // Nếu theme bị xóa, reset về sun
        setTimeout(() => setTheme('sun'), 0);
      }
    };

    // Override localStorage.clear để theo dõi khi tất cả localStorage bị xóa
    const originalClear = localStorage.clear;
    localStorage.clear = function() {
      originalClear.call(this);
      // Nếu localStorage bị clear, reset theme về sun
      setTimeout(() => setTheme('sun'), 0);
    };

    // Lắng nghe sự kiện storage change
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      // Restore original methods
      localStorage.removeItem = originalRemoveItem;
      localStorage.clear = originalClear;
    };
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'sun' ? 'space' : 'sun');
  };

  const resetTheme = () => {
    setTheme('sun'); // Reset về theme mặc định
  };

  const value = {
    theme,
    toggleTheme,
    resetTheme,
    isSunTheme: theme === 'sun',
    isSpaceTheme: theme === 'space'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
