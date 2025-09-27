import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageToggle.css';

const LanguageToggle = () => {
  const { i18n } = useTranslation();
  const [isEnglish, setIsEnglish] = useState(i18n.language === 'en');

  useEffect(() => {
    setIsEnglish(i18n.language === 'en');
  }, [i18n.language]);

  const toggleLanguage = () => {
    const newLanguage = isEnglish ? 'vi' : 'en';
    i18n.changeLanguage(newLanguage);
    setIsEnglish(!isEnglish);
  };

  return (
    <div className="language-toggle-container">
      <div className="language-toggle" onClick={toggleLanguage}>
        <div className={`toggle-track ${isEnglish ? 'active' : ''}`}>
          <div className="toggle-thumb">
            <img 
              src={isEnglish ? "/img/englandflag.png" : "/img/vietnamflag.png"} 
              alt={isEnglish ? "English" : "Tiếng Việt"}
              className="flag-icon"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageToggle;
