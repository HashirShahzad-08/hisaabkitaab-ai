// One savings goal: name, saved of target, progress bar, optional target date and weekly saving.
// A reached goal turns gold.
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import AmountText from './ui/AmountText';
import AppText from './AppText';
import Card from './ui/Card';
import PressableScale from './PressableScale';
import PrimaryButton from './ui/PrimaryButton';
import ProgressBar from './ui/ProgressBar';
import { colors, radius, sizes, spacing } from '../theme';
import { weeklySaving } from '../utils/budgets';
import { rupeesText, shortDate } from '../utils/money';

export default function GoalCard({ goal, onAddMoney, onEdit, onDelete }) {
  const { t, i18n } = useTranslation();
  const reached = goal.savedAmount >= goal.targetAmount;
  const ratio = goal.targetAmount > 0 ? goal.savedAmount / goal.targetAmount : 0;
  const plan = weeklySaving(goal);
  const money = (n) => rupeesText(n, i18n.language, t('common.rupees'));

  return (
    <Card style={[styles.card, reached && styles.cardReached]}>
      <View style={styles.top}>
        <View style={styles.iconBox}>
          <Ionicons name={reached ? 'trophy' : 'flag-outline'} size={22} color={reached ? colors.accent : colors.accentLight} />
        </View>
        <AppText variant="h2" style={styles.name} numberOfLines={2}>{goal.name}</AppText>
        <PressableScale onPress={onEdit} accessibilityLabel={t('goals.edit')} hitSlop={6} pressableStyle={styles.iconButton}>
          <Ionicons name="create-outline" size={22} color={colors.textSecondary} />
        </PressableScale>
        <PressableScale onPress={onDelete} accessibilityLabel={t('goals.delete')} hitSlop={6} pressableStyle={styles.iconButton}>
          <Ionicons name="trash-outline" size={22} color={colors.danger} />
        </PressableScale>
      </View>

      <View style={styles.amounts}>
        <AmountText amount={goal.savedAmount} variant="h2" color={reached ? colors.accent : colors.text} />
        <AppText variant="caption" color={colors.textSecondary}>{t('goals.of')}</AppText>
        <AmountText amount={goal.targetAmount} variant="amount" color={colors.textSecondary} />
      </View>

      <ProgressBar value={ratio} color={reached ? colors.accent : colors.primary} />

      {reached ? (
        <View style={styles.badge}>
          <Ionicons name="trophy-outline" size={18} color={colors.accent} />
          <AppText variant="bodyMedium" color={colors.accent}>{t('goals.reached')}</AppText>
        </View>
      ) : (
        <>
          {goal.targetDate ? (
            <AppText variant="caption" color={colors.textSecondary}>{t('goals.targetDate', { date: shortDate(goal.targetDate, t) })}</AppText>
          ) : null}
          {plan && !plan.pastDue ? (
            <AppText variant="bodyMedium" color={colors.accentLight}>
              {t('goals.savePerWeek', { amount: money(plan.perWeek), date: shortDate(goal.targetDate, t) })}
            </AppText>
          ) : null}
          {plan && plan.pastDue ? (
            <AppText variant="caption" color={colors.warning}>{t('goals.pastDue', { amount: money(plan.remaining) })}</AppText>
          ) : null}
          <PrimaryButton label={t('goals.addMoney')} icon="add-circle-outline" variant="outlined" onPress={onAddMoney} />
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  cardReached: { borderColor: colors.accent },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.input,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { flex: 1 },
  iconButton: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center' },
  amounts: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
