// A small pill. With onPress it can be selected.
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppText from '../AppText';
import PressableScale from '../PressableScale';
import { colors, radius, spacing } from '../../theme';

export default function Chip({
  label, icon, color = colors.textBody, background = colors.surfaceRaised, borderColor, selected, onPress, style,
}) {
  const tint = selected ? colors.onPrimary : color;
  const body = (
    <View
      style={[
        styles.chip,
        { backgroundColor: selected ? colors.primary : background, borderColor: selected ? colors.primary : borderColor || colors.border },
        !onPress && style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={14} color={tint} /> : null}
      <AppText variant="caption" color={tint}>{label}</AppText>
    </View>
  );
  if (!onPress) return body;
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label} accessibilityState={{ selected: !!selected }} style={style} hitSlop={8}>
      {body}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
