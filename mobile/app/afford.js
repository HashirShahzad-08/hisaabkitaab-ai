// Can I afford it? The app works out the numbers from the user's own data, the backend decides and explains.
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AIThinking from '../components/AIThinking';
import AmountText from '../components/ui/AmountText';
import AppText from '../components/AppText';
import FadeInCard from '../components/FadeInCard';
import InsightCard from '../components/InsightCard';
import PrimaryButton from '../components/ui/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import KeyboardAvoider from '../components/ui/KeyboardAvoider';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import FormInput from '../components/ui/FormInput';
import ListSkeleton from '../components/ui/ListSkeleton';
import ScoreRing from '../components/ui/ScoreRing';
import SectionHeader from '../components/ui/SectionHeader';
import StatGrid, { StatTile } from '../components/ui/StatGrid';
import VerdictCard from '../components/ui/VerdictCard';
import { useAuth } from '../context/AuthContext';
import useBills from '../hooks/useBills';
import { useBudgets } from '../hooks/useBudgetsAndGoals';
import useProfile from '../hooks/useProfile';
import useTransactions from '../hooks/useTransactions';
import { ApiError, askAfford } from '../services/api';
import { colors, fonts, radius, screenPadding, spacing } from '../theme';
import { buildAffordInputs } from '../utils/affordInputs';
import { formatNumber } from '../utils/format';
import { monthHealth } from '../utils/monthHealth';
import { forwardIcon, useIsRTL } from '../utils/rtl';
import { getMonthStats } from '../utils/stats';
import useAnimatedNumber from '../utils/useAnimatedNumber';

const THINKING = ['thinking.afford.0', 'thinking.afford.1', 'thinking.afford.2'];
const MAX_PRICE = 100000000; // the server's limit

