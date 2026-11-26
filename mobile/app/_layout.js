// Root layout: loads fonts + saved language + login state, then shows Login or the tabs.
import { useEffect, useMemo, useState } from 'react';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
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

import { loadSavedLanguage, reloadApp } from '../i18n';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { SettingsProvider } from '../context/SettingsContext';
import { WelcomeProvider, useWelcome } from '../context/WelcomeContext';
import { colors, getPaperTheme } from '../theme';

SplashScreen.preventAutoHideAsync();

// Dark background behind every screen, so nothing flashes white between screens
const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.tabBar,
    text: colors.text,
    border: colors.border,
    notification: colors.danger,
  },
};

function Routes() {
  const { user, loading } = useAuth();
  const { gate } = useWelcome(); // first-run welcome: "show" sends a new user to the welcome screen
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

  // Load the saved language BEFORE the first screen. If the layout direction has to change, restart once
  // and keep the splash screen up meanwhile.
  useEffect(() => {
    loadSavedLanguage()
      .then(async (needsRestart) => {
        if (needsRestart && (await reloadApp())) return;
        setLangReady(true);
      })
      .catch(() => setLangReady(true));
  }, []);

  const ready = fontsLoaded && langReady && !loading && !(user && gate === 'checking');
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      {/* Logged in: the tabs */}
      <Stack.Protected guard={!!user && gate === 'skip'}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-transaction" />
        <Stack.Screen name="sms-entry" />
        <Stack.Screen name="quick-entry" />
        <Stack.Screen name="afford" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="bill-form" />
        <Stack.Screen name="bill-result" />
        <Stack.Screen name="budget-form" />
        <Stack.Screen name="goal-form" />
      </Stack.Protected>
      {/* Logged in, first time only (or "Show welcome again" in Settings): the welcome flow */}
      <Stack.Protected guard={!!user && gate === 'show'}>
        <Stack.Screen name="welcome" />
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
    // direction: rows, margins and text alignment flip by themselves for Urdu (RTL). Setting it here also makes
    // Urdu mirror in Expo Go, where the phone-level RTL switch (I18nManager) is reset.
    <GestureHandlerRootView style={{ flex: 1, direction: lang === 'ur' ? 'rtl' : 'ltr', backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <SettingsProvider>
            <AuthProvider>
              <WelcomeProvider>
                <StatusBar style="light" />
                <ThemeProvider value={navigationTheme}>
                  <Routes />
                </ThemeProvider>
              </WelcomeProvider>
            </AuthProvider>
          </SettingsProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
