// Root layout: loads fonts + saved language + login state, then shows Login or the tabs.
import { useEffect, useMemo, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  NotoNastaliqUrdu_400Regular,
  NotoNastaliqUrdu_500Medium,
  NotoNastaliqUrdu_600SemiBold,
  NotoNastaliqUrdu_700Bold,
} from '@expo-google-fonts/noto-nastaliq-urdu';
import { useTranslation } from 'react-i18next';

import { loadSavedLanguage } from '../i18n';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { getPaperTheme } from '../theme';

SplashScreen.preventAutoHideAsync();

function Routes() {
  const { user, loading } = useAuth();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    NotoNastaliqUrdu_400Regular,
    NotoNastaliqUrdu_500Medium,
    NotoNastaliqUrdu_600SemiBold,
    NotoNastaliqUrdu_700Bold,
  });
  const [langReady, setLangReady] = useState(false);

  useEffect(() => {
    loadSavedLanguage().finally(() => setLangReady(true));
  }, []);

  const ready = fontsLoaded && langReady && !loading;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Logged in: the tabs */}
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-transaction" />
        <Stack.Screen name="sms-entry" />
        <Stack.Screen name="quick-entry" />
        <Stack.Screen name="afford" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="bill-form" />
        <Stack.Screen name="bill-result" />
      </Stack.Protected>
      {/* Logged out: login and sign up */}
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'ur' ? 'ur' : 'en';
  const theme = useMemo(() => getPaperTheme(lang), [lang]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <StatusBar style="dark" />
          <Routes />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