const VERDICT = {
  yes: { tone: 'ok', icon: 'checkmark-circle' },
  careful: { tone: 'warning', icon: 'alert-circle' },
  not_now: { tone: 'danger', icon: 'close-circle' },
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
  const rtl = useIsRTL();
  const shownBefore = useAnimatedNumber(before, { restartKey });
  const shownAfter = useAnimatedNumber(after, { restartKey });
  const delta = after - before;
  return (
    <Card style={styles.group}>
      <SectionHeader title={t('afford.healthTitle')} />
      <View style={styles.healthRow}>
        <View style={styles.healthItem}>
          <ScoreRing score={shownBefore} />
          <AppText variant="caption" color={colors.textSecondary}>{t('afford.healthNow')}</AppText>
        </View>
        <Ionicons name={forwardIcon(rtl)} size={24} color={colors.textSecondary} />
        <View style={styles.healthItem}>
          <ScoreRing score={shownAfter} />
          <AppText variant="caption" color={colors.textSecondary}>{t('afford.healthAfter')}</AppText>
        </View>
      </View>
      <AppText variant="caption" color={delta < 0 ? colors.warning : colors.textSecondary} style={styles.centerText}>
        {delta === 0 ? t('afford.healthSame') : t(delta < 0 ? 'afford.healthDown' : 'afford.healthUp', { points: Math.abs(delta) })}
      </AppText>
    </Card>
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
  const budgets = useBudgets(user?.uid, reloadKey);
  const profile = useProfile(user?.uid, reloadKey);
  const inputs = useMemo(() => buildAffordInputs(tx.items, bills.bills, profile), [tx.items, bills.bills, profile]);

  const [item, setItem] = useState('');
  const [price, setPrice] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [answer, setAnswer] = useState(null); // { result, priceNumber }
  const [playKey, setPlayKey] = useState(0);

  const dataLoading = tx.loading || bills.loading || budgets.loading || profile === undefined;

  async function check() {
    if (loading) return;
    const e = {};
    if (!item.trim()) e.item = 'afford.errors.item';
    if (!/^\d+(\.\d+)?$/.test(price.trim()) || Number(price) <= 0) e.price = 'afford.errors.price';
    else if (Number(price) > MAX_PRICE) e.price = 'afford.errors.priceMax';
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
    body = <ListSkeleton count={3} height={88} />;
  } else if (tx.error) {
    body = (
      <FadeInCard>
        <EmptyState
          icon="cloud-offline-outline"
          iconColor={colors.textSecondary}
          text={t(tx.error === 'permission-denied' ? 'afford.errorPermission' : 'afford.errorLoad')}
          buttonLabel={t('afford.retry')}
          buttonVariant="outlined"
          onPress={() => setReloadKey((k) => k + 1)}
        />
      </FadeInCard>
    );
  } else if (!inputs.hasIncome) {
    body = (
      <FadeInCard>
        <EmptyState
          icon="wallet-outline"
          title={t('afford.noIncomeTitle')}
          text={t('afford.noIncomeText')}
          buttonLabel={t('afford.addIncome')}
          buttonIcon="add-circle-outline"
          onPress={() => router.push('/add-transaction')}
        />
      </FadeInCard>
    );
  } else if (answer) {
    const { result, priceNumber } = answer;
    const meta = VERDICT[result.verdict];
    const stats = getMonthStats(tx.items);
    const before = monthHealth(stats, budgets.items, profile).score;
    const after = monthHealth(stats, budgets.items, profile, priceNumber).score;
    body = (
      <View style={styles.stack}>
        {/* 1. Verdict */}
        <VerdictCard tone={meta.tone} icon={meta.icon} title={t(`afford.verdict.${result.verdict}`)} text={item.trim()} />

        {/* 2. Key numbers */}
        <FadeInCard index={1}>
          <StatGrid>
            <StatTile label={t('afford.moneyLeft')}><AmountText amount={result.remaining} variant="h2" fit /></StatTile>
            <StatTile label={t('afford.safeToSpend')}>
              <AmountText amount={result.safe_to_spend} variant="h2" color={result.safe_to_spend < 0 ? colors.danger : colors.text} fit />
            </StatTile>
            <StatTile label={t('afford.price')}><AmountText amount={result.price} variant="h2" fit /></StatTile>
          </StatGrid>
        </FadeInCard>

        {/* 3. Explanation, can be read aloud */}
        <FadeInCard index={2}><InsightCard text={result.explanation} /></FadeInCard>

        {/* 4. Suggestion, and the saving plan if not now */}
        <FadeInCard index={3}>
          <Card style={styles.group}>
            <View style={styles.suggestionRow}>
              <Ionicons name="bulb-outline" size={22} color={colors.accentLight} />
              <AppText variant="body" color={colors.textBody} style={styles.flex}>{result.suggestion}</AppText>
            </View>
            {result.verdict === 'not_now' && result.weeks_to_save > 0 ? (
              <View style={styles.plan}>
                <Ionicons name="calendar-outline" size={22} color={colors.accentLight} />
                <AppText variant="bodyMedium" color={colors.primaryDark} style={styles.flex}>
                  {t('afford.saveWeekly', { amount: rupees(result.weekly_saving, isUrdu, t('common.rupees')), weeks: result.weeks_to_save })}
                </AppText>
              </View>
            ) : null}
          </Card>
        </FadeInCard>

        {/* 5. Health Score now -> after buying */}
        <FadeInCard index={4}><HealthChange before={before} after={after} restartKey={playKey} /></FadeInCard>
      </View>
    );
  } else {
    body = (
      <View style={styles.stack}>
        <FadeInCard index={0}>
          <Card style={styles.group}>
            <View style={styles.field}>
              <FormInput
                label={t('afford.itemLabel')}
                value={item}
                onChangeText={(v) => { setItem(v); setErrors((x) => ({ ...x, item: undefined })); }}
                maxLength={80}
                error={!!errors.item}
                disabled={loading}
              />
              {errors.item ? <AppText variant="caption" color={colors.danger}>{t(errors.item)}</AppText> : null}
              <View style={styles.hint}>
                <Ionicons name="mic-outline" size={18} color={colors.textSecondary} />
                <AppText variant="caption" color={colors.textSecondary} style={styles.flex}>{t('afford.itemHint')}</AppText>
              </View>
            </View>

            <View style={styles.field}>
              <FormInput
                label={t('afford.priceLabel')}
                value={price}
                onChangeText={(v) => { setPrice(cleanNumber(v)); setErrors((x) => ({ ...x, price: undefined })); }}
                keyboardType="decimal-pad"
                left={<TextInput.Affix text="Rs" />}
                font={fonts.en.medium}
                contentStyle={{ fontSize: 18 }}
                error={!!errors.price}
                disabled={loading}
              />
              {errors.price ? <AppText variant="caption" color={colors.danger}>{t(errors.price)}</AppText> : null}
            </View>
          </Card>
        </FadeInCard>

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
      <KeyboardAvoider>
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
      </KeyboardAvoider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: screenPadding, paddingBottom: spacing.xl, flexGrow: 1 },
  stack: { gap: spacing.md },
  group: { gap: spacing.md },
  field: { gap: spacing.xs },
  hint: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xs },
  centerText: { textAlign: 'center' },
  suggestionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  plan: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primaryLight, borderRadius: radius.input, padding: 12 },
  healthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  healthItem: { alignItems: 'center', gap: spacing.sm },
  errorBox: { backgroundColor: colors.dangerLight, borderColor: colors.dangerBorder, borderWidth: 1, borderRadius: radius.input, padding: 12 },
  footer: { padding: screenPadding, backgroundColor: colors.background },
});
