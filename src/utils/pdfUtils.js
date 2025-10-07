import * as pdfjsLib from 'pdfjs-dist';

// Cấu hình worker cho pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

/**
 * Trích xuất text từ file PDF
 * @param {File} file - File PDF được upload
 * @returns {Promise<string>} - Text được trích xuất từ PDF
 */
export const extractTextFromPDF = async (file) => {
  try {
    // Chuyển đổi File thành ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Lặp qua tất cả các trang
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Trích xuất text từ page
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }
    
    // Trả về text đã được làm sạch
    return cleanExtractedText(fullText);
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Không thể đọc file PDF. Vui lòng kiểm tra file có hợp lệ không.');
  }
};

/**
 * Làm sạch text được trích xuất từ PDF
 * @param {string} text - Text thô từ PDF
 * @returns {string} - Text đã được làm sạch
 */
const cleanExtractedText = (text) => {
  if (!text) return '';
  
  return text
    // Loại bỏ các ký tự đặc biệt không cần thiết
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Loại bỏ các dòng trống thừa
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // Loại bỏ khoảng trắng thừa ở đầu và cuối dòng
    .replace(/[ \t]+/g, ' ')
    .replace(/^\s+|\s+$/gm, '')
    // Loại bỏ khoảng trắng thừa ở đầu và cuối text
    .trim();
};

/**
 * Kiểm tra file có phải là PDF hợp lệ không
 * @param {File} file - File cần kiểm tra
 * @returns {boolean} - True nếu file hợp lệ
 */
export const isValidPDF = (file) => {
  // Kiểm tra type
  if (file.type !== 'application/pdf') {
    return false;
  }
  
  // Kiểm tra kích thước file (tối đa 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return false;
  }
  
  return true;
};

/**
 * Format kích thước file thành chuỗi dễ đọc
 * @param {number} bytes - Kích thước file tính bằng bytes
 * @returns {string} - Chuỗi kích thước đã format
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
