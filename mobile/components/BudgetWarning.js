// Amber card on Home, shown only when a budget is at 80% or more, with a speaker button.
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import SpeakerButton from './ui/SpeakerButton';
import { categoryKey } from '../constants/categories';
import { colors, radius, spacing } from '../theme';
import { rupeesText } from '../utils/money';

export default function BudgetWarning({ budget }) {
  const { t, i18n } = useTranslation();
  if (!budget) return null;

  const title = t('goals.budgetWarning', { category: t(categoryKey(budget.category)), percent: budget.percent });
  const body = budget.status === 'over'
    ? t('goals.overBy', { amount: rupeesText(budget.overBy, i18n.language, t('common.rupees')) })
    : t('goals.percentUsed', { percent: budget.percent });

  return (
    <View style={styles.card} accessibilityRole="alert">
      <Ionicons name="warning-outline" size={24} color={colors.warning} />
      <View style={styles.texts}>
        <AppText variant="bodyMedium" color={colors.warningTitle}>{title}</AppText>
        <AppText variant="caption" color={colors.warningBody}>{body}</AppText>
      </View>
      <SpeakerButton text={`${title}. ${body}`} color={colors.warning} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  texts: { flex: 1, gap: 2 },
});
