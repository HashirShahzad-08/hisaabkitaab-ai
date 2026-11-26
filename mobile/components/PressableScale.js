// Wraps anything pressable: springs to 0.97 while pressed and gives a light haptic (DESIGN.md section 6).
import { useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

export default function PressableScale({
  onPress, children, style, pressableStyle, accessibilityLabel, accessibilityRole = 'button',
  accessibilityState, disabled, hitSlop,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(scale, { toValue: v, damping: 15, stiffness: 300, useNativeDriver: true }).start();
  const press = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  };
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={press}
        onPressIn={() => !disabled && to(0.97)}
        onPressOut={() => to(1)}
        disabled={disabled}
        style={pressableStyle}
        hitSlop={hitSlop}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={accessibilityState}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
