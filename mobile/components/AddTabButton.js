// The center "+" button: a 52px blue rounded square. It turns 45 degrees into an x while the sheet is open.
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import PressableScale from './PressableScale';
import { useAddSheet } from '../context/AddSheetContext';
import { colors, radius, sizes } from '../theme';

export default function AddTabButton({ accessibilityLabel }) {
  const { open, toggle } = useAddSheet();
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(rotation, { toValue: open ? 1 : 0, damping: 14, stiffness: 180, useNativeDriver: true }).start();
  }, [open]);

  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  return (
    <View style={styles.slot}>
      <PressableScale onPress={toggle} accessibilityLabel={accessibilityLabel}>
        <View style={styles.button}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="add" size={30} color={colors.onPrimary} />
          </Animated.View>
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  button: {
    width: sizes.addButton,
    height: sizes.addButton,
    borderRadius: radius.card,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
