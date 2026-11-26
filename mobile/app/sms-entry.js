// SMS auto-entry - DESIGN.md section 8.5
import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Linking, Platform, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AIThinking from '../components/AIThinking';
import AppText from '../components/AppText';
import FadeInCard from '../components/FadeInCard';
import LowConfidenceNote from '../components/LowConfidenceNote';
import ScamAlert from '../components/ScamAlert';
import ScreenHeader from '../components/ScreenHeader';
import TransactionForm, { toFormValue } from '../components/TransactionForm';
import Card from '../components/ui/Card';
import FormInput from '../components/ui/FormInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import SectionHeader from '../components/ui/SectionHeader';
import { useAuth } from '../context/AuthContext';
import { ApiError, parseSms } from '../services/api';
import { addTransaction } from '../services/transactionService';
import { colors, fonts, screenPadding, spacing } from '../theme';
import { offlineScamCheck, scamFlags } from '../utils/offlineScam';

const PTA_NUMBER = '080055055'; // 0800-55055
const THINKING = ['thinking.sms.0', 'thinking.sms.1', 'thinking.sms.2'];
// When the server cannot be reached or fails, we run the check on the phone instead.
const OFFLINE_ERRORS = ['api.errors.network', 'api.errors.timeout', 'api.errors.ai', 'api.errors.aiSetup', 'api.errors.aiBusy'];

export default function SmsEntryScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const isUrdu = i18n.language === 'ur';

  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | normal | scam
  const [scamReason, setScamReason] = useState('');
  const [scamFlagList, setScamFlagList] = useState([]); // red flags found in the text, for the family warning
  const [checkedOffline, setCheckedOffline] = useState(false);
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
        setCheckedOffline(false);
        setScamFlagList(scamFlags(text));
        setScamReason(result.scamReason || '');
        setStatus('scam');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        setForm(toFormValue(result));
        setAmountError(null);
        setStatus('normal');
      }
    } catch (e) {
      const key = e instanceof ApiError ? e.messageKey : 'api.errors.generic';
      const offline = OFFLINE_ERRORS.includes(key) ? offlineScamCheck(text) : null;
      if (offline?.isScam) {
        // Server unreachable, but the phone itself sees 2 or more red flags: show the same scam alert
        setCheckedOffline(true);
        setScamFlagList(offline.flags);
        setScamReason(offline.flags.map((f) => t(`smsEntry.scam.reasons.${f}`)).join(' '));
        setStatus('scam');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      setStatus('idle');
      // Not a scam on the phone: do not guess the transaction, just ask the user to try again
      setError(OFFLINE_ERRORS.includes(key) ? 'smsEntry.offlineFail' : key);
    }
  }

  // "Warn my family": the share sheet with a short warning in the current language
  function warnFamily() {
    const known = scamFlagList.filter((f) => ['fee', 'secret', 'prize', 'wrong_transfer', 'threat', 'link', 'courier', 'job'].includes(f));
    const asks = known.length
      ? known.map((f) => t(`smsEntry.scam.asks.${f}`)).join(isUrdu ? '، ' : ', ')
      : t('smsEntry.scam.asksDefault');
    const sender = scamFlagList.includes('bisp') ? t('smsEntry.scam.senderBisp') : t('smsEntry.scam.senderGeneric');
    Share.share({ message: t('smsEntry.scam.shareMessage', { sender, asks }) }).catch(() => {});
  }

  function clearAll() {
    setText('');
    setForm(null);
    setScamReason('');
    setScamFlagList([]);
    setCheckedOffline(false);
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

  // The scam reasons as a list: one per red flag when checked on the phone, else one per sentence
  // of the server's explanation (without splitting after "Rs.").
  const reasonList = checkedOffline
    ? scamFlagList.map((f) => t(`smsEntry.scam.reasons.${f}`))
    : scamReason.split(/(?<=[!?۔]|(?<!Rs)(?<!\d)\.)\s+/).filter(Boolean);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title={t('smsEntry.title')} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <FadeInCard index={0}>
            <View style={styles.group}>
              <AppText variant="body" color={colors.textSecondary}>{t('smsEntry.helper')}</AppText>
              <FormInput
                multiline
                value={text}
                onChangeText={(v) => { setText(v); setError(null); }}
                placeholder={t('smsEntry.placeholder')}
                font={fonts.en.regular}
                contentStyle={styles.inputContent}
                editable={!busy}
              />
              <PrimaryButton
                label={t('smsEntry.paste')}
                icon="clipboard-outline"
                variant="outlined"
                onPress={paste}
                disabled={busy}
                style={styles.pasteButton}
              />
            </View>
          </FadeInCard>

          {error ? (
            <AppText variant="body" color={colors.danger}>{t(error)}</AppText>
          ) : null}

          <FadeInCard index={1}>
            <PrimaryButton label={t('smsEntry.analyze')} onPress={analyze} loading={busy} />
          </FadeInCard>

          {busy ? <AIThinking messageKeys={THINKING} /> : null}

          {status === 'scam' ? (
            <ScamAlert
              title={t('smsEntry.scam.title')}
              reasons={reasonList}
              advice={t('smsEntry.scam.never')}
              note={checkedOffline ? t('smsEntry.offlineNote') : null}
            >
              <PrimaryButton
                label={t('smsEntry.scam.report')}
                icon="call-outline"
                variant="danger"
                onPress={() => Linking.openURL(`tel:${PTA_NUMBER}`)}
              />
              <PrimaryButton label={t('smsEntry.scam.warnFamily')} icon="share-social-outline" variant="outlined" onPress={warnFamily} />
              <PrimaryButton label={t('smsEntry.scam.delete')} variant="text" tone="danger" onPress={clearAll} />
            </ScamAlert>
          ) : null}

          {status === 'normal' && form ? (
            <FadeInCard>
              <Card style={styles.group}>
                <SectionHeader title={t('smsEntry.found')} />
                <LowConfidenceNote confidence={form.confidence} />
                <TransactionForm
                  value={form}
                  onChange={(patch) => { setForm((f) => ({ ...f, ...patch })); setAmountError(null); }}
                  fields="merchant"
                  amountError={amountError}
                />
                <PrimaryButton label={t('addTx.save')} onPress={save} loading={saving} />
              </Card>
            </FadeInCard>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: screenPadding, gap: spacing.md, paddingBottom: spacing.xxl },
  group: { gap: spacing.md },
  inputContent: { minHeight: 144, paddingTop: 12 },
  pasteButton: { alignSelf: 'flex-start' },
});
