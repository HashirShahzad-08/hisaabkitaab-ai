// A dark track with a blue pill on the chosen option.
import { StyleSheet, View } from 'react-native';

import AppText from '../AppText';
import PressableScale from '../PressableScale';
import { colors, radius, sizes, spacing } from '../../theme';

// options: [{ value, label }]
export default function SegmentedControl({ options, value, onChange }) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <PressableScale
            key={option.value}
            onPress={() => onChange(option.value)}
            style={styles.flex}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
          >
            <View style={[styles.segment, selected && styles.selected]}>
              <AppText variant="bodyMedium" color={selected ? colors.onPrimary : colors.textSecondary}>{option.label}</AppText>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flex: { flex: 1 },
  segment: { minHeight: sizes.touch, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  selected: { backgroundColor: colors.primary },
});
