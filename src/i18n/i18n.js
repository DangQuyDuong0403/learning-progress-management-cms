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
    lng: 'en', // Ngôn ngữ mặc định là tiếng Anh
    fallbackLng: 'en', // Ngôn ngữ mặc định là tiếng Anh
    debug: false, // Set to true for debugging
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    }
  });

// Thêm logic để theo dõi localStorage và reset về default khi bị xóa
const checkAndResetLanguage = () => {
  const storedLang = localStorage.getItem('i18nextLng');
  if (!storedLang) {
    // Nếu localStorage bị xóa, reset về tiếng Anh
    i18n.changeLanguage('en');
  }
};

// Kiểm tra khi khởi tạo
checkAndResetLanguage();

// Lắng nghe sự kiện storage change
window.addEventListener('storage', (e) => {
  if (e.key === 'i18nextLng' && !e.newValue) {
    // Nếu i18nextLng bị xóa, reset về tiếng Anh
    i18n.changeLanguage('en');
  }
});

export default i18n;
