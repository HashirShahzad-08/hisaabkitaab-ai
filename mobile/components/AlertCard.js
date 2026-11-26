// Alert card with variants: danger / warning / success / info (DESIGN.md section 5).
// The danger variant slides in, shakes once, and its icon pulses.
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';

import AppText from './AppText';
import { colors, radius } from '../theme';

const VARIANTS = {
  danger: { bg: colors.dangerLight, border: colors.dangerBorder, fg: colors.danger, title: colors.dangerText, icon: 'shield-half-outline' },
  warning: { bg: colors.warningLight, border: colors.warningBorder, fg: colors.warning, title: colors.warningTitle, icon: 'alert-circle-outline' },
  success: { bg: colors.primaryLight, border: colors.primary, fg: colors.accentLight, title: colors.accentLight, icon: 'checkmark-circle-outline' },
  info: { bg: colors.primaryLight, border: colors.border, fg: colors.info, title: colors.info, icon: 'information-circle-outline' },
};

export default function AlertCard({ variant = 'info', title, icon, children }) {
  const v = VARIANTS[variant];
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (variant !== 'danger') return undefined;
    // After the slide-in, shake left and right once.
    const id = setTimeout(() => {
      Animated.sequence([-8, 8, -6, 6, -3, 0].map((to) => Animated.timing(shake, { toValue: to, duration: 60, useNativeDriver: true }))).start();
    }, 400);
    return () => clearTimeout(id);
  }, [variant]);

  const iconView = (
    <Ionicons name={icon || v.icon} size={32} color={v.fg} />
  );

  return (
    <MotiView
      from={{ opacity: 0, translateY: -24 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15 }}
    >
      <Animated.View style={[styles.card, { backgroundColor: v.bg, borderColor: v.border, transform: [{ translateX: shake }] }]}>
        <View style={styles.iconWrap}>
          {variant === 'danger' ? (
            <MotiView
              from={{ scale: 1 }}
              animate={{ scale: 1.15 }}
              transition={{ type: 'timing', duration: 700, loop: true, repeatReverse: true }}
            >
              {iconView}
            </MotiView>
          ) : (
            iconView
          )}
        </View>
        <AppText variant="h2" color={v.title} style={styles.title}>{title}</AppText>
        {children}
      </Animated.View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, borderWidth: 1, padding: 16, gap: 8 },
  iconWrap: { alignSelf: 'flex-start' },
  title: {},
});
