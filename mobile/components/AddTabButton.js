// The raised green center "+" button (56px). It turns 45 degrees into an x while the sheet is open.
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAddSheet } from '../context/AddSheetContext';
import { colors, sizes } from '../theme';

export default function AddTabButton({ accessibilityLabel }) {
  const { open, toggle } = useAddSheet();
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(rotation, { toValue: open ? 1 : 0, damping: 14, stiffness: 180, useNativeDriver: true }).start();
  }, [open]);

  const to = (v) =>
    Animated.spring(scale, { toValue: v, damping: 15, stiffness: 300, useNativeDriver: true }).start();
  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  return (
    <View style={styles.slot}>
      <Pressable
        onPress={toggle}
        onPressIn={() => to(0.97)}
        onPressOut={() => to(1)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <Animated.View style={[styles.circle, { transform: [{ scale }] }]}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="add" size={32} color="#FFFFFF" />
          </Animated.View>
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
