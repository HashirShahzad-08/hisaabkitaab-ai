// Add Transaction (manual) - DESIGN.md section 8.4
import { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput as RNTextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, SegmentedButtons, TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppText from '../components/AppText';
import ScreenHeader from '../components/ScreenHeader';
import {
  EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_TYPES,
  categoryColor, categoryIcon, categoryKey, paymentColor, paymentKey,
} from '../constants/categories';
import { useAuth } from '../context/AuthContext';
import { addTransaction } from '../services/transactionService';
import { colors, fonts, radius, screenPadding, sizes } from '../theme';
import { formatDayLabel, formatNumber, toDateKey } from '../utils/format';

export default function AddTransactionScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const isUrdu = i18n.language === 'ur';

  const [type, setType] = useState('expense');
  const [digits, setDigits] = useState('');
  const [category, setCategory] = useState(null);
  const [paymentType, setPaymentType] = useState('Cash');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  function changeType(next) {
    setType(next);
    const list = next === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    if (category && !list.includes(category)) setCategory(null);
  }

  async function save() {
    if (saving) return;
    const amount = Number(digits);
    const e = {};
    if (!amount || amount <= 0) e.amount = 'addTx.errors.amount';
    if (!category) e.category = 'addTx.errors.category';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      await addTransaction(user.uid, { amount, type, category, paymentType, date, note });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.back();
    } catch (err) {
      setErrors({ form: err?.code === 'permission-denied' ? 'addTx.errors.permission' : 'addTx.errors.generic' });
      setSaving(false);
    }
  }

  const dateLabel = formatDayLabel(toDateKey(date), t);
  const labelFont = isUrdu ? fonts.ur.medium : fonts.en.medium;

  const err = (key) =>
    errors[key] ? (
      <AppText variant="caption" color={colors.danger} style={styles.error}>{t(errors[key])}</AppText>
    ) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title={t('addTx.title')} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <SegmentedButtons
            value={type}
            onValueChange={changeType}
            theme={{ colors: { secondaryContainer: colors.primaryLight, onSecondaryContainer: colors.primaryDark } }}
            buttons={[
              { value: 'expense', label: t('addTx.expense'), style: styles.segment, labelStyle: { fontFamily: labelFont } },
              { value: 'income', label: t('addTx.income'), style: styles.segment, labelStyle: { fontFamily: labelFont } },
            ]}
          />

          {/* Amount */}
          <View style={styles.amountRow}>
            <Text style={styles.rs}>Rs</Text>
            <RNTextInput
              value={digits ? formatNumber(digits) : ''}
              onChangeText={(v) => { setDigits(v.replace(/\D/g, '').slice(0, 9)); setErrors((x) => ({ ...x, amount: undefined })); }}
              placeholder="0"
              placeholderTextColor={colors.border}
              keyboardType="number-pad"
              style={styles.amountInput}
              selectionColor={colors.primary}
              accessibilityLabel={t('addTx.amount')}
            />
          </View>
          <View style={styles.centerError}>{err('amount')}</View>

          {/* Category */}
          <AppText variant="h2" style={styles.section}>{t('addTx.category')}</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {categories.map((c) => {
              const selected = category === c;
              const color = categoryColor(c);
              return (
                <Pressable
                  key={c}
                  onPress={() => { setCategory(c); setErrors((x) => ({ ...x, category: undefined })); }}
                  style={[styles.chip, { borderColor: selected ? color : colors.border, backgroundColor: selected ? `${color}22` : colors.surface }]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Ionicons name={categoryIcon(c)} size={18} color={color} />
                  <AppText variant="body" color={selected ? colors.text : colors.textSecondary} style={styles.chipText}>
                    {t(categoryKey(c))}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
          {err('category')}

          {/* Payment type */}
          <AppText variant="h2" style={styles.section}>{t('addTx.paymentType')}</AppText>
          <View style={styles.wrapRow}>
            {PAYMENT_TYPES.map((p) => {
              const selected = paymentType === p;
              const color = paymentColor(p);
              return (
                <Pressable
                  key={p}
                  onPress={() => setPaymentType(p)}
                  style={[styles.chip, { borderColor: color, backgroundColor: selected ? color : colors.surface }]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <AppText variant="bodyMedium" color={selected ? '#FFFFFF' : color}>{t(paymentKey(p))}</AppText>
                </Pressable>
              );
            })}
          </View>

          {/* Date */}
          <AppText variant="h2" style={styles.section}>{t('addTx.date')}</AppText>
          <Pressable onPress={() => setShowPicker(true)} style={[styles.dateRow, isUrdu && styles.rowReverse]} accessibilityRole="button">
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <AppText variant="body" style={styles.dateText}>{dateLabel}</AppText>
            <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
          </Pressable>
          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              maximumDate={new Date()}
              onChange={(event, picked) => {
                setShowPicker(false);
                if (event.type === 'set' && picked) setDate(picked);
              }}
            />
          )}

          {/* Note */}
          <TextInput
            mode="outlined"
            label={t('addTx.note')}
            value={note}
            onChangeText={setNote}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            outlineStyle={{ borderRadius: radius.input }}
            style={styles.note}
            maxLength={120}
          />

          {errors.form ? (
            <AppText variant="body" color={colors.danger} style={styles.formError}>{t(errors.form)}</AppText>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            mode="contained"
            onPress={save}
            loading={saving}
            disabled={saving}
            buttonColor={colors.primary}
            textColor="#FFFFFF"
            style={styles.saveButton}
            contentStyle={{ height: sizes.button }}
            labelStyle={{ fontFamily: isUrdu ? fonts.ur.semibold : fonts.en.semibold, fontSize: 16 }}
          >
            {t('addTx.save')}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: screenPadding, paddingBottom: 24 },
  segment: { borderColor: colors.border },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, direction: 'ltr' },
  rs: { fontFamily: fonts.en.semibold, fontSize: 22, color: colors.textSecondary, marginRight: 8 },
  amountInput: { fontFamily: fonts.en.bold, fontSize: 34, color: colors.text, minWidth: 80, textAlign: 'center', padding: 0 },
  centerError: { alignItems: 'center', marginTop: 4 },
  section: { marginTop: 24, marginBottom: 12 },
  chipRow: { gap: 8, paddingRight: 8 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: sizes.touch,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  chipText: { marginHorizontal: 2 },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowReverse: { flexDirection: 'row-reverse' },
  dateText: { flex: 1, marginHorizontal: 12 },
  note: { marginTop: 24, backgroundColor: colors.surface },
  error: { marginTop: 8 },
  formError: { marginTop: 16 },
  footer: { padding: screenPadding, backgroundColor: colors.background },
  saveButton: { borderRadius: radius.button },
});
