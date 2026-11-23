// "AI is working" card: shimmering skeleton lines and a status text that changes every 1.5 seconds.
// Never a plain spinner (DESIGN.md section 6).
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import { colors, radius } from '../theme';

function ShimmerBar({ width, height = 14 }) {
  const x = useRef(new Animated.Value(0)).current;
  const [w, setW] = useState(200);

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(x, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, []);

  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [-w, w] });
  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ width, height, borderRadius: 8, backgroundColor: colors.border, overflow: 'hidden' }}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

// messageKeys: list of i18n keys, shown one after another
export default function AIThinking({ messageKeys }) {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((n) => (n + 1) % messageKeys.length), 1500);
    return () => clearInterval(id);
  }, [messageKeys.length]);

  return (
    <View style={styles.card} accessibilityLiveRegion="polite">
      <View style={[styles.statusRow, isUrdu && styles.rowUrdu]}>
        <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
        <AppText variant="bodyMedium" color={colors.primary} style={styles.status}>{t(messageKeys[index])}</AppText>
      </View>
      <View style={styles.bars}>
        <ShimmerBar width="70%" />
        <ShimmerBar width="100%" />
        <ShimmerBar width="45%" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 16, gap: 16, elevation: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowUrdu: { flexDirection: 'row-reverse' },
  status: { flex: 1 },
  bars: { gap: 10 },
});
