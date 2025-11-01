import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import TestSecurityMonitor from '../../component/TestSecurityMonitor';
import './TestDemo.css';

/**
 * Trang demo để test tính năng giám sát test của học sinh
 * - Test tab switching detection
 * - Test copy/paste blocking
 * - Xem log và thống kê
 */
const TestDemo = () => {
  const { isSunTheme } = useTheme();
  const [testStarted, setTestStarted] = useState(false);
  const [testAnswer, setTestAnswer] = useState('');
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);

  const handleStartTest = () => {
    setTestStarted(true);
    setMonitoringEnabled(true);
    setTestAnswer('');
  };

  const handleEndTest = () => {
    setTestStarted(false);
    setMonitoringEnabled(false);
  };

  const handleViolation = (logEntry) => {
    console.log('Vi phạm được phát hiện:', logEntry);
    // Có thể gửi log này lên server nếu cần
  };

  return (
    <div className={`test-demo-page ${!isSunTheme ? 'dark-theme' : ''}`}>
      <div className="test-demo-container">
        <div className="test-demo-header">
          <h1>🛡️ Demo Giám sát Test</h1>
          <p className="subtitle">
            Trang này demo tính năng giám sát hành động của học sinh trong bài test
          </p>
        </div>

        <div className="test-demo-content">
          <div className="test-info-panel">
            <h2>Hướng dẫn Test</h2>
            <div className="instructions">
              <p><strong>Để test các tính năng giám sát:</strong></p>
              <ol>
                <li>Nhấn nút "Bắt đầu Test" để bắt đầu giám sát</li>
                <li>
                  <strong>Test chuyển tab:</strong> Chuyển sang tab khác hoặc ứng dụng khác, 
                  sau đó quay lại. Xem log ghi nhận.
                </li>
                <li>
                  <strong>Test copy:</strong> Thử copy text bằng Ctrl+C hoặc chuột phải. 
                  Hành động sẽ bị chặn và được ghi log.
                </li>
                <li>
                  <strong>Test paste:</strong> Thử paste text bằng Ctrl+V. 
                  Hành động sẽ bị chặn và được ghi log.
                </li>
                <li>Xem panel giám sát ở góc phải trên để theo dõi log và thống kê</li>
              </ol>
            </div>

            <div className="test-controls">
              {!testStarted ? (
                <button 
                  className="btn-start-test" 
                  onClick={handleStartTest}
                >
                  🚀 Bắt đầu Test
                </button>
              ) : (
                <button 
                  className="btn-end-test" 
                  onClick={handleEndTest}
                >
                  ✅ Kết thúc Test
                </button>
              )}
            </div>
          </div>

          {testStarted && (
            <div className="test-questions-panel">
              <h2>📝 Bài Test Demo</h2>
              
              <div className="question-section">
                <h3>Câu hỏi 1: Viết một đoạn văn về chủ đề "Mùa hè"</h3>
                <textarea
                  className="test-textarea"
                  value={testAnswer}
                  onChange={(e) => setTestAnswer(e.target.value)}
                  placeholder="Nhập câu trả lời của bạn ở đây... (Thử copy/paste để xem tính năng chặn hoạt động)"
                  rows={8}
                />
                <p className="test-hint">
                  💡 <strong>Gợi ý:</strong> Thử copy text từ đâu đó và paste vào đây để test tính năng chặn paste
                </p>
              </div>

              <div className="question-section">
                <h3>Câu hỏi 2: Điền vào chỗ trống</h3>
                <div className="fill-blank-question">
                  <p>
                    The capital city of Vietnam is <input 
                      type="text" 
                      className="test-input"
                      placeholder="?"
                    />.
                  </p>
                  <p>
                    I love to <input 
                      type="text" 
                      className="test-input"
                      placeholder="?"
                    /> in the morning.
                  </p>
                </div>
              </div>

              <div className="question-section">
                <h3>Câu hỏi 3: Chọn đáp án đúng</h3>
                <div className="multiple-choice">
                  <label>
                    <input type="radio" name="q3" value="a" />
                    <span>Đáp án A: HTML là ngôn ngữ lập trình</span>
                  </label>
                  <label>
                    <input type="radio" name="q3" value="b" />
                    <span>Đáp án B: HTML là ngôn ngữ đánh dấu</span>
                  </label>
                  <label>
                    <input type="radio" name="q3" value="c" />
                    <span>Đáp án C: HTML là framework JavaScript</span>
                  </label>
                </div>
              </div>

              <div className="warning-box">
                <strong>⚠️ Lưu ý:</strong> Panel giám sát ở góc phải trên sẽ ghi lại tất cả các hành động vi phạm 
                (chuyển tab, copy, paste). Hãy thử các hành động này để xem hệ thống hoạt động.
              </div>
            </div>
          )}

          {!testStarted && (
            <div className="demo-features">
              <h2>✨ Tính năng giám sát</h2>
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">🔄</div>
                  <h3>Chuyển Tab</h3>
                  <p>Theo dõi và ghi log khi học sinh chuyển sang tab hoặc ứng dụng khác</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">📋</div>
                  <h3>Chặn Copy</h3>
                  <p>Chặn Ctrl+C, Ctrl+Insert và các phương thức copy khác, ghi log tất cả các lần thử</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">📥</div>
                  <h3>Chặn Paste</h3>
                  <p>Chặn Ctrl+V, Shift+Insert và các phương thức paste khác, ghi log tất cả các lần thử</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">📊</div>
                  <h3>Thống kê & Log</h3>
                  <p>Hiển thị thống kê real-time và log chi tiết tất cả các vi phạm</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Test Security Monitor Panel */}
      <TestSecurityMonitor 
        enabled={monitoringEnabled}
        onViolation={handleViolation}
        showPanel={true}
        position="top-right"
      />
    </div>
  );
};

export default TestDemo;

