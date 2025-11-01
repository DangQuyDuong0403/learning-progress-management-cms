import React, { useState, useEffect, useRef } from 'react';
import { translateText } from '../../apis/backend/translate';
import { useTheme } from '../../contexts/ThemeContext';
import './TextTranslator.css';

const TextTranslator = ({ enabled = true }) => {
  const { isSunTheme } = useTheme();
  const [selectedText, setSelectedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [showPopup, setShowPopup] = useState(false);
  const [showTranslateButton, setShowTranslateButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const popupRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const handleTextSelection = () => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (selectedText && selectedText.length > 0) {
        // Kiểm tra xem selection có trong input, textarea, hoặc code block không
        const activeElement = document.activeElement;
        const isInputOrTextarea = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.isContentEditable
        );

        // Kiểm tra xem có phải code block không
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        const containerElement = range?.commonAncestorContainer;
        const isCodeBlock = containerElement?.nodeType === Node.ELEMENT_NODE
          ? containerElement.closest('code, pre, .hljs, .language-') !== null
          : containerElement?.parentElement?.closest('code, pre, .hljs, .language-') !== null;

        // Bỏ qua nếu là input, textarea, hoặc code block
        if (isInputOrTextarea || isCodeBlock) {
          setShowPopup(false);
          return;
        }

        // Kiểm tra xem text có chứa ký tự tiếng Anh không
        const hasEnglishChars = /[a-zA-Z]/.test(selectedText);
        
        if (hasEnglishChars && selectedText.length <= 500 && range) { // Giới hạn độ dài
          const rect = range.getBoundingClientRect();
          
          setSelectedText(selectedText);
          setPopupPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10
          });
          
          // Hiển thị button dịch thay vì tự động dịch
          setShowTranslateButton(true);
          setShowPopup(false);
          setTranslatedText('');
        } else {
          // Nếu không phải tiếng Anh hoặc quá dài, ẩn popup và button
          setShowPopup(false);
          setShowTranslateButton(false);
        }
      } else {
        setShowPopup(false);
        setShowTranslateButton(false);
      }
    };

    const handleClickOutside = (e) => {
      // Đóng popup và button khi click bên ngoài
      if (popupRef.current && !popupRef.current.contains(e.target) &&
          buttonRef.current && !buttonRef.current.contains(e.target)) {
        const selection = window.getSelection();
        if (selection.toString().trim() === '') {
          setShowPopup(false);
          setShowTranslateButton(false);
        }
      }
    };

    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [enabled]);

  const translateSelectedText = async (text) => {
    setIsLoading(true);
    setShowPopup(true);
    setShowTranslateButton(false);
    
    try {
      const translated = await translateText(text);
      setTranslatedText(translated);
    } catch (error) {
      console.error('Translation failed:', error);
      setTranslatedText('Không thể dịch text này');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslateButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedText) {
      setShowTranslateButton(false);
      translateSelectedText(selectedText);
    }
  };

  // Điều chỉnh vị trí popup và button để không bị tràn màn hình
  useEffect(() => {
    if ((showPopup && popupRef.current) || (showTranslateButton && buttonRef.current)) {
      const element = showPopup ? popupRef.current : buttonRef.current;
      const rect = element.getBoundingClientRect();
      let { x, y } = popupPosition;

      // Điều chỉnh theo chiều ngang
      if (rect.right > window.innerWidth) {
        x = window.innerWidth - rect.width - 10;
      }
      if (rect.left < 0) {
        x = 10;
      }

      // Điều chỉnh theo chiều dọc
      if (rect.top < 0) {
        y = popupPosition.y + rect.height + 20;
      }

      if (x !== popupPosition.x || y !== popupPosition.y) {
        setPopupPosition({ x, y });
      }
    }
  }, [showPopup, showTranslateButton, popupPosition]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      {/* Button dịch */}
      {showTranslateButton && (
        <button
          ref={buttonRef}
          className={`translate-button ${!isSunTheme ? 'dark-theme' : ''}`}
          onClick={handleTranslateButtonClick}
          style={{
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
          title="Dịch text này"
        >
          <span className="translate-icon">📖</span>
        </button>
      )}

      {/* Popup kết quả dịch */}
      {showPopup && (
        <div
          ref={popupRef}
          className={`translation-popup ${!isSunTheme ? 'dark-theme' : ''}`}
          style={{
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
        >
          <div className="translation-popup-content">
            {isLoading ? (
              <div className="translation-loading">
                <span>Đang dịch...</span>
              </div>
            ) : (
              <>
                <div className="translation-original">
                  <strong>EN:</strong> {selectedText}
                </div>
                <div className="translation-separator"></div>
                <div className="translation-result">
                  <strong>VI:</strong> {translatedText}
                </div>
              </>
            )}
          </div>
          <div className="translation-popup-arrow"></div>
        </div>
      )}
    </>
  );
};

export default TextTranslator;

