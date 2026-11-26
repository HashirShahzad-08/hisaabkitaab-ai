// The blue Home card: this month's balance with the Health Score ring, then income and spent.
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import HealthRing from './HealthRing';
import AmountText from './ui/AmountText';
import HeroCard from './ui/HeroCard';
import { palette, spacing } from '../theme';
import useAnimatedNumber from '../utils/useAnimatedNumber';

function Stat({ label, amount }) {
  return (
    <View style={styles.stat}>
      <AppText variant="caption" color={palette.heroSubtle}>{label}</AppText>
      <View style={styles.amount}>
        <AmountText amount={amount} variant="h2" color={palette.heroText} fit />
      </View>
    </View>
  );
}

// health: the result of calculateHealthScore, or null to leave the ring out (no transactions yet)
export default function BalanceHero({ balance, income, expense, health }) {
  const { t } = useTranslation();
  // The numbers count up from 0 on load, and roll to new values when they change.
  const shownBalance = useAnimatedNumber(balance);
  const shownIncome = useAnimatedNumber(income);
  const shownExpense = useAnimatedNumber(expense);

  return (
    <HeroCard>
      <View style={styles.top}>
        <View style={styles.balance}>
          <AppText variant="caption" color={palette.heroSubtle}>{t('home.balanceThisMonth')}</AppText>
          <View style={styles.amount}>
            <AmountText amount={shownBalance} variant="display" size={32} color={palette.heroText} fit />
          </View>
        </View>
        {health ? <HealthRing score={health.score} band={health.band} /> : null}
      </View>

      <View style={styles.divider} />

      <View style={styles.stats}>
        <Stat label={t('home.income')} amount={shownIncome} />
        <View style={styles.split} />
        <Stat label={t('home.spentTitle')} amount={shownExpense} />
      </View>
    </HeroCard>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  balance: { flex: 1, gap: spacing.xs },
  amount: { alignItems: 'flex-start' }, // start = left in English, right in Urdu
  divider: { height: 1, backgroundColor: palette.heroLine, marginVertical: spacing.md },
  stats: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.md },
  stat: { flex: 1, gap: spacing.xs },
  split: { width: 1, backgroundColor: palette.heroLine },
});
