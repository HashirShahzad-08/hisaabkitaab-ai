// Language and layout direction.
// The language is saved in AsyncStorage under "language" ("en" or "ur").
// Urdu is right-to-left. RN flips layouts natively through I18nManager, but a change only takes effect
// after the app restarts, so starting the app and switching language both handle that here.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { DevSettings, I18nManager } from 'react-native';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import ur from './ur.json';

const LANGUAGE_KEY = 'language';
const RELOAD_KEY = 'rtlReloadTried'; // stops a restart loop if the phone refuses to change direction

I18nManager.allowRTL(true);

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ur: { translation: ur } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

// First install: Urdu if the phone is set to Urdu, otherwise English.
function phoneLanguage() {
  try {
    const code = Localization.getLocales?.()[0]?.languageCode;
    return code === 'ur' ? 'ur' : 'en';
  } catch (e) {
    return 'en';
  }
}

export const isUrduLanguage = (lang) => lang === 'ur';

// Restarts the app. Returns false if this build cannot restart itself (the user must reopen the app).
export async function reloadApp() {
  try {
    const Updates = require('expo-updates');
    await Updates.reloadAsync();
    return true;
  } catch (e) {
    if (__DEV__ && DevSettings?.reload) {
      DevSettings.reload();
      return true;
    }
    return false;
  }
}

// Call once at app start, BEFORE the first screen. Loads the language and makes the layout direction match.
// Returns true when the app has to restart once to flip the direction (keep the splash screen up).
export async function loadSavedLanguage() {
  let lang = 'en';
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved === 'en' || saved === 'ur') {
      lang = saved;
    } else {
      lang = phoneLanguage();
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    }
  } catch (e) {
    // storage failed: stay on English
  }
  await i18n.changeLanguage(lang);

  const wantRTL = isUrduLanguage(lang);
  I18nManager.allowRTL(true);
  if (I18nManager.isRTL === wantRTL) {
    try { await AsyncStorage.removeItem(RELOAD_KEY); } catch (e) {}
    return false;
  }
  I18nManager.forceRTL(wantRTL);
  try {
    if ((await AsyncStorage.getItem(RELOAD_KEY)) === String(wantRTL)) return false; // already tried once
    await AsyncStorage.setItem(RELOAD_KEY, String(wantRTL));
  } catch (e) {
    return false;
  }
  return true;
}

// Settings screen: save the new language, set the direction, and restart so it applies everywhere.
// Returns false if the app could not restart by itself.
export async function changeLanguageAndRestart(lang) {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    await AsyncStorage.removeItem(RELOAD_KEY);
  } catch (e) {}
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(isUrduLanguage(lang));
  return reloadApp();
}

export default i18n;
