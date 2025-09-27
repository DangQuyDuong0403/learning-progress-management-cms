import React, { useState } from 'react';
import TableSpinner from './TableSpinner';

const LoadingWithEffect = ({ loading, message = "Đang tải...", children }) => {
  const [showSpinner, setShowSpinner] = useState(loading);
  const [isCompleted, setIsCompleted] = useState(false);

  React.useEffect(() => {
    if (loading) {
      setShowSpinner(true);
      setIsCompleted(false);
    } else if (showSpinner && !loading) {
      // Khi loading kết thúc, bắt đầu hiệu ứng
      setIsCompleted(true);
    }
  }, [loading, showSpinner]);

  const handleAnimationEnd = () => {
    setShowSpinner(false);
    setIsCompleted(false);
  };

  if (!showSpinner) {
    return children || null;
  }

  return (
    <TableSpinner 
      message={message} 
      isCompleted={isCompleted}
      onAnimationEnd={handleAnimationEnd}
    />
  );
};

export default LoadingWithEffect;
