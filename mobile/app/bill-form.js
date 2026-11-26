// Bill form: the numbers from the electricity bill, then "Check bill".
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AIThinking from '../components/AIThinking';
import AppText from '../components/AppText';
import FadeInCard from '../components/FadeInCard';
import PressableScale from '../components/PressableScale';
import PrimaryButton from '../components/ui/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import KeyboardAvoider from '../components/ui/KeyboardAvoider';
import Card from '../components/ui/Card';
import FormInput from '../components/ui/FormInput';
import { useAuth } from '../context/AuthContext';
import useBills from '../hooks/useBills';
import { ApiError, analyzeBill } from '../services/api';
import { setCurrentBill } from '../services/billService';
import { colors, fonts, radius, screenPadding, sizes, spacing } from '../theme';
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
    if (!e.previous && !e.current && Number(current) < Number(previous)) e.current = 'bills.form.errors.currentLower';
    if (!e.units && Number(units) === 0) e.units = 'bills.form.errors.zero';
    if (!e.amount && Number(amount) === 0) e.amount = 'bills.form.errors.zero';
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
    keyboardType: 'decimal-pad',
    font: fonts.en.medium,
    contentStyle: { fontSize: 18 },
    disabled: loading,
  };

  const field = (key, label, value, setValue, extra = {}) => (
    <View style={styles.field}>
      <FormInput
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
    <PressableScale onPress={onPress} disabled={disabled || loading} hitSlop={6}>
      <View style={[styles.stepButton, disabled && styles.stepOff]}>
        <Ionicons name={icon} size={22} color={colors.accentLight} />
      </View>
    </PressableScale>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title={t('bills.form.title')} />
      <KeyboardAvoider>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Month */}
          <FadeInCard index={0}>
            <Card style={styles.group}>
              <AppText variant="caption" color={colors.textSecondary}>{t('bills.form.month')}</AppText>
              <View style={styles.monthRow}>
                {stepper(isUrdu ? 'chevron-forward' : 'chevron-back', () => setMonth((m) => shiftMonth(m, -1)), false)}
                <AppText variant="h2" style={styles.monthText}>{monthLabel(month, t)}</AppText>
                {stepper(isUrdu ? 'chevron-back' : 'chevron-forward', () => setMonth((m) => shiftMonth(m, 1)), isCurrentMonth)}
              </View>
            </Card>
          </FadeInCard>

          {/* Readings */}
          <FadeInCard index={1}>
            <Card style={styles.group}>
              {field('previous', t('bills.form.previous'), previous, setPrevious)}
              {field('current', t('bills.form.current'), current, setCurrent)}
              <View style={styles.helper}>
                <Ionicons name="information-circle-outline" size={18} color={colors.info} />
                <AppText variant="caption" color={colors.textSecondary} style={styles.helperText}>{t('bills.form.readingsHelp')}</AppText>
              </View>
            </Card>
          </FadeInCard>

          <FadeInCard index={2}>
            <Card style={styles.group}>
              {field('units', t('bills.form.units'), units, setUnits)}
              {field('amount', t('bills.form.amount'), amount, setAmount, { left: <TextInput.Affix text="Rs" /> })}
            </Card>
          </FadeInCard>

          {/* More details */}
          <FadeInCard index={3}>
            <Card style={styles.group}>
              <PressableScale onPress={() => setMoreOpen((o) => !o)} accessibilityState={{ expanded: moreOpen }}>
                <View style={styles.moreHeader}>
                  <AppText variant="bodyMedium" color={colors.accentLight} style={styles.flex}>{t('bills.form.more')}</AppText>
                  <Ionicons name={moreOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.accentLight} />
                </View>
              </PressableScale>
              {moreOpen ? (
                <View style={styles.group}>
                  {field('lastMonth', t('bills.form.lastMonth'), lastMonth, setLastMonth)}
                  {autoFilled ? (
                    <AppText variant="caption" color={colors.textSecondary}>{t('bills.form.autoFilled')}</AppText>
                  ) : null}
                  {field('lastYear', t('bills.form.lastYear'), lastYear, setLastYear)}
                  <View style={styles.field}>
                    <FormInput
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
            </Card>
          </FadeInCard>

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
      </KeyboardAvoider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: screenPadding, paddingBottom: spacing.xl, gap: spacing.md },
  group: { gap: spacing.md },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    minHeight: 56,
  },
  monthText: { flex: 1, textAlign: 'center' },
  stepButton: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center' },
  stepOff: { opacity: 0.3 },
  field: { gap: spacing.xs },
  error: { marginHorizontal: spacing.xs },
  helper: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  helperText: { flex: 1 },
  moreHeader: { flexDirection: 'row', alignItems: 'center', minHeight: sizes.touch },
  errorBox: { backgroundColor: colors.dangerLight, borderColor: colors.dangerBorder, borderWidth: 1, borderRadius: radius.input, padding: 12 },
  footer: { padding: screenPadding, backgroundColor: colors.background },
});
