// A small pill. With onPress it can be selected (blue fill). size="lg" is a 44px touch target.
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppText from '../AppText';
import PressableScale from '../PressableScale';
import { colors, radius, sizes, spacing } from '../../theme';

export default function Chip({
  label, icon, trailingIcon, iconColor, color = colors.textBody, background = colors.surfaceRaised, borderColor,
  selected, onPress, size, style, accessibilityRole,
}) {
  const tint = selected ? colors.onPrimary : color;
  const large = size === 'lg';
  const body = (
    <View
      style={[
        styles.chip,
        large && styles.large,
        { backgroundColor: selected ? colors.primary : background, borderColor: selected ? colors.primary : borderColor || colors.border },
        !onPress && style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={large ? 18 : 14} color={selected ? tint : iconColor || tint} /> : null}
      <AppText variant={large ? 'bodyMedium' : 'caption'} color={tint} style={styles.label}>{label}</AppText>
      {trailingIcon ? <Ionicons name={trailingIcon} size={14} color={tint} /> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      style={[styles.touch, style]}
      hitSlop={large ? 0 : 8}
    >
      {body}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  touch: { maxWidth: '100%' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    maxWidth: '100%',
  },
  large: { minHeight: sizes.touch, paddingHorizontal: spacing.md, gap: spacing.sm },
  label: { flexShrink: 1 },
});
