// Small colored pill: green (looks ok), orange (check), red (likely overbilled).
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import { radius } from '../theme';
import { verdictMeta } from '../utils/billUi';

export default function VerdictChip({ verdict }) {
  const { t } = useTranslation();
  const meta = verdictMeta(verdict);
  return (
    <View style={[styles.chip, { backgroundColor: meta.bg }]}>
      <AppText variant="caption" color={meta.color} style={styles.text}>{t(`bills.chip.${verdict}`)}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  text: { fontWeight: '600' },
});
