// One monthly budget: category, "Rs 6,200 of Rs 8,000", a progress bar, and "Over by Rs X" when it is over.
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import AmountText from './ui/AmountText';
import AppText from './AppText';
import CategoryIcon from './CategoryIcon';
import PressableScale from './PressableScale';
import ProgressBar from './ui/ProgressBar';
import { categoryKey } from '../constants/categories';
import { colors, radius } from '../theme';
import { rupeesText } from '../utils/money';

const STATUS_COLOR = { ok: colors.primary, warning: colors.warning, over: colors.danger };

export default function BudgetCard({ budget, onPress }) {
  const { t, i18n } = useTranslation();
  const color = STATUS_COLOR[budget.status];
  return (
    <PressableScale onPress={onPress} accessibilityLabel={t(categoryKey(budget.category))}>
      <View style={styles.card}>
        <View style={styles.top}>
          <CategoryIcon category={budget.category} />
          <AppText variant="bodyMedium" style={styles.name}>{t(categoryKey(budget.category))}</AppText>
          <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
        </View>

        <View style={styles.amounts}>
          <AmountText amount={budget.spent} variant="amount" color={color} />
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
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 16, gap: 12, elevation: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { flex: 1 },
  amounts: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
});
