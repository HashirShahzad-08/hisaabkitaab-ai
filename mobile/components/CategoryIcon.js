// Rounded-square icon for a category, on a raised dark background.
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { categoryColor, categoryIcon } from '../constants/categories';
import { colors, radius } from '../theme';

export default function CategoryIcon({ category, size = 44 }) {
  const color = categoryColor(category);
  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <Ionicons name={categoryIcon(category)} size={size * 0.5} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radius.input,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
