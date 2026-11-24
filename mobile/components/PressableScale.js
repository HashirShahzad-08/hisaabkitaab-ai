// Wraps anything pressable: scales to 0.97 while pressed and springs back (DESIGN.md section 6).
import { useRef } from 'react';
import { Animated, Pressable } from 'react-native';

export default function PressableScale({ onPress, children, style, accessibilityLabel, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(scale, { toValue: v, damping: 15, stiffness: 300, useNativeDriver: true }).start();
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => to(0.97)}
        onPressOut={() => to(1)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
