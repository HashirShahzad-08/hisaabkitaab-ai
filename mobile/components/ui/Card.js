// The basic dark card. Give it onPress to make it springy and tappable.
import { StyleSheet, View } from 'react-native';

import PressableScale from '../PressableScale';
import { colors, radius, spacing } from '../../theme';

export default function Card({ children, raised = false, onPress, style, accessibilityLabel }) {
  const body = <View style={[styles.card, raised && styles.raised, style]}>{children}</View>;
  if (!onPress) return body;
  return <PressableScale onPress={onPress} accessibilityLabel={accessibilityLabel}>{body}</PressableScale>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  raised: { backgroundColor: colors.surfaceRaised },
});
