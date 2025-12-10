import React, { useState, useEffect } from 'react';
import './TableSpinner.css';

const TableSpinner = ({ message = "Đang tải...", isCompleted = false, onAnimationEnd }) => {
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (isCompleted) {
      setAnimationClass('completed');
      if (onAnimationEnd) {
        setTimeout(() => {
          onAnimationEnd();
        }, 1000); // Thời gian của animation fadeOutSuccess
      }
    }
  }, [isCompleted, onAnimationEnd]);

  return (
    <div className={`table-spinner-container ${animationClass}`}>
      <div className="table-spinner-overlay">
        <div className="table-spinner-content">
          {/* Trái đất nhỏ */}
          <div  className="table-earth">
            <img style={{ width: '100px', height: '100px' }} src="/img/planet-5.png" alt="Planet" />
          </div>
          
          {/* 3 UFO bay xung quanh */}
          <div className="table-rocket-orbit">
            <div className="table-rocket table-rocket-1">
              <img src="/img/ufo-1.png" alt="UFO" className="ufo-image" />
            </div>
            <div className="table-rocket table-rocket-2">
              <img src="/img/ufo-1.png" alt="UFO" className="ufo-image" />
            </div>
          
          </div>
          
          {/* Loading message */}
          <div className="table-loading-message">
            <span>{message}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableSpinner;
