// Bill result: verdict, key numbers, issues, explanation (spoken), tips, complaint, and Save.
import { useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Snackbar, Switch } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AlertCard from '../components/AlertCard';
import AppText from '../components/AppText';
import FadeInCard from '../components/FadeInCard';
import InsightCard from '../components/InsightCard';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { getCurrentBill, saveBill, setFlash } from '../services/billService';
import { colors, fonts, radius, screenPadding } from '../theme';
import { helplineFor, monthLabel, verdictMeta } from '../utils/billUi';
import { formatNumber } from '../utils/format';

// 150 -> "150", 1250 -> "1,250", 31.6 -> "31.6", -100 -> "-100"
const fmt = (n) => {
  const r = Math.round(n * 10) / 10;
  const text = Number.isInteger(r) ? formatNumber(r) : String(Math.abs(r));
  return r < 0 ? `-${text}` : text;
};

const ISSUE_STYLE = {
  reading_error: { icon: 'alert-circle', color: colors.danger },
  units_mismatch: { icon: 'alert-circle', color: colors.danger },
  sudden_jump: { icon: 'trending-up', color: colors.warning },
  higher_than_last_year: { icon: 'trending-up', color: colors.warning },
  near_200: { icon: 'warning', color: colors.warning },
  above_200: { icon: 'information-circle', color: colors.info },
};

function Stat({ label, children }) {
  return (
    <View style={styles.stat}>
      <AppText variant="caption" color={colors.textSecondary}>{label}</AppText>
      {children}
    </View>
  );
}

