// The raised green center "+" button (56px). It sits on top of the tab bar.
import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, sizes } from '../theme';

export default function AddTabButton({ onPress, accessibilityLabel }) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v) =>
    Animated.spring(scale, { toValue: v, damping: 15, stiffness: 300, useNativeDriver: true }).start();

  return (
    <View style={styles.slot}>
      <Pressable
        onPress={onPress}
        onPressIn={() => to(0.97)}
        onPressOut={() => to(1)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <Animated.View style={[styles.circle, { transform: [{ scale }] }]}>
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  circle: {
    width: sizes.addButton,
    height: sizes.addButton,
    borderRadius: sizes.addButton / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28, // raises the circle above the bar
    elevation: 4,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 4,
    borderColor: colors.background,
  },
});
