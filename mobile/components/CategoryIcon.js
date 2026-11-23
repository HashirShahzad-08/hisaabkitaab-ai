// Round colored icon for a category.
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { categoryColor, categoryIcon } from '../constants/categories';

export default function CategoryIcon({ category, size = 44 }) {
  const color = categoryColor(category);
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}22` }]}>
      <Ionicons name={categoryIcon(category)} size={size * 0.5} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
});
