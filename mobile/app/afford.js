// Can I afford it? The app works out the numbers from the user's own data, the backend decides and explains.
import { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AIThinking from '../components/AIThinking';
import AlertCard from '../components/AlertCard';
import AmountText from '../components/AmountText';
import AppText from '../components/AppText';
import FadeInCard from '../components/FadeInCard';
import { scoreColor } from '../components/HealthRing';
import InsightCard from '../components/InsightCard';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import useBills from '../hooks/useBills';
import useTransactions from '../hooks/useTransactions';
import { ApiError, askAfford } from '../services/api';
import { colors, fonts, radius, screenPadding } from '../theme';
import { buildAffordInputs } from '../utils/affordInputs';
import { formatNumber } from '../utils/format';
import { calculateHealthScore } from '../utils/healthScore';
import useAnimatedNumber from '../utils/useAnimatedNumber';

const THINKING = ['thinking.afford.0', 'thinking.afford.1', 'thinking.afford.2'];

const VERDICT = {
  yes: { variant: 'success', icon: 'checkmark-circle', color: colors.primary },
  careful: { variant: 'warning', icon: 'alert-circle', color: colors.warning },
  not_now: { variant: 'danger', icon: 'close-circle', color: colors.danger },
};

// Keep digits and one dot only. "1,250" becomes "1250".
const cleanNumber = (v) => {
  const only = v.replace(/[^0-9.]/g, '');
  const [whole, ...rest] = only.split('.');
  return rest.length ? `${whole}.${rest.join('')}` : whole;
};

// "Rs 698" in English, "698 روپے" in Urdu (digits always Western)
const rupees = (n, isUrdu, unit) => (isUrdu ? `${formatNumber(n)} ${unit}` : `Rs ${formatNumber(n)}`);

function HealthChange({ before, after, restartKey }) {
  const { t } = useTranslation();
  const shownBefore = useAnimatedNumber(before, { restartKey });
  const shownAfter = useAnimatedNumber(after, { restartKey });
  const delta = after - before;
  return (
    <View style={styles.card}>
      <AppText variant="h2">{t('afford.healthTitle')}</AppText>
      <View style={styles.healthRow}>
        <View style={styles.healthItem}>
          <AppText variant="caption" color={colors.textSecondary}>{t('afford.healthNow')}</AppText>
          <Text style={[styles.healthNumber, { color: scoreColor(shownBefore) }]}>{Math.round(shownBefore)}</Text>
        </View>
        <Ionicons name="arrow-forward" size={24} color={colors.textSecondary} style={styles.arrow} />
        <View style={styles.healthItem}>
          <AppText variant="caption" color={colors.textSecondary}>{t('afford.healthAfter')}</AppText>
          <Text style={[styles.healthNumber, { color: scoreColor(shownAfter) }]}>{Math.round(shownAfter)}</Text>
        </View>
      </View>
      <AppText variant="caption" color={delta < 0 ? colors.danger : colors.textSecondary}>
        {delta === 0 ? t('afford.healthSame') : t(delta < 0 ? 'afford.healthDown' : 'afford.healthUp', { points: Math.abs(delta) })}
      </AppText>
    </View>
  );
}

export default function AffordScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const isUrdu = i18n.language === 'ur';

  const [reloadKey, setReloadKey] = useState(0);
  const tx = useTransactions(user?.uid, reloadKey);
  const bills = useBills(user?.uid, reloadKey);
  const inputs = useMemo(() => buildAffordInputs(tx.items, bills.bills), [tx.items, bills.bills]);

  const [item, setItem] = useState('');
  const [price, setPrice] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [answer, setAnswer] = useState(null); // { result, priceNumber }
  const [playKey, setPlayKey] = useState(0);

  const dataLoading = tx.loading || bills.loading;

  async function check() {
    if (loading) return;
    const e = {};
    if (!item.trim()) e.item = 'afford.errors.item';
    if (!/^\d+(\.\d+)?$/.test(price.trim()) || Number(price) <= 0) e.price = 'afford.errors.price';
    setErrors(e);
    if (Object.keys(e).length) return;

    const priceNumber = Number(price);
    const payload = {
      item: item.trim(),
      price: priceNumber,
      monthly_income: inputs.monthly_income,
      spent_this_month: inputs.spent_this_month,
      days_left_in_month: inputs.days_left_in_month,
      avg_daily_spend: inputs.avg_daily_spend,
    };
    if (inputs.upcoming_bills_estimate !== undefined) payload.upcoming_bills_estimate = inputs.upcoming_bills_estimate;

    setLoading(true);
    setApiError(null);
    try {
      const result = await askAfford(payload);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setAnswer({ result, priceNumber });
      setPlayKey((k) => k + 1);
    } catch (err) {
      setApiError(err instanceof ApiError ? err.messageKey : 'api.errors.generic');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setAnswer(null);
    setItem('');
    setPrice('');
    setErrors({});
    setApiError(null);
  }

  let body;
  if (dataLoading) {
    body = <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />;
  } else if (tx.error) {
    body = (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={40} color={colors.textSecondary} />
        <AppText variant="body" color={colors.textSecondary} style={styles.centerText}>
          {t(tx.error === 'permission-denied' ? 'afford.errorPermission' : 'afford.errorLoad')}
        </AppText>
        <PrimaryButton label={t('afford.retry')} variant="outlined" onPress={() => setReloadKey((k) => k + 1)} style={styles.fullWidth} />
      </View>
    );
  } else if (!inputs.hasIncome) {
    body = (
      <FadeInCard>
        <View style={[styles.card, styles.center]}>
          <View style={styles.circle}><Ionicons name="wallet-outline" size={40} color={colors.primary} /></View>
          <AppText variant="h2" style={styles.centerText}>{t('afford.noIncomeTitle')}</AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.centerText}>{t('afford.noIncomeText')}</AppText>
          <PrimaryButton label={t('afford.addIncome')} icon="add-circle-outline" onPress={() => router.push('/add-transaction')} style={styles.fullWidth} />
        </View>
      </FadeInCard>
    );
  } else if (answer) {
    const { result, priceNumber } = answer;
    const meta = VERDICT[result.verdict];
    const before = calculateHealthScore({ income: inputs.monthly_income, expense: inputs.spent_this_month, budgets: [] }).score;
    const after = calculateHealthScore({ income: inputs.monthly_income, expense: inputs.spent_this_month + priceNumber, budgets: [] }).score;
    body = (
      <View style={styles.stack}>
        {/* 1. Verdict */}
        <AlertCard variant={meta.variant} icon={meta.icon} title={t(`afford.verdict.${result.verdict}`)}>
          <AppText variant="body" color={colors.text}>{item.trim()}</AppText>
        </AlertCard>

        {/* 2. Key numbers */}
        <FadeInCard index={1}>
          <View style={styles.card}>
            <View style={styles.statRow}>
              <AppText variant="body" color={colors.textSecondary} style={styles.flex}>{t('afford.moneyLeft')}</AppText>
              <AmountText amount={result.remaining} variant="h2" />
            </View>
            <View style={styles.statRow}>
              <AppText variant="body" color={colors.textSecondary} style={styles.flex}>{t('afford.safeToSpend')}</AppText>
              <AmountText amount={result.safe_to_spend} variant="h2" color={result.safe_to_spend < 0 ? colors.danger : colors.text} />
            </View>
            <View style={styles.statRow}>
              <AppText variant="body" color={colors.textSecondary} style={styles.flex}>{t('afford.price')}</AppText>
              <AmountText amount={result.price} variant="h2" />
            </View>
          </View>
        </FadeInCard>

        {/* 3. Explanation, can be read aloud */}
        <FadeInCard index={2}><InsightCard text={result.explanation} /></FadeInCard>

        {/* 4. Suggestion, and the saving plan if not now */}
        <FadeInCard index={3}>
          <View style={styles.card}>
            <View style={[styles.suggestionRow, isUrdu && styles.rowUrdu]}>
              <Ionicons name="bulb-outline" size={22} color={colors.accent} />
              <AppText variant="body" style={styles.flex}>{result.suggestion}</AppText>
            </View>
            {result.verdict === 'not_now' && result.weeks_to_save > 0 ? (
              <View style={[styles.plan, isUrdu && styles.rowUrdu]}>
                <Ionicons name="calendar-outline" size={22} color={colors.primary} />
                <AppText variant="bodyMedium" color={colors.primaryDark} style={styles.flex}>
                  {t('afford.saveWeekly', { amount: rupees(result.weekly_saving, isUrdu, t('common.rupees')), weeks: result.weeks_to_save })}
                </AppText>
              </View>
            ) : null}
          </View>
        </FadeInCard>

        {/* 5. Health Score now -> after buying */}
        <FadeInCard index={4}><HealthChange before={before} after={after} restartKey={playKey} /></FadeInCard>
      </View>
    );
  } else {
    body = (
      <View style={styles.stack}>
        <View style={styles.field}>
          <TextInput
            mode="outlined"
            label={t('afford.itemLabel')}
            value={item}
            onChangeText={(v) => { setItem(v); setErrors((x) => ({ ...x, item: undefined })); }}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            outlineStyle={{ borderRadius: radius.input }}
            style={styles.input}
            contentStyle={{ fontFamily: isUrdu ? fonts.ur.regular : fonts.en.regular }}
            maxLength={80}
            error={!!errors.item}
            disabled={loading}
          />
          {errors.item ? <AppText variant="caption" color={colors.danger}>{t(errors.item)}</AppText> : null}
          <View style={[styles.hint, isUrdu && styles.rowUrdu]}>
            <Ionicons name="mic-outline" size={18} color={colors.textSecondary} />
            <AppText variant="caption" color={colors.textSecondary} style={styles.flex}>{t('afford.itemHint')}</AppText>
          </View>
        </View>

        <View style={styles.field}>
          <TextInput
            mode="outlined"
            label={t('afford.priceLabel')}
            value={price}
            onChangeText={(v) => { setPrice(cleanNumber(v)); setErrors((x) => ({ ...x, price: undefined })); }}
            keyboardType="decimal-pad"
            left={<TextInput.Affix text="Rs" />}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            outlineStyle={{ borderRadius: radius.input }}
            style={styles.input}
            contentStyle={{ fontFamily: fonts.en.medium, fontSize: 18 }}
            error={!!errors.price}
            disabled={loading}
          />
          {errors.price ? <AppText variant="caption" color={colors.danger}>{t(errors.price)}</AppText> : null}
        </View>

        {apiError ? (
          <View style={styles.errorBox}><AppText variant="body" color={colors.danger}>{t(apiError)}</AppText></View>
        ) : null}
        {loading ? <AIThinking messageKeys={THINKING} /> : null}
      </View>
    );
  }

  const showFormButton = !dataLoading && !tx.error && inputs.hasIncome && !answer;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title={t('afford.title')} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {body}
        </ScrollView>
        <View style={styles.footer}>
          {showFormButton ? (
            <PrimaryButton
              label={apiError ? t('afford.retry') : t('afford.check')}
              icon={apiError ? 'refresh' : 'help-circle-outline'}
              onPress={check}
              loading={loading}
            />
          ) : null}
          {answer ? <PrimaryButton label={t('afford.another')} variant="outlined" onPress={reset} /> : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: screenPadding, paddingBottom: 24, flexGrow: 1 },
  stack: { gap: 12 },
  loader: { marginTop: 48 },
  field: { gap: 4 },
  input: { backgroundColor: colors.surface },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  rowUrdu: { flexDirection: 'row-reverse' },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 16, gap: 12, elevation: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  centerText: { textAlign: 'center' },
  fullWidth: { alignSelf: 'stretch', marginTop: 8 },
  circle: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  suggestionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.primaryLight, borderRadius: radius.input, padding: 12 },
  healthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, direction: 'ltr' },
  healthItem: { alignItems: 'center' },
  healthNumber: { fontFamily: fonts.en.bold, fontSize: 34 },
  arrow: { marginTop: 14 },
  errorBox: { backgroundColor: colors.dangerLight, borderRadius: radius.input, padding: 12 },
  footer: { padding: screenPadding, backgroundColor: colors.background },
});
