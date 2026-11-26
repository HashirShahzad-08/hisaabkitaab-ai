// One savings goal: name, saved of target, gold progress bar, optional target date and weekly saving.
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import AmountText from './ui/AmountText';
import AppText from './AppText';
import PrimaryButton from './ui/PrimaryButton';
import ProgressBar from './ui/ProgressBar';
import { colors, radius, sizes } from '../theme';
import { weeklySaving } from '../utils/budgets';
import { rupeesText, shortDate } from '../utils/money';

export default function GoalCard({ goal, onAddMoney, onEdit, onDelete }) {
  const { t, i18n } = useTranslation();
  const reached = goal.savedAmount >= goal.targetAmount;
  const ratio = goal.targetAmount > 0 ? goal.savedAmount / goal.targetAmount : 0;
  const plan = weeklySaving(goal);
  const money = (n) => rupeesText(n, i18n.language, t('common.rupees'));

  return (
    <View style={[styles.card, reached && styles.cardReached]}>
      <View style={styles.top}>
        <View style={[styles.iconCircle, reached && { backgroundColor: colors.accent }]}>
          <Ionicons name={reached ? 'trophy' : 'flag-outline'} size={22} color={reached ? colors.background : colors.accent} />
        </View>
        <AppText variant="h2" style={styles.name} numberOfLines={2}>{goal.name}</AppText>
        <Pressable onPress={onEdit} style={styles.iconButton} accessibilityRole="button" accessibilityLabel={t('goals.edit')} hitSlop={6}>
          <Ionicons name="create-outline" size={22} color={colors.textSecondary} />
        </Pressable>
        <Pressable onPress={onDelete} style={styles.iconButton} accessibilityRole="button" accessibilityLabel={t('goals.delete')} hitSlop={6}>
          <Ionicons name="trash-outline" size={22} color={colors.danger} />
        </Pressable>
      </View>

      <View style={styles.amounts}>
        <AmountText amount={goal.savedAmount} variant="amount" color={reached ? colors.accent : colors.text} />
        <AppText variant="caption" color={colors.textSecondary}>{t('goals.of')}</AppText>
        <AmountText amount={goal.targetAmount} variant="amount" color={colors.textSecondary} />
      </View>

      <ProgressBar value={ratio} color={colors.accent} height={12} />

      {reached ? (
        <View style={styles.badge}>
          <Ionicons name="trophy-outline" size={18} color={colors.text} />
          <AppText variant="bodyMedium" color={colors.text}>{t('goals.reached')}</AppText>
        </View>
      ) : (
        <>
          {goal.targetDate ? (
            <AppText variant="caption" color={colors.textSecondary}>{t('goals.targetDate', { date: shortDate(goal.targetDate, t) })}</AppText>
          ) : null}
          {plan && !plan.pastDue ? (
            <AppText variant="bodyMedium" color={colors.primaryDark}>
              {t('goals.savePerWeek', { amount: money(plan.perWeek), date: shortDate(goal.targetDate, t) })}
            </AppText>
          ) : null}
          {plan && plan.pastDue ? (
            <AppText variant="caption" color={colors.danger}>{t('goals.pastDue', { amount: money(plan.remaining) })}</AppText>
          ) : null}
          <PrimaryButton label={t('goals.addMoney')} icon="add-circle-outline" variant="outlined" onPress={onAddMoney} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 16, gap: 12, elevation: 1, borderWidth: 2, borderColor: 'transparent' },
  cardReached: { borderColor: colors.accent },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.warningLight, alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1 },
  iconButton: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center' },
  amounts: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
