// Home dashboard - DESIGN.md section 8.3, with real data from Firestore.
import { useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import BalanceHero from '../../components/BalanceHero';
import BudgetWarning from '../../components/BudgetWarning';
import FadeInCard from '../../components/FadeInCard';
import HomeHeader from '../../components/HomeHeader';
import SpendingCard from '../../components/SpendingCard';
import TransactionRow from '../../components/TransactionRow';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import IconTile from '../../components/ui/IconTile';
import SectionHeader from '../../components/ui/SectionHeader';
import Skeleton from '../../components/ui/Skeleton';
import { categoryKey } from '../../constants/categories';
import { useAuth } from '../../context/AuthContext';
import { useBudgets } from '../../hooks/useBudgetsAndGoals';
import useProfile from '../../hooks/useProfile';
import useTransactions from '../../hooks/useTransactions';
import { colors, radius, screenPadding, spacing } from '../../theme';
import { budgetProgress, worstBudget } from '../../utils/budgets';
import { monthHealth } from '../../utils/monthHealth';
import { getMonthStats } from '../../utils/stats';

const TILES = [
  { key: 'sms', icon: 'chatbox-ellipses-outline', route: '/sms-entry' },
  { key: 'speak', icon: 'mic-outline', route: '/quick-entry' },
  { key: 'bill', icon: 'flash-outline', route: '/bill-form' },
  { key: 'afford', icon: 'help-circle-outline', route: '/afford' },
];

function LoadingHome() {
  return (
    <>
      <Skeleton height={216} round={radius.hero} />
      <View style={styles.tiles}>
        {TILES.map((tile) => <Skeleton key={tile.key} width={64} height={64} round={radius.card} />)}
      </View>
      <Skeleton height={192} round={radius.card} />
      <Skeleton height={192} round={radius.card} />
    </>
  );
}

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [reloadKey, setReloadKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [snack, setSnack] = useState('');

  const { items, loading } = useTransactions(user?.uid, reloadKey);
  const profile = useProfile(user?.uid, reloadKey);
  const budgetData = useBudgets(user?.uid, reloadKey);

  // The skeleton is only for the first load, so pull to refresh does not blank the screen
  const loadedOnce = useRef(false);
  if (!loading) loadedOnce.current = true;
  const showSkeleton = loading && !loadedOnce.current;

  const stats = useMemo(() => getMonthStats(items), [items]);
  const progress = useMemo(() => budgetProgress(budgetData.items, stats), [budgetData.items, stats]);

  // Health Score (the same helper as "Can I afford it?")
  const health = useMemo(() => monthHealth(stats, budgetData.items, profile), [stats, budgetData.items, profile]);

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
    setTimeout(() => setRefreshing(false), 700);
  };

  const hasAny = items.length > 0;
  const recent = items.slice(0, 5);
  const warning = worstBudget(progress);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.md }]}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.accentLight]}
            tintColor={colors.accentLight}
            progressBackgroundColor={colors.surfaceRaised}
            progressViewOffset={insets.top}
          />
        )}
        showsVerticalScrollIndicator={false}
      >
        <FadeInCard index={0}>
          <HomeHeader
            name={name}
            onBell={() => setSnack(t('home.noNotifications'))}
            onSettings={() => router.push('/settings')}
          />
        </FadeInCard>

        {showSkeleton ? (
          <LoadingHome />
        ) : (
          <>
            <FadeInCard index={1}>
              <BalanceHero
                balance={stats.balance}
                income={stats.income}
                expense={stats.expense}
                health={hasAny ? health : null}
              />
            </FadeInCard>

            <FadeInCard index={2}>
              <View style={styles.tiles}>
                {TILES.map((tile) => (
                  <IconTile
                    key={tile.key}
                    icon={tile.icon}
                    label={t(`home.tiles.${tile.key}`)}
                    onPress={() => router.push(tile.route)}
                    style={styles.tile}
                  />
                ))}
              </View>
            </FadeInCard>

            {!hasAny ? (
              <FadeInCard index={3}>
                <EmptyState
                  icon="wallet-outline"
                  title={t('home.emptyTitle')}
                  text={t('home.emptyText')}
                  buttonLabel={t('home.addFirst')}
                  onPress={() => router.push('/add-transaction')}
                />
              </FadeInCard>
            ) : (
              <>
                {warning ? (
                  <FadeInCard index={3}>
                    <BudgetWarning budget={warning} />
                  </FadeInCard>
                ) : null}
                <FadeInCard index={4}>
                  <SpendingCard stats={stats} tips={[t(health.tip), insightText]} />
                </FadeInCard>
                <FadeInCard index={5}>
                  <Card style={styles.recentCard}>
                    <SectionHeader
                      title={t('home.recentShort')}
                      linkLabel={t('home.seeAll')}
                      onPressLink={() => router.navigate('/(tabs)/history')}
                      style={styles.recentHeader}
                    />
                    {recent.map((tx, i) => (
                      <TransactionRow key={tx.id} item={tx} meta="source" last={i === recent.length - 1} />
                    ))}
                  </Card>
                </FadeInCard>
              </>
            )}
          </>
        )}
      </ScrollView>

      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={2500}>{snack}</Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: screenPadding, paddingBottom: spacing.xl, gap: spacing.md },
  tiles: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tile: { flex: 1 },
  recentCard: { padding: 0, overflow: 'hidden' },
  recentHeader: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
});
