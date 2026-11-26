// Add or edit a monthly budget. One budget per category, so "add" only offers categories without one.
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Dialog, Portal, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppText from '../components/AppText';
import PrimaryButton from '../components/ui/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import { categoryColor, categoryIcon, categoryKey } from '../constants/categories';
import { useAuth } from '../context/AuthContext';
import { useBudgets } from '../hooks/useBudgetsAndGoals';
import { deleteBudget, getEditing, saveBudget } from '../services/goalsService';
import { colors, fonts, radius, screenPadding, sizes } from '../theme';
import { freeCategories } from '../utils/budgets';

export default function BudgetFormScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const editing = useMemo(() => getEditing(), []); // a budget when editing, otherwise null
  const budgets = useBudgets(user?.uid);

  const [category, setCategory] = useState(editing?.category || null);
  const [limit, setLimit] = useState(editing ? String(Math.round(editing.limit)) : '');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const choices = editing ? [editing.category] : freeCategories(budgets.items);

  async function save() {
    if (saving) return;
    const e = {};
    if (!category) e.category = 'goals.errors.category';
    const value = Number(limit);
    if (!/^\d+(\.\d+)?$/.test(limit.trim()) || value <= 0) e.limit = 'goals.errors.limit';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    setSaveError(false);
    try {
      await saveBudget(user.uid, { category, limit: value });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.back();
    } catch (err) {
      setSaveError(true);
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    try {
      await deleteBudget(user.uid, editing.category);
      router.back();
    } catch (err) {
      setSaveError(true);
      setSaving(false);
      setConfirmDelete(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title={t(editing ? 'goals.editBudget' : 'goals.addBudget')} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <AppText variant="h2">{t('goals.category')}</AppText>
          {choices.length === 0 && !budgets.loading ? (
            <AppText variant="body" color={colors.textSecondary}>{t('goals.allCategoriesUsed')}</AppText>
          ) : (
            <View style={styles.chips}>
              {choices.map((c) => {
                const selected = category === c;
                const color = categoryColor(c);
                return (
                  <Pressable
                    key={c}
                    onPress={() => { if (!editing) { setCategory(c); setErrors((x) => ({ ...x, category: undefined })); } }}
                    style={[styles.chip, { borderColor: selected ? color : colors.border, backgroundColor: selected ? `${color}22` : colors.surface }]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Ionicons name={categoryIcon(c)} size={20} color={color} />
                    <AppText variant="bodyMedium" color={selected ? colors.text : colors.textSecondary}>{t(categoryKey(c))}</AppText>
                  </Pressable>
                );
              })}
            </View>
          )}
          {errors.category ? <AppText variant="caption" color={colors.danger}>{t(errors.category)}</AppText> : null}

          <AppText variant="h2" style={styles.section}>{t('goals.monthlyLimit')}</AppText>
          <TextInput
            mode="outlined"
            label={t('goals.limitLabel')}
            value={limit}
            onChangeText={(v) => { setLimit(v.replace(/[^0-9.]/g, '')); setErrors((x) => ({ ...x, limit: undefined })); }}
            keyboardType="decimal-pad"
            left={<TextInput.Affix text="Rs" />}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            outlineStyle={{ borderRadius: radius.input }}
            style={styles.input}
            contentStyle={{ fontFamily: fonts.en.medium, fontSize: 20 }}
            error={!!errors.limit}
          />
          {errors.limit ? <AppText variant="caption" color={colors.danger}>{t(errors.limit)}</AppText> : null}

          {saveError ? (
            <View style={styles.errorBox}><AppText variant="body" color={colors.danger}>{t('goals.saveError')}</AppText></View>
          ) : null}

          {editing ? (
            <Pressable onPress={() => setConfirmDelete(true)} style={styles.deleteRow} accessibilityRole="button">
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
              <AppText variant="bodyMedium" color={colors.danger}>{t('goals.deleteBudget')}</AppText>
            </Pressable>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton label={t('goals.save')} icon="checkmark-circle-outline" onPress={save} loading={saving} disabled={choices.length === 0} />
        </View>
      </KeyboardAvoidingView>

      <Portal>
        <Dialog visible={confirmDelete} onDismiss={() => !saving && setConfirmDelete(false)} style={styles.dialog}>
          <Dialog.Title><AppText variant="h2">{t('goals.deleteBudgetTitle')}</AppText></Dialog.Title>
          <Dialog.Content><AppText variant="body">{t('goals.deleteBudgetText')}</AppText></Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDelete(false)} textColor={colors.textSecondary} disabled={saving}>{t('common.cancel')}</Button>
            <Button onPress={remove} textColor={colors.danger} loading={saving} disabled={saving}>{t('goals.delete')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: screenPadding, paddingBottom: 24, gap: 12 },
  section: { marginTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: sizes.touch, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1.5 },
  input: { backgroundColor: colors.surface },
  errorBox: { backgroundColor: colors.dangerLight, borderRadius: radius.input, padding: 12 },
  deleteRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: sizes.touch, marginTop: 12 },
  footer: { padding: screenPadding, backgroundColor: colors.background },
  dialog: { backgroundColor: colors.surface, borderRadius: radius.card },
});
