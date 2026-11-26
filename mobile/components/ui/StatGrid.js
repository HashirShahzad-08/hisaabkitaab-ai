// Numbers in a 2-column grid of small cards. An odd last card takes the whole row.
import { StyleSheet, View } from 'react-native';

import AppText from '../AppText';
import Card from './Card';
import { colors, spacing } from '../../theme';

export default function StatGrid({ children }) {
  return <View style={styles.grid}>{children}</View>;
}

export function StatTile({ label, children }) {
  return (
    <View style={styles.cell}>
      <Card style={styles.card}>
        <AppText variant="caption" color={colors.textSecondary}>{label}</AppText>
        <View style={styles.value}>{children}</View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: { flexGrow: 1, flexBasis: '47%' },
  card: { flexGrow: 1, gap: spacing.xs },
  value: { alignItems: 'flex-start' },
});
