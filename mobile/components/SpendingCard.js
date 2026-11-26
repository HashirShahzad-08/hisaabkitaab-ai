// "Spending this month": the top 3 categories with bars. "Details" opens the full donut chart.
// The tips at the bottom (health tip and insight) can be read aloud.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { PieChartPro } from 'react-native-gifted-charts';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import AmountText from './ui/AmountText';
import Card from './ui/Card';
import ProgressBar from './ui/ProgressBar';
import SectionHeader from './ui/SectionHeader';
import SpeakerButton from './ui/SpeakerButton';
import { categoryColor, categoryKey } from '../constants/categories';
import { colors, fonts, spacing } from '../theme';

export default function SpendingCard({ stats, tips = [] }) {
  const { t } = useTranslation();
  const { categories, expense } = stats;
  const [open, setOpen] = useState(false);
  const pieData = categories.map((c) => ({ value: c.amount, color: categoryColor(c.category) }));
  const tipsText = tips.filter(Boolean).join(' ');

  return (
    <Card style={styles.card}>
      <SectionHeader
        title={t('home.spendingThisMonth')}
        linkLabel={expense > 0 ? t(open ? 'home.hideDetails' : 'home.details') : null}
        onPressLink={() => setOpen((v) => !v)}
      />

      {expense === 0 ? (
        <AppText variant="body" color={colors.textSecondary}>{t('home.noSpending')}</AppText>
      ) : (
        categories.slice(0, 3).map((c) => (
          <View key={c.category} style={styles.category}>
            <View style={styles.line}>
              <AppText variant="body" color={colors.textBody} style={styles.flex}>{t(categoryKey(c.category))}</AppText>
              <AmountText amount={c.amount} variant="bodyMedium" />
            </View>
            <ProgressBar value={c.percent / 100} height={8} />
          </View>
        ))
      )}

      {open && expense > 0 ? (
        <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 300 }}>
          <View style={styles.chart}>
            <PieChartPro
              data={pieData}
              donut
              radius={72}
              innerRadius={52}
              innerCircleColor={colors.surface}
              isAnimated
              animationDuration={800}
              centerLabelComponent={() => (
                <View style={styles.centerLabel}>
                  <AmountText amount={expense} variant="amount" size={14} />
                  <AppText variant="caption" color={colors.textSecondary}>{t('home.spent')}</AppText>
                </View>
              )}
            />
          </View>
          {categories.slice(0, 5).map((c) => (
            <View key={c.category} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: categoryColor(c.category) }]} />
              <AppText variant="body" color={colors.textBody} style={styles.flex}>{t(categoryKey(c.category))}</AppText>
              <AmountText amount={c.amount} variant="caption" color={colors.textSecondary} />
              <View style={styles.percentBox}>
                <Text style={styles.percent}>{`${c.percent}%`}</Text>
              </View>
            </View>
          ))}
        </MotiView>
      ) : null}

      {tipsText ? (
        <View style={styles.tips}>
          <Ionicons name="bulb-outline" size={20} color={colors.accentLight} />
          <AppText variant="caption" color={colors.textBody} style={styles.flex}>{tipsText}</AppText>
          <SpeakerButton text={tipsText} />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  flex: { flex: 1 },
  category: { gap: spacing.sm },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chart: { alignItems: 'center', marginBottom: spacing.md },
  centerLabel: { alignItems: 'center', justifyContent: 'center' },
  legendRow: { flexDirection: 'row', alignItems: 'center', minHeight: 32, gap: spacing.sm },
  dot: { width: 12, height: 12, borderRadius: 6 },
  percentBox: { width: 48, alignItems: 'flex-end' },
  percent: { fontFamily: fonts.en.medium, fontSize: 14, color: colors.text },
  tips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
  },
});
