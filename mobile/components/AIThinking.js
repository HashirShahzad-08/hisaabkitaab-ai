// "AI is working" card: calm shimmering skeleton lines and a status text that changes every 1.5 seconds.
// Never a plain spinner (DESIGN.md section 6).
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import Card from './ui/Card';
import Skeleton from './ui/Skeleton';
import { colors, spacing } from '../theme';

// messageKeys: list of i18n keys, shown one after another
export default function AIThinking({ messageKeys }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((n) => (n + 1) % messageKeys.length), 1500);
    return () => clearInterval(id);
  }, [messageKeys.length]);

  return (
    <View accessibilityLiveRegion="polite">
      <Card style={styles.card}>
        <View style={styles.statusRow}>
          <Ionicons name="sparkles-outline" size={20} color={colors.accentLight} />
          <AppText variant="bodyMedium" color={colors.textBody} style={styles.status}>{t(messageKeys[index])}</AppText>
        </View>
        <View style={styles.bars}>
          <Skeleton width="70%" height={12} />
          <Skeleton height={12} />
          <Skeleton width="45%" height={12} />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  status: { flex: 1 },
  bars: { gap: spacing.sm },
});
