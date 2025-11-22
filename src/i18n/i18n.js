import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import viTranslation from './locales/vi.json';
import enTranslation from './locales/en.json';

const resources = {
  vi: {
    translation: viTranslation
  },
  en: {
    translation: enTranslation
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // KHÔNG set lng cứng ở đây để LanguageDetector có thể tự động phát hiện
    fallbackLng: 'en', // Ngôn ngữ mặc định là tiếng Anh
    debug: false, // Set to true for debugging
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    detection: {
      // Ưu tiên localStorage trước tiên
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Lưu vào localStorage khi thay đổi ngôn ngữ
      caches: ['localStorage'],
      // Tên key trong localStorage
      lookupLocalStorage: 'i18nextLng',
      // Chỉ chấp nhận 'vi' và 'en'
      checkWhitelist: false, // Tắt check whitelist để không bị giới hạn
    }
  })
  .then(() => {
    // Sau khi init xong, đảm bảo ngôn ngữ từ localStorage được áp dụng
    const storedLang = localStorage.getItem('i18nextLng');
    if (storedLang && (storedLang === 'vi' || storedLang === 'en')) {
      // Nếu có ngôn ngữ trong localStorage và khác với ngôn ngữ hiện tại
      if (i18n.language !== storedLang) {
        i18n.changeLanguage(storedLang);
      }
    } else if (!storedLang) {
      // Nếu không có trong localStorage, lưu ngôn ngữ hiện tại vào
      const currentLang = i18n.language || 'en';
      localStorage.setItem('i18nextLng', currentLang);
      if (i18n.language !== currentLang) {
        i18n.changeLanguage(currentLang);
      }
    }
  });

// Đảm bảo mỗi khi changeLanguage được gọi, nó sẽ lưu vào localStorage
const originalChangeLanguage = i18n.changeLanguage.bind(i18n);
i18n.changeLanguage = (lng, ...args) => {
  if (lng && (lng === 'vi' || lng === 'en')) {
    localStorage.setItem('i18nextLng', lng);
  }
  return originalChangeLanguage(lng, ...args);
};

// Lắng nghe sự kiện storage change (khi localStorage thay đổi từ tab khác)
window.addEventListener('storage', (e) => {
  if (e.key === 'i18nextLng') {
    if (e.newValue && (e.newValue === 'vi' || e.newValue === 'en')) {
      // Nếu có ngôn ngữ mới hợp lệ, cập nhật
      i18n.changeLanguage(e.newValue);
    } else if (!e.newValue) {
      // Nếu bị xóa, chỉ reset về tiếng Anh nếu thực sự không có giá trị
      const currentLang = localStorage.getItem('i18nextLng');
      if (!currentLang) {
        i18n.changeLanguage('en');
      }
    }
  }
});

export default i18n;
