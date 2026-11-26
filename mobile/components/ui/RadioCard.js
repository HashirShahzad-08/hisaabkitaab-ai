// A large pick-one card (used for the two languages).
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppText from '../AppText';
import PressableScale from '../PressableScale';
import { colors, radius, spacing } from '../../theme';

export default function RadioCard({ label, fontFamily, selected, onPress, style }) {
  return (
    <PressableScale
      onPress={onPress}
      style={style}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <View style={[styles.card, selected && styles.selected]}>
        <Ionicons
          name={selected ? 'checkmark-circle' : 'radio-button-off'}
          size={24}
          color={selected ? colors.accentLight : colors.textSecondary}
        />
        <AppText variant="h2" style={[styles.label, { fontFamily }]}>{label}</AppText>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.border,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  label: { flex: 1 },
});
