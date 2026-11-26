// Editable transaction fields, used by the SMS and Quick Entry screens to let the user
// fix what the AI found before saving.
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import AmountInput from './ui/AmountInput';
import Chip from './ui/Chip';
import DateField from './ui/DateField';
import FormInput from './ui/FormInput';
import SegmentedControl from './ui/SegmentedControl';
import {
  EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_TYPES,
  categoryColor, categoryIcon, categoryKey, paymentColor, paymentKey,
} from '../constants/categories';
import { colors, spacing } from '../theme';
import { formatDayLabel, fromDateKey, toDateKey } from '../utils/format';

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
  const { t } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);

  const base = value.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const categories = base.includes(value.category) ? base : [value.category, ...base];

  return (
    <View style={styles.wrap}>
      {/* Expense / Income */}
      <SegmentedControl
        value={value.type}
        onChange={(type) => onChange({ type })}
        options={['expense', 'income'].map((tp) => ({ value: tp, label: t(`addTx.${tp}`) }))}
      />

      {/* Amount */}
      <AmountInput
        value={value.digits}
        onChangeText={(v) => onChange({ digits: v.replace(/\D/g, '').slice(0, 9) })}
        size={28}
        accessibilityLabel={t('addTx.amount')}
      />
      {amountError ? (
        <AppText variant="caption" color={colors.danger} style={styles.centerText}>{t(amountError)}</AppText>
      ) : null}

      {/* Category */}
      <AppText variant="caption" color={colors.textSecondary}>{t('addTx.category')}</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {categories.map((c) => (
          <Chip
            key={c}
            size="lg"
            icon={categoryIcon(c)}
            iconColor={categoryColor(c)}
            label={t(categoryKey(c))}
            selected={value.category === c}
            onPress={() => onChange({ category: c })}
          />
        ))}
      </ScrollView>

      {/* Payment type */}
      <AppText variant="caption" color={colors.textSecondary}>{t('addTx.paymentType')}</AppText>
      <View style={styles.wrapRow}>
        {PAYMENT_TYPES.map((p) => (
          <Chip
            key={p}
            size="lg"
            label={t(paymentKey(p))}
            color={paymentColor(p)}
            selected={value.paymentType === p}
            onPress={() => onChange({ paymentType: p })}
          />
        ))}
      </View>

      {/* Merchant or note */}
      <FormInput
        dense
        label={t(fields === 'merchant' ? 'addTx.merchant' : 'addTx.note')}
        value={fields === 'merchant' ? value.merchant : value.note}
        onChangeText={(v) => onChange(fields === 'merchant' ? { merchant: v } : { note: v })}
        maxLength={120}
      />

      {/* Date */}
      <DateField label={formatDayLabel(toDateKey(value.date), t)} onPress={() => setShowPicker(true)} />
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
  wrap: { gap: spacing.sm },
  centerText: { textAlign: 'center' },
  chipRow: { gap: spacing.sm, paddingEnd: spacing.sm },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
