// Small bar chart of units per month (DESIGN.md 8.8). Bars grow from the bottom, one after another.
import { StyleSheet, Text, View } from 'react-native';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import { colors, fonts, radius } from '../theme';
import { splitMonth } from '../utils/billUi';

const HEIGHT = 90;

// bills: saved bills (any order). Shows the latest 6 months, oldest on the left (numbers never mirror).
export default function UnitsChart({ bills }) {
  const { t } = useTranslation();
  const byMonth = new Map();
  bills.forEach((b) => { if (!byMonth.has(b.billMonth)) byMonth.set(b.billMonth, b); }); // newest save wins
  const items = [...byMonth.values()].sort((a, b) => a.billMonth.localeCompare(b.billMonth)).slice(-6);
  if (items.length < 2) return null;
  const max = Math.max(...items.map((b) => b.units), 1);

  return (
    <View style={styles.card}>
      <AppText variant="h2">{t('bills.unitsPerMonth')}</AppText>
      <View style={styles.bars}>
        {items.map((b, i) => {
          const h = Math.max(6, Math.round((b.units / max) * HEIGHT));
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 16, gap: 12, elevation: 1 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: HEIGHT + 44, direction: 'ltr' },
  col: { alignItems: 'center', justifyContent: 'flex-end', flex: 1, gap: 4 },
  bar: { width: 22, backgroundColor: colors.primary, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  value: { fontFamily: fonts.en.medium, fontSize: 11, color: colors.textSecondary },
  label: { textAlign: 'center' },
});
