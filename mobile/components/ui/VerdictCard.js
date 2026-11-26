// The big answer at the top of a result screen. tone: "ok" (blue hero), "warning" (amber), "danger" (red).
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';

import AppText from '../AppText';
import HeroCard from './HeroCard';
import { colors, palette, radius, spacing } from '../../theme';

const TONES = {
  ok: { icon: palette.heroText, title: palette.heroText, body: palette.heroSubtle, circle: palette.heroLine },
  warning: { icon: colors.warning, title: colors.warningTitle, body: colors.warningBody, circle: colors.surfaceRaised, bg: colors.warningLight, border: colors.warningBorder },
  danger: { icon: colors.danger, title: colors.dangerText, body: colors.dangerText, circle: colors.dangerBorder, bg: colors.dangerLight, border: colors.dangerBorder },
};

export default function VerdictCard({ tone = 'ok', icon, title, text }) {
  const look = TONES[tone] || TONES.ok;
  const content = (
    <View style={styles.content} accessibilityRole="alert">
      <View style={[styles.circle, { backgroundColor: look.circle }]}>
        <Ionicons name={icon} size={36} color={look.icon} />
      </View>
      <AppText variant="h1" color={look.title} style={styles.center}>{title}</AppText>
      {text ? <AppText variant="body" color={look.body} style={styles.center}>{text}</AppText> : null}
    </View>
  );
  return (
    <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', damping: 15 }}>
      {tone === 'ok' ? (
        <HeroCard>{content}</HeroCard>
      ) : (
        <View style={[styles.box, { backgroundColor: look.bg, borderColor: look.border }]}>{content}</View>
      )}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.hero, borderWidth: 1, padding: spacing.xl },
  content: { alignItems: 'center', gap: spacing.sm },
  circle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  center: { textAlign: 'center' },
});
