import React, { useState } from 'react';
import Spinner from '../component/spinner/LoadingSpinner'
import './SpinnerDemo.css';

const SpinnerDemo = () => {
  const [showSpinner, setShowSpinner] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Đang tải...');

  const handleShowSpinner = (message = 'Đang tải...') => {
    setLoadingMessage(message);
    setShowSpinner(true);
    
    // Tự động ẩn spinner sau 5 giây
    setTimeout(() => {
      setShowSpinner(false);
    }, 5000);
  };

  return (
    <div className="spinner-demo">
      <div className="demo-content">
        <h1>Demo Spinner Component</h1>
        <p>Nhấn các nút bên dưới để xem spinner hoạt động:</p>
        
        <div className="demo-buttons">
          <button 
            className="demo-btn primary"
            onClick={() => handleShowSpinner('Đang tải dữ liệu...')}
          >
            Tải dữ liệu
          </button>
          
          <button 
            className="demo-btn secondary"
            onClick={() => handleShowSpinner('Đang xử lý...')}
          >
            Xử lý
          </button>
          
          <button 
            className="demo-btn success"
            onClick={() => handleShowSpinner('Đang kết nối...')}
          >
            Kết nối
          </button>
          
          <button 
            className="demo-btn warning"
            onClick={() => handleShowSpinner('Đang đồng bộ...')}
          >
            Đồng bộ
          </button>
        </div>
        
        <div className="demo-info">
          <h3>Tính năng của Spinner:</h3>
          <ul>
            <li>🌍 Trái đất quay ở giữa với hiệu ứng 3D</li>
            <li>🚀 Nhiều tên lửa bay xung quanh theo quỹ đạo</li>
            <li>⭐ Hiệu ứng sao nhấp nháy trên nền vũ trụ</li>
            <li>📱 Responsive trên mọi thiết bị</li>
            <li>💫 Animation mượt mà và đẹp mắt</li>
          </ul>
        </div>
      </div>
      
      {showSpinner && <Spinner message={loadingMessage} />}
    </div>
  );
};

export default SpinnerDemo;
