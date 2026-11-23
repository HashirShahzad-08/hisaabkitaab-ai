// Tab icon: outline when idle, filled when active, a small bounce, and a green pill under it.
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';

export default function TabIcon({ name, focused }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pill = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(pill, {
      toValue: focused ? 1 : 0,
      damping: 15,
      stiffness: 180,
      useNativeDriver: true,
    }).start();
    if (focused) {
      // 1 -> 1.15 -> 1
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.15, duration: 120, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, damping: 12, useNativeDriver: true }),
      ]).start();
    }
  }, [focused]);

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons
          name={focused ? name : `${name}-outline`}
          size={24}
          color={focused ? colors.primary : colors.textSecondary}
        />
      </Animated.View>
      <Animated.View style={[styles.pill, { opacity: pill, transform: [{ scaleX: pill }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  pill: {
    width: 20,
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
});
