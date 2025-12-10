import React from 'react';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggleSwitch = ({ size = 'default' }) => {
  const { isSunTheme, toggleTheme } = useTheme();

  const handleClick = () => {
    toggleTheme();
  };

  return (
    <button
      className={`login-theme-switch ${isSunTheme ? 'checked' : ''}`}
      onClick={handleClick}
      style={{
        width: size === 'small' ? '40px' : '50px',
        height: size === 'small' ? '22px' : '28px',
      }}
    >
      <div className="login-theme-switch-handle">
        {isSunTheme ? (
          <SunOutlined className="anticon sun-icon" />
        ) : (
          <MoonOutlined className="anticon moon-icon" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggleSwitch;
