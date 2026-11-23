// SMS auto-entry - DESIGN.md section 8.5
import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, TextInput } from 'react-native-paper';
import { MotiView } from 'moti';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AIThinking from '../components/AIThinking';
import AlertCard from '../components/AlertCard';
import AppText from '../components/AppText';
import LowConfidenceNote from '../components/LowConfidenceNote';
import ScreenHeader from '../components/ScreenHeader';
import TransactionForm, { toFormValue } from '../components/TransactionForm';
import { useAuth } from '../context/AuthContext';
import { ApiError, parseSms } from '../services/api';
import { addTransaction } from '../services/transactionService';
import { colors, fonts, radius, screenPadding, sizes } from '../theme';

const PTA_NUMBER = '080055055'; // 0800-55055
const THINKING = ['thinking.sms.0', 'thinking.sms.1', 'thinking.sms.2'];

export default function SmsEntryScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const isUrdu = i18n.language === 'ur';

  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | normal | scam
  const [scamReason, setScamReason] = useState('');
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null); // an i18n key
  const [amountError, setAmountError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function paste() {
    const clip = await Clipboard.getStringAsync();
    if (clip) {
      setText(clip);
      setError(null);
    }
  }

  async function analyze() {
    Keyboard.dismiss();
    if (!text.trim()) {
      setError('smsEntry.errors.empty');
      return;
    }
    setError(null);
    setStatus('loading');
    try {
      const result = await parseSms(text.trim());
      if (result.isScam) {
        setScamReason(result.scamReason || '');
        setStatus('scam');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        setForm(toFormValue(result));
        setAmountError(null);
        setStatus('normal');
      }
    } catch (e) {
      setStatus('idle');
      setError(e instanceof ApiError ? e.messageKey : 'api.errors.generic');
    }
  }

  function clearAll() {
    setText('');
    setForm(null);
    setScamReason('');
    setError(null);
    setStatus('idle');
  }

  async function save() {
    if (saving) return;
    const amount = Number(form.digits);
    if (!amount) {
      setAmountError('addTx.errors.amount');
      return;
    }
    setSaving(true);
    try {
      await addTransaction(user.uid, {
        amount,
        type: form.type,
        category: form.category,
        paymentType: form.paymentType,
        date: form.date,
        merchant: form.merchant,
        note: form.note,
        source: 'sms',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      setError(e?.code === 'permission-denied' ? 'addTx.errors.permission' : 'addTx.errors.generic');
      setSaving(false);
    }
  }

  const busy = status === 'loading';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title={t('smsEntry.title')} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <AppText variant="body" color={colors.textSecondary}>{t('smsEntry.helper')}</AppText>

          <TextInput
            mode="outlined"
            multiline
            value={text}
            onChangeText={(v) => { setText(v); setError(null); }}
            placeholder={t('smsEntry.placeholder')}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            outlineStyle={{ borderRadius: radius.input }}
            style={styles.input}
            contentStyle={{ minHeight: 140, paddingTop: 12, fontFamily: fonts.en.regular }}
            editable={!busy}
          />

          <Button
            mode="outlined"
            icon="content-paste"
            onPress={paste}
            disabled={busy}
            textColor={colors.primary}
            style={styles.pasteButton}
            contentStyle={{ height: sizes.touch }}
          >
            {t('smsEntry.paste')}
          </Button>

          {error ? (
            <AppText variant="body" color={colors.danger}>{t(error)}</AppText>
          ) : null}

          <Button
            mode="contained"
            onPress={analyze}
            loading={busy}
            disabled={busy}
            buttonColor={colors.primary}
            textColor="#FFFFFF"
            style={styles.primaryButton}
            contentStyle={{ height: sizes.button }}
            labelStyle={{ fontFamily: isUrdu ? fonts.ur.semibold : fonts.en.semibold, fontSize: 16 }}
          >
            {t('smsEntry.analyze')}
          </Button>

          {busy ? <AIThinking messageKeys={THINKING} /> : null}

          {status === 'scam' ? (
            <AlertCard variant="danger" title={t('smsEntry.scam.title')}>
              {scamReason ? <AppText variant="body" color={colors.text}>{scamReason}</AppText> : null}
              <AppText variant="bodyMedium" color={colors.danger}>{t('smsEntry.scam.never')}</AppText>
              <View style={styles.scamButtons}>
                <Button
                  mode="contained"
                  onPress={clearAll}
                  buttonColor={colors.danger}
                  textColor="#FFFFFF"
                  style={styles.scamButton}
                  contentStyle={{ height: sizes.button }}
                >
                  {t('smsEntry.scam.delete')}
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => Linking.openURL(`tel:${PTA_NUMBER}`)}
                  textColor={colors.danger}
                  style={[styles.scamButton, { borderColor: colors.danger }]}
                  contentStyle={{ height: sizes.button }}
                >
                  {t('smsEntry.scam.report')}
                </Button>
              </View>
            </AlertCard>
          ) : null}

          {status === 'normal' && form ? (
            <MotiView
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 350 }}
              style={styles.resultCard}
            >
              <AppText variant="h2">{t('smsEntry.found')}</AppText>
              <LowConfidenceNote confidence={form.confidence} />
              <TransactionForm
                value={form}
                onChange={(patch) => { setForm((f) => ({ ...f, ...patch })); setAmountError(null); }}
                fields="merchant"
                amountError={amountError}
              />
              <Button
                mode="contained"
                onPress={save}
                loading={saving}
                disabled={saving}
                buttonColor={colors.primary}
                textColor="#FFFFFF"
                style={styles.primaryButton}
                contentStyle={{ height: sizes.button }}
                labelStyle={{ fontFamily: isUrdu ? fonts.ur.semibold : fonts.en.semibold, fontSize: 16 }}
              >
                {t('addTx.save')}
              </Button>
            </MotiView>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: screenPadding, gap: 12, paddingBottom: 32 },
  input: { backgroundColor: colors.surface },
  pasteButton: { alignSelf: 'flex-start', borderRadius: radius.button, borderColor: colors.border },
  primaryButton: { borderRadius: radius.button },
  scamButtons: { gap: 8, marginTop: 8 },
  scamButton: { borderRadius: radius.button },
  resultCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 16, gap: 12, elevation: 1 },
});
