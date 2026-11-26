// Settings in grouped cards: language (English / Urdu), read aloud, account, about. DESIGN.md section 10.
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Dialog, Portal, Switch } from 'react-native-paper';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { doc, setDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

import AppText from '../components/AppText';
import FadeInCard from '../components/FadeInCard';
import ScreenHeader from '../components/ScreenHeader';
import Card from '../components/ui/Card';
import ListRow from '../components/ui/ListRow';
import PrimaryButton from '../components/ui/PrimaryButton';
import RadioCard from '../components/ui/RadioCard';
import SectionHeader from '../components/ui/SectionHeader';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useWelcome } from '../context/WelcomeContext';
import { db } from '../firebase';
import { changeLanguageAndRestart } from '../i18n';
import { logout } from '../services/authService';
import { loadDemoData } from '../services/demoService';
import { colors, fonts, radius, screenPadding, spacing } from '../theme';

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
  const { replayWelcome } = useWelcome();
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
        <FadeInCard index={0}>
          <View style={styles.section}>
            <SectionHeader title={t('settings.language')} />
            <View style={styles.langRow}>
              {LANGUAGES.map((lang) => {
                const selected = current === lang.code;
                return (
                  <RadioCard
                    key={lang.code}
                    label={lang.label}
                    fontFamily={lang.font}
                    selected={selected}
                    onPress={() => { if (!selected) setPending(lang.code); }}
                    style={styles.flex}
                  />
                );
              })}
            </View>
            <AppText variant="caption" color={colors.textSecondary}>{t('settings.languageNote')}</AppText>
            {manualRestart ? (
              <View style={styles.notice}>
                <AppText variant="body" color={colors.warningTitle}>{t('settings.restartManually')}</AppText>
              </View>
            ) : null}
          </View>
        </FadeInCard>

        {/* Read aloud */}
        <FadeInCard index={1}>
          <View style={styles.section}>
            <SectionHeader title={t('settings.voice')} />
            <Card style={styles.group}>
              <ListRow
                first
                icon="volume-high-outline"
                label={t('settings.readAloud')}
                hint={t('settings.readAloudHint')}
                right={<Switch value={readAloud} onValueChange={setReadAloud} color={colors.primary} />}
              />
            </Card>
          </View>
        </FadeInCard>

        {/* Account */}
        <FadeInCard index={2}>
          <View style={styles.section}>
            <SectionHeader title={t('settings.account')} />
            <Card style={styles.group}>
              <ListRow first icon="mail-outline" label={t('settings.email')} value={user?.email || '-'} />
            </Card>
          </View>
        </FadeInCard>

        {/* About */}
        <FadeInCard index={3}>
          <View style={styles.section}>
            <SectionHeader title={t('settings.about')} />
            <Card style={styles.group}>
              <ListRow first icon="wallet-outline" label={t('app.name')} hint={t('app.tagline')} />
              <ListRow
                icon="information-circle-outline"
                label={t('settings.version')}
                right={<AppText style={styles.version}>{Constants.expoConfig?.version || '1.0.0'}</AppText>}
              />
              <ListRow
                icon="shield-checkmark-outline"
                iconColor={colors.danger}
                label={t('settings.scamHelp')}
                accessibilityRole="link"
                onPress={() => Linking.openURL(`tel:${PTA_NUMBER}`)}
              />
            </Card>

            {/* Small, secondary actions */}
            <Card style={styles.group}>
              <ListRow
                first
                icon="flask-outline"
                iconColor={colors.textSecondary}
                labelColor={colors.textBody}
                label={t('settings.demoLoad')}
                onPress={() => { setDemoMessage(''); setDemoAsk(true); }}
              />
              <ListRow
                icon="refresh-outline"
                iconColor={colors.textSecondary}
                labelColor={colors.textBody}
                label={t('settings.showWelcome')}
                onPress={replayWelcome}
              />
            </Card>
            {demoMessage ? (
              <View style={styles.notice}>
                <AppText variant="body" color={colors.warningTitle}>{t(demoMessage)}</AppText>
              </View>
            ) : null}
          </View>
        </FadeInCard>

        <FadeInCard index={4}>
          <PrimaryButton label={t('auth.logout')} icon="log-out-outline" variant="text" tone="danger" onPress={logout} />
        </FadeInCard>
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
  scroll: { padding: screenPadding, paddingBottom: spacing.xxl, gap: spacing.xl },
  section: { gap: spacing.sm },
  langRow: { flexDirection: 'row', gap: spacing.sm },
  group: { padding: 0, overflow: 'hidden' },
  notice: { backgroundColor: colors.warningLight, borderColor: colors.warningBorder, borderWidth: 1, borderRadius: radius.input, padding: 12 },
  version: { fontFamily: fonts.en.medium, fontSize: 15, color: colors.textBody },
  dialog: { backgroundColor: colors.surfaceRaised, borderRadius: radius.card },
});
