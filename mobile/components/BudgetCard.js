// One monthly budget: category, "Rs 6,200 of Rs 8,000", a progress bar, and "Over by Rs X" when it is over.
// Bar color: blue under 80%, amber from 80% to 100%, red over.
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import AmountText from './ui/AmountText';
import AppText from './AppText';
import Card from './ui/Card';
import CategoryIcon from './CategoryIcon';
import ProgressBar from './ui/ProgressBar';
import { categoryKey } from '../constants/categories';
import { colors, spacing } from '../theme';
import { rupeesText } from '../utils/money';

const STATUS_COLOR = { ok: colors.primary, warning: colors.warning, over: colors.danger };

export default function BudgetCard({ budget, onPress }) {
  const { t, i18n } = useTranslation();
  const color = STATUS_COLOR[budget.status];
  const textColor = budget.status === 'ok' ? colors.text : color;
  return (
    <Card onPress={onPress} accessibilityLabel={t(categoryKey(budget.category))} style={styles.card}>
      <View style={styles.top}>
        <CategoryIcon category={budget.category} />
        <AppText variant="bodyMedium" style={styles.name}>{t(categoryKey(budget.category))}</AppText>
        <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
      </View>

      <View style={styles.amounts}>
        <AmountText amount={budget.spent} variant="h2" color={textColor} />
        <AppText variant="caption" color={colors.textSecondary}>{t('goals.of')}</AppText>
        <AmountText amount={budget.limit} variant="amount" color={colors.textSecondary} />
      </View>

      <ProgressBar value={budget.ratio} color={color} />

      {budget.status === 'over' ? (
        <AppText variant="bodyMedium" color={colors.danger}>
          {t('goals.overBy', { amount: rupeesText(budget.overBy, i18n.language, t('common.rupees')) })}
        </AppText>
      ) : (
        <AppText variant="caption" color={colors.textSecondary}>{t('goals.percentUsed', { percent: budget.percent })}</AppText>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { flex: 1 },
  amounts: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
});
