// First-run welcome flow: language, what the app does, monthly income, then start fresh or with sample data.
// Shown once after the first login or sign up (see context/WelcomeContext.js).
import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Dialog, Portal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';

import AppText from '../components/AppText';
import PressableScale from '../components/PressableScale';
import RadioCard from '../components/ui/RadioCard';
import KeyboardAvoider from '../components/ui/KeyboardAvoider';
import PrimaryButton from '../components/ui/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { WELCOME_STEP_KEY, useWelcome } from '../context/WelcomeContext';
import useProfile from '../hooks/useProfile';
import { changeLanguageAndRestart } from '../i18n';
import { loadDemoData } from '../services/demoService';
import { saveLanguageToProfile, saveMonthlyIncome } from '../services/profileService';
import { addTransaction, deleteTransaction } from '../services/transactionService';
import { colors, fonts, radius, screenPadding, sizes, spacing } from '../theme';
import { formatNumber } from '../utils/format';

const LANGUAGES = [
  { code: 'en', label: 'English', font: fonts.en.semibold },
  { code: 'ur', label: 'اردو', font: fonts.ur.semibold }, // each language is always written in its own script
];
const SWIPE_DISTANCE = 50;

function Hero({ icon }) {
  return (
    <MotiView
      from={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 12 }}
      style={styles.hero}
    >
      <View style={styles.heroInner}>
        <Ionicons name={icon} size={64} color={colors.accentLight} />
      </View>
    </MotiView>
  );
}

function Dots({ count, index }) {
  return (
    <View style={styles.dots} accessibilityElementsHidden>
      {Array.from({ length: count }, (_, i) => (
        <MotiView
          key={i}
          animate={{ width: i === index ? 24 : 8, backgroundColor: i === index ? colors.primary : colors.border }}
          transition={{ type: 'spring', damping: 15 }}
          style={styles.dot}
        />
      ))}
    </View>
  );
}

