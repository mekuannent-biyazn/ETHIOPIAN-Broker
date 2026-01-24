import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import your translation files
import am from "./am.json";
import en from "./en.json";

const resources = {
  en: {
    translation: en,
  },
  am: {
    translation: am,
  },
};

// Get saved language from localStorage or default to 'en'
const savedLanguage = localStorage.getItem("preferred-language") || "en";

i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage, // Use saved language
  fallbackLng: "en",
  debug: process.env.NODE_ENV === "development", // Only debug in development
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  react: {
    useSuspense: false, // Prevents suspense issues
  },
});

export default i18n;
