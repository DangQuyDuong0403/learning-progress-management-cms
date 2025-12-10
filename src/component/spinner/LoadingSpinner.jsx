import React from 'react';
import Spinner from './Spinner';

/**
 * Component LoadingSpinner - Sử dụng để hiển thị loading
 * @param {boolean} loading - Trạng thái loading
 * @param {string} message - Thông báo hiển thị khi loading
 * @param {React.ReactNode} children - Nội dung hiển thị khi không loading
 */
const LoadingSpinner = ({ loading = false, message = "Đang tải...", children }) => {
  if (loading) {
    return <Spinner message={message} />;
  }
  
  return children || null;
};

export default LoadingSpinner;
