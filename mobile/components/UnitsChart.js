// Small bar chart of units per month (DESIGN.md 8.8). Bars grow from the bottom, one after another.
import { StyleSheet, Text, View } from 'react-native';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import { colors, fonts, spacing } from '../theme';
import { splitMonth } from '../utils/billUi';

const HEIGHT = 88;

// bills: saved bills (any order). Shows the latest 6 months, oldest on the left (numbers never mirror).
export default function UnitsChart({ bills }) {
  const { t } = useTranslation();
  const byMonth = new Map();
  bills.forEach((b) => { if (!byMonth.has(b.billMonth)) byMonth.set(b.billMonth, b); }); // newest save wins
  const items = [...byMonth.values()].sort((a, b) => a.billMonth.localeCompare(b.billMonth)).slice(-6);
  if (items.length < 2) return null;
  const max = Math.max(...items.map((b) => b.units), 1);

  return (
    <Card style={styles.card}>
      <SectionHeader title={t('bills.unitsPerMonth')} />
      <View style={styles.bars}>
        {items.map((b, i) => {
          const h = Math.max(8, Math.round((b.units / max) * HEIGHT));
          return (
            <View key={b.billMonth} style={styles.col}>
              <Text style={styles.value}>{Math.round(b.units)}</Text>
              <MotiView
                from={{ height: 0 }}
                animate={{ height: h }}
                transition={{ type: 'timing', duration: 400, delay: i * 80 }}
                style={styles.bar}
              />
              <AppText variant="caption" color={colors.textSecondary} style={styles.label}>
                {t(`months.short.${splitMonth(b.billMonth).month - 1}`)}
              </AppText>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  bars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: HEIGHT + 48, direction: 'ltr' },
  col: { alignItems: 'center', justifyContent: 'flex-end', flex: 1, gap: spacing.xs },
  bar: { width: 24, backgroundColor: colors.primary, borderTopStartRadius: 8, borderTopEndRadius: 8 },
  value: { fontFamily: fonts.en.medium, fontSize: 11, color: colors.textBody },
  label: { textAlign: 'center' },
});
