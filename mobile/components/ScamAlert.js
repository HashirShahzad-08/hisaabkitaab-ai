// The red scam warning: a shield in a soft circle, the reasons as a list, and the actions.
// It shakes once, gently, when it appears. Nothing loops.
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';

import AppText from './AppText';
import { colors, radius, spacing } from '../theme';

export default function ScamAlert({ title, reasons, advice, note, children }) {
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = setTimeout(() => {
      Animated.sequence([-6, 6, -4, 4, 0].map((to) => Animated.timing(shake, { toValue: to, duration: 70, useNativeDriver: true }))).start();
    }, 350);
    return () => clearTimeout(id);
  }, []);

  return (
    <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', damping: 15 }}>
      <Animated.View style={[styles.card, { transform: [{ translateX: shake }] }]} accessibilityRole="alert">
        <View style={styles.circle}>
          <Ionicons name="shield-half-outline" size={36} color={colors.danger} />
        </View>
        <AppText variant="h1" color={colors.dangerText} style={styles.center}>{title}</AppText>

        {reasons.length > 0 ? (
          <View style={styles.reasons}>
            {reasons.map((reason, i) => (
              <View key={i} style={styles.reason}>
                <View style={styles.dotBox}><View style={styles.dot} /></View>
                <AppText variant="body" color={colors.text} style={styles.flex}>{reason}</AppText>
              </View>
            ))}
          </View>
        ) : null}

        <AppText variant="bodyMedium" color={colors.dangerText} style={styles.center}>{advice}</AppText>
        {note ? <AppText variant="caption" color={colors.textSecondary} style={styles.center}>{note}</AppText> : null}
        <View style={styles.actions}>{children}</View>
      </Animated.View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  circle: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.dangerBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { textAlign: 'center' },
  flex: { flex: 1 },
  reasons: { gap: spacing.sm },
  reason: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  dotBox: { height: 22, justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  actions: { gap: spacing.sm, marginTop: spacing.xs },
});
