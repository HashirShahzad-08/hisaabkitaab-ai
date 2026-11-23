// Urdu quick entry (type or speak) - DESIGN.md section 8.6
import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Checkbox, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AIThinking from '../components/AIThinking';
import AppText from '../components/AppText';
import FadeInCard from '../components/FadeInCard';
import LowConfidenceNote from '../components/LowConfidenceNote';
import ScreenHeader from '../components/ScreenHeader';
import TransactionForm, { toFormValue } from '../components/TransactionForm';
import { useAuth } from '../context/AuthContext';
import { ApiError, quickEntry } from '../services/api';
import { addTransaction } from '../services/transactionService';
import { colors, fonts, radius, screenPadding, sizes } from '../theme';

const THINKING = ['thinking.quick.0', 'thinking.quick.1', 'thinking.quick.2'];
const EXAMPLES = ['quickEntry.examples.0', 'quickEntry.examples.1', 'quickEntry.examples.2'];

export default function QuickEntryScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const isUrdu = i18n.language === 'ur';

  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done
  const [entries, setEntries] = useState([]); // { checked, form, amountError }
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

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
      setEntries(result.transactions.map((tx) => ({ checked: true, form: toFormValue(tx), amountError: null })));
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
    if (saving || selected.length === 0) return;
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
    setSaving(true);
    try {
      for (const en of selected) {
        await addTransaction(user.uid, {
          amount: Number(en.form.digits),
          type: en.form.type,
          category: en.form.category,
          paymentType: en.form.paymentType,
          date: en.form.date,
          merchant: en.form.merchant,
          note: en.form.note,
          source: 'quick',
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      setError(e?.code === 'permission-denied' ? 'addTx.errors.permission' : 'addTx.errors.generic');
      setSaving(false);
    }
  }

  const busy = status === 'loading';
  const showResults = status === 'done';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title={t('quickEntry.title')} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TextInput
            mode="outlined"
            multiline
            value={text}
            onChangeText={(v) => { setText(v); setError(null); }}
            placeholder={t('quickEntry.placeholder')}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            outlineStyle={{ borderRadius: radius.input }}
            style={styles.input}
            contentStyle={{ minHeight: 110, paddingTop: 12, fontFamily: isUrdu ? fonts.ur.regular : fonts.en.regular }}
            editable={!busy}
          />

          <View style={[styles.hintRow, isUrdu && styles.rowUrdu]}>
            <Ionicons name="mic-outline" size={18} color={colors.textSecondary} />
            <AppText variant="caption" color={colors.textSecondary} style={styles.hintText}>{t('quickEntry.hint')}</AppText>
          </View>

          <View style={styles.exampleRow}>
            {EXAMPLES.map((key) => (
              <Pressable
                key={key}
                onPress={() => { setText(t(key)); setError(null); }}
                style={styles.exampleChip}
                accessibilityRole="button"
              >
                <AppText variant="caption" color={colors.primaryDark}>{t(key)}</AppText>
              </Pressable>
            ))}
          </View>

          {error ? <AppText variant="body" color={colors.danger}>{t(error)}</AppText> : null}

          <Button
            mode="contained"
            onPress={addWithAi}
            loading={busy}
            disabled={busy || saving}
            buttonColor={colors.primary}
            textColor="#FFFFFF"
            style={styles.primaryButton}
            contentStyle={{ height: sizes.button }}
            labelStyle={{ fontFamily: isUrdu ? fonts.ur.semibold : fonts.en.semibold, fontSize: 16 }}
          >
            {t('quickEntry.add')}
          </Button>

          {busy ? <AIThinking messageKeys={THINKING} /> : null}

          {showResults && entries.length === 0 ? (
            <AppText variant="body" color={colors.textSecondary} style={styles.centerText}>{t('quickEntry.none')}</AppText>
          ) : null}

          {showResults
            ? entries.map((en, i) => (
                <FadeInCard key={i} index={i}>
                  <View style={[styles.entryCard, !en.checked && styles.entryOff]}>
                    <Pressable
                      onPress={() => update(i, { checked: !en.checked })}
                      style={[styles.checkRow, isUrdu && styles.rowUrdu]}
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
                  </View>
                </FadeInCard>
              ))
            : null}
        </ScrollView>

        {showResults && entries.length > 0 ? (
          <View style={styles.footer}>
            <Button
              mode="contained"
              onPress={saveAll}
              loading={saving}
              disabled={saving || selected.length === 0}
              buttonColor={colors.primary}
              textColor="#FFFFFF"
              style={styles.primaryButton}
              contentStyle={{ height: sizes.button }}
              labelStyle={{ fontFamily: isUrdu ? fonts.ur.semibold : fonts.en.semibold, fontSize: 16 }}
            >
              {t('quickEntry.saveAll', { count: selected.length })}
            </Button>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: screenPadding, gap: 12, paddingBottom: 32 },
  input: { backgroundColor: colors.surface },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowUrdu: { flexDirection: 'row-reverse' },
  hintText: { flex: 1 },
  exampleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  exampleChip: {
    minHeight: sizes.touch,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
  },
  primaryButton: { borderRadius: radius.button },
  centerText: { textAlign: 'center' },
  entryCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 16, gap: 8, elevation: 1 },
  entryOff: { opacity: 0.5 },
  checkRow: { flexDirection: 'row', alignItems: 'center', minHeight: sizes.touch },
  footer: { padding: screenPadding, backgroundColor: colors.background },
});
