// Add Transaction (manual) - DESIGN.md section 8.4
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppText from '../components/AppText';
import FadeInCard from '../components/FadeInCard';
import ScreenHeader from '../components/ScreenHeader';
import KeyboardAvoider from '../components/ui/KeyboardAvoider';
import AmountInput from '../components/ui/AmountInput';
import Card from '../components/ui/Card';
import Chip from '../components/ui/Chip';
import DateField from '../components/ui/DateField';
import FormInput from '../components/ui/FormInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import SectionHeader from '../components/ui/SectionHeader';
import SegmentedControl from '../components/ui/SegmentedControl';
import {
  EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_TYPES,
  categoryColor, categoryIcon, categoryKey, paymentColor, paymentKey,
} from '../constants/categories';
import { useAuth } from '../context/AuthContext';
import { addTransaction } from '../services/transactionService';
import { colors, screenPadding, spacing } from '../theme';
import { formatDayLabel, toDateKey } from '../utils/format';

export default function AddTransactionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  const [type, setType] = useState('expense');
  const [digits, setDigits] = useState('');
  const [category, setCategory] = useState(null);
  const [paymentType, setPaymentType] = useState('Cash');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const busy = useRef(false); // blocks a second tap before the screen has redrawn

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  function changeType(next) {
    setType(next);
    const list = next === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    if (category && !list.includes(category)) setCategory(null);
  }

  async function save() {
    if (busy.current) return;
    const amount = Number(digits);
    const e = {};
    if (!amount || amount <= 0) e.amount = 'addTx.errors.amount';
    if (!category) e.category = 'addTx.errors.category';
    setErrors(e);
    if (Object.keys(e).length) return;

    busy.current = true;
    setSaving(true);
    try {
      await addTransaction(user.uid, { amount, type, category, paymentType, date, note });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.back();
    } catch (err) {
      busy.current = false;
      setErrors({ form: err?.code === 'permission-denied' ? 'addTx.errors.permission' : 'addTx.errors.generic' });
      setSaving(false);
    }
  }

  const dateLabel = formatDayLabel(toDateKey(date), t);

  const err = (key) =>
    errors[key] ? (
      <AppText variant="caption" color={colors.danger} style={styles.error}>{t(errors[key])}</AppText>
    ) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title={t('addTx.title')} />
      <KeyboardAvoider>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <FadeInCard index={0}>
            <View style={styles.group}>
              <SegmentedControl
                value={type}
                onChange={changeType}
                options={[
                  { value: 'expense', label: t('addTx.expense') },
                  { value: 'income', label: t('addTx.income') },
                ]}
              />

              {/* Amount */}
              <AmountInput
                value={digits}
                onChangeText={(v) => { setDigits(v.replace(/\D/g, '').slice(0, 9)); setErrors((x) => ({ ...x, amount: undefined })); }}
                accessibilityLabel={t('addTx.amount')}
              />
              <View style={styles.centerError}>{err('amount')}</View>
            </View>
          </FadeInCard>

          {/* Category */}
          <FadeInCard index={1}>
            <Card style={styles.group}>
              <SectionHeader title={t('addTx.category')} />
              <View style={styles.wrapRow}>
                {categories.map((c) => (
                  <Chip
                    key={c}
                    size="lg"
                    icon={categoryIcon(c)}
                    iconColor={categoryColor(c)}
                    label={t(categoryKey(c))}
                    selected={category === c}
                    onPress={() => { setCategory(c); setErrors((x) => ({ ...x, category: undefined })); }}
                  />
                ))}
              </View>
              {err('category')}
            </Card>
          </FadeInCard>

          {/* Payment type */}
          <FadeInCard index={2}>
            <Card style={styles.group}>
              <SectionHeader title={t('addTx.paymentType')} />
              <View style={styles.wrapRow}>
                {PAYMENT_TYPES.map((p) => (
                  <Chip
                    key={p}
                    size="lg"
                    label={t(paymentKey(p))}
                    color={paymentColor(p)}
                    selected={paymentType === p}
                    onPress={() => setPaymentType(p)}
                  />
                ))}
              </View>
            </Card>
          </FadeInCard>

          {/* Date and note */}
          <FadeInCard index={3}>
            <Card style={styles.group}>
              <SectionHeader title={t('addTx.date')} />
              <DateField label={dateLabel} onPress={() => setShowPicker(true)} />
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
              <FormInput label={t('addTx.note')} value={note} onChangeText={setNote} maxLength={120} />
            </Card>
          </FadeInCard>

          {errors.form ? (
            <AppText variant="body" color={colors.danger} style={styles.formError}>{t(errors.form)}</AppText>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton label={t('addTx.save')} onPress={save} loading={saving} />
        </View>
      </KeyboardAvoider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: screenPadding, paddingBottom: spacing.xl, gap: spacing.md },
  group: { gap: spacing.md },
  centerError: { alignItems: 'center', marginTop: -spacing.sm },
  error: { marginTop: spacing.xs },
  formError: { marginTop: spacing.xs },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  footer: { padding: screenPadding, backgroundColor: colors.background },
});
