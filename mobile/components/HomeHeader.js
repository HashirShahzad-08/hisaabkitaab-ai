// Green gradient header: greeting, this month's balance, income and expense (DESIGN.md 8.3).
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import AmountText from './AmountText';
import AppText from './AppText';
import { colors, screenPadding, sizes } from '../theme';
import useAnimatedNumber from '../utils/useAnimatedNumber';

const WHITE_80 = 'rgba(255,255,255,0.8)';

function IconButton({ name, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.iconButton} accessibilityRole="button" accessibilityLabel={label} hitSlop={4}>
      <Ionicons name={name} size={24} color="#FFFFFF" />
    </Pressable>
  );
}

function Stat({ icon, label, amount }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={14} color="#FFFFFF" />
      </View>
      <View>
        <AppText variant="caption" color={WHITE_80}>{label}</AppText>
        <AmountText amount={amount} variant="bodyMedium" color="#FFFFFF" />
      </View>
    </View>
  );
}

export default function HomeHeader({ name, balance, income, expense, restartKey, onBell, onSettings }) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  // The numbers count up from 0 when Home opens, and roll to new values when they change.
  const shownBalance = useAnimatedNumber(balance, { restartKey });
  const shownIncome = useAnimatedNumber(income, { restartKey });
  const shownExpense = useAnimatedNumber(expense, { restartKey });

  return (
    <LinearGradient colors={[colors.primary, colors.primaryDark]} style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <View style={styles.topRow}>
        <View style={styles.flex}>
          <AppText variant="caption" color={WHITE_80}>
            {name ? t('home.greeting', { name }) : t('home.greetingNoName')}
          </AppText>
        </View>
        <IconButton name="notifications-outline" label={t('home.notifications')} onPress={onBell} />
        <IconButton name="settings-outline" label={t('settings.title')} onPress={onSettings} />
      </View>

      <AppText variant="caption" color={WHITE_80} style={styles.balanceLabel}>{t('home.balanceThisMonth')}</AppText>
      <View style={styles.balanceWrap}>
        <AmountText amount={shownBalance} variant="display" color="#FFFFFF" />
      </View>

      <View style={styles.statsRow}>
        <Stat icon="arrow-up" label={t('home.income')} amount={shownIncome} />
        <Stat icon="arrow-down" label={t('home.expense')} amount={shownExpense} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: screenPadding,
    paddingBottom: 48, // the Health Score card overlaps the last 24px
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  flex: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  balanceWrap: { alignItems: 'flex-start' }, // start = left in English, right in Urdu
  iconButton: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center' },
  balanceLabel: { marginTop: 16 },
  statsRow: { flexDirection: 'row', gap: 24, marginTop: 16 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
