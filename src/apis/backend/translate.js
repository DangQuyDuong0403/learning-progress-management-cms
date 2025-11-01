import axios from 'axios';

/**
 * Translation API service - Sử dụng nhiều API miễn phí
 * Không cần API key, tự động fallback nếu một API lỗi
 */

/**
 * Dịch text sử dụng MyMemory API (miễn phí, không cần key)
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
 * Tự động thử các API khác nhau nếu một API lỗi
 * @param {string} text - Text cần dịch
 * @returns {Promise<string>} - Text đã dịch
 */
export const translateText = async (text) => {
  // Thử MyMemory API trước (không cần key, miễn phí, ổn định)
  try {
    return await translateWithMyMemory(text, 'en', 'vi');
  } catch (error) {
    console.warn('MyMemory translation failed, trying Google Translate fallback:', error.message);
    
    // Fallback: thử Google Translate không chính thức
    try {
      return await translateWithGoogle(text, 'en', 'vi');
    } catch (fallbackError) {
      console.error('All translation methods failed:', fallbackError);
      throw new Error('Không thể dịch text này. Vui lòng thử lại sau.');
    }
  }
};

/**
 * Dịch text với tùy chọn ngôn ngữ nguồn và đích
 * Tự động thử các API khác nhau nếu một API lỗi
 * @param {string} text - Text cần dịch
 * @param {string} sourceLang - Ngôn ngữ nguồn (mặc định: 'en')
 * @param {string} targetLang - Ngôn ngữ đích (mặc định: 'vi')
 * @returns {Promise<string>} - Text đã dịch
 */
export const translateTextCustom = async (text, sourceLang = 'en', targetLang = 'vi') => {
  // Thử MyMemory API trước
  try {
    return await translateWithMyMemory(text, sourceLang, targetLang);
  } catch (error) {
    console.warn('MyMemory translation failed, trying Google Translate fallback:', error.message);
    
    // Fallback: thử Google Translate không chính thức
    try {
      return await translateWithGoogle(text, sourceLang, targetLang);
    } catch (fallbackError) {
      console.error('All translation methods failed:', fallbackError);
      throw new Error('Không thể dịch text này. Vui lòng thử lại sau.');
    }
  }
};


