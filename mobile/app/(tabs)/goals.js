// Goals tab: monthly Budgets and savings Goals, as two segments (DESIGN.md section 8.9).
import { useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Dialog, Portal, SegmentedButtons, Snackbar, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppText from '../../components/AppText';
import BudgetCard from '../../components/BudgetCard';
import FadeInCard from '../../components/FadeInCard';
import GoalCard from '../../components/GoalCard';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { useBudgets, useGoals } from '../../hooks/useBudgetsAndGoals';
import useTransactions from '../../hooks/useTransactions';
import { addMoneyToGoal, deleteGoal, setEditing } from '../../services/goalsService';
import { colors, fonts, radius, screenPadding } from '../../theme';
import { budgetProgress, freeCategories } from '../../utils/budgets';
import { getMonthStats } from '../../utils/stats';

export default function GoalsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const labelFont = i18n.language === 'ur' ? fonts.ur.medium : fonts.en.medium;

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
    const amount = Number(moneyText);
    if (!/^\d+(\.\d+)?$/.test(moneyText.trim()) || amount <= 0) {
      setMoneyError(true);
      return;
    }
    setBusy(true);
    try {
      await addMoneyToGoal(user.uid, moneyGoal.id, amount);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSnack(t('goals.moneyAdded'));
    } catch (e) {
      setSnack(t('goals.saveError'));
    }
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
    body = <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />;
  } else if (error) {
    body = (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={40} color={colors.textSecondary} />
        <AppText variant="body" color={colors.textSecondary} style={styles.centerText}>
          {t(error === 'permission-denied' ? 'goals.errorPermission' : 'goals.errorLoad')}
        </AppText>
        <PrimaryButton label={t('goals.retry')} variant="outlined" onPress={onRefresh} style={styles.fullWidth} />
      </View>
    );
  } else if (isBudgets) {
    body = progress.length === 0 ? (
      <FadeInCard>
        <View style={styles.center}>
          <View style={styles.circle}><Ionicons name="pie-chart-outline" size={44} color={colors.primary} /></View>
          <AppText variant="h2" style={styles.centerText}>{t('goals.budgetsEmptyTitle')}</AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.centerText}>{t('goals.budgetsEmptyText')}</AppText>
          <PrimaryButton label={t('goals.addFirstBudget')} icon="add-circle-outline" onPress={() => openBudget(null)} style={styles.fullWidth} />
        </View>
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
        <View style={styles.center}>
          <View style={styles.circle}><Ionicons name="flag-outline" size={44} color={colors.accent} /></View>
          <AppText variant="h2" style={styles.centerText}>{t('goals.goalsEmptyTitle')}</AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.centerText}>{t('goals.goalsEmptyText')}</AppText>
          <PrimaryButton label={t('goals.addFirstGoal')} icon="add-circle-outline" onPress={() => openGoal(null)} style={styles.fullWidth} />
        </View>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AppText variant="h1">{t('goals.title')}</AppText>
        <SegmentedButtons
          value={segment}
          onValueChange={setSegment}
          theme={{ colors: { secondaryContainer: colors.primaryLight, onSecondaryContainer: colors.primaryDark } }}
          buttons={[
            { value: 'budgets', label: t('goals.segmentBudgets'), style: styles.segment, labelStyle: { fontFamily: labelFont } },
            { value: 'goals', label: t('goals.segmentGoals'), style: styles.segment, labelStyle: { fontFamily: labelFont } },
          ]}
        />
        {body}
      </ScrollView>

      <Portal>
        <Dialog visible={!!moneyGoal} onDismiss={() => !busy && setMoneyGoal(null)} style={styles.dialog}>
          <Dialog.Title><AppText variant="h2">{t('goals.addMoneyTitle')}</AppText></Dialog.Title>
          <Dialog.Content>
            <AppText variant="caption" color={colors.textSecondary} style={styles.dialogName}>{moneyGoal?.name}</AppText>
            <TextInput
              mode="outlined"
              label={t('goals.amount')}
              value={moneyText}
              onChangeText={(v) => { setMoneyText(v.replace(/[^0-9.]/g, '')); setMoneyError(false); }}
              keyboardType="decimal-pad"
              left={<TextInput.Affix text="Rs" />}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              outlineStyle={{ borderRadius: radius.input }}
              style={styles.input}
              contentStyle={{ fontFamily: fonts.en.medium, fontSize: 18 }}
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
  scroll: { padding: screenPadding, paddingBottom: 64, gap: 12 },
  segment: { borderColor: colors.border },
  loader: { marginTop: 48 },
  list: { gap: 12, marginTop: 4 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  centerText: { textAlign: 'center' },
  fullWidth: { alignSelf: 'stretch', marginTop: 8 },
  circle: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  dialog: { backgroundColor: colors.surface, borderRadius: radius.card },
  dialogName: { marginBottom: 8 },
  input: { backgroundColor: colors.surface },
});
