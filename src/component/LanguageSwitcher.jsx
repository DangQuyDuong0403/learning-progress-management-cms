import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown, Button } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const languageMenu = {
    items: [
      {
        key: 'vi',
        label: (
          <div className="d-flex align-items-center">
            <span className="me-2">🇻🇳</span>
            {t('common.vietnamese')}
          </div>
        ),
        onClick: () => changeLanguage('vi'),
      },
      {
        key: 'en',
        label: (
          <div className="d-flex align-items-center">
            <span className="me-2">🇺🇸</span>
            {t('common.english')}
          </div>
        ),
        onClick: () => changeLanguage('en'),
      },
    ],
  };

  const getCurrentLanguageLabel = () => {
    const currentLang = i18n.language || 'en'; // Mặc định là 'en' nếu không có
    switch (currentLang) {
      case 'vi':
        return `🇻🇳 ${t('common.vietnamese')}`;
      case 'en':
        return `🇺🇸 ${t('common.english')}`;
      default:
        return `🇺🇸 ${t('common.english')}`; // Mặc định về tiếng Anh
    }
  };

  return (
    <Dropdown
      menu={languageMenu}
      placement="bottomRight"
      trigger={['click']}
    >
      <Button
        type="text"
        className="language-switcher-btn"
        style={{
          color: 'rgba(255, 255, 255, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          padding: '4px 12px',
          height: 'auto',
          fontSize: '14px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.3s ease',
          background: 'rgba(255, 255, 255, 0.05)',
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.05)';
          e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        }}
      >
        <GlobalOutlined style={{ fontSize: '16px' }} />
        <span>{getCurrentLanguageLabel().split(' ').slice(1).join(' ')}</span>
      </Button>
    </Dropdown>
  );
};

export default LanguageSwitcher;
