// Health Score ring for the blue hero card: a white ring that draws in (800ms),
// with the number and the band name inside.
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import { fonts, healthColors, palette } from '../theme';
import { getBand } from '../utils/healthScore';
import useAnimatedNumber from '../utils/useAnimatedNumber';

// Color of a score on dark cards (DESIGN.md section 2): used where the ring is not on the blue card
export function scoreColor(value) {
  return healthColors[getBand(Math.round(value))];
}

const SIZE = 112;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function HealthRing({ score, band }) {
  const { t } = useTranslation();
  const value = useAnimatedNumber(score);
  return (
    <View style={styles.wrap} accessible accessibilityLabel={`${t('health.title')} ${score}, ${t(`health.bands.${band}`)}`}>
      <Svg width={SIZE} height={SIZE}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={palette.heroLine} strokeWidth={STROKE} fill="none" />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={palette.heroText}
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
        <Text style={styles.number}>{Math.round(value)}</Text>
        <AppText variant="caption" color={palette.heroSubtle} style={styles.band} numberOfLines={1} adjustsFontSizeToFit>
          {t(`health.bands.${band}`)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE },
  center: { position: 'absolute', top: 0, bottom: 0, start: 0, end: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  number: { fontFamily: fonts.en.bold, fontSize: 30, lineHeight: 34, color: palette.heroText },
  band: { textAlign: 'center', maxWidth: '100%', fontSize: 11 },
});
