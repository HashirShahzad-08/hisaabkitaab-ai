// A dark square tile with a light icon and a short label under it.
// With a description it becomes a large option card: icon, title and one short line.
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppText from '../AppText';
import PressableScale from '../PressableScale';
import { colors, radius, spacing } from '../../theme';

export default function IconTile({ icon, label, description, onPress, style }) {
  if (description) {
    return (
      <PressableScale onPress={onPress} accessibilityLabel={`${label}. ${description}`} style={style} pressableStyle={styles.fill}>
        <View style={styles.large}>
          <View style={styles.largeIcon}>
            <Ionicons name={icon} size={26} color={colors.accentLight} />
          </View>
          <AppText variant="bodyMedium">{label}</AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>{description}</AppText>
        </View>
      </PressableScale>
    );
  }
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label} style={style}>
      <View style={styles.wrap}>
        <View style={styles.tile}>
          <Ionicons name={icon} size={24} color={colors.text} />
        </View>
        <AppText variant="caption" color={colors.textBody} style={styles.label} numberOfLines={2}>{label}</AppText>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  fill: { flexGrow: 1 },
  wrap: { alignItems: 'center', gap: spacing.sm },
  tile: {
    width: 64,
    height: 64,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { textAlign: 'center' },
  large: {
    flexGrow: 1,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  largeIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.input,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
});
