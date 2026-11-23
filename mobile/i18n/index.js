// Language setup. Choice is saved in AsyncStorage under "language" ("en" or "ur").
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import ur from './ur.json';

const LANGUAGE_KEY = 'language';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ur: { translation: ur } },
  lng: 'en', // default
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

// Call once at app start to restore the saved language.
export async function loadSavedLanguage() {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved === 'en' || saved === 'ur') {
      await i18n.changeLanguage(saved);
    }
  } catch (e) {
    // If storage fails, stay on English.
  }
}

// Use this from the Settings screen later.
export async function setLanguage(lang) {
  await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch (e) {}
}

export default i18n;
