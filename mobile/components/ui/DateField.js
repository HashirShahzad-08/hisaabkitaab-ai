// A dark input-like row that opens the date picker.
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppText from '../AppText';
import PressableScale from '../PressableScale';
import { colors, radius, spacing } from '../../theme';

export default function DateField({ label, onPress, style }) {
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label} style={style}>
      <View style={styles.row}>
        <Ionicons name="calendar-outline" size={20} color={colors.accentLight} />
        <AppText variant="body" style={styles.label}>{label}</AppText>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { flex: 1 },
});
