// The Add options sheet (DESIGN.md section 7): a dark bottom sheet with a handle and four large tiles.
// It sits just above the tab bar so the + button stays visible and turns into an x.
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import IconTile from './ui/IconTile';
import { useAddSheet } from '../context/AddSheetContext';
import { colors, palette, radius, sizes, spacing } from '../theme';

const OPTIONS = [
  { key: 'manual', icon: 'create-outline', route: '/add-transaction' },
  { key: 'sms', icon: 'chatbox-ellipses-outline', route: '/sms-entry' },
  { key: 'quick', icon: 'mic-outline', route: '/quick-entry' },
  { key: 'afford', icon: 'help-circle-outline', route: '/afford' },
];

export default function AddSheet() {
  const { open, close } = useAddSheet();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [mounted, setMounted] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const tileAnims = useRef(OPTIONS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (open) {
      setMounted(true);
      Animated.spring(progress, { toValue: 1, damping: 18, stiffness: 180, useNativeDriver: true }).start();
      Animated.stagger(
        60,
        tileAnims.map((a) => Animated.timing(a, { toValue: 1, duration: 220, useNativeDriver: true }))
      ).start();
    } else if (mounted) {
      Animated.timing(progress, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
        tileAnims.forEach((a) => a.setValue(0));
        setMounted(false);
      });
    }
  }, [open]);

  if (!mounted) return null;

  // Stop just above the tab bar, so the + button stays visible.
  const bottom = sizes.tabBar + insets.bottom;
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [80, 0] });

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
        <View style={styles.handle} />
        <View style={styles.grid}>
          {OPTIONS.map((option, i) => (
            <Animated.View
              key={option.key}
              style={[
                styles.cell,
                {
                  opacity: tileAnims[i],
                  transform: [{ translateY: tileAnims[i].interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
                },
              ]}
            >
              <IconTile
                icon={option.icon}
                label={t(`addSheet.${option.key}.title`)}
                description={t(`addSheet.${option.key}.caption`)}
                onPress={() => go(option.route)}
                style={styles.tile}
              />
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', start: 0, end: 0, top: 0, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: palette.scrim },
  sheet: {
    backgroundColor: colors.tabBar,
    borderTopWidth: 1,
    borderColor: colors.border,
    borderTopStartRadius: radius.hero,
    borderTopEndRadius: radius.hero,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: radius.pill, backgroundColor: colors.border },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: { flexGrow: 1, flexBasis: '47%' },
  tile: { flexGrow: 1 },
});