export default function WelcomeScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { replay, finish } = useWelcome();
  const profile = useProfile(user?.uid);
  const isUrdu = i18n.language === 'ur';
  const current = isUrdu ? 'ur' : 'en';

  // When replaying from Settings the income step is left out (it would add a second salary)
  const steps = useMemo(() => (replay ? ['language', 'intro', 'final'] : ['language', 'intro', 'income', 'final']), [replay]);
  const [index, setIndex] = useState(0);
  const [slide, setSlide] = useState(1); // 1 = new page comes in from the end side, -1 = from the start side
  const step = steps[index];

  // After the language restart, carry on at screen 2
  useEffect(() => {
    AsyncStorage.getItem(WELCOME_STEP_KEY)
      .then((saved) => {
        if (saved) {
          setIndex(Math.min(Number(saved) || 0, steps.length - 1));
          AsyncStorage.removeItem(WELCOME_STEP_KEY).catch(() => {});
        }
      })
      .catch(() => {});
  }, [steps.length]);

  // ---- language
  const [pendingLang, setPendingLang] = useState(null);
  const [restarting, setRestarting] = useState(false);
  const [manualRestart, setManualRestart] = useState(false);

  async function confirmLanguage() {
    const language = pendingLang;
    setRestarting(true);
    try { await AsyncStorage.setItem(WELCOME_STEP_KEY, '1'); } catch (e) {}
    await Promise.race([saveLanguageToProfile(user?.uid, language), new Promise((r) => setTimeout(r, 1500))]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ok = await changeLanguageAndRestart(language);
    if (!ok) {
      setPendingLang(null);
      setRestarting(false);
      setManualRestart(true);
    }
  }

  // ---- income
  const [digits, setDigits] = useState('');
  const [incomeError, setIncomeError] = useState(null);
  const [savingIncome, setSavingIncome] = useState(false);
  const savedIncome = useRef({ digits: '', id: null });
  const incomeBusy = useRef(false); // true while saving: no second save, no swiping away
  const prefilled = useRef(false);
  useEffect(() => {
    if (!prefilled.current && profile?.monthlyIncome) {
      prefilled.current = true;
      setDigits(String(Math.round(profile.monthlyIncome)));
    }
  }, [profile]);

  // Saves this month's income (category Income, note "Salary" in the app language) and monthlyIncome in the profile.
  async function saveIncome() {
    if (incomeBusy.current) return false;
    const amount = Number(digits);
    if (!amount || digits === savedIncome.current.digits) return true; // nothing new to save
    incomeBusy.current = true;
    setSavingIncome(true);
    setIncomeError(null);
    try {
      if (savedIncome.current.id) await deleteTransaction(user.uid, savedIncome.current.id);
      savedIncome.current = { digits: '', id: null };
      const now = new Date();
      const id = await addTransaction(user.uid, {
        amount,
        type: 'income',
        category: 'Income',
        paymentType: 'Bank card',
        date: new Date(now.getFullYear(), now.getMonth(), 1), // salary on the 1st of this month
        note: t('categories.salary'),
        source: 'manual',
      });
      savedIncome.current = { digits: '', id }; // if the next step fails, a retry replaces this one
      await saveMonthlyIncome(user.uid, amount);
      savedIncome.current = { digits, id };
      return true;
    } catch (e) {
      setIncomeError(e?.code === 'permission-denied' ? 'addTx.errors.permission' : 'addTx.errors.generic');
      return false;
    } finally {
      incomeBusy.current = false;
      setSavingIncome(false);
    }
  }

  // ---- moving between screens
  function go(delta) {
    const next = index + delta;
    if (next < 0 || next >= steps.length) return;
    setSlide(delta);
    setIndex(next);
    Haptics.selectionAsync();
  }

  async function onNext() {
    if (incomeBusy.current) return;
    if (step === 'income' && !(await saveIncome())) return;
    go(1);
  }

  // Swipe: toward the start of the line goes forward (left in English, right in Urdu)
  const swipe = useRef(() => {});
  swipe.current = (dx) => {
    if (Math.abs(dx) < SWIPE_DISTANCE || restarting || incomeBusy.current) return;
    const forward = isUrdu ? dx > 0 : dx < 0;
    if (forward) {
      if (step === 'final') return;
      onNext();
    } else {
      go(-1);
    }
  };
  const pan = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
      onPanResponderRelease: (_, g) => swipe.current(g.dx),
    }),
    []
  );

  // ---- finishing
  const [demoAsk, setDemoAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [finalError, setFinalError] = useState(false);

  async function startFresh() {
    setBusy(true);
    await finish();
  }

  async function startWithSample() {
    setBusy(true);
    setFinalError(false);
    try {
      await loadDemoData(user.uid, current);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDemoAsk(false);
      await finish();
    } catch (e) {
      setFinalError(true);
      setDemoAsk(false);
      setBusy(false);
    }
  }

  const labelFont = { fontFamily: isUrdu ? fonts.ur.semibold : fonts.en.semibold };
  const from = { opacity: 0, translateX: (isUrdu ? -1 : 1) * slide * 40 };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        {step !== 'final' ? (
          <PressableScale onPress={() => { setBusy(true); finish(); }} hitSlop={12} pressableStyle={styles.skip}>
            <AppText variant="bodyMedium" color={colors.textSecondary}>{t('welcome.skip')}</AppText>
          </PressableScale>
        ) : null}
      </View>

      <KeyboardAvoider>
        <View style={styles.flex} {...pan.panHandlers}>
          <ScrollView
            contentContainerStyle={styles.page}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <MotiView
              key={step}
              from={from}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              style={styles.pageInner}
            >
              {step === 'language' ? (
                <>
                  <Hero icon="language" />
                  <AppText variant="h1" style={styles.center}>{t('welcome.language.title')}</AppText>
                  <AppText variant="body" color={colors.textSecondary} style={styles.center}>{t('welcome.language.subtitle')}</AppText>
                  <View style={styles.langCol}>
                    {LANGUAGES.map((lang) => {
                      const selected = current === lang.code;
                      return (
                        <RadioCard
                          key={lang.code}
                          label={lang.label}
                          fontFamily={lang.font}
                          selected={selected}
                          onPress={() => { if (!selected) setPendingLang(lang.code); }}
                        />
                      );
                    })}
                  </View>
                  {manualRestart ? (
                    <View style={styles.notice}>
                      <AppText variant="body">{t('settings.restartManually')}</AppText>
                    </View>
                  ) : null}
                </>
              ) : null}

              {step === 'intro' ? (
                <>
                  <Hero icon="shield-checkmark" />
                  <AppText variant="h1" style={styles.center}>{t('welcome.intro.title')}</AppText>
                  <AppText variant="bodyMedium" color={colors.textSecondary} style={styles.center}>{t('app.tagline')}</AppText>
                  <View style={styles.lines}>
                    {[
                      ['chatbubble-ellipses-outline', 'welcome.intro.sms'],
                      ['mic-outline', 'welcome.intro.voice'],
                      ['flash-outline', 'welcome.intro.bill'],
                    ].map(([icon, key], i) => (
                      <MotiView
                        key={key}
                        from={{ opacity: 0, translateY: 12 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'spring', damping: 15, delay: 150 + i * 80 }}
                        style={styles.line}
                      >
                        <View style={styles.lineIcon}>
                          <Ionicons name={icon} size={24} color={colors.accentLight} />
                        </View>
                        <AppText variant="body" style={styles.flex}>{t(key)}</AppText>
                      </MotiView>
                    ))}
                  </View>
                </>
              ) : null}

              {step === 'income' ? (
                <>
                  <Hero icon="wallet" />
                  <AppText variant="h1" style={styles.center}>{t('welcome.income.title')}</AppText>
                  <AppText variant="body" color={colors.textSecondary} style={styles.center}>{t('welcome.income.hint')}</AppText>
                  <View style={styles.amountBox}>
                    <AppText variant="h2" color={colors.textSecondary}>{t('common.rupees')}</AppText>
                    <TextInput
                      value={digits ? formatNumber(digits) : ''}
                      onChangeText={(v) => { setDigits(v.replace(/\D/g, '').slice(0, 9)); setIncomeError(null); }}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="number-pad"
                      style={styles.amountInput}
                      accessibilityLabel={t('welcome.income.title')}
                      maxLength={13}
                    />
                  </View>
                  {incomeError ? <AppText variant="body" color={colors.danger} style={styles.center}>{t(incomeError)}</AppText> : null}
                </>
              ) : null}

              {step === 'final' ? (
                <>
                  <Hero icon="rocket" />
                  <AppText variant="h1" style={styles.center}>{t('welcome.final.title')}</AppText>
                  <AppText variant="body" color={colors.textSecondary} style={styles.center}>{t('welcome.final.subtitle')}</AppText>
                </>
              ) : null}
            </MotiView>
          </ScrollView>
        </View>

        <View style={styles.bottom}>
          <Dots count={steps.length} index={index} />
          {step === 'final' ? (
            <>
              {finalError ? <AppText variant="body" color={colors.danger} style={styles.center}>{t('settings.demoError')}</AppText> : null}
              <PrimaryButton label={t('welcome.final.start')} onPress={startFresh} disabled={busy} />
              <PrimaryButton label={t('welcome.final.sample')} variant="outlined" onPress={() => setDemoAsk(true)} disabled={busy} />
              <AppText variant="caption" color={colors.textSecondary} style={styles.center}>{t('welcome.final.sampleNote')}</AppText>
            </>
          ) : (
            <PrimaryButton label={t('welcome.next')} onPress={onNext} loading={savingIncome} disabled={restarting} />
          )}
        </View>
      </KeyboardAvoider>

      <Portal>
        <Dialog visible={!!pendingLang} onDismiss={() => !restarting && setPendingLang(null)} style={styles.dialog}>
          <Dialog.Title><AppText variant="h2">{t('settings.restartTitle')}</AppText></Dialog.Title>
          <Dialog.Content><AppText variant="body">{t('settings.restartText')}</AppText></Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPendingLang(null)} textColor={colors.textSecondary} disabled={restarting}>{t('common.cancel')}</Button>
            <Button onPress={confirmLanguage} textColor={colors.primary} loading={restarting} disabled={restarting} labelStyle={labelFont}>{t('settings.restart')}</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={demoAsk} onDismiss={() => !busy && setDemoAsk(false)} style={styles.dialog}>
          <Dialog.Title><AppText variant="h2">{t('settings.demoTitle')}</AppText></Dialog.Title>
          <Dialog.Content><AppText variant="body">{t('settings.demoText')}</AppText></Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDemoAsk(false)} textColor={colors.textSecondary} disabled={busy}>{t('common.cancel')}</Button>
            <Button onPress={startWithSample} textColor={colors.primary} loading={busy} disabled={busy} labelStyle={labelFont}>{t('settings.demoConfirm')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  topBar: { minHeight: sizes.touch, paddingHorizontal: screenPadding, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  skip: { minHeight: sizes.touch, justifyContent: 'center', paddingHorizontal: 8 },
  page: { flexGrow: 1, justifyContent: 'center', padding: screenPadding },
  pageInner: { gap: 14, alignItems: 'stretch' },
  hero: { alignSelf: 'center', marginBottom: 8 },
  heroInner: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langCol: { gap: spacing.md, marginTop: spacing.sm },
  notice: { borderWidth: 1, borderColor: colors.warningBorder, backgroundColor: colors.warningLight, borderRadius: radius.input, padding: 12 },
  lines: { gap: 12, marginTop: 8 },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lineIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.input,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  amountInput: {
    flex: 1,
    height: 80,
    fontFamily: fonts.en.semibold,
    fontSize: 38,
    color: colors.text,
    textAlign: 'center',
  },
  bottom: { padding: screenPadding, gap: 12 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 4 },
  dot: { height: 8, borderRadius: 4 },
  dialog: { backgroundColor: colors.surfaceRaised, borderRadius: radius.card },
});
