import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import TestSecurityMonitor from '../../component/TestSecurityMonitor';
import {
  getDeviceFingerprint,
  saveFingerprintHash,
  getSavedFingerprintHash,
  compareFingerprints,
} from '../../utils/fingerprintUtils';
import './TestDemo.css';

/**
 * Trang demo để test tính năng giám sát test của học sinh
 * - Test tab switching detection
 * - Test copy/paste blocking
 * - Test device fingerprinting để phát hiện thi hộ
 * - Xem log và thống kê
 */
const TestDemo = () => {
  const { isSunTheme } = useTheme();
  const [testStarted, setTestStarted] = useState(false);
  const [testAnswer, setTestAnswer] = useState('');
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);
  
  // Fingerprint states
  const [fingerprint, setFingerprint] = useState(null);
  const [fingerprintHash, setFingerprintHash] = useState('');
  const [savedFingerprint, setSavedFingerprint] = useState(null);
  const [fingerprintMatch, setFingerprintMatch] = useState(null);
  const [fingerprintLoading, setFingerprintLoading] = useState(false);
  const [fingerprintDetails, setFingerprintDetails] = useState(false);

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

  // Load fingerprint khi component mount
  useEffect(() => {
    loadFingerprint();
  }, []);

  // Load và so sánh fingerprint
  const loadFingerprint = async () => {
    setFingerprintLoading(true);
    try {
      const saved = getSavedFingerprintHash();
      setSavedFingerprint(saved);

      const deviceData = await getDeviceFingerprint();
      setFingerprint(deviceData.fingerprint);
      setFingerprintHash(deviceData.hash);

      if (saved) {
        const match = compareFingerprints(deviceData.hash, saved.hash);
        setFingerprintMatch(match);
        
        if (!match) {
          console.warn('⚠️ Fingerprint không khớp! Có thể có người khác đang sử dụng tài khoản này.');
        }
      }
    } catch (error) {
      console.error('Lỗi khi load fingerprint:', error);
    } finally {
      setFingerprintLoading(false);
    }
  };

  // Lưu fingerprint hiện tại
  const handleSaveFingerprint = () => {
    if (fingerprintHash) {
      const success = saveFingerprintHash(fingerprintHash);
      if (success) {
        alert('✅ Đã lưu fingerprint thành công!');
        loadFingerprint();
      } else {
        alert('❌ Lỗi khi lưu fingerprint!');
      }
    }
  };

  // Xóa fingerprint đã lưu
  const handleClearFingerprint = () => {
    if (window.confirm('Bạn có chắc muốn xóa fingerprint đã lưu?')) {
      localStorage.removeItem('deviceFingerprint');
      setSavedFingerprint(null);
      setFingerprintMatch(null);
      alert('✅ Đã xóa fingerprint!');
    }
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
          {/* Fingerprint Panel */}
          <div className="fingerprint-panel">
            <h2>🔐 Device Fingerprint (Chống thi hộ)</h2>
            <div className="fingerprint-content">
              {fingerprintLoading ? (
                <div className="fingerprint-loading">Đang thu thập fingerprint...</div>
              ) : (
                <>
                  <div className="fingerprint-status">
                    {fingerprint && (
                      <div className="fingerprint-ip-section">
                        <label>IP Address:</label>
                        <div className="ip-display">
                          <span className={fingerprint.ipAddress === 'unknown' ? 'ip-unknown' : 'ip-address'}>
                            {fingerprint.ipAddress}
                          </span>
                          {fingerprint.ipAddress !== 'unknown' && (
                            <button 
                              className="btn-copy-ip"
                              onClick={() => {
                                navigator.clipboard.writeText(fingerprint.ipAddress);
                                alert('✅ Đã copy IP!');
                              }}
                              title="Copy IP"
                            >
                              📋
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="fingerprint-hash-section">
                      <label>Fingerprint Hash:</label>
                      <div className="hash-display">
                        <code>{fingerprintHash || 'Chưa có'}</code>
                        <button 
                          className="btn-copy-hash"
                          onClick={() => {
                            navigator.clipboard.writeText(fingerprintHash);
                            alert('✅ Đã copy hash!');
                          }}
                          title="Copy hash"
                        >
                          📋
                        </button>
                      </div>
                    </div>

                    {savedFingerprint && (
                      <div className="fingerprint-comparison">
                        <div className={`match-status ${fingerprintMatch ? 'match' : 'mismatch'}`}>
                          {fingerprintMatch ? (
                            <>
                              <span className="status-icon">✅</span>
                              <span>Fingerprint khớp với thiết bị đã lưu</span>
                            </>
                          ) : (
                            <>
                              <span className="status-icon">⚠️</span>
                              <span>Fingerprint KHÔNG khớp! Có thể có người khác đang dùng tài khoản này</span>
                            </>
                          )}
                        </div>
                        <div className="saved-info">
                          <small>
                            Đã lưu lúc: {new Date(savedFingerprint.timestamp).toLocaleString('vi-VN')}
                          </small>
                        </div>
                      </div>
                    )}

                    {!savedFingerprint && (
                      <div className="fingerprint-save-prompt">
                        <p>Chưa có fingerprint được lưu. Nhấn nút bên dưới để lưu fingerprint của thiết bị này.</p>
                      </div>
                    )}
                  </div>

                  <div className="fingerprint-actions">
                    <button 
                      className="btn-save-fingerprint"
                      onClick={handleSaveFingerprint}
                      disabled={!fingerprintHash}
                    >
                      💾 Lưu Fingerprint
                    </button>
                    <button 
                      className="btn-refresh-fingerprint"
                      onClick={loadFingerprint}
                    >
                      🔄 Làm mới
                    </button>
                    {savedFingerprint && (
                      <button 
                        className="btn-clear-fingerprint"
                        onClick={handleClearFingerprint}
                      >
                        🗑️ Xóa Fingerprint đã lưu
                      </button>
                    )}
                    <button 
                      className="btn-toggle-details"
                      onClick={() => setFingerprintDetails(!fingerprintDetails)}
                    >
                      {fingerprintDetails ? '👁️‍🗨️ Ẩn chi tiết' : '🔍 Xem chi tiết'}
                    </button>
                  </div>

                  {fingerprintDetails && fingerprint && (
                    <div className="fingerprint-details">
                      <h3>Chi tiết Fingerprint:</h3>
                      <div className="details-grid">
                        <div className="detail-item">
                          <strong>IP Address:</strong>
                          <span className={fingerprint.ipAddress === 'unknown' ? 'ip-unknown' : 'ip-address'}>
                            {fingerprint.ipAddress}
                            {fingerprint.ipAddress !== 'unknown' && (
                              <button 
                                className="btn-copy-ip"
                                onClick={() => {
                                  navigator.clipboard.writeText(fingerprint.ipAddress);
                                  alert('✅ Đã copy IP!');
                                }}
                                title="Copy IP"
                              >
                                📋
                              </button>
                            )}
                          </span>
                        </div>
                        <div className="detail-item">
                          <strong>User Agent:</strong>
                          <span>{fingerprint.userAgent}</span>
                        </div>
                        <div className="detail-item">
                          <strong>Platform:</strong>
                          <span>{fingerprint.platform}</span>
                        </div>
                        <div className="detail-item">
                          <strong>Language:</strong>
                          <span>{fingerprint.language}</span>
                        </div>
                        <div className="detail-item">
                          <strong>Screen:</strong>
                          <span>{fingerprint.screenWidth}x{fingerprint.screenHeight} ({fingerprint.screenColorDepth}bit)</span>
                        </div>
                        <div className="detail-item">
                          <strong>Device Pixel Ratio:</strong>
                          <span>{fingerprint.devicePixelRatio}</span>
                        </div>
                        <div className="detail-item">
                          <strong>Timezone:</strong>
                          <span>{fingerprint.timezone} (UTC{fingerprint.timezoneOffset > 0 ? '-' : '+'}{Math.abs(fingerprint.timezoneOffset / 60)})</span>
                        </div>
                        <div className="detail-item">
                          <strong>Hardware:</strong>
                          <span>CPU cores: {fingerprint.hardwareConcurrency}, Memory: {fingerprint.deviceMemory || 'N/A'}GB</span>
                        </div>
                        <div className="detail-item">
                          <strong>WebGL Vendor:</strong>
                          <span>{fingerprint.webglVendor || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <strong>WebGL Renderer:</strong>
                          <span>{fingerprint.webglRenderer || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <strong>Canvas Hash:</strong>
                          <span className="hash-preview">{fingerprint.canvasHash ? fingerprint.canvasHash.substring(0, 50) + '...' : 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <strong>Audio Hash:</strong>
                          <span>{fingerprint.audioHash || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <strong>Storage Support:</strong>
                          <span>LocalStorage: {fingerprint.localStorage ? '✅' : '❌'}, SessionStorage: {fingerprint.sessionStorage ? '✅' : '❌'}, IndexedDB: {fingerprint.indexedDB ? '✅' : '❌'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="test-info-panel">
            <h2>Hướng dẫn Test</h2>
            <div className="instructions">
              <p><strong>Để test các tính năng giám sát:</strong></p>
              <ol>
                <li>
                  <strong>Test Fingerprint:</strong> Xem fingerprint của thiết bị, lưu và so sánh. 
                  Thử mở trên thiết bị/browser khác để xem sự khác biệt.
                </li>
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
                <div className="feature-card">
                  <div className="feature-icon">🔐</div>
                  <h3>Device Fingerprint</h3>
                  <p>Thu thập và hash thông tin thiết bị để phát hiện và ngăn chặn việc thi hộ</p>
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

