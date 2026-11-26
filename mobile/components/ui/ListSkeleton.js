// Placeholder cards while a list is loading.
import { StyleSheet, View } from 'react-native';

import Skeleton from './Skeleton';
import { radius, spacing } from '../../theme';

export default function ListSkeleton({ count = 4, height = 72, style }) {
  return (
    <View style={[styles.list, style]}>
      {Array.from({ length: count }, (_, i) => <Skeleton key={i} height={height} round={radius.card} />)}
    </View>
  );
}

const styles = StyleSheet.create({ list: { gap: spacing.md, alignSelf: 'stretch' } });
