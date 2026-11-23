// Firebase setup. No Analytics on purpose.
// Note: these web config values are identifiers, not secrets. Real protection comes from
// Firebase Authentication and Firestore security rules.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDuqs65PfUd9BQZLoBtFYVl4lNezqylcdI',
  authDomain: 'hisaabkitaab-ai.firebaseapp.com',
  projectId: 'hisaabkitaab-ai',
  storageBucket: 'hisaabkitaab-ai.firebasestorage.app',
  messagingSenderId: '1071238749712',
  appId: '1:1071238749712:web:82b7d839b388bad53cf495',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// initializeAuth can only run once. After a fast refresh it throws, so fall back to getAuth.
let auth;
try {
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch (e) {
  auth = getAuth(app);
}

export { app, auth };
export const db = getFirestore(app);
