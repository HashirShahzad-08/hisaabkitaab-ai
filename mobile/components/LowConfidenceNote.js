// A small line shown on a result card when the backend is not sure ("low" confidence).
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import { colors, radius, spacing } from '../theme';

export default function LowConfidenceNote({ confidence }) {
  const { t } = useTranslation();
  if (confidence !== 'low') return null;
  return (
    <View style={styles.row} accessibilityRole="alert">
      <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
      <AppText variant="caption" color={colors.warningTitle} style={styles.text}>{t('common.checkDetails')}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    borderRadius: radius.input,
    paddingHorizontal: 12,
    paddingVertical: spacing.sm,
  },
  text: { flex: 1 },
});
