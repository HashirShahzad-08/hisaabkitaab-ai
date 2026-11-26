// Bills tab: check an electricity bill, and see the bills you checked before (DESIGN.md 8.8).
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Snackbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AmountText from '../../components/ui/AmountText';
import AppText from '../../components/AppText';
import FadeInCard from '../../components/FadeInCard';
import PressableScale from '../../components/PressableScale';
import PrimaryButton from '../../components/ui/PrimaryButton';
import UnitsChart from '../../components/UnitsChart';
import VerdictChip from '../../components/VerdictChip';
import { useAuth } from '../../context/AuthContext';
import useBills from '../../hooks/useBills';
import { setCurrentBill, takeFlash } from '../../services/billService';
import { colors, radius, screenPadding } from '../../theme';
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
    body = <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />;
  } else if (error) {
    body = (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={40} color={colors.textSecondary} />
        <AppText variant="body" color={colors.textSecondary} style={styles.centerText}>
          {t(error === 'permission-denied' ? 'bills.errorPermission' : 'bills.errorLoad')}
        </AppText>
        <Button mode="outlined" onPress={onRefresh} textColor={colors.primary} style={styles.retry}>{t('bills.retry')}</Button>
      </View>
    );
  } else if (bills.length === 0) {
    body = (
      <FadeInCard>
        <View style={styles.center}>
          <View style={styles.emptyCircle}><Ionicons name="flash-outline" size={44} color={colors.primary} /></View>
          <AppText variant="h2" style={styles.centerText}>{t('bills.emptyTitle')}</AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.centerText}>{t('bills.emptyText')}</AppText>
        </View>
      </FadeInCard>
    );
  } else {
    body = (
      <View style={styles.list}>
        <FadeInCard index={0}><UnitsChart bills={bills} /></FadeInCard>
        <AppText variant="h2" style={styles.sectionTitle}>{t('bills.pastBills')}</AppText>
        {bills.map((b, i) => (
          <FadeInCard key={b.id} index={i + 1}>
            <PressableScale onPress={() => open(b)} accessibilityLabel={monthLabel(b.billMonth, t)}>
              <View style={styles.card}>
                <View style={styles.cardLeft}>
                  <AppText variant="bodyMedium">{monthLabel(b.billMonth, t)}</AppText>
                  <AppText variant="caption" color={colors.textSecondary}>{t('bills.unitsCount', { count: Math.round(b.units) })}</AppText>
                </View>
                <View style={styles.cardRight}>
                  <AmountText amount={b.amount} />
                  <VerdictChip verdict={b.verdict} />
                </View>
              </View>
            </PressableScale>
          </FadeInCard>
        ))}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="h1">{t('bills.title')}</AppText>
        <PrimaryButton
          label={t('bills.checkMyBill')}
          icon="flash"
          onPress={() => router.push('/bill-form')}
          style={styles.hero}
        />
        {body}
      </ScrollView>
      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={3000}>{snack}</Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: screenPadding, paddingBottom: 64, gap: 12 },
  hero: { marginTop: 4 },
  loader: { marginTop: 48 },
  list: { gap: 12, marginTop: 8 },
  sectionTitle: { marginTop: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    elevation: 1,
    gap: 12,
  },
  cardLeft: { flex: 1, gap: 2 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  centerText: { textAlign: 'center' },
  emptyCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  retry: { marginTop: 12, borderRadius: radius.button },
});
