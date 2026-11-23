// Spending by category: animated donut with the total in the middle, and a top 5 legend.
import { StyleSheet, Text, View } from 'react-native';
import { Card } from 'react-native-paper';
import { PieChartPro } from 'react-native-gifted-charts';
import { useTranslation } from 'react-i18next';

import AmountText from './AmountText';
import AppText from './AppText';
import { categoryColor, categoryKey } from '../constants/categories';
import { colors, fonts, radius } from '../theme';

export default function SpendingCard({ stats }) {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const { categories, expense } = stats;
  const pieData = categories.map((c) => ({ value: c.amount, color: categoryColor(c.category) }));

  return (
    <Card elevation={1} style={styles.card}>
      <AppText variant="h2">{t('home.spendingByCategory')}</AppText>

      {expense === 0 ? (
        <AppText variant="body" color={colors.textSecondary} style={styles.empty}>{t('home.noSpending')}</AppText>
      ) : (
        <>
          <View style={styles.chart}>
            <PieChartPro
              data={pieData}
              donut
              radius={72}
              innerRadius={50}
              isAnimated
              animationDuration={800}
              centerLabelComponent={() => (
                <View style={styles.centerLabel}>
                  <AmountText amount={expense} variant="amount" size={14} />
                  <AppText variant="caption" color={colors.textSecondary} style={styles.centerCaption}>
                    {t('home.spent')}
                  </AppText>
                </View>
              )}
            />
          </View>

          {categories.slice(0, 5).map((c) => (
            <View key={c.category} style={[styles.legendRow, isUrdu && styles.rowUrdu]}>
              <View style={[styles.dot, { backgroundColor: categoryColor(c.category) }]} />
              <AppText variant="body" style={styles.legendName}>{t(categoryKey(c.category))}</AppText>
              <AmountText amount={c.amount} variant="caption" color={colors.textSecondary} />
              <Text style={styles.percent}>{`${c.percent}%`}</Text>
            </View>
          ))}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 16 },
  empty: { marginTop: 12 },
  chart: { alignItems: 'center', marginVertical: 16 },
  centerLabel: { alignItems: 'center', justifyContent: 'center' },
  centerCaption: { marginTop: -2 },
  legendRow: { flexDirection: 'row', alignItems: 'center', minHeight: 36, gap: 8 },
  rowUrdu: { flexDirection: 'row-reverse' },
  dot: { width: 12, height: 12, borderRadius: 6 },
  legendName: { flex: 1 },
  percent: { width: 48, textAlign: 'right', fontFamily: fonts.en.medium, fontSize: 15, color: colors.text },
});
