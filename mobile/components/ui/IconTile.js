// A dark square tile with a light icon and a short label under it.
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppText from '../AppText';
import PressableScale from '../PressableScale';
import { colors, radius, spacing } from '../../theme';

export default function IconTile({ icon, label, onPress, style }) {
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
});
