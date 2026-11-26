// Bills tab: check an electricity bill, and see the bills you checked before (DESIGN.md 8.8).
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Snackbar } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AmountText from '../../components/ui/AmountText';
import AppText from '../../components/AppText';
import FadeInCard from '../../components/FadeInCard';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import ListSkeleton from '../../components/ui/ListSkeleton';
import SectionHeader from '../../components/ui/SectionHeader';
import PrimaryButton from '../../components/ui/PrimaryButton';
import UnitsChart from '../../components/UnitsChart';
import VerdictChip from '../../components/VerdictChip';
import { useAuth } from '../../context/AuthContext';
import useBills from '../../hooks/useBills';
import { setCurrentBill, takeFlash } from '../../services/billService';
import { colors, screenPadding, spacing } from '../../theme';
import { monthLabel } from '../../utils/billUi';

export default function BillsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  const [reloadKey, setReloadKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [snack, setSnack] = useState('');
  const { bills, loading, error } = useBills(user?.uid, reloadKey);

  // After saving a bill we come back here and say so, once.
  useFocusEffect(
    useCallback(() => {
      const key = takeFlash();
      if (key) setSnack(t(key));
    }, [t])
  );

  const onRefresh = () => {
    setRefreshing(true);
    setReloadKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 700);
  };

  const open = (bill) => {
    setCurrentBill({ request: bill.request, result: bill.result, saved: true });
    router.push('/bill-result');
  };

  let body;
  if (loading) {
    body = <ListSkeleton count={4} height={80} />;
  } else if (error) {
    body = (
      <FadeInCard index={2}>
        <EmptyState
          icon="cloud-offline-outline"
          iconColor={colors.textSecondary}
          text={t(error === 'permission-denied' ? 'bills.errorPermission' : 'bills.errorLoad')}
          buttonLabel={t('bills.retry')}
          buttonVariant="outlined"
          onPress={onRefresh}
        />
      </FadeInCard>
    );
  } else if (bills.length === 0) {
    body = (
      <FadeInCard index={2}>
        <EmptyState icon="flash-outline" title={t('bills.emptyTitle')} text={t('bills.emptyText')} />
      </FadeInCard>
    );
  } else {
    body = (
      <View style={styles.list}>
        <FadeInCard index={2}><UnitsChart bills={bills} /></FadeInCard>
        <FadeInCard index={3}><SectionHeader title={t('bills.pastBills')} /></FadeInCard>
        {bills.map((b, i) => (
          <FadeInCard key={b.id} index={Math.min(i + 4, 10)}>
            <Card onPress={() => open(b)} accessibilityLabel={monthLabel(b.billMonth, t)} style={styles.card}>
              <View style={styles.cardLeft}>
                <AppText variant="bodyMedium">{monthLabel(b.billMonth, t)}</AppText>
                <AppText variant="caption" color={colors.textSecondary}>{t('bills.unitsCount', { count: Math.round(b.units) })}</AppText>
              </View>
              <View style={styles.cardRight}>
                <AmountText amount={b.amount} />
                <VerdictChip verdict={b.verdict} />
              </View>
            </Card>
          </FadeInCard>
        ))}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.accentLight]}
            tintColor={colors.accentLight}
            progressBackgroundColor={colors.surfaceRaised}
          />
        )}
        showsVerticalScrollIndicator={false}
      >
        <FadeInCard index={0}><AppText variant="h1">{t('bills.title')}</AppText></FadeInCard>
        <FadeInCard index={1}>
          <PrimaryButton label={t('bills.checkMyBill')} icon="flash" onPress={() => router.push('/bill-form')} />
        </FadeInCard>
        {body}
      </ScrollView>
      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={3000}>{snack}</Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: screenPadding, paddingBottom: spacing.xl, gap: spacing.md },
  list: { gap: spacing.md },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  cardLeft: { flex: 1, gap: spacing.xs },
  cardRight: { alignItems: 'flex-end', gap: spacing.sm },
});
