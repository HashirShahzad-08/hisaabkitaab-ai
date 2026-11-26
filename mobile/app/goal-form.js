// Add or edit a savings goal: name, target amount, and an optional target date.
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppText from '../components/AppText';
import FadeInCard from '../components/FadeInCard';
import PressableScale from '../components/PressableScale';
import PrimaryButton from '../components/ui/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import KeyboardAvoider from '../components/ui/KeyboardAvoider';
import Card from '../components/ui/Card';
import DateField from '../components/ui/DateField';
import FormInput from '../components/ui/FormInput';
import SectionHeader from '../components/ui/SectionHeader';
import { useAuth } from '../context/AuthContext';
import { getEditing, saveGoal } from '../services/goalsService';
import { colors, fonts, radius, screenPadding, sizes, spacing } from '../theme';
import { fromDateKey, toDateKey } from '../utils/format';
import { shortDate } from '../utils/money';

export default function GoalFormScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const editing = useMemo(() => getEditing(), []); // a goal when editing, otherwise null

  const [name, setName] = useState(editing?.name || '');
  const [target, setTarget] = useState(editing ? String(Math.round(editing.targetAmount)) : '');
  const [date, setDate] = useState(editing?.targetDate || null); // "YYYY-MM-DD" or null
  const [showPicker, setShowPicker] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  async function save() {
    if (saving) return;
    const e = {};
    if (!name.trim()) e.name = 'goals.errors.name';
    const value = Number(target);
    if (!/^\d+(\.\d+)?$/.test(target.trim()) || value <= 0) e.target = 'goals.errors.target';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    setSaveError(false);
    try {
      await saveGoal(user.uid, { id: editing?.id, name: name.trim(), targetAmount: value, targetDate: date });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.back();
    } catch (err) {
      setSaveError(true);
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title={t(editing ? 'goals.editGoal' : 'goals.addGoal')} />
      <KeyboardAvoider>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <FadeInCard index={0}>
            <Card style={styles.group}>
              <FormInput
                label={t('goals.goalName')}
                value={name}
                onChangeText={(v) => { setName(v); setErrors((x) => ({ ...x, name: undefined })); }}
                maxLength={60}
                error={!!errors.name}
              />
              {errors.name ? <AppText variant="caption" color={colors.danger}>{t(errors.name)}</AppText> : null}
              <AppText variant="caption" color={colors.textSecondary}>{t('goals.nameHint')}</AppText>

              <FormInput
                label={t('goals.targetAmount')}
                value={target}
                onChangeText={(v) => { setTarget(v.replace(/[^0-9.]/g, '')); setErrors((x) => ({ ...x, target: undefined })); }}
                keyboardType="decimal-pad"
                left={<TextInput.Affix text="Rs" />}
                font={fonts.en.medium}
                contentStyle={{ fontSize: 20 }}
                error={!!errors.target}
              />
              {errors.target ? <AppText variant="caption" color={colors.danger}>{t(errors.target)}</AppText> : null}
            </Card>
          </FadeInCard>

          <FadeInCard index={1}>
            <Card style={styles.group}>
              <SectionHeader title={t('goals.targetDateOptional')} />
              <View style={styles.dateRow}>
                <DateField label={date ? shortDate(date, t) : t('goals.noDate')} onPress={() => setShowPicker(true)} style={styles.flex} />
                {date ? (
                  <PressableScale onPress={() => setDate(null)} accessibilityLabel={t('goals.clearDate')} hitSlop={6} pressableStyle={styles.clear}>
                    <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
                  </PressableScale>
                ) : null}
              </View>
              {showPicker ? (
                <DateTimePicker
                  value={date ? fromDateKey(date) : new Date()}
                  mode="date"
                  minimumDate={new Date()}
                  onChange={(event, picked) => {
                    setShowPicker(false);
                    if (event.type === 'set' && picked) setDate(toDateKey(picked));
                  }}
                />
              ) : null}
            </Card>
          </FadeInCard>

          {saveError ? (
            <View style={styles.errorBox}><AppText variant="body" color={colors.danger}>{t('goals.saveError')}</AppText></View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton label={t('goals.save')} icon="checkmark-circle-outline" onPress={save} loading={saving} />
        </View>
      </KeyboardAvoider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: screenPadding, paddingBottom: spacing.xl, gap: spacing.md },
  group: { gap: spacing.md },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  clear: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center' },
  errorBox: { backgroundColor: colors.dangerLight, borderColor: colors.dangerBorder, borderWidth: 1, borderRadius: radius.input, padding: 12 },
  footer: { padding: screenPadding, backgroundColor: colors.background },
});
