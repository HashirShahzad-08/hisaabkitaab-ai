// Animated ring, 0 to 100. Fills in 800ms. The score sits in the middle with "/100" under it.
// The color changes in steps as the number rises: red, orange, green, gold.
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, fonts } from '../theme';
import { getBand } from '../utils/healthScore';
import useAnimatedNumber from '../utils/useAnimatedNumber';

// Exact colors per band (DESIGN.md 8.3). No blending between them.
export function scoreColor(value) {
  const band = getBand(Math.round(value));
  if (band === 'excellent') return colors.accent; // 80+ gold
  if (band === 'good') return colors.primary; // 60-79 green
  if (band === 'okay') return colors.warning; // 40-59 orange
  return colors.danger; // under 40 red
}

const SIZE = 96;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function HealthRing({ score, restartKey }) {
  const value = useAnimatedNumber(score, { restartKey });
  const color = scoreColor(value);
  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={colors.border} strokeWidth={STROKE} fill="none" />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={CIRCUMFERENCE * (1 - value / 100)}
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.number, { color }]}>{Math.round(value)}</Text>
        <Text style={styles.outOf}>/100</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  number: { fontFamily: fonts.en.bold, fontSize: 28, lineHeight: 32 },
  outOf: { fontFamily: fonts.en.regular, fontSize: 11, lineHeight: 14, color: colors.textSecondary },
});
