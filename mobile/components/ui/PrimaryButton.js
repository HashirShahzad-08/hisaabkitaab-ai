// The app's button (min height 52, radius 12). Springs to 0.97 while pressed and gives a light haptic.
// variant: "filled" (blue) | "outlined" (dark outline) | "danger" (red filled) | "text" (no box)
// tone="danger" makes the words of an outlined or text button red.
import { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import AppText from '../AppText';
import { colors, radius, sizes, spacing } from '../../theme';

export default function PrimaryButton({
  label, onPress, loading = false, disabled = false, icon, variant = 'filled', tone, style,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(scale, { toValue: v, damping: 15, stiffness: 300, useNativeDriver: true }).start();
  const solid = variant === 'filled' || variant === 'danger';
  const textColor = solid ? colors.onPrimary : tone === 'danger' ? colors.danger : colors.text;
  const inactive = disabled || loading;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onPress?.();
        }}
        onPressIn={() => !inactive && to(0.97)}
        onPressOut={() => to(1)}
        disabled={inactive}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: inactive, busy: loading }}
        style={[styles.button, styles[variant], inactive && styles.inactive]}
      >
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <View style={styles.row}>
            {icon ? <Ionicons name={icon} size={20} color={textColor} /> : null}
            <AppText variant="bodyMedium" color={textColor} style={styles.label}>{label}</AppText>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: sizes.button,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  filled: { backgroundColor: colors.primary },
  danger: { backgroundColor: colors.danger },
  outlined: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  text: { backgroundColor: 'transparent' },
  inactive: { opacity: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { textAlign: 'center', flexShrink: 1 },
});
