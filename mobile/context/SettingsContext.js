// App settings kept on the phone. Right now: "Read aloud" (voice replies on or off).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Speech from 'expo-speech';

const KEY = 'readAloud';
const SettingsContext = createContext({ readAloud: true, setReadAloud: () => {} });

export function SettingsProvider({ children }) {
  const [readAloud, setReadAloudState] = useState(true); // on by default

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => { if (v === 'false') setReadAloudState(false); })
      .catch(() => {});
  }, []);

  const setReadAloud = useCallback((value) => {
    setReadAloudState(value);
    if (!value) Speech.stop(); // turning it off stops anything being read right now
    AsyncStorage.setItem(KEY, String(value)).catch(() => {});
  }, []);

  const value = useMemo(() => ({ readAloud, setReadAloud }), [readAloud, setReadAloud]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
