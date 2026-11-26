// Urdu quick entry (type or speak) - DESIGN.md section 8.6
import { useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Checkbox } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AIThinking from '../components/AIThinking';
import AppText from '../components/AppText';
import FadeInCard from '../components/FadeInCard';
import LowConfidenceNote from '../components/LowConfidenceNote';
import ScreenHeader from '../components/ScreenHeader';
import KeyboardAvoider from '../components/ui/KeyboardAvoider';
import TransactionForm, { toFormValue } from '../components/TransactionForm';
import Card from '../components/ui/Card';
import Chip from '../components/ui/Chip';
import EmptyState from '../components/ui/EmptyState';
import FormInput from '../components/ui/FormInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { ApiError, quickEntry } from '../services/api';
import { addTransactions, newTransactionRef } from '../services/transactionService';
import { colors, screenPadding, sizes, spacing } from '../theme';

const THINKING = ['thinking.quick.0', 'thinking.quick.1', 'thinking.quick.2'];
const EXAMPLES = ['quickEntry.examples.0', 'quickEntry.examples.1', 'quickEntry.examples.2'];

export default function QuickEntryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done
  const [entries, setEntries] = useState([]); // { checked, form, amountError }
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const busyRef = useRef(false); // blocks a second tap before the screen has redrawn

  async function addWithAi() {
    Keyboard.dismiss();
    if (!text.trim()) {
      setError('quickEntry.errors.empty');
      return;
    }
    setError(null);
    setStatus('loading');
    try {
      const result = await quickEntry(text.trim());
      // each entry gets its document now, so retrying a save can never create it twice
      setEntries(result.transactions.map((tx) => (
        { checked: true, form: toFormValue(tx), amountError: null, ref: newTransactionRef(user.uid) }
      )));
      setStatus('done');
    } catch (e) {
      setStatus('idle');
      setError(e instanceof ApiError ? e.messageKey : 'api.errors.generic');
    }
  }

  const update = (i, patch) =>
    setEntries((list) => list.map((en, idx) => (idx === i ? { ...en, ...patch } : en)));
  const updateForm = (i, patch) =>
    setEntries((list) => list.map((en, idx) => (idx === i ? { ...en, form: { ...en.form, ...patch }, amountError: null } : en)));

  const selected = entries.filter((e) => e.checked);

  async function saveAll() {
    if (busyRef.current || selected.length === 0) return;
    // Every checked entry needs an amount
    let bad = false;
    const checked = entries.map((en) => {
      if (en.checked && !Number(en.form.digits)) {
        bad = true;
        return { ...en, amountError: 'addTx.errors.amount' };
      }
      return en;
    });
    if (bad) {
      setEntries(checked);
      return;
    }
    busyRef.current = true;
    setSaving(true);
    try {
      await addTransactions(selected.map((en) => ({
        ref: en.ref,
        fields: {
          amount: Number(en.form.digits),
          type: en.form.type,
          category: en.form.category,
          paymentType: en.form.paymentType,
          date: en.form.date,
          merchant: en.form.merchant,
          note: en.form.note,
          source: 'quick',
        },
      })));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      busyRef.current = false;
      setError(e?.code === 'permission-denied' ? 'addTx.errors.permission' : 'addTx.errors.generic');
      setSaving(false);
    }
  }

  const busy = status === 'loading';
  const showResults = status === 'done';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title={t('quickEntry.title')} />
      <KeyboardAvoider>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <FadeInCard index={0}>
            <View style={styles.group}>
              <FormInput
                multiline
                value={text}
                onChangeText={(v) => { setText(v); setError(null); }}
                placeholder={t('quickEntry.placeholder')}
                contentStyle={styles.inputContent}
                editable={!busy}
              />

              <View style={styles.hintRow}>
                <Ionicons name="mic-outline" size={18} color={colors.textSecondary} />
                <AppText variant="caption" color={colors.textSecondary} style={styles.hintText}>{t('quickEntry.hint')}</AppText>
              </View>

              <View style={styles.exampleRow}>
                {EXAMPLES.map((key) => (
                  <Chip
                    key={key}
                    size="lg"
                    label={t(key)}
                    accessibilityRole="button"
                    onPress={() => { setText(t(key)); setError(null); }}
                  />
                ))}
              </View>
            </View>
          </FadeInCard>

          {error ? <AppText variant="body" color={colors.danger}>{t(error)}</AppText> : null}

          <FadeInCard index={1}>
            <PrimaryButton label={t('quickEntry.add')} onPress={addWithAi} loading={busy} disabled={saving} />
          </FadeInCard>

          {busy ? <AIThinking messageKeys={THINKING} /> : null}

          {showResults && entries.length === 0 ? (
            <EmptyState icon="search-outline" iconColor={colors.textSecondary} text={t('quickEntry.none')} />
          ) : null}

          {showResults
            ? entries.map((en, i) => (
                <FadeInCard key={i} index={i}>
                  <Card style={[styles.entryCard, !en.checked && styles.entryOff]}>
                    <Pressable
                      onPress={() => update(i, { checked: !en.checked })}
                      style={styles.checkRow}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: en.checked }}
                    >
                      <Checkbox.Android status={en.checked ? 'checked' : 'unchecked'} color={colors.primary} onPress={() => update(i, { checked: !en.checked })} />
                      <AppText variant="bodyMedium">{t('quickEntry.entryNumber', { number: i + 1 })}</AppText>
                    </Pressable>
                    <LowConfidenceNote confidence={en.form.confidence} />
                    <TransactionForm
                      value={en.form}
                      onChange={(patch) => updateForm(i, patch)}
                      fields="note"
                      amountError={en.amountError}
                    />
                  </Card>
                </FadeInCard>
              ))
            : null}
        </ScrollView>

        {showResults && entries.length > 0 ? (
          <View style={styles.footer}>
            <PrimaryButton
              label={t('quickEntry.saveAll', { count: selected.length })}
              onPress={saveAll}
              loading={saving}
              disabled={selected.length === 0}
            />
          </View>
        ) : null}
      </KeyboardAvoider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: screenPadding, gap: spacing.md, paddingBottom: spacing.xxl },
  group: { gap: spacing.sm },
  inputContent: { minHeight: 112, paddingTop: 12 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hintText: { flex: 1 },
  exampleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  entryCard: { gap: spacing.sm },
  entryOff: { opacity: 0.5 },
  checkRow: { flexDirection: 'row', alignItems: 'center', minHeight: sizes.touch },
  footer: { padding: screenPadding, backgroundColor: colors.background },
});
