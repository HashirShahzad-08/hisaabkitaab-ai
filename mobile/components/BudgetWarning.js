// One small line on Home: "Food budget 92% used". Shown when a budget is at 80% or more.
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import { categoryKey } from '../constants/categories';
import { colors, radius } from '../theme';

export default function BudgetWarning({ budget }) {
  const { t } = useTranslation();
  if (!budget) return null;
  const over = budget.status === 'over';
  const tint = over ? colors.danger : colors.warning;
  return (
    <View style={[styles.row, { backgroundColor: over ? colors.dangerLight : colors.warningLight }]} accessibilityRole="alert">
      <Ionicons name={over ? 'alert-circle' : 'warning-outline'} size={18} color={tint} />
      <AppText variant="caption" color={colors.text} style={styles.text}>
        {t('goals.budgetWarning', { category: t(categoryKey(budget.category)), percent: budget.percent })}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.input, paddingHorizontal: 12, paddingVertical: 8 },
  text: { flex: 1 },
});
