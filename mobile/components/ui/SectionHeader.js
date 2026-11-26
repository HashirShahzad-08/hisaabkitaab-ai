// A section title with an optional link at the end.
import { StyleSheet, View } from 'react-native';

import AppText from '../AppText';
import PressableScale from '../PressableScale';
import { colors, sizes, spacing } from '../../theme';

export default function SectionHeader({ title, linkLabel, onPressLink, style }) {
  return (
    <View style={[styles.row, style]}>
      <AppText variant="h2" style={styles.title}>{title}</AppText>
      {linkLabel ? (
        <PressableScale onPress={onPressLink} accessibilityRole="link" accessibilityLabel={linkLabel} hitSlop={8} pressableStyle={styles.link}>
          <AppText variant="bodyMedium" color={colors.accentLight}>{linkLabel}</AppText>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1 },
  link: { minHeight: sizes.touch, justifyContent: 'center' },
});
