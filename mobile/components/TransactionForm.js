// Editable transaction fields, used by the SMS and Quick Entry screens to let the user
// fix what the AI found before saving.
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput as RNTextInput, View } from 'react-native';
import { TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import {
  EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_TYPES,
  categoryColor, categoryIcon, categoryKey, paymentColor, paymentKey,
} from '../constants/categories';
import { colors, fonts, radius, sizes } from '../theme';
import { formatDayLabel, formatNumber, fromDateKey, toDateKey } from '../utils/format';

// Turns what the backend returned into the values the form edits.
export function toFormValue(tx) {
  const amount = Math.round(Number(tx.amount) || 0);
  return {
    type: tx.type === 'income' ? 'income' : 'expense',
    digits: amount > 0 ? String(amount) : '',
    category: tx.category || 'Other',
    paymentType: PAYMENT_TYPES.includes(tx.paymentType) ? tx.paymentType : 'Cash',
    merchant: tx.merchant || '',
    note: tx.note || '',
    date: /^\d{4}-\d{2}-\d{2}$/.test(tx.date || '') ? fromDateKey(tx.date) : new Date(),
    confidence: tx.confidence || 'medium', // how sure the backend is: high, medium or low
  };
}

// fields: which extra text box to show: 'merchant' or 'note'
export default function TransactionForm({ value, onChange, fields = 'merchant', amountError }) {
  const { t, i18n } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);

  const base = value.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const categories = base.includes(value.category) ? base : [value.category, ...base];

  return (
    <View style={styles.wrap}>
      {/* Expense / Income */}
      <View style={styles.row}>
        {['expense', 'income'].map((tp) => {
          const selected = value.type === tp;
          return (
            <Pressable
              key={tp}
              onPress={() => onChange({ type: tp })}
              style={[styles.typeChip, selected && styles.typeChipOn]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <AppText variant="bodyMedium" color={selected ? colors.primaryDark : colors.textSecondary}>
                {t(`addTx.${tp}`)}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {/* Amount */}
      <View style={styles.amountRow}>
        <Text style={styles.rs}>Rs</Text>
        <RNTextInput
          value={value.digits ? formatNumber(value.digits) : ''}
          onChangeText={(v) => onChange({ digits: v.replace(/\D/g, '').slice(0, 9) })}
          placeholder="0"
          placeholderTextColor={colors.border}
          keyboardType="number-pad"
          style={styles.amountInput}
          selectionColor={colors.primary}
          accessibilityLabel={t('addTx.amount')}
        />
      </View>
      {amountError ? (
        <AppText variant="caption" color={colors.danger} style={styles.centerText}>{t(amountError)}</AppText>
      ) : null}

      {/* Category */}
      <AppText variant="caption" color={colors.textSecondary}>{t('addTx.category')}</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {categories.map((c) => {
          const selected = value.category === c;
          const color = categoryColor(c);
          return (
            <Pressable
              key={c}
              onPress={() => onChange({ category: c })}
              style={[styles.chip, { borderColor: selected ? color : colors.border, backgroundColor: selected ? `${color}22` : colors.surface }]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Ionicons name={categoryIcon(c)} size={16} color={color} />
              <AppText variant="body" color={selected ? colors.text : colors.textSecondary}>{t(categoryKey(c))}</AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Payment type */}
      <AppText variant="caption" color={colors.textSecondary}>{t('addTx.paymentType')}</AppText>
      <View style={styles.wrapRow}>
        {PAYMENT_TYPES.map((p) => {
          const selected = value.paymentType === p;
          const color = paymentColor(p);
          return (
            <Pressable
              key={p}
              onPress={() => onChange({ paymentType: p })}
              style={[styles.chip, { borderColor: color, backgroundColor: selected ? color : colors.surface }]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <AppText variant="bodyMedium" color={selected ? '#FFFFFF' : color}>{t(paymentKey(p))}</AppText>
            </Pressable>
          );
        })}
      </View>

      {/* Merchant or note */}
      <TextInput
        mode="outlined"
        dense
        label={t(fields === 'merchant' ? 'addTx.merchant' : 'addTx.note')}
        value={fields === 'merchant' ? value.merchant : value.note}
        onChangeText={(v) => onChange(fields === 'merchant' ? { merchant: v } : { note: v })}
        outlineColor={colors.border}
        activeOutlineColor={colors.primary}
        outlineStyle={{ borderRadius: radius.input }}
        style={styles.textInput}
        maxLength={120}
      />

      {/* Date */}
      <Pressable onPress={() => setShowPicker(true)} style={styles.dateRow} accessibilityRole="button">
        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
        <AppText variant="body" style={styles.dateText}>{formatDayLabel(toDateKey(value.date), t)}</AppText>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={value.date}
          mode="date"
          maximumDate={new Date()}
          onChange={(event, picked) => {
            setShowPicker(false);
            if (event.type === 'set' && picked) onChange({ date: picked });
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  typeChip: {
    flex: 1,
    minHeight: sizes.touch,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipOn: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', direction: 'ltr', marginVertical: 4 },
  rs: { fontFamily: fonts.en.semibold, fontSize: 18, color: colors.textSecondary, marginRight: 6 },
  amountInput: { fontFamily: fonts.en.bold, fontSize: 28, color: colors.text, minWidth: 80, textAlign: 'center', padding: 0 },
  centerText: { textAlign: 'center' },
  chipRow: { gap: 8, paddingEnd: 8 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: sizes.touch,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  textInput: { backgroundColor: colors.surface },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.touch,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateText: { flex: 1, marginHorizontal: 12 },
});
