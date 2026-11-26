// History - DESIGN.md section 8.7
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, SectionList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Dialog, Portal, Snackbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppText from '../../components/AppText';
import FadeInCard from '../../components/FadeInCard';
import FilterDialog from '../../components/FilterDialog';
import TransactionRow from '../../components/TransactionRow';
import Chip from '../../components/ui/Chip';
import EmptyState from '../../components/ui/EmptyState';
import ListSkeleton from '../../components/ui/ListSkeleton';
import { ALL_CATEGORIES, PAYMENT_TYPES, categoryKey, paymentKey } from '../../constants/categories';
import { useAuth } from '../../context/AuthContext';
import useTransactions from '../../hooks/useTransactions';
import { deleteTransaction } from '../../services/transactionService';
import { colors, radius, screenPadding, spacing } from '../../theme';
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
    <Chip
      key={id}
      size="lg"
      label={label}
      trailingIcon="chevron-down"
      selected={active}
      onPress={() => setOpenFilter(id)}
    />
  );

  const labelFor = (list, value) => list.find((o) => o.value === value)?.label;

  let body;
  if (loading) {
    body = <ListSkeleton count={6} style={styles.state} />;
  } else if (error) {
    body = (
      <FadeInCard style={styles.state}>
        <EmptyState
          icon="cloud-offline-outline"
          iconColor={colors.textSecondary}
          text={t(error === 'permission-denied' ? 'history.errorPermission' : 'history.errorGeneric')}
          buttonLabel={t('history.retry')}
          buttonVariant="outlined"
          onPress={onRefresh}
        />
      </FadeInCard>
    );
  } else if (items.length === 0) {
    body = (
      <FadeInCard style={styles.state}>
        <EmptyState
          icon="receipt-outline"
          title={t('history.emptyTitle')}
          text={t('history.emptyText')}
          buttonLabel={t('history.addFirst')}
          onPress={() => router.push('/add-transaction')}
        />
      </FadeInCard>
    );
  } else if (filtered.length === 0) {
    body = (
      <FadeInCard style={styles.state}>
        <EmptyState
          icon="search-outline"
          iconColor={colors.textSecondary}
          text={t('history.noMatch')}
          buttonLabel={t('history.clearFilters')}
          buttonVariant="outlined"
          onPress={clearFilters}
        />
      </FadeInCard>
    );
  } else {
    body = (
      <FadeInCard index={1} style={styles.flex}>
        <SectionList
          sections={sections}
          keyExtractor={(x) => x.id}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => (
            <View style={styles.dayHeader}>
              <AppText variant="caption" color={colors.textSecondary} style={!isUrdu && styles.overline}>{section.title}</AppText>
            </View>
          )}
          // Each day is one card: round the first and last rows
          renderItem={({ item, index, section }) => (
            <View
              style={[
                styles.rowWrap,
                index === 0 && styles.rowFirst,
                index === section.data.length - 1 && styles.rowLast,
              ]}
            >
              <TransactionRow item={item} onDelete={setToDelete} last={index === section.data.length - 1} />
            </View>
          )}
          refreshControl={(
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.accentLight]}
              tintColor={colors.accentLight}
              progressBackgroundColor={colors.surfaceRaised}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </FadeInCard>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FadeInCard index={0}>
        <View style={styles.top}>
          <AppText variant="h1">{t('history.title')}</AppText>
        </View>
        {/* The filter bar: a dark input-like strip */}
        <View style={styles.filterBar}>
          <Ionicons name="options-outline" size={20} color={colors.textSecondary} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.flex} contentContainerStyle={styles.chipRow}>
            {chip('month', month === 'all' ? t('history.month') : monthLabel(month), month !== 'all')}
            {chip('category', category === 'all' ? t('history.category') : labelFor(options.category, category), category !== 'all')}
            {chip('payment', payment === 'all' ? t('history.paymentType') : labelFor(options.payment, payment), payment !== 'all')}
          </ScrollView>
        </View>
      </FadeInCard>

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
        <Dialog visible={!!toDelete} onDismiss={() => setToDelete(null)} style={styles.dialog}>
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
  top: { paddingHorizontal: screenPadding, paddingVertical: spacing.sm },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: screenPadding,
    marginBottom: spacing.sm,
    paddingStart: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  chipRow: { gap: spacing.sm, paddingEnd: spacing.sm },
  state: { paddingHorizontal: screenPadding, paddingTop: spacing.sm },
  listContent: { paddingBottom: spacing.xl },
  dayHeader: { backgroundColor: colors.background, paddingHorizontal: screenPadding + spacing.xs, paddingVertical: spacing.sm },
  overline: { textTransform: 'uppercase', letterSpacing: 1 }, // not for Urdu: spacing would break the joined letters
  rowWrap: {
    marginHorizontal: screenPadding,
    borderStartWidth: 1,
    borderEndWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  rowFirst: { borderTopWidth: 1, borderTopStartRadius: radius.card, borderTopEndRadius: radius.card },
  rowLast: { borderBottomWidth: 1, borderBottomStartRadius: radius.card, borderBottomEndRadius: radius.card },
  dialog: { backgroundColor: colors.surfaceRaised, borderRadius: radius.card },
});
