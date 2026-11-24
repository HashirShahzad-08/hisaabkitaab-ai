// Settings: language (English / Urdu), read aloud, account, about. DESIGN.md section 10.
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Dialog, Portal, Switch } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { doc, setDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

import AppText from '../components/AppText';
import ScreenHeader from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { db } from '../firebase';
import { changeLanguageAndRestart } from '../i18n';
import { logout } from '../services/authService';
import { loadDemoData } from '../services/demoService';
import { colors, fonts, radius, screenPadding, sizes } from '../theme';

const LANGUAGES = [
  { code: 'en', label: 'English', font: fonts.en.semibold },
  { code: 'ur', label: 'اردو', font: fonts.ur.semibold }, // each language is always written in its own script
];

const PTA_NUMBER = '080055055'; // 0800-55055

// Save the choice on the user's profile too (best effort: never blocks or breaks the switch)
function saveLanguageToProfile(uid, language) {
  if (!uid) return Promise.resolve();
  const save = setDoc(doc(db, 'users', uid, 'profile', 'main'), { language }, { merge: true }).catch(() => {});
  return Promise.race([save, new Promise((resolve) => setTimeout(resolve, 1500))]);
}

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { readAloud, setReadAloud } = useSettings();
  const current = i18n.language === 'ur' ? 'ur' : 'en';

  const [pending, setPending] = useState(null); // the language the user tapped, waiting for "Restart"
  const [restarting, setRestarting] = useState(false);
  const [manualRestart, setManualRestart] = useState(false);
  const [demoAsk, setDemoAsk] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [demoMessage, setDemoMessage] = useState(''); // an i18n key, shown under About

  async function confirmDemo() {
    setDemoBusy(true);
    try {
      await loadDemoData(user.uid, current);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDemoMessage('settings.demoDone');
    } catch (e) {
      setDemoMessage('settings.demoError');
    }
    setDemoBusy(false);
    setDemoAsk(false);
  }

  async function confirmRestart() {
    const language = pending;
    setRestarting(true);
    await saveLanguageToProfile(user?.uid, language);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ok = await changeLanguageAndRestart(language);
    if (!ok) {
      // this build cannot restart itself: the direction changes the next time the app is opened
      setPending(null);
      setRestarting(false);
      setManualRestart(true);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title={t('settings.title')} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Language */}
        <AppText variant="h2">{t('settings.language')}</AppText>
        <View style={styles.langRow}>
          {LANGUAGES.map((lang) => {
            const selected = current === lang.code;
            return (
              <Pressable
                key={lang.code}
                onPress={() => { if (!selected) setPending(lang.code); }}
                style={[styles.langCard, selected && styles.langCardOn]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={lang.label}
              >
                <Ionicons
                  name={selected ? 'checkmark-circle' : 'radio-button-off'}
                  size={24}
                  color={selected ? colors.primary : colors.textSecondary}
                />
                <AppText variant="h2" style={[styles.langLabel, { fontFamily: lang.font }]}>{lang.label}</AppText>
              </Pressable>
            );
          })}
        </View>
        <AppText variant="caption" color={colors.textSecondary}>{t('settings.languageNote')}</AppText>
        {manualRestart ? (
          <View style={styles.notice}>
            <AppText variant="body" color={colors.text}>{t('settings.restartManually')}</AppText>
          </View>
        ) : null}

        {/* Read aloud */}
        <AppText variant="h2" style={styles.section}>{t('settings.voice')}</AppText>
        <View style={[styles.card, styles.switchRow]}>
          <View style={styles.flex}>
            <AppText variant="bodyMedium">{t('settings.readAloud')}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>{t('settings.readAloudHint')}</AppText>
          </View>
          <Switch value={readAloud} onValueChange={setReadAloud} color={colors.primary} />
        </View>

        {/* Account */}
        <AppText variant="h2" style={styles.section}>{t('settings.account')}</AppText>
        <View style={styles.card}>
          <AppText variant="caption" color={colors.textSecondary}>{t('settings.email')}</AppText>
          <AppText variant="body" style={styles.email}>{user?.email || '-'}</AppText>
        </View>
        <Button
          mode="outlined"
          onPress={logout}
          textColor={colors.danger}
          style={styles.logout}
          contentStyle={{ height: sizes.button }}
          labelStyle={{ fontFamily: current === 'ur' ? fonts.ur.semibold : fonts.en.semibold }}
        >
          {t('auth.logout')}
        </Button>

        {/* About */}
        <AppText variant="h2" style={styles.section}>{t('settings.about')}</AppText>
        <View style={styles.card}>
          <AppText variant="h2" color={colors.primary}>{t('app.name')}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>{t('app.tagline')}</AppText>
          <View style={styles.aboutRow}>
            <AppText variant="body" color={colors.textSecondary} style={styles.flex}>{t('settings.version')}</AppText>
            <AppText style={styles.version}>{Constants.expoConfig?.version || '1.0.0'}</AppText>
          </View>
          <Pressable
            onPress={() => Linking.openURL(`tel:${PTA_NUMBER}`)}
            style={styles.aboutRow}
            accessibilityRole="link"
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.danger} />
            <AppText variant="bodyMedium" style={styles.flex}>{t('settings.scamHelp')}</AppText>
          </Pressable>
        </View>
        <Pressable
          onPress={() => { setDemoMessage(''); setDemoAsk(true); }}
          style={styles.demoLink}
          accessibilityRole="button"
        >
          <Ionicons name="flask-outline" size={16} color={colors.textSecondary} />
          <AppText variant="caption" color={colors.textSecondary}>{t('settings.demoLoad')}</AppText>
        </Pressable>
        {demoMessage ? (
          <View style={styles.notice}>
            <AppText variant="body" color={colors.text}>{t(demoMessage)}</AppText>
          </View>
        ) : null}
      </ScrollView>

      <Portal>
        <Dialog visible={!!pending} onDismiss={() => !restarting && setPending(null)} style={styles.dialog}>
          <Dialog.Title><AppText variant="h2">{t('settings.restartTitle')}</AppText></Dialog.Title>
          <Dialog.Content><AppText variant="body">{t('settings.restartText')}</AppText></Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPending(null)} textColor={colors.textSecondary} disabled={restarting}>{t('common.cancel')}</Button>
            <Button onPress={confirmRestart} textColor={colors.primary} loading={restarting} disabled={restarting}>{t('settings.restart')}</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={demoAsk} onDismiss={() => !demoBusy && setDemoAsk(false)} style={styles.dialog}>
          <Dialog.Title><AppText variant="h2">{t('settings.demoTitle')}</AppText></Dialog.Title>
          <Dialog.Content><AppText variant="body">{t('settings.demoText')}</AppText></Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDemoAsk(false)} textColor={colors.textSecondary} disabled={demoBusy}>{t('common.cancel')}</Button>
            <Button onPress={confirmDemo} textColor={colors.primary} loading={demoBusy} disabled={demoBusy}>{t('settings.demoConfirm')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: screenPadding, paddingBottom: 48, gap: 12 },
  section: { marginTop: 12 },
  langRow: { flexDirection: 'row', gap: 12 },
  langCard: {
    flex: 1,
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.border,
  },
  langCardOn: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  langLabel: { flex: 1 },
  notice: { backgroundColor: colors.warningLight, borderRadius: radius.input, padding: 12 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 16, gap: 4, elevation: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  email: { fontFamily: fonts.en.regular },
  logout: { borderRadius: radius.button, borderColor: colors.danger },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: sizes.touch },
  version: { fontFamily: fonts.en.medium, fontSize: 15, color: colors.text },
  demoLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: sizes.touch },
  dialog: { backgroundColor: colors.surface, borderRadius: radius.card },
});
