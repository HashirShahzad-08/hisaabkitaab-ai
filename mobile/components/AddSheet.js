// The Add options sheet (DESIGN.md section 7). It floats above the tab bar so the
// + button stays visible and turns into an x.
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import { useAddSheet } from '../context/AddSheetContext';
import { colors, radius, sizes } from '../theme';

const ROWS = [
  { key: 'manual', icon: 'create-outline', route: '/add-transaction' },
  { key: 'sms', icon: 'chatbox-ellipses-outline', route: '/sms-entry' },
  { key: 'quick', icon: 'mic-outline', route: '/quick-entry' },
  { key: 'afford', icon: 'help-circle-outline', route: '/afford' },
];

export default function AddSheet() {
  const { open, close } = useAddSheet();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isUrdu = i18n.language === 'ur';

  const [mounted, setMounted] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const rowAnims = useRef(ROWS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (open) {
      setMounted(true);
      Animated.spring(progress, { toValue: 1, damping: 18, stiffness: 180, useNativeDriver: true }).start();
      Animated.stagger(
        40,
        rowAnims.map((a) => Animated.timing(a, { toValue: 1, duration: 220, useNativeDriver: true }))
      ).start();
    } else if (mounted) {
      Animated.timing(progress, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
        rowAnims.forEach((a) => a.setValue(0));
        setMounted(false);
      });
    }
  }, [open]);

  if (!mounted) return null;

  // Stop above the raised + button (it sticks out 28px above the bar).
  const bottom = sizes.tabBar + insets.bottom + 28;
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [60, 0] });

  const go = (route) => {
    close();
    router.push(route);
  };

  return (
    <View style={[styles.overlay, { bottom }]} pointerEvents="box-none">
      <Animated.View style={[styles.scrim, { opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel={t('common.close')} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { opacity: progress, transform: [{ translateY }] }]}>
        {ROWS.map((row, i) => (
          <Animated.View
            key={row.key}
            style={{
              opacity: rowAnims[i],
              transform: [{ translateY: rowAnims[i].interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
            }}
          >
            <Pressable
              onPress={() => go(row.route)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <View style={styles.iconCircle}>
                <Ionicons name={row.icon} size={22} color={colors.primary} />
              </View>
              <View style={styles.texts}>
                <AppText variant="bodyMedium">{t(`addSheet.${row.key}.title`)}</AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {t(`addSheet.${row.key}.caption`)}
                </AppText>
              </View>
              <Ionicons
                name={isUrdu ? 'chevron-back' : 'chevron-forward'}
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
          </Animated.View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  sheet: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 24,
    paddingVertical: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, minHeight: 64 },
  pressed: { backgroundColor: colors.primaryLight, borderRadius: radius.card },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, marginHorizontal: 12 },
});
