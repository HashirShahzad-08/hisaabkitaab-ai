// The big green button (DESIGN.md: height 52, radius 12, full width). Springs to 0.97 while pressed.
import { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import { colors, radius, sizes } from '../theme';

export default function PrimaryButton({ label, onPress, loading = false, disabled = false, icon, variant = 'filled', style }) {
  const { i18n } = useTranslation();
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(scale, { toValue: v, damping: 15, stiffness: 300, useNativeDriver: true }).start();
  const filled = variant === 'filled';
  const textColor = filled ? '#FFFFFF' : colors.primary;
  const inactive = disabled || loading;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => !inactive && to(0.97)}
        onPressOut={() => to(1)}
        disabled={inactive}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: inactive, busy: loading }}
        style={[
          styles.button,
          filled ? styles.filled : styles.outlined,
          inactive && styles.inactive,
        ]}
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
    height: sizes.button,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  filled: { backgroundColor: colors.primary },
  outlined: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.surface },
  inactive: { opacity: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { textAlign: 'center' },
});