export default function BillResultScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const isUrdu = i18n.language === 'ur';
  const bill = getCurrentBill();

  const [addExpense, setAddExpense] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [snack, setSnack] = useState('');

  if (!bill) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title={t('bills.result.title')} />
        <View style={styles.missing}>
          <AppText variant="body" color={colors.textSecondary} style={styles.centerText}>{t('bills.result.missing')}</AppText>
          <PrimaryButton label={t('bills.result.back')} onPress={() => router.replace('/(tabs)/bills')} variant="outlined" />
        </View>
      </SafeAreaView>
    );
  }

  const { request, result, saved } = bill;
  const meta = verdictMeta(result.verdict);
  const helpline = helplineFor(request.company);

  async function save() {
    if (saving) return;
    setSaving(true);
    setSaveError(false);
    try {
      await saveBill(user.uid, {
        request,
        result,
        expense: addExpense ? { label: t('bills.expenseNote', { month: monthLabel(request.bill_month, t) }) } : null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFlash('bills.saved');
      router.navigate('/(tabs)/bills');
    } catch (e) {
      setSaveError(true);
      setSaving(false);
    }
  }

  async function copy() {
    await Clipboard.setStringAsync(result.complaint);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSnack(t('bills.result.copied'));
  }

  const money = (value) => (
    <View style={styles.valueRow}>
      {!isUrdu ? <Text style={styles.value}>Rs </Text> : null}
      <Text style={styles.value}>{fmt(value)}</Text>
      {isUrdu ? <AppText variant="caption" color={colors.text}> {t('common.rupees')}</AppText> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title={monthLabel(request.bill_month, t)} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 1. Verdict */}
        <AlertCard variant={meta.variant} icon={meta.icon} title={t(meta.key)}>
          <AppText variant="body" color={colors.text}>{t(`bills.verdictLine.${result.verdict}`)}</AppText>
        </AlertCard>

        {/* 2. Key numbers */}
        <FadeInCard index={1}>
          <View style={[styles.card, styles.statsGrid]}>
            <Stat label={t('bills.result.meterUnits')}><Text style={styles.value}>{fmt(result.reading_units)}</Text></Stat>
            <Stat label={t('bills.result.billedUnits')}><Text style={styles.value}>{fmt(result.units_billed)}</Text></Stat>
            {result.extra_units > 0 ? (
              <Stat label={t('bills.result.extraUnits')}><Text style={[styles.value, { color: colors.danger }]}>{fmt(result.extra_units)}</Text></Stat>
            ) : null}
            <Stat label={t('bills.result.costPerUnit')}>{money(result.cost_per_unit)}</Stat>
          </View>
        </FadeInCard>

        {/* 3. Issues */}
        <FadeInCard index={2}>
          <View style={styles.card}>
            <AppText variant="h2">{t('bills.result.found')}</AppText>
            {result.issues.length === 0 ? (
              <View style={[styles.issueRow, isUrdu && styles.rowUrdu]}>
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                <AppText variant="body" style={styles.flex}>{t('bills.result.noIssues')}</AppText>
              </View>
            ) : (
              result.issues.map((issue) => {
                const style = ISSUE_STYLE[issue.code] || ISSUE_STYLE.above_200;
                return (
                  <View key={issue.code} style={[styles.issueRow, isUrdu && styles.rowUrdu]}>
                    <Ionicons name={style.icon} size={22} color={style.color} />
                    <AppText variant="body" style={styles.flex}>{issue.message}</AppText>
                  </View>
                );
              })
            )}
          </View>
        </FadeInCard>

        {/* 4. Explanation (can be read aloud) */}
        <FadeInCard index={3}><InsightCard text={result.explanation} /></FadeInCard>

        {/* 5. Tips */}
        {result.tips.length > 0 ? (
          <FadeInCard index={4}>
            <View style={styles.card}>
              <AppText variant="h2">{t('bills.result.tips')}</AppText>
              {result.tips.map((tip, i) => (
                <View key={i} style={[styles.issueRow, isUrdu && styles.rowUrdu]}>
                  <Ionicons name="bulb-outline" size={22} color={colors.accent} />
                  <AppText variant="body" style={styles.flex}>{tip}</AppText>
                </View>
              ))}
            </View>
          </FadeInCard>
        ) : null}

        {/* 6. Complaint */}
        {result.complaint ? (
          <FadeInCard index={5}>
            <View style={styles.card}>
              <AppText variant="h2">{t('bills.result.complaint')}</AppText>
              <AppText variant="body" selectable style={styles.complaintText}>{result.complaint}</AppText>
              {helpline ? (
                <View style={[styles.issueRow, isUrdu && styles.rowUrdu]}>
                  <Ionicons name="call-outline" size={20} color={colors.primary} />
                  <AppText variant="bodyMedium" style={styles.flex}>
                    {t('bills.result.helpline', { company: (request.company || '').toUpperCase(), number: helpline })}
                  </AppText>
                </View>
              ) : null}
              <View style={[styles.buttonRow, isUrdu && styles.rowUrdu]}>
                <PrimaryButton label={t('bills.result.copy')} icon="copy-outline" variant="outlined" onPress={copy} style={styles.flex} />
                <PrimaryButton
                  label={t('bills.result.share')}
                  icon="share-social-outline"
                  variant="outlined"
                  onPress={() => Share.share({ message: result.complaint })}
                  style={styles.flex}
                />
              </View>
            </View>
          </FadeInCard>
        ) : null}

        {/* 7. Add to expenses */}
        {!saved ? (
          <FadeInCard index={6}>
            <View style={[styles.card, styles.switchRow, isUrdu && styles.rowUrdu]}>
              <AppText variant="bodyMedium" style={styles.flex}>{t('bills.result.addExpense')}</AppText>
              <Switch value={addExpense} onValueChange={setAddExpense} color={colors.primary} disabled={saving} />
            </View>
          </FadeInCard>
        ) : null}

        {saveError ? (
          <View style={styles.errorBox}>
            <AppText variant="body" color={colors.danger}>{t('bills.result.saveError')}</AppText>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {saved ? (
          <PrimaryButton label={t('bills.result.back')} variant="outlined" onPress={() => router.back()} />
        ) : (
          <PrimaryButton label={saveError ? t('bills.result.retrySave') : t('bills.result.save')} onPress={save} loading={saving} icon="save-outline" />
        )}
      </View>
      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={2000}>{snack}</Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: screenPadding, paddingBottom: 24, gap: 12 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 16, gap: 12, elevation: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 },
  stat: { width: '50%', gap: 2 },
  value: { fontFamily: fonts.en.semibold, fontSize: 20, color: colors.text },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', direction: 'ltr' },
  issueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  rowUrdu: { flexDirection: 'row-reverse' },
  complaintText: { backgroundColor: colors.background, borderRadius: radius.input, padding: 12 },
  buttonRow: { flexDirection: 'row', gap: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  errorBox: { backgroundColor: colors.dangerLight, borderRadius: radius.input, padding: 12 },
  footer: { padding: screenPadding, backgroundColor: colors.background },
  missing: { flex: 1, padding: screenPadding, justifyContent: 'center', gap: 16 },
  centerText: { textAlign: 'center' },
});
