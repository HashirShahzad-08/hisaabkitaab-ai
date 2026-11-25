// Decides if the first-run welcome flow must be shown.
// It is shown only when BOTH are true: the "welcome done" flag is missing (on this phone and in the
// Firestore profile) AND the user has no transactions yet. Existing users never see it.
// gate: "checking" (still deciding) | "show" (welcome) | "skip" (go to the app)
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, getDoc, getDocs, limit, query } from 'firebase/firestore';

import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { saveWelcomeDone } from '../services/profileService';

export const WELCOME_STEP_KEY = 'welcomeStep'; // where to continue after the language restart
const doneKey = (uid) => `welcomeDone_${uid}`;

const WelcomeContext = createContext({ gate: 'skip', replay: false, finish: async () => {}, replayWelcome: () => {} });

const timeout = (ms) => new Promise((resolve) => setTimeout(() => resolve('timeout'), ms));

async function shouldShow(uid) {
  try {
    if ((await AsyncStorage.getItem(doneKey(uid))) === '1') return false;
  } catch (e) {
    // storage failed: carry on with the Firestore check
  }
  try {
    const checks = Promise.all([
      getDoc(doc(db, 'users', uid, 'profile', 'main')),
      getDocs(query(collection(db, 'users', uid, 'transactions'), limit(1))),
    ]);
    const result = await Promise.race([checks, timeout(6000)]);
    if (result === 'timeout') return false; // cannot tell: never block the app
    const [profile, transactions] = result;
    if (profile.exists() && profile.data().welcomeDone) {
      AsyncStorage.setItem(doneKey(uid), '1').catch(() => {});
      return false;
    }
    if (!transactions.empty) {
      AsyncStorage.setItem(doneKey(uid), '1').catch(() => {}); // an existing user
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

export function WelcomeProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [gate, setGate] = useState('checking');
  const [replay, setReplay] = useState(false);

  useEffect(() => {
    if (!uid) {
      setGate('skip');
      setReplay(false);
      return undefined;
    }
    let cancelled = false;
    setGate('checking');
    shouldShow(uid).then((show) => {
      if (!cancelled) setGate(show ? 'show' : 'skip');
    });
    return () => { cancelled = true; };
  }, [uid]);

  const finish = useCallback(async () => {
    if (uid) {
      try {
        await AsyncStorage.setItem(doneKey(uid), '1');
        await AsyncStorage.removeItem(WELCOME_STEP_KEY);
      } catch (e) {}
      await saveWelcomeDone(uid);
    }
    setReplay(false);
    setGate('skip');
  }, [uid]);

  const replayWelcome = useCallback(() => {
    AsyncStorage.removeItem(WELCOME_STEP_KEY).catch(() => {});
    setReplay(true);
    setGate('show');
  }, []);

  const value = useMemo(() => ({ gate, replay, finish, replayWelcome }), [gate, replay, finish, replayWelcome]);
  return <WelcomeContext.Provider value={value}>{children}</WelcomeContext.Provider>;
}

export const useWelcome = () => useContext(WelcomeContext);
