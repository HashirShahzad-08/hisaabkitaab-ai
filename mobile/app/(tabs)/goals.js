// Goals tab: monthly Budgets and savings Goals, as two segments (DESIGN.md section 8.9).
import { useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Dialog, Portal, Snackbar, TextInput } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppText from '../../components/AppText';
import BudgetCard from '../../components/BudgetCard';
import FadeInCard from '../../components/FadeInCard';
import GoalCard from '../../components/GoalCard';
import PrimaryButton from '../../components/ui/PrimaryButton';
import EmptyState from '../../components/ui/EmptyState';
import FormInput from '../../components/ui/FormInput';
import ListSkeleton from '../../components/ui/ListSkeleton';
import SegmentedControl from '../../components/ui/SegmentedControl';
import { useAuth } from '../../context/AuthContext';
import { useBudgets, useGoals } from '../../hooks/useBudgetsAndGoals';
import useTransactions from '../../hooks/useTransactions';
import { addMoneyToGoal, deleteGoal, setEditing } from '../../services/goalsService';
import { colors, fonts, radius, screenPadding, spacing } from '../../theme';
import { budgetProgress, freeCategories } from '../../utils/budgets';
import { getMonthStats } from '../../utils/stats';

export default function GoalsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  const [segment, setSegment] = useState('budgets');
  const [reloadKey, setReloadKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [snack, setSnack] = useState('');

  const tx = useTransactions(user?.uid, reloadKey);
  const budgets = useBudgets(user?.uid, reloadKey);
  const goals = useGoals(user?.uid, reloadKey);

  const progress = useMemo(() => budgetProgress(budgets.items, getMonthStats(tx.items)), [budgets.items, tx.items]);
  const canAddBudget = freeCategories(budgets.items).length > 0;

  // "Add money" and "delete" dialogs for goals
  const [moneyGoal, setMoneyGoal] = useState(null);
  const [moneyText, setMoneyText] = useState('');
  const [moneyError, setMoneyError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const addingMoney = useRef(false); // blocks a second tap before the screen has redrawn

  const onRefresh = () => {
    setRefreshing(true);
    setReloadKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 700);
  };

  function openBudget(budget) {
    setEditing(budget || null);
    router.push('/budget-form');
  }
  function openGoal(goal) {
    setEditing(goal || null);
    router.push('/goal-form');
  }

  async function confirmAddMoney() {
    if (addingMoney.current || !moneyGoal) return;
    const amount = Number(moneyText);
    if (!/^\d+(\.\d+)?$/.test(moneyText.trim()) || amount <= 0) {
      setMoneyError(true);
      return;
    }
    addingMoney.current = true;
    setBusy(true);
    try {
      await addMoneyToGoal(user.uid, moneyGoal.id, amount);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSnack(t('goals.moneyAdded'));
    } catch (e) {
      setSnack(t('goals.saveError'));
    }
    addingMoney.current = false;
    setBusy(false);
    setMoneyGoal(null);
    setMoneyText('');
  }

  async function confirmDelete() {
    setBusy(true);
    try {
      await deleteGoal(user.uid, deleteTarget.id);
      setSnack(t('goals.deleted'));
    } catch (e) {
      setSnack(t('goals.saveError'));
    }
    setBusy(false);
    setDeleteTarget(null);
  }

  const isBudgets = segment === 'budgets';
  const loading = tx.loading || budgets.loading || goals.loading;
  const error = tx.error || budgets.error || goals.error;

  let body;
  if (loading) {
    body = <ListSkeleton count={3} height={144} />;
  } else if (error) {
    body = (
      <FadeInCard>
        <EmptyState
          icon="cloud-offline-outline"
          iconColor={colors.textSecondary}
          text={t(error === 'permission-denied' ? 'goals.errorPermission' : 'goals.errorLoad')}
          buttonLabel={t('goals.retry')}
          buttonVariant="outlined"
          onPress={onRefresh}
        />
      </FadeInCard>
    );
  } else if (isBudgets) {
    body = progress.length === 0 ? (
      <FadeInCard>
        <EmptyState
          icon="pie-chart-outline"
          title={t('goals.budgetsEmptyTitle')}
          text={t('goals.budgetsEmptyText')}
          buttonLabel={t('goals.addFirstBudget')}
          buttonIcon="add-circle-outline"
          onPress={() => openBudget(null)}
        />
      </FadeInCard>
    ) : (
      <View style={styles.list}>
        <PrimaryButton label={t('goals.addBudget')} icon="add" onPress={() => openBudget(null)} disabled={!canAddBudget} />
        {!canAddBudget ? <AppText variant="caption" color={colors.textSecondary}>{t('goals.allCategoriesUsed')}</AppText> : null}
        {progress.map((b, i) => (
          <FadeInCard key={b.id} index={i}>
            <BudgetCard budget={b} onPress={() => openBudget(b)} />
          </FadeInCard>
        ))}
      </View>
    );
  } else {
    body = goals.items.length === 0 ? (
      <FadeInCard>
        <EmptyState
          icon="flag-outline"
          iconColor={colors.accent}
          title={t('goals.goalsEmptyTitle')}
          text={t('goals.goalsEmptyText')}
          buttonLabel={t('goals.addFirstGoal')}
          buttonIcon="add-circle-outline"
          onPress={() => openGoal(null)}
        />
      </FadeInCard>
    ) : (
      <View style={styles.list}>
        <PrimaryButton label={t('goals.addGoal')} icon="add" onPress={() => openGoal(null)} />
        {goals.items.map((g, i) => (
          <FadeInCard key={g.id} index={i}>
            <GoalCard
              goal={g}
              onAddMoney={() => { setMoneyText(''); setMoneyError(false); setMoneyGoal(g); }}
              onEdit={() => openGoal(g)}
              onDelete={() => setDeleteTarget(g)}
            />
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
        keyboardShouldPersistTaps="handled"
      >
        <FadeInCard index={0}><AppText variant="h1">{t('goals.title')}</AppText></FadeInCard>
        <FadeInCard index={1}>
          <SegmentedControl
            value={segment}
            onChange={setSegment}
            options={[
              { value: 'budgets', label: t('goals.segmentBudgets') },
              { value: 'goals', label: t('goals.segmentGoals') },
            ]}
          />
        </FadeInCard>
        {body}
      </ScrollView>

      <Portal>
        <Dialog visible={!!moneyGoal} onDismiss={() => !busy && setMoneyGoal(null)} style={styles.dialog}>
          <Dialog.Title><AppText variant="h2">{t('goals.addMoneyTitle')}</AppText></Dialog.Title>
          <Dialog.Content>
            <AppText variant="caption" color={colors.textSecondary} style={styles.dialogName}>{moneyGoal?.name}</AppText>
            <FormInput
              label={t('goals.amount')}
              value={moneyText}
              onChangeText={(v) => { setMoneyText(v.replace(/[^0-9.]/g, '')); setMoneyError(false); }}
              keyboardType="decimal-pad"
              left={<TextInput.Affix text="Rs" />}
              font={fonts.en.medium}
              contentStyle={{ fontSize: 18 }}
              error={moneyError}
              autoFocus
            />
            {moneyError ? <AppText variant="caption" color={colors.danger}>{t('goals.errors.amount')}</AppText> : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setMoneyGoal(null)} textColor={colors.textSecondary} disabled={busy}>{t('common.cancel')}</Button>
            <Button onPress={confirmAddMoney} textColor={colors.primary} loading={busy} disabled={busy}>{t('goals.add')}</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={!!deleteTarget} onDismiss={() => !busy && setDeleteTarget(null)} style={styles.dialog}>
          <Dialog.Title><AppText variant="h2">{t('goals.deleteGoalTitle')}</AppText></Dialog.Title>
          <Dialog.Content><AppText variant="body">{t('goals.deleteGoalText', { name: deleteTarget?.name || '' })}</AppText></Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteTarget(null)} textColor={colors.textSecondary} disabled={busy}>{t('common.cancel')}</Button>
            <Button onPress={confirmDelete} textColor={colors.danger} loading={busy} disabled={busy}>{t('goals.delete')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={2500}>{snack}</Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: screenPadding, paddingBottom: spacing.xl, gap: spacing.md },
  list: { gap: spacing.md },
  dialog: { backgroundColor: colors.surfaceRaised, borderRadius: radius.card },
  dialogName: { marginBottom: spacing.sm },
});
