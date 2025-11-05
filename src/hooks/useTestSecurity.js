import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook để giám sát và chặn các hành động trong bài test của học sinh
 * - Theo dõi tab switching (chuyển tab)
 * - Chặn copy (Ctrl+C) và paste (Ctrl+V)
 * - Ghi log và đếm số lần vi phạm
 * 
 * @param {boolean} enabled - Bật/tắt giám sát
 * @param {Function} onViolation - Callback khi có vi phạm (tab switch, copy, paste)
 * @returns {Object} - Trạng thái và dữ liệu giám sát
 */
export const useTestSecurity = (enabled = true, onViolation = null) => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    tabSwitches: 0,
    copyAttempts: 0,
    pasteAttempts: 0,
    totalViolations: 0
  });

  const isVisibleRef = useRef(true);
  const violationCallbackRef = useRef(onViolation);

  // Cập nhật callback ref khi onViolation thay đổi
  useEffect(() => {
    violationCallbackRef.current = onViolation;
  }, [onViolation]);

  // Hàm ghi log
  const logViolation = useCallback((type, details = {}) => {
    const logEntry = {
      id: Date.now() + Math.random(),
      type, // 'tab_switch', 'copy', 'paste'
      timestamp: new Date().toISOString(),
      timestampDisplay: new Date().toLocaleString('vi-VN'),
      ...details
    };

    setLogs(prev => {
      const newLogs = [logEntry, ...prev];
      // Giữ tối đa 100 log entries
      return newLogs.slice(0, 100);
    });

    // Cập nhật stats
    setStats(prev => {
      const newStats = {
        ...prev,
        [type === 'tab_switch' ? 'tabSwitches' : 
         type === 'copy' ? 'copyAttempts' : 'pasteAttempts']: 
          prev[type === 'tab_switch' ? 'tabSwitches' : 
               type === 'copy' ? 'copyAttempts' : 'pasteAttempts'] + 1,
        totalViolations: prev.totalViolations + 1
      };
      return newStats;
    });

    // Gọi callback nếu có
    if (violationCallbackRef.current) {
      violationCallbackRef.current(logEntry);
    }

    return logEntry;
  }, []);

  // Theo dõi tab switching
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab bị ẩn (chuyển sang tab khác)
        if (isVisibleRef.current) {
          isVisibleRef.current = false;
          logViolation('tab_switch', {
            action: 'tab_hidden',
            message: 'Người dùng đã chuyển sang tab khác'
          });
        }
      } else {
        // Tab được hiển thị lại
        if (!isVisibleRef.current) {
          isVisibleRef.current = true;
          logViolation('tab_switch', {
            action: 'tab_visible',
            message: 'Người dùng đã quay lại tab này'
          });
        }
      }
    };

    // Theo dõi khi window mất focus (có thể là chuyển sang ứng dụng khác)
    const handleBlur = () => {
      if (isVisibleRef.current) {
        isVisibleRef.current = false;
        logViolation('tab_switch', {
          action: 'window_blur',
          message: 'Window mất focus (có thể chuyển sang ứng dụng khác)'
        });
      }
    };

    const handleFocus = () => {
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        logViolation('tab_switch', {
          action: 'window_focus',
          message: 'Window được focus lại'
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, logViolation]);

  // Chặn copy (Ctrl+C, Ctrl+Insert, hoặc chuột phải copy)
  useEffect(() => {
    if (!enabled) return;

    const handleCopy = (e) => {
      // Capture selected text before preventing default
      let selectedText = '';
      try {
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
          selectedText = selection.toString().trim();
        }
      } catch (err) {
        // Ignore errors
      }

      e.preventDefault();
      e.stopPropagation();
      logViolation('copy', {
        action: 'copy_blocked',
        message: 'Đã chặn hành động copy',
        method: e.type, // 'copy' event
        selectedText: selectedText // Include captured text
      });
      return false;
    };

    const handleKeyDown = (e) => {
      // Chặn Ctrl+C, Ctrl+Insert (copy)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.key === 'Insert')) {
        // Capture selected text before preventing default
        let selectedText = '';
        try {
          const selection = window.getSelection();
          if (selection && selection.toString().trim()) {
            selectedText = selection.toString().trim();
          }
        } catch (err) {
          // Ignore errors
        }

        e.preventDefault();
        e.stopPropagation();
        logViolation('copy', {
          action: 'copy_blocked',
          message: 'Đã chặn Ctrl+C / Ctrl+Insert',
          key: e.key,
          selectedText: selectedText // Include captured text
        });
        return false;
      }

      // Chặn Ctrl+V, Shift+Insert (paste)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V') || 
          (e.shiftKey && e.key === 'Insert')) {
        e.preventDefault();
        e.stopPropagation();
        logViolation('paste', {
          action: 'paste_blocked',
          message: 'Đã chặn Ctrl+V / Shift+Insert',
          key: e.key
        });
        return false;
      }
    };

    // Chặn context menu (chuột phải)
    const handleContextMenu = (e) => {
      // Cho phép context menu trên một số element nhất định nếu cần
      // Nhưng vẫn log lại
      logViolation('copy', {
        action: 'context_menu',
        message: 'Người dùng mở context menu (có thể để copy)'
      });
      // Có thể uncomment dòng dưới để chặn hoàn toàn context menu
      // e.preventDefault();
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [enabled, logViolation]);

  // Chặn paste thông qua event paste
  useEffect(() => {
    if (!enabled) return;

    const handlePaste = (e) => {
      // Try to read clipboard content before preventing default
      // Note: This requires clipboard permission and may not work in all browsers
      let clipboardText = '';
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText()
          .then(text => {
            // Update log entry with clipboard content if available
            // This is async, so we'll try to get it in the callback
          })
          .catch(err => {
            // Clipboard read failed (permission denied or other error)
            console.warn('Could not read clipboard:', err);
          });
      }

      e.preventDefault();
      e.stopPropagation();
      logViolation('paste', {
        action: 'paste_blocked',
        message: 'Đã chặn hành động paste',
        method: e.type,
        // Note: clipboardText will be empty here as it's async
        // The actual clipboard reading should be done in the callback
      });
      return false;
    };

    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [enabled, logViolation]);

  // Reset logs và stats
  const resetLogs = useCallback(() => {
    setLogs([]);
    setStats({
      tabSwitches: 0,
      copyAttempts: 0,
      pasteAttempts: 0,
      totalViolations: 0
    });
  }, []);

  return {
    logs,
    stats,
    resetLogs
  };
};

