// Animated ring, 0 to 100. Fills in 800ms and its color shifts as the number rises:
// danger -> warning -> green -> gold.
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, fonts } from '../theme';
import useAnimatedNumber from '../utils/useAnimatedNumber';

const STOPS = [
  { at: 0, color: colors.danger },
  { at: 40, color: colors.warning },
  { at: 60, color: colors.primary },
  { at: 80, color: colors.accent },
];

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

export function scoreColor(value) {
  if (value >= STOPS[3].at) return STOPS[3].color;
  for (let i = 0; i < STOPS.length - 1; i += 1) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (value >= a.at && value < b.at) {
      const p = (value - a.at) / (b.at - a.at);
      const [r1, g1, b1] = hexToRgb(a.color);
      const [r2, g2, b2] = hexToRgb(b.color);
      const mix = (x, y) => Math.round(x + (y - x) * p);
      return `rgb(${mix(r1, r2)}, ${mix(g1, g2)}, ${mix(b1, b2)})`;
    }
  }
  return STOPS[0].color;
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  number: { fontFamily: fonts.en.bold, fontSize: 28 },
});
