// History - DESIGN.md section 8.7
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, SectionList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Dialog, Portal, Snackbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppText from '../../components/AppText';
import FilterDialog from '../../components/FilterDialog';
import TransactionRow from '../../components/TransactionRow';
import { ALL_CATEGORIES, PAYMENT_TYPES, categoryKey, paymentKey } from '../../constants/categories';
import { useAuth } from '../../context/AuthContext';
import useTransactions from '../../hooks/useTransactions';
import { deleteTransaction } from '../../services/transactionService';
import { colors, fonts, radius, screenPadding, sizes } from '../../theme';
import { formatDayLabel, monthKey } from '../../utils/format';

export default function HistoryScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const isUrdu = i18n.language === 'ur';

  const [reloadKey, setReloadKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const { items, loading, error } = useTransactions(user?.uid, reloadKey);

  // Filters. Month starts on the current month.
  const thisMonth = monthKey(new Date());
  const [month, setMonth] = useState(thisMonth);
  const [category, setCategory] = useState('all');
  const [payment, setPayment] = useState('all');
  const [openFilter, setOpenFilter] = useState(null); // 'month' | 'category' | 'payment' | null

  const [toDelete, setToDelete] = useState(null);
  const [snack, setSnack] = useState('');

  const monthLabel = useCallback(
    (key) => {
      const [y, m] = key.split('-').map(Number);
      return `${t(`months.long.${m - 1}`)} ${y}`;
    },
    [t]
  );

  const options = useMemo(() => {
    const now = new Date();
    const months = [{ value: 'all', label: t('history.allTime') }];
    for (let i = 0; i < 12; i += 1) {
      const key = monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1));
      months.push({ value: key, label: monthLabel(key) });
    }
    return {
      month: months,
      category: [{ value: 'all', label: t('history.allCategories') }, ...ALL_CATEGORIES.map((c) => ({ value: c, label: t(categoryKey(c)) }))],
      payment: [{ value: 'all', label: t('history.allPayments') }, ...PAYMENT_TYPES.map((p) => ({ value: p, label: t(paymentKey(p)) }))],
    };
  }, [t, monthLabel]);

  const filtered = useMemo(
    () =>
      items.filter(
        (x) =>
          (month === 'all' || x.date.startsWith(month)) &&
          (category === 'all' || x.category === category) &&
          (payment === 'all' || x.paymentType === payment)
      ),
    [items, month, category, payment]
  );

  const sections = useMemo(() => {
    const out = [];
    for (const tx of filtered) {
      const last = out[out.length - 1];
      if (last && last.key === tx.date) last.data.push(tx);
      else out.push({ key: tx.date, title: formatDayLabel(tx.date, t), data: [tx] });
    }
    return out;
  }, [filtered, t]);

  const filtersActive = month !== thisMonth || category !== 'all' || payment !== 'all';
  const clearFilters = () => { setMonth('all'); setCategory('all'); setPayment('all'); };

  async function confirmDelete() {
    const tx = toDelete;
    setToDelete(null);
    if (!tx) return;
    try {
      await deleteTransaction(user.uid, tx.id);
      setSnack(t('history.deleted'));
    } catch (e) {
      setSnack(t('history.deleteFailed'));
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    setReloadKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 700);
  };

  const chip = (id, label, active) => (
    <Pressable
      key={id}
      onPress={() => setOpenFilter(id)}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
    >
      <AppText variant="body" color={active ? colors.primaryDark : colors.textSecondary} numberOfLines={1}>
        {label}
      </AppText>
      <Ionicons name="chevron-down" size={14} color={active ? colors.primaryDark : colors.textSecondary} />
    </Pressable>
  );

  const labelFor = (list, value) => list.find((o) => o.value === value)?.label;

  let body;
  if (loading) {
    body = <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  } else if (error) {
    body = (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={40} color={colors.textSecondary} />
        <AppText variant="body" color={colors.textSecondary} style={styles.centerText}>
          {t(error === 'permission-denied' ? 'history.errorPermission' : 'history.errorGeneric')}
        </AppText>
        <Button mode="outlined" onPress={onRefresh} textColor={colors.primary} style={styles.emptyButton}>
          {t('history.retry')}
        </Button>
      </View>
    );
  } else if (items.length === 0) {
    body = (
      <View style={styles.center}>
        <View style={styles.emptyCircle}><Ionicons name="receipt-outline" size={40} color={colors.primary} /></View>
        <AppText variant="h2" style={styles.centerText}>{t('history.emptyTitle')}</AppText>
        <AppText variant="body" color={colors.textSecondary} style={styles.centerText}>{t('history.emptyText')}</AppText>
        <Button
          mode="contained"
          onPress={() => router.push('/add-transaction')}
          buttonColor={colors.primary}
          style={styles.emptyButton}
          contentStyle={{ height: sizes.button }}
          labelStyle={{ fontFamily: isUrdu ? fonts.ur.semibold : fonts.en.semibold }}
        >
          {t('history.addFirst')}
        </Button>
      </View>
    );
  } else if (filtered.length === 0) {
    body = (
      <View style={styles.center}>
        <Ionicons name="search-outline" size={40} color={colors.textSecondary} />
        <AppText variant="body" color={colors.textSecondary} style={styles.centerText}>{t('history.noMatch')}</AppText>
        <Button mode="outlined" onPress={clearFilters} textColor={colors.primary} style={styles.emptyButton}>
          {t('history.clearFilters')}
        </Button>
      </View>
    );
  } else {
    body = (
      <SectionList
        sections={sections}
        keyExtractor={(x) => x.id}
        stickySectionHeadersEnabled
        renderSectionHeader={({ section }) => (
          <View style={styles.dayHeader}>
            <AppText variant="caption" color={colors.textSecondary}>{section.title}</AppText>
          </View>
        )}
        renderItem={({ item }) => <TransactionRow item={item} onDelete={setToDelete} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.top}>
        <AppText variant="h1">{t('history.title')}</AppText>
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {chip('month', month === 'all' ? t('history.month') : monthLabel(month), month !== 'all')}
          {chip('category', category === 'all' ? t('history.category') : labelFor(options.category, category), category !== 'all')}
          {chip('payment', payment === 'all' ? t('history.paymentType') : labelFor(options.payment, payment), payment !== 'all')}
        </ScrollView>
      </View>

      <View style={styles.flex}>{body}</View>

      <FilterDialog
        visible={openFilter !== null}
        title={openFilter ? t(`history.${openFilter === 'payment' ? 'paymentType' : openFilter}`) : ''}
        options={openFilter ? options[openFilter] : []}
        value={openFilter === 'month' ? month : openFilter === 'category' ? category : payment}
        onDismiss={() => setOpenFilter(null)}
        onSelect={(v) => {
          if (openFilter === 'month') setMonth(v);
          else if (openFilter === 'category') setCategory(v);
          else setPayment(v);
          setOpenFilter(null);
        }}
      />

      <Portal>
        <Dialog visible={!!toDelete} onDismiss={() => setToDelete(null)} style={{ backgroundColor: colors.surface, borderRadius: 16 }}>
          <Dialog.Title><AppText variant="h2">{t('history.deleteTitle')}</AppText></Dialog.Title>
          <Dialog.Content><AppText variant="body">{t('history.deleteText')}</AppText></Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setToDelete(null)} textColor={colors.textSecondary}>{t('common.cancel')}</Button>
            <Button onPress={confirmDelete} textColor={colors.danger}>{t('history.delete')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={2500}>{snack}</Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  top: { paddingHorizontal: screenPadding, paddingTop: 8, paddingBottom: 8 },
  chipRow: { paddingHorizontal: screenPadding, paddingVertical: 8, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: sizes.touch,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  dayHeader: { backgroundColor: colors.background, paddingHorizontal: screenPadding, paddingVertical: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  centerText: { textAlign: 'center', marginTop: 12 },
  emptyCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButton: { marginTop: 24, borderRadius: radius.button },
});
