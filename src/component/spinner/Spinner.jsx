import React from 'react';
import './Spinner.css';

const Spinner = ({ message = "Đang tải..." }) => {
  return (
    <div className="spinner-container">
      <div className="spinner-overlay">
        <div className="spinner-content">
          {/* Trái đất */}
          <div className="earth">
            <div className="earth-surface"></div>
          </div>
          
          {/* Tên lửa bay xung quanh */}
          <div className="rocket-orbit">
            <div className="rocket rocket-1">🚀</div>
            <div className="rocket rocket-2">🚀</div>
            <div className="rocket rocket-3">🚀</div>
          </div>
          
          {/* Vòng tròn quỹ đạo */}
          <div className="orbit-ring orbit-ring-1"></div>
          <div className="orbit-ring orbit-ring-2"></div>
          
          {/* Loading message */}
          <div className="loading-message">
            <h3>{message}</h3>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Spinner;
