// A row inside a grouped card: icon, label (and hint), then a value or switch, and a chevron if tappable.
// The chevron points the right way in both directions.
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppText from '../AppText';
import PressableScale from '../PressableScale';
import { colors, radius, spacing } from '../../theme';
import { forwardIcon, useIsRTL } from '../../utils/rtl';

export default function ListRow({
  icon, iconColor = colors.accentLight, label, labelColor = colors.text, hint, value, right, onPress, first = false,
  accessibilityRole = 'button',
}) {
  const rtl = useIsRTL();
  const body = (
    <View style={[styles.row, !first && styles.line]}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.texts}>
        <AppText variant="bodyMedium" color={labelColor}>{label}</AppText>
        {hint ? <AppText variant="caption" color={colors.textSecondary}>{hint}</AppText> : null}
        {value ? <AppText variant="caption" color={colors.textSecondary}>{value}</AppText> : null}
      </View>
      {right}
      {onPress ? <Ionicons name={forwardIcon(rtl, 'chevron')} size={18} color={colors.textSecondary} /> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <PressableScale onPress={onPress} accessibilityRole={accessibilityRole} accessibilityLabel={label}>{body}</PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 64, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  line: { borderTopWidth: 1, borderTopColor: colors.divider },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.input,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 2 },
});
