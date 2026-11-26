// A dark placeholder block with a soft shimmer, shown while data is loading.
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, palette, radius } from '../../theme';

export default function Skeleton({ width = '100%', height = 16, round = radius.input, style }) {
  const x = useRef(new Animated.Value(0)).current;
  const [measured, setMeasured] = useState(200);

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(x, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, []);

  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [-measured, measured] });
  return (
    <View
      onLayout={(e) => setMeasured(e.nativeEvent.layout.width)}
      style={[{ width, height, borderRadius: round, backgroundColor: colors.surfaceRaised, overflow: 'hidden' }, style]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={[palette.shimmerClear, palette.shimmer, palette.shimmerClear]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}
