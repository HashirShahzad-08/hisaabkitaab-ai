// Health Score card: ring on one side, label and one tip on the other.
import { StyleSheet, View } from 'react-native';
import { Card } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import HealthRing, { scoreColor } from './HealthRing';
import { colors, radius } from '../theme';

export default function HealthScoreCard({ result, restartKey }) {
  const { t, i18n } = useTranslation();
  const { score, band, tip } = result;
  return (
    <Card elevation={1} style={styles.card}>
      <View style={styles.row}>
        <HealthRing score={score} restartKey={restartKey} />
        <View style={styles.texts}>
          <AppText variant="caption" color={colors.textSecondary}>{t('health.title')}</AppText>
          <AppText variant="h2" color={scoreColor(score)}>{t(`health.bands.${band}`)}</AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={3}>{t(tip)}</AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  texts: { flex: 1, marginHorizontal: 16, gap: 2 },
});
