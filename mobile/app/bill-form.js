// Bill form: the numbers from the electricity bill, then "Check bill".
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AIThinking from '../components/AIThinking';
import AppText from '../components/AppText';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import useBills from '../hooks/useBills';
import { ApiError, analyzeBill } from '../services/api';
import { setCurrentBill } from '../services/billService';
import { colors, fonts, radius, screenPadding, sizes } from '../theme';
import { currentMonthKey, monthLabel, shiftMonth } from '../utils/billUi';

const THINKING = ['thinking.bill.0', 'thinking.bill.1', 'thinking.bill.2'];

// Keep digits and one dot only. "1,250" becomes "1250".
const cleanNumber = (v) => {
  const only = v.replace(/[^0-9.]/g, '');
  const [whole, ...rest] = only.split('.');
  return rest.length ? `${whole}.${rest.join('')}` : whole;
};

export default function BillFormScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const isUrdu = i18n.language === 'ur';
  const { bills } = useBills(user?.uid);

  const [month, setMonth] = useState(currentMonthKey());
  const [previous, setPrevious] = useState('');
  const [current, setCurrent] = useState('');
  const [units, setUnits] = useState('');
  const [amount, setAmount] = useState('');
  const [lastMonth, setLastMonth] = useState('');
  const [lastYear, setLastYear] = useState('');
  const [company, setCompany] = useState('IESCO');
  const [moreOpen, setMoreOpen] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const lastMonthTouched = useRef(false);

  // Fill "Last month units" from the most recent saved bill (unless the user already typed something).
  useEffect(() => {
    if (bills.length > 0 && !lastMonthTouched.current && lastMonth === '') {
      setLastMonth(String(Math.round(bills[0].units)));
      setAutoFilled(true);
      setMoreOpen(true);
    }
  }, [bills]);

  const clear = (field) => setErrors((e) => ({ ...e, [field]: undefined }));
  const isCurrentMonth = month >= currentMonthKey();

  function validate() {
    const e = {};
    const required = { previous, current, units, amount };
    for (const [key, value] of Object.entries(required)) {
      if (value.trim() === '') e[key] = 'bills.form.errors.required';
      else if (!/^\d+(\.\d+)?$/.test(value.trim())) e[key] = 'bills.form.errors.number';
    }
    for (const [key, value] of Object.entries({ lastMonth, lastYear })) {
      if (value.trim() !== '' && !/^\d+(\.\d+)?$/.test(value.trim())) {
        e[key] = 'bills.form.errors.number';
        setMoreOpen(true);
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (loading || !validate()) return;
    const payload = {
      bill_month: month,
      previous_reading: Number(previous),
      current_reading: Number(current),
      units_billed: Number(units),
      amount: Number(amount),
    };
    if (company.trim()) payload.company = company.trim();
    if (lastMonth.trim() !== '') payload.last_month_units = Number(lastMonth);
    if (lastYear.trim() !== '') payload.same_month_last_year_units = Number(lastYear);

    setLoading(true);
    setApiError(null);
    try {
      const result = await analyzeBill(payload);
      setCurrentBill({ request: { ...payload, lang: i18n.language === 'ur' ? 'ur' : 'en' }, result, saved: false });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.replace('/bill-result');
    } catch (err) {
      setApiError(err instanceof ApiError ? err.messageKey : 'api.errors.generic');
      setLoading(false);
    }
  }

  const inputProps = {
    mode: 'outlined',
    keyboardType: 'decimal-pad',
    outlineColor: colors.border,
    activeOutlineColor: colors.primary,
    outlineStyle: { borderRadius: radius.input },
    style: styles.input,
    contentStyle: { fontFamily: fonts.en.medium, fontSize: 18 },
    disabled: loading,
  };

  const field = (key, label, value, setValue, extra = {}) => (
    <View style={styles.field}>
      <TextInput
        {...inputProps}
        label={label}
        value={value}
        onChangeText={(v) => { setValue(cleanNumber(v)); clear(key); if (key === 'lastMonth') { lastMonthTouched.current = true; setAutoFilled(false); } }}
        error={!!errors[key]}
        {...extra}
      />
      {errors[key] ? <AppText variant="caption" color={colors.danger} style={styles.error}>{t(errors[key])}</AppText> : null}
    </View>
  );

  const stepper = (icon, onPress, disabled) => (
    <Pressable onPress={onPress} disabled={disabled || loading} style={[styles.stepButton, disabled && styles.stepOff]} accessibilityRole="button" hitSlop={6}>
      <Ionicons name={icon} size={22} color={colors.primary} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title={t('bills.form.title')} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Month */}
          <AppText variant="caption" color={colors.textSecondary}>{t('bills.form.month')}</AppText>
          <View style={styles.monthRow}>
            {stepper(isUrdu ? 'chevron-forward' : 'chevron-back', () => setMonth((m) => shiftMonth(m, -1)), false)}
            <AppText variant="h2" style={styles.monthText}>{monthLabel(month, t)}</AppText>
            {stepper(isUrdu ? 'chevron-back' : 'chevron-forward', () => setMonth((m) => shiftMonth(m, 1)), isCurrentMonth)}
          </View>

          {/* Readings */}
          {field('previous', t('bills.form.previous'), previous, setPrevious)}
          {field('current', t('bills.form.current'), current, setCurrent)}
          <View style={styles.helper}>
            <Ionicons name="information-circle-outline" size={18} color={colors.info} />
            <AppText variant="caption" color={colors.textSecondary} style={styles.helperText}>{t('bills.form.readingsHelp')}</AppText>
          </View>

          {field('units', t('bills.form.units'), units, setUnits)}
          {field('amount', t('bills.form.amount'), amount, setAmount, { left: <TextInput.Affix text="Rs" /> })}

          {/* More details */}
          <Pressable onPress={() => setMoreOpen((o) => !o)} style={styles.moreHeader} accessibilityRole="button" accessibilityState={{ expanded: moreOpen }}>
            <AppText variant="bodyMedium" color={colors.primary} style={styles.flex}>{t('bills.form.more')}</AppText>
            <Ionicons name={moreOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.primary} />
          </Pressable>
          {moreOpen ? (
            <View style={styles.moreBody}>
              {field('lastMonth', t('bills.form.lastMonth'), lastMonth, setLastMonth)}
              {autoFilled ? (
                <AppText variant="caption" color={colors.textSecondary}>{t('bills.form.autoFilled')}</AppText>
              ) : null}
              {field('lastYear', t('bills.form.lastYear'), lastYear, setLastYear)}
              <View style={styles.field}>
                <TextInput
                  {...inputProps}
                  keyboardType="default"
                  label={t('bills.form.company')}
                  value={company}
                  onChangeText={setCompany}
                  maxLength={60}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          ) : null}

          {apiError ? (
            <View style={styles.errorBox}>
              <AppText variant="body" color={colors.danger}>{t(apiError)}</AppText>
            </View>
          ) : null}

          {loading ? <AIThinking messageKeys={THINKING} /> : null}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={apiError ? t('bills.form.retry') : t('bills.form.check')}
            onPress={submit}
            loading={loading}
            icon={apiError ? 'refresh' : 'checkmark-circle-outline'}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: screenPadding, paddingBottom: 24, gap: 12 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    minHeight: 56,
  },
  monthText: { flex: 1, textAlign: 'center' },
  stepButton: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center' },
  stepOff: { opacity: 0.3 },
  field: { gap: 4 },
  input: { backgroundColor: colors.surface },
  error: { marginHorizontal: 4 },
  helper: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 4 },
  helperText: { flex: 1 },
  moreHeader: { flexDirection: 'row', alignItems: 'center', minHeight: sizes.touch, marginTop: 4 },
  moreBody: { gap: 12 },
  errorBox: { backgroundColor: colors.dangerLight, borderRadius: radius.input, padding: 12 },
  footer: { padding: screenPadding, backgroundColor: colors.background },
});
