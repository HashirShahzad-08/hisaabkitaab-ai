// A rounded progress bar that fills smoothly. It fills from the start side (left in English, right in Urdu).
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { colors } from '../theme';

export default function ProgressBar({ value, color = colors.primary, height = 10 }) {
  const fill = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(1, value || 0));

  useEffect(() => {
    Animated.timing(fill, { toValue: clamped, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [clamped]);

  const width = fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}>
      <Animated.View style={{ width, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { backgroundColor: colors.border, overflow: 'hidden', alignSelf: 'stretch' },
});
