// The blue gradient card for the most important number on a screen (CSS: linear-gradient 160deg).
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { palette, radius, spacing } from '../../theme';

export default function HeroCard({ children, style }) {
  return (
    <LinearGradient
      colors={[palette.heroStart, palette.heroEnd]}
      start={{ x: 0.33, y: 0 }}
      end={{ x: 0.67, y: 1 }}
      style={[styles.card, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.hero, borderWidth: 1, borderColor: palette.heroBorder, padding: spacing.xl },
});
