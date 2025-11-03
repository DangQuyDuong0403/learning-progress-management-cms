import React, { useState, useEffect, useRef } from 'react';
import { translateText } from '../../apis/backend/translate';
import { useTheme } from '../../contexts/ThemeContext';
import './TextTranslator.css';

const TextTranslator = ({ enabled = true }) => {
  const { isSunTheme } = useTheme();
  const [selectedText, setSelectedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [popupPlacement, setPopupPlacement] = useState('above'); // 'above' or 'below'
  const [showPopup, setShowPopup] = useState(false);
  const [showTranslateButton, setShowTranslateButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const popupRef = useRef(null);
  const buttonRef = useRef(null);
  const lastSelectedTextRef = useRef('');
  const showTranslateButtonRef = useRef(false);
  const bodyScrollDisabledRef = useRef(false);
  const scrollPositionRef = useRef(0);
  const [isInPassageSelection, setIsInPassageSelection] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const handleTextSelection = (e) => {
      // Không xử lý nếu click vào button hoặc popup
      const target = e?.target;
      if (target && (
        buttonRef.current?.contains(target) ||
        popupRef.current?.contains(target) ||
        target.closest('.translate-button') ||
        target.closest('.translation-popup')
      )) {
        return;
      }

      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (selectedText && selectedText.length > 0) {
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        
        if (!range) {
          setShowPopup(false);
          setShowTranslateButton(false);
          showTranslateButtonRef.current = false;
          return;
        }

        // Kiểm tra xem selection có nằm trong reading passage không (luôn cho phép)
        const containerElement = range.commonAncestorContainer;
        const element = containerElement?.nodeType === Node.ELEMENT_NODE
          ? containerElement
          : containerElement?.parentElement;
        const isInPassageContent = element?.closest('.passage-text-content') !== null;
        
        // Kiểm tra xem selection có trong input, textarea, hoặc code block không
        const activeElement = document.activeElement;
        const isInputOrTextarea = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA'
        );

        // Kiểm tra nếu selection nằm trong contentEditable element (trừ reading passage)
        const closestEditable = element?.closest('[contenteditable="true"]');
        const isContentEditable = closestEditable && !isInPassageContent;

        // Kiểm tra xem có phải code block không
        const isCodeBlock = element?.closest('code, pre, .hljs, .language-') !== null;

        // Bỏ qua nếu là input, textarea, hoặc code block (nhưng cho phép reading passage)
        // Hoặc nếu là contentEditable nhưng không phải trong reading passage
        if (!isInPassageContent && (isInputOrTextarea || isContentEditable || isCodeBlock)) {
          setShowPopup(false);
          setShowTranslateButton(false);
          showTranslateButtonRef.current = false;
          return;
        }

        // Kiểm tra xem text có chứa ký tự tiếng Anh không
        const hasEnglishChars = /[a-zA-Z]/.test(selectedText);
        
        // Giới hạn độ dài: 2000 ký tự cho reading passage, 500 cho các vùng khác (nhưng vẫn hiển thị button trong passage khi vượt quá)
        console.log('🔍 Text selection check:', {
          selectedText: selectedText.substring(0, 50) + '...',
          hasEnglishChars,
          textLength: selectedText.length,
          maxLengthReading: 2000,
          maxLengthOther: 500,
          isInPassageContent,
          rect: range ? {
            width: range.getBoundingClientRect().width,
            height: range.getBoundingClientRect().height,
            left: range.getBoundingClientRect().left,
            top: range.getBoundingClientRect().top,
          } : null,
        });
        
        // Cho phép hiển thị button nếu: có chữ cái tiếng Anh và có range, và
        // - Nếu nằm trong passage: KHÔNG giới hạn độ dài (vẫn cho hiện button)
        // - Nếu không nằm trong passage: giới hạn 500 ký tự
        if (hasEnglishChars && range && (isInPassageContent || selectedText.length <= 500)) {
          const rect = range.getBoundingClientRect();
          
          // Chỉ hiện button nếu có vị trí hợp lệ (có ít nhất width hoặc height, hoặc có tọa độ hợp lệ)
          const hasValidPosition = (rect.width > 0 || rect.height > 0) || 
                                   (rect.left >= 0 && rect.top >= 0 && 
                                    rect.left < window.innerWidth && rect.top < window.innerHeight);
          
          if (hasValidPosition) {
            // Tính toán vị trí button: ở giữa selection nếu có width, nếu không thì dùng left
            const buttonX = rect.width > 0 ? rect.left + rect.width / 2 : rect.left;
            const buttonY = rect.top - 10;
            
            // Chỉ update position và text nếu text khác với text hiện tại hoặc button chưa hiển thị
            // Điều này ngăn button bị di chuyển khi đã hiển thị và đang chuẩn bị click
            const isNewSelection = selectedText !== lastSelectedTextRef.current;
            if (!showTranslateButtonRef.current || isNewSelection) {
              setSelectedText(selectedText);
              lastSelectedTextRef.current = selectedText;
              setIsInPassageSelection(!!isInPassageContent);
              setPopupPosition({
                x: buttonX,
                y: buttonY
              });
            }
            
            // Hiển thị button dịch thay vì tự động dịch
            setShowTranslateButton(true);
            showTranslateButtonRef.current = true;
            setShowPopup(false);
            setTranslatedText('');
            console.log('✅ Showing translate button at:', { x: buttonX, y: buttonY });
          } else {
            console.warn('⚠️ Invalid rect position:', rect);
          }
        } else {
          // Nếu không phải tiếng Anh hoặc quá dài, ẩn popup và button
          console.log('⚠️ Text selection not valid for translation:', {
            hasEnglishChars,
            textLength: selectedText.length,
            maxLengthReading: 2000,
            maxLengthOther: 500,
            exceedsLimitReading: isInPassageContent && selectedText.length > 2000,
            exceedsLimitOther: !isInPassageContent && selectedText.length > 500,
            hasRange: !!range,
          });
          setShowPopup(false);
          setShowTranslateButton(false);
          showTranslateButtonRef.current = false;
        }
      } else {
        setShowPopup(false);
        setShowTranslateButton(false);
        showTranslateButtonRef.current = false;
      }
    };

    const handleClickOutside = (e) => {
      // Đóng popup và button khi click bên ngoài
      // Nhưng không đóng nếu click vào button translate hoặc popup
      const target = e.target;
      const clickedButton = buttonRef.current && (
        buttonRef.current === target || 
        buttonRef.current.contains(target)
      );
      const clickedPopup = popupRef.current && (
        popupRef.current === target || 
        popupRef.current.contains(target)
      );
      
      // Kiểm tra xem có phải click vào button hoặc popup không (bao gồm cả children)
      const clickedButtonOrPopup = target?.closest('.translate-button') || 
                                   target?.closest('.translation-popup');
      
      // Nếu click vào button hoặc popup, không làm gì cả (để onClick handler xử lý)
      if (clickedButton || clickedPopup || clickedButtonOrPopup) {
        return;
      }
      
      // Chỉ đóng nếu click bên ngoài và không có text được select
      const selection = window.getSelection();
      if (selection.toString().trim() === '') {
        setShowPopup(false);
        setShowTranslateButton(false);
        showTranslateButtonRef.current = false;
      }
    };

    // Sử dụng capture phase để handleClickOutside chạy trước, nhưng sẽ return early nếu click vào button
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('click', handleClickOutside, true); // Use capture phase

    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [enabled]);

  const translateSelectedText = async (text) => {
    if (!text || text.trim().length === 0) {
      console.warn('No text to translate');
      setIsLoading(false);
      return;
    }

    // Không set state ở đây nữa vì đã set trong handleTranslateButtonClick
    // Chỉ set translatedText khi có kết quả
    
    try {
      console.log('🔄 Starting translation for text:', text.substring(0, 100) + '...');
      console.log('📡 Calling translate API...');
      const translated = await translateText(text);
      console.log('✅ Translation successful:', translated);
      setTranslatedText(translated || 'Không thể dịch text này');
    } catch (error) {
      console.error('❌ Translation failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack,
      });
      setTranslatedText('Không thể dịch text này. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslateButtonClick = (e) => {
    // Ngăn chặn tất cả các event propagation
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation?.();
    
    // Try to stop immediate propagation if available
    if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
      e.nativeEvent.stopImmediatePropagation();
    }
    
    console.log('🖱️ Translate button clicked!', {
      selectedText: selectedText?.substring(0, 50) + '...',
      selectedTextLength: selectedText?.length,
      showTranslateButton,
    });
    
    // Lưu selectedText vào biến local để tránh closure issue
    const textToTranslate = selectedText;
    
      if (textToTranslate && textToTranslate.trim().length > 0) {
      console.log('✅ Starting translation for selected text');
      
      // Tính toán placement trước khi hiển thị popup
      // Ước tính chiều cao popup dựa trên độ dài text (tính bằng pixels, giả sử mỗi ký tự ~0.5px height với line-height 1.6)
      const estimatedTextHeight = Math.min(600, Math.max(150, textToTranslate.length * 0.5));
      const spaceAbove = popupPosition.y;
      const spaceBelow = window.innerHeight - popupPosition.y;
      const requiredSpace = estimatedTextHeight + 40; // 40px padding
      
      // Chọn placement ban đầu dựa trên không gian có sẵn
      const initialPlacement = (spaceAbove >= requiredSpace && spaceAbove >= spaceBelow) ? 'above' : 'below';
      setPopupPlacement(initialPlacement);

      // Nếu là selection trong passage và vượt quá 2000 ký tự: hiển thị popup cảnh báo, không gọi API
      if (isInPassageSelection && textToTranslate.length > 2000) {
        setShowTranslateButton(false);
        showTranslateButtonRef.current = false;
        setShowPopup(true);
        setIsLoading(false);
        setTranslatedText('Đã vượt quá 2000 kí tự. Vui lòng chọn đoạn ngắn hơn.');
        return;
      }
      
      // Set state trước khi gọi API để UI update ngay
      setShowTranslateButton(false);
      showTranslateButtonRef.current = false;
      setShowPopup(true);
      setIsLoading(true);
      setTranslatedText(''); // Clear previous translation
      
      // Sử dụng setTimeout để đảm bảo state update trước khi gọi API
      setTimeout(() => {
        translateSelectedText(textToTranslate);
      }, 0);
    } else {
      console.warn('⚠️ No text selected to translate');
    }
  };

  // Disable body scroll khi popup hiển thị để tránh scrollbar ở ngoài cùng
  useEffect(() => {
    if (showPopup) {
      // Lưu scroll position hiện tại
      scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop;
      
      // Disable scroll của body
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;
      const originalWidth = document.body.style.width;
      
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.width = '100%';
      
      bodyScrollDisabledRef.current = true;
      
      return () => {
        // Restore scroll của body khi popup đóng
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = originalWidth;
        
        // Restore scroll position
        window.scrollTo(0, scrollPositionRef.current);
        
        bodyScrollDisabledRef.current = false;
      };
    }
  }, [showPopup]);

  // Điều chỉnh vị trí popup và button để không bị tràn màn hình
  useEffect(() => {
    if (showPopup && popupRef.current) {
      const element = popupRef.current;
      const rect = element.getBoundingClientRect();
      let { x, y } = popupPosition;
      let newPlacement = popupPlacement;

      // Tính toán chiều cao ước tính của popup (có thể cần điều chỉnh)
      // Sử dụng max-height từ CSS (tạm thời dùng 60vh)
      const maxPopupHeight = Math.min(600, window.innerHeight * 0.6);
      const estimatedPopupHeight = Math.min(rect.height || maxPopupHeight, maxPopupHeight);
      
      // Kiểm tra xem có đủ chỗ ở trên không
      const spaceAbove = popupPosition.y;
      const spaceBelow = window.innerHeight - popupPosition.y;
      const requiredSpace = estimatedPopupHeight + 20; // 20px padding

      // Quyết định placement dựa trên không gian có sẵn
      if (popupPlacement === 'above' && spaceAbove < requiredSpace && spaceBelow > spaceAbove) {
        // Không đủ chỗ ở trên, chuyển xuống dưới
        newPlacement = 'below';
        y = popupPosition.y + 30; // Offset từ selection
      } else if (popupPlacement === 'below' && spaceBelow < requiredSpace && spaceAbove > spaceBelow) {
        // Không đủ chỗ ở dưới, chuyển lên trên
        newPlacement = 'above';
        y = popupPosition.y - 10;
      }

      // Điều chỉnh theo chiều ngang (clamp centerX vì dùng translateX(-50%))
      if (rect.width > 0) {
        const minCenterX = 10 + rect.width / 2;
        const maxCenterX = window.innerWidth - 10 - rect.width / 2;
        const clampedCenterX = Math.min(Math.max(x, minCenterX), maxCenterX);
        x = clampedCenterX;
      }

      // Điều chỉnh theo chiều dọc để đảm bảo popup luôn trong viewport
      if (newPlacement === 'above' && rect.top < 10) {
        // Popup bị cắt ở trên, đẩy xuống hoặc chuyển sang below
        if (spaceBelow > requiredSpace) {
          newPlacement = 'below';
          y = popupPosition.y + 30;
        } else {
          // Nếu không đủ chỗ cả 2 phía, ít nhất đảm bảo top >= 10
          y = 10 + estimatedPopupHeight / 2;
        }
      } else if (newPlacement === 'below' && rect.bottom > window.innerHeight - 10) {
        // Popup bị cắt ở dưới, đẩy lên hoặc chuyển sang above
        if (spaceAbove > requiredSpace) {
          newPlacement = 'above';
          y = popupPosition.y - 10;
        } else {
          // Nếu không đủ chỗ cả 2 phía, ít nhất đảm bảo bottom <= window.innerHeight - 10
          y = window.innerHeight - 10 - estimatedPopupHeight / 2;
        }
      }

      if (x !== popupPosition.x || y !== popupPosition.y || newPlacement !== popupPlacement) {
        setPopupPosition({ x, y });
        if (newPlacement !== popupPlacement) {
          setPopupPlacement(newPlacement);
        }
      }
    } else if (showTranslateButton && buttonRef.current) {
      // Xử lý button positioning
      const element = buttonRef.current;
      const rect = element.getBoundingClientRect();
      let { x, y } = popupPosition;

      // Điều chỉnh theo chiều ngang (clamp centerX vì dùng translateX(-50%))
      if (rect.width > 0) {
        const minCenterX = 10 + rect.width / 2;
        const maxCenterX = window.innerWidth - 10 - rect.width / 2;
        const clampedCenterX = Math.min(Math.max(x, minCenterX), maxCenterX);
        x = clampedCenterX;
      }

      // Điều chỉnh theo chiều dọc
      if (rect.top < 10) {
        y = Math.max(popupPosition.y, rect.height + 10);
      } else if (rect.bottom > window.innerHeight - 10) {
        // Với translateY(-100%), rect.bottom xấp xỉ bằng y; giới hạn trong viewport
        y = Math.min(popupPosition.y, window.innerHeight - 10);
      }

      if (x !== popupPosition.x || y !== popupPosition.y) {
        setPopupPosition({ x, y });
      }
    }
  }, [showPopup, showTranslateButton, popupPosition, popupPlacement]);

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
          onMouseDown={(e) => {
            // Prevent event from bubbling to handleClickOutside và handleTextSelection
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation?.();
          }}
          onMouseUp={(e) => {
            // Prevent mouseup from triggering handleTextSelection
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation?.();
          }}
          style={{
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
            transform: 'translateX(-50%) translateY(-100%)',
            zIndex: 9001, // Thấp hơn custom cursor để không che con trỏ
            pointerEvents: 'auto', // Đảm bảo có thể click được
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
          className={`translation-popup ${!isSunTheme ? 'dark-theme' : ''} ${popupPlacement === 'below' ? 'popup-below' : 'popup-above'}`}
          style={{
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
            transform: popupPlacement === 'below' 
              ? 'translateX(-50%) translateY(0)' 
              : 'translateX(-50%) translateY(-100%)',
            maxHeight: '60vh',
            overflow: 'visible',
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
                  <strong>EN:</strong> {isInPassageSelection && selectedText.length > 2000 
                    ? 'Exceeded 2000 characters. Please select a shorter paragraph.' 
                    : selectedText}
                </div>
                <div className="translation-separator"></div>
                <div className="translation-result">
                  <strong>VI:</strong> {translatedText}
                </div>
              </>
            )}
          </div>
          <div className={`translation-popup-arrow ${popupPlacement === 'below' ? 'arrow-up' : 'arrow-down'}`}></div>
        </div>
      )}
    </>
  );
};

export default TextTranslator;

