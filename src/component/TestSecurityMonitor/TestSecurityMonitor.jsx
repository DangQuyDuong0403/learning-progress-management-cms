import React from 'react';
import { useTestSecurity } from '../../hooks/useTestSecurity';
import './TestSecurityMonitor.css';

/**
 * Component để hiển thị log và thống kê các hành động vi phạm trong test
 */
const TestSecurityMonitor = ({ 
  enabled = true, 
  onViolation = null,
  showPanel = true,
  position = 'top-right' // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
}) => {
  const { logs, stats, resetLogs } = useTestSecurity(enabled, onViolation);
  const [isMinimized, setIsMinimized] = React.useState(false);

  if (!enabled) {
    return null;
  }

  const positionClasses = {
    'top-right': 'monitor-top-right',
    'top-left': 'monitor-top-left',
    'bottom-right': 'monitor-bottom-right',
    'bottom-left': 'monitor-bottom-left'
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'tab_switch':
        return '🔄 Chuyển tab';
      case 'copy':
        return '📋 Copy';
      case 'paste':
        return '📥 Paste';
      default:
        return type;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'tab_switch':
        return '#ff9800';
      case 'copy':
        return '#f44336';
      case 'paste':
        return '#9c27b0';
      default:
        return '#666';
    }
  };

  if (!showPanel) {
    return null;
  }

  return (
    <div className={`test-security-monitor ${positionClasses[position]} ${isMinimized ? 'minimized' : ''}`}>
      <div className="monitor-header">
        <div className="monitor-title">
          <span className="monitor-icon">🛡️</span>
          <span>Giám sát Test</span>
          {stats.totalViolations > 0 && (
            <span className="violation-badge">{stats.totalViolations}</span>
          )}
        </div>
        <div className="monitor-actions">
          <button 
            className="monitor-btn reset-btn" 
            onClick={resetLogs}
            title="Reset logs"
          >
            🔄
          </button>
          <button 
            className="monitor-btn minimize-btn" 
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Mở rộng" : "Thu nhỏ"}
          >
            {isMinimized ? '⬆️' : '⬇️'}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="monitor-stats">
            <div className="stat-item">
              <div className="stat-label">Chuyển tab</div>
              <div className="stat-value tab-switch">{stats.tabSwitches}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Copy</div>
              <div className="stat-value copy-attempt">{stats.copyAttempts}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Paste</div>
              <div className="stat-value paste-attempt">{stats.pasteAttempts}</div>
            </div>
            <div className="stat-item total">
              <div className="stat-label">Tổng vi phạm</div>
              <div className="stat-value total-violations">{stats.totalViolations}</div>
            </div>
          </div>

          <div className="monitor-logs">
            <div className="logs-header">Nhật ký hoạt động</div>
            <div className="logs-content">
              {logs.length === 0 ? (
                <div className="no-logs">Chưa có vi phạm nào</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="log-item">
                    <div className="log-header">
                      <span 
                        className="log-type" 
                        style={{ color: getTypeColor(log.type) }}
                      >
                        {getTypeLabel(log.type)}
                      </span>
                      <span className="log-time">{log.timestampDisplay}</span>
                    </div>
                    <div className="log-message">{log.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TestSecurityMonitor;

