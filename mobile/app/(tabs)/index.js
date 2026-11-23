// Home dashboard - DESIGN.md section 8.3, with real data from Firestore.
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Snackbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppText from '../../components/AppText';
import FadeInCard from '../../components/FadeInCard';
import HealthScoreCard from '../../components/HealthScoreCard';
import HomeHeader from '../../components/HomeHeader';
import InsightCard from '../../components/InsightCard';
import SpendingCard from '../../components/SpendingCard';
import TransactionRow from '../../components/TransactionRow';
import { categoryKey } from '../../constants/categories';
import { useAuth } from '../../context/AuthContext';
import useProfile from '../../hooks/useProfile';
import useTransactions from '../../hooks/useTransactions';
import { colors, fonts, radius, screenPadding, sizes } from '../../theme';
import { calculateHealthScore } from '../../utils/healthScore';
import { getMonthStats } from '../../utils/stats';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const isUrdu = i18n.language === 'ur';

  const [reloadKey, setReloadKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [playKey, setPlayKey] = useState(0); // changes -> the animations play again
  const [snack, setSnack] = useState('');

  const { items, loading } = useTransactions(user?.uid, reloadKey);
  const profile = useProfile(user?.uid, reloadKey);

  // Play the opening animations again each time the user comes back to Home (not on first load).
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      setPlayKey((k) => k + 1);
    }, [])
  );

  const stats = useMemo(() => getMonthStats(items), [items]);

  // Health Score. Income = this month's income transactions; if none yet, the monthly income from the profile.
  const health = useMemo(() => {
    const income = stats.income > 0 ? stats.income : Number(profile?.monthlyIncome) || 0;
    return calculateHealthScore({ income, expense: stats.expense, budgets: [] }); // budgets come later
  }, [stats, profile]);

  // Rule-based insight for now: the biggest spending category this month.
  const insightText = useMemo(() => {
    const top = stats.categories[0];
    if (!top) return t('insight.empty');
    return t('insight.topCategory', { category: t(categoryKey(top.category)), percent: top.percent });
  }, [stats, t, i18n.language]);

  const name = profile?.name || user?.displayName || '';
  const onRefresh = () => {
    setRefreshing(true);
    setReloadKey((k) => k + 1);
    setPlayKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 700);
  };

  const hasAny = items.length > 0;
  const recent = items.slice(0, 5);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor="#FFFFFF" progressViewOffset={40} />}
        showsVerticalScrollIndicator={false}
      >
        <FadeInCard key={`h${playKey}`} index={0}>
          <HomeHeader
            name={name}
            balance={stats.balance}
            income={stats.income}
            expense={stats.expense}
            restartKey={playKey}
            onBell={() => setSnack(t('home.noNotifications'))}
            onSettings={() => router.push('/settings')}
          />
        </FadeInCard>

        <View style={styles.cards}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : !hasAny ? (
            <FadeInCard key={`e${playKey}`} index={1}>
              <Card elevation={1} style={styles.emptyCard}>
                <View style={styles.emptyCircle}>
                  <Ionicons name="wallet-outline" size={40} color={colors.primary} />
                </View>
                <AppText variant="h2" style={styles.centerText}>{t('home.emptyTitle')}</AppText>
                <AppText variant="body" color={colors.textSecondary} style={styles.centerText}>{t('home.emptyText')}</AppText>
                <Button
                  mode="contained"
                  onPress={() => router.push('/add-transaction')}
                  buttonColor={colors.primary}
                  style={styles.emptyButton}
                  contentStyle={{ height: sizes.button }}
                  labelStyle={{ fontFamily: isUrdu ? fonts.ur.semibold : fonts.en.semibold, fontSize: 16 }}
                >
                  {t('home.addFirst')}
                </Button>
              </Card>
            </FadeInCard>
          ) : (
            <>
              {/* Overlaps the header by 24px (the header leaves 48px of space at the bottom) */}
              <FadeInCard key={`s${playKey}`} index={1} style={styles.overlap}>
                <HealthScoreCard result={health} restartKey={playKey} />
              </FadeInCard>
              <FadeInCard key={`i${playKey}`} index={2}>
                <InsightCard text={insightText} />
              </FadeInCard>
              <FadeInCard key={`p${playKey}`} index={3}>
                <SpendingCard stats={stats} />
              </FadeInCard>
              <FadeInCard key={`r${playKey}`} index={4}>
                <Card elevation={1} style={styles.recentCard}>
                  <View style={[styles.recentHeader, isUrdu && styles.rowUrdu]}>
                    <AppText variant="h2" style={styles.flex}>{t('home.recent')}</AppText>
                    <Pressable onPress={() => router.navigate('/(tabs)/history')} hitSlop={8} style={styles.seeAll} accessibilityRole="link">
                      <AppText variant="bodyMedium" color={colors.primary}>{t('home.seeAll')}</AppText>
                    </Pressable>
                  </View>
                  {recent.map((tx) => (
                    <TransactionRow key={tx.id} item={tx} />
                  ))}
                </Card>
              </FadeInCard>
            </>
          )}
        </View>
      </ScrollView>

      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={2500}>{snack}</Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 64 }, // clears the raised + button above the tab bar
  flex: { flex: 1 },
  cards: { paddingHorizontal: screenPadding, gap: 12 },
  overlap: { marginTop: -24 },
  loader: { marginTop: 48 },
  rowUrdu: { flexDirection: 'row-reverse' },
  emptyCard: { marginTop: 24, backgroundColor: colors.surface, borderRadius: radius.card, padding: 24, alignItems: 'center' },
  emptyCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  centerText: { textAlign: 'center', marginTop: 4 },
  emptyButton: { marginTop: 24, borderRadius: radius.button, alignSelf: 'stretch' },
  recentCard: { backgroundColor: colors.surface, borderRadius: radius.card, overflow: 'hidden' },
  recentHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 },
  seeAll: { minHeight: sizes.touch, justifyContent: 'center' },
});
