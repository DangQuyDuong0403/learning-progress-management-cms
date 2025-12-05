import axios from 'axios';
import axiosClient from '../index.js';

/**
 * Translation API service - Sử dụng API backend mới với fallback về các API miễn phí
 */

/**
 * Dịch text sử dụng API backend mới (Azure Translator)
 * @param {string} text - Text cần dịch
 * @param {string} sourceLang - Ngôn ngữ nguồn (mặc định: 'en')
 * @param {string} targetLang - Ngôn ngữ đích (mặc định: 'vi')
 * @returns {Promise<string>} - Text đã dịch
 */
const translateWithBackendAPI = async (text, sourceLang = 'en', targetLang = 'vi') => {
  try {
    // Build absolute URL to /api/openai/translate
    const base = (typeof axiosClient?.defaults?.baseURL === 'string') ? axiosClient.defaults.baseURL : '';
    const baseApi = base.includes('/api/v1')
      ? base.replace('/api/v1', '/api')
      : (base.endsWith('/api') ? base : (base.replace(/\/$/, '') + '/api'));
    const absoluteUrl = `${baseApi}/translation/translate`;

    const response = await axiosClient.post(absoluteUrl, { text }, {
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*',
      },
    });

    // axiosClient interceptor returns response.data, so response is already the data object
    // Response format: { traceId, success, message, data: { originalText, translatedText, fromLanguage, toLanguage }, timestamp }
    if (response && response.success && response.data && response.data.translatedText) {
      return response.data.translatedText;
    }
    
    console.error('❌ Invalid response format:', response);
    throw new Error('Invalid backend API response');
  } catch (error) {
    console.error('❌ Translate API error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

/**
 * Dịch text sử dụng MyMemory API (miễn phí, không cần key) - Fallback
 * @param {string} text - Text cần dịch
 * @param {string} sourceLang - Ngôn ngữ nguồn
 * @param {string} targetLang - Ngôn ngữ đích
 * @returns {Promise<string>} - Text đã dịch
 */
const translateWithMyMemory = async (text, sourceLang = 'en', targetLang = 'vi') => {
  try {
    const response = await axios.get(
      `https://api.mymemory.translated.net/get`,
      {
        params: {
          q: text,
          langpair: `${sourceLang}|${targetLang}`
        },
        timeout: 10000
      }
    );

    if (response.data && response.data.responseData && response.data.responseData.translatedText) {
      return response.data.responseData.translatedText;
    }
    throw new Error('Invalid MyMemory response');
  } catch (error) {
    throw error;
  }
};

/**
 * Dịch text sử dụng Google Translate không chính thức (fallback)
 * @param {string} text - Text cần dịch
 * @param {string} sourceLang - Ngôn ngữ nguồn
 * @param {string} targetLang - Ngôn ngữ đích
 * @returns {Promise<string>} - Text đã dịch
 */
const translateWithGoogle = async (text, sourceLang = 'en', targetLang = 'vi') => {
  try {
    const response = await axios.get(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`,
      {
        headers: {
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );
    
    if (response.data && response.data[0] && response.data[0][0]) {
      return response.data[0][0][0];
    }
    throw new Error('Invalid Google Translate response');
  } catch (error) {
    throw error;
  }
};

/**
 * Dịch text từ tiếng Anh sang tiếng Việt
 * Thử API backend mới trước, tự động fallback về các API miễn phí nếu lỗi
 * @param {string} text - Text cần dịch
 * @returns {Promise<string>} - Text đã dịch
 */
export const translateText = async (text) => {
  // Thử API backend mới trước (có xác thực, chất lượng tốt hơn)
  try {
    return await translateWithBackendAPI(text, 'en', 'vi');
  } catch (error) {
    console.warn('Backend API translation failed, trying MyMemory fallback:', error.message);
    
    // Fallback: thử MyMemory API
    try {
      return await translateWithMyMemory(text, 'en', 'vi');
    } catch (fallbackError) {
      console.warn('MyMemory translation failed, trying Google Translate fallback:', fallbackError.message);
      
      // Fallback cuối: thử Google Translate không chính thức
      try {
        return await translateWithGoogle(text, 'en', 'vi');
      } catch (finalError) {
        console.error('All translation methods failed:', finalError);
        throw new Error('Không thể dịch text này. Vui lòng thử lại sau.');
      }
    }
  }
};

/**
 * Dịch text với tùy chọn ngôn ngữ nguồn và đích
 * Thử API backend mới trước, tự động fallback về các API miễn phí nếu lỗi
 * @param {string} text - Text cần dịch
 * @param {string} sourceLang - Ngôn ngữ nguồn (mặc định: 'en')
 * @param {string} targetLang - Ngôn ngữ đích (mặc định: 'vi')
 * @returns {Promise<string>} - Text đã dịch
 */
export const translateTextCustom = async (text, sourceLang = 'en', targetLang = 'vi') => {
  // Thử API backend mới trước
  try {
    return await translateWithBackendAPI(text, sourceLang, targetLang);
  } catch (error) {
    console.warn('Backend API translation failed, trying MyMemory fallback:', error.message);
    
    // Fallback: thử MyMemory API
    try {
      return await translateWithMyMemory(text, sourceLang, targetLang);
    } catch (fallbackError) {
      console.warn('MyMemory translation failed, trying Google Translate fallback:', fallbackError.message);
      
      // Fallback cuối: thử Google Translate không chính thức
      try {
        return await translateWithGoogle(text, sourceLang, targetLang);
      } catch (finalError) {
        console.error('All translation methods failed:', finalError);
        throw new Error('Không thể dịch text này. Vui lòng thử lại sau.');
      }
    }
  }
};


