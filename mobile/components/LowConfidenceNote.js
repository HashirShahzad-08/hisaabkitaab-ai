// A small line shown on a result card when the backend is not sure ("low" confidence).
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import { colors, radius } from '../theme';

export default function LowConfidenceNote({ confidence }) {
  const { t, i18n } = useTranslation();
  if (confidence !== 'low') return null;
  return (
    <View style={styles.row} accessibilityRole="alert">
      <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
      <AppText variant="caption" color={colors.text} style={styles.text}>{t('common.checkDetails')}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.warningLight,
    borderRadius: radius.input,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: { flex: 1 },
});
