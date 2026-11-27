// Bill result: verdict, key numbers, issues, explanation (spoken), tips, complaint, and Save.
import { useRef, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Snackbar, Switch } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppText from '../components/AppText';
import FadeInCard from '../components/FadeInCard';
import InsightCard from '../components/InsightCard';
import PrimaryButton from '../components/ui/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import SectionHeader from '../components/ui/SectionHeader';
import StatGrid, { StatTile } from '../components/ui/StatGrid';
import VerdictCard from '../components/ui/VerdictCard';
import { useAuth } from '../context/AuthContext';
import { getCurrentBill, newBillRefs, saveBill, setFlash } from '../services/billService';
import { colors, fonts, radius, screenPadding, spacing } from '../theme';
import { helplineFor, monthLabel, verdictMeta } from '../utils/billUi';
import { formatNumber } from '../utils/format';

// 150 -> "150", 1250 -> "1,250", 31.6 -> "31.6", -100 -> "-100"
const fmt = (n) => {
  const r = Math.round(n * 10) / 10;
  const text = Number.isInteger(r) ? formatNumber(r) : String(Math.abs(r));
  return r < 0 ? `-${text}` : text;
};

// The color of the dot in front of each issue
const ISSUE_COLOR = {
  reading_error: colors.danger,
  units_mismatch: colors.danger,
  sudden_jump: colors.warning,
  higher_than_last_year: colors.warning,
  near_200: colors.warning,
  reading_typo: colors.warning,
  above_200: colors.info,
};

// bill verdict -> look of the big verdict card
const TONE = { looks_ok: 'ok', check: 'warning', likely_overbilled: 'danger' };

function ListItem({ color, children }) {
  return (
    <View style={styles.issueRow}>
      <View style={styles.dotBox}><View style={[styles.dot, { backgroundColor: color }]} /></View>
      <AppText variant="body" color={colors.textBody} style={styles.flex}>{children}</AppText>
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
  const busy = useRef(false); // blocks a second tap before the screen has redrawn
  const refs = useRef(null); // the same documents are reused if saving is retried

  if (!bill) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title={t('bills.result.title')} />
        <View style={styles.missing}>
          <EmptyState
            icon="receipt-outline"
            iconColor={colors.textSecondary}
            text={t('bills.result.missing')}
            buttonLabel={t('bills.result.back')}
            buttonVariant="outlined"
            onPress={() => router.replace('/(tabs)/bills')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const { request, result, saved } = bill;
  const meta = verdictMeta(result.verdict);
  const helpline = helplineFor(request.company);

  async function save() {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setSaveError(false);
    try {
      if (!refs.current) refs.current = newBillRefs(user.uid);
      await saveBill({
        refs: refs.current,
        request,
        result,
        expense: addExpense ? { label: t('bills.expenseNote', { month: monthLabel(request.bill_month, t) }) } : null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFlash('bills.saved');
      router.navigate('/(tabs)/bills');
    } catch (e) {
      busy.current = false;
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
        <VerdictCard
          tone={TONE[result.verdict] || 'warning'}
          icon={meta.icon}
          title={t(meta.key)}
          text={t(`bills.verdictLine.${result.verdict}`)}
        />

        {/* 2. Key numbers */}
        <FadeInCard index={1}>
          <StatGrid>
            <StatTile label={t('bills.result.meterUnits')}><Text style={styles.value}>{fmt(result.reading_units)}</Text></StatTile>
            <StatTile label={t('bills.result.billedUnits')}><Text style={styles.value}>{fmt(result.units_billed)}</Text></StatTile>
            {result.extra_units > 0 ? (
              <StatTile label={t('bills.result.extraUnits')}><Text style={[styles.value, { color: colors.danger }]}>{fmt(result.extra_units)}</Text></StatTile>
            ) : null}
            <StatTile label={t('bills.result.costPerUnit')}>{money(result.cost_per_unit)}</StatTile>
          </StatGrid>
        </FadeInCard>

        {/* 3. Issues */}
        <FadeInCard index={2}>
          <Card style={styles.group}>
            <SectionHeader title={t('bills.result.found')} />
            {result.issues.length === 0 ? (
              <ListItem color={colors.info}>{t('bills.result.noIssues')}</ListItem>
            ) : (
              result.issues.map((issue) => (
                <ListItem key={issue.code} color={ISSUE_COLOR[issue.code] || colors.info}>{issue.message}</ListItem>
              ))
            )}
          </Card>
        </FadeInCard>

        {/* 4. Explanation (can be read aloud) */}
        <FadeInCard index={3}><InsightCard text={result.explanation} /></FadeInCard>

        {/* 5. Tips */}
        {result.tips.length > 0 ? (
          <FadeInCard index={4}>
            <Card style={styles.group}>
              <SectionHeader title={t('bills.result.tips')} />
              {result.tips.map((tip, i) => (
                <ListItem key={i} color={colors.accentLight}>{tip}</ListItem>
              ))}
            </Card>
          </FadeInCard>
        ) : null}

        {/* 6. Complaint */}
        {result.complaint ? (
          <FadeInCard index={5}>
            <Card style={styles.group}>
              <SectionHeader title={t('bills.result.complaint')} />
              <AppText variant="body" color={colors.textBody} selectable style={styles.complaintText}>{result.complaint}</AppText>
              {helpline ? (
                <View style={styles.issueRow}>
                  <Ionicons name="call-outline" size={20} color={colors.accentLight} />
                  <AppText variant="bodyMedium" style={styles.flex}>
                    {t('bills.result.helpline', { company: (request.company || '').toUpperCase(), number: helpline })}
                  </AppText>
                </View>
              ) : null}
              <View style={styles.buttonRow}>
                <PrimaryButton label={t('bills.result.copy')} icon="copy-outline" variant="outlined" onPress={copy} style={styles.flex} />
                <PrimaryButton
                  label={t('bills.result.share')}
                  icon="share-social-outline"
                  onPress={() => Share.share({ message: result.complaint })}
                  style={styles.flex}
                />
              </View>
            </Card>
          </FadeInCard>
        ) : null}

        {/* 7. Add to expenses */}
        {!saved ? (
          <FadeInCard index={6}>
            <Card style={styles.switchRow}>
              <AppText variant="bodyMedium" style={styles.flex}>{t('bills.result.addExpense')}</AppText>
              <Switch value={addExpense} onValueChange={setAddExpense} color={colors.primary} disabled={saving} />
            </Card>
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
  scroll: { padding: screenPadding, paddingBottom: spacing.xl, gap: spacing.md },
  group: { gap: spacing.md },
  value: { fontFamily: fonts.en.semibold, fontSize: 22, color: colors.text },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', direction: 'ltr' },
  issueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  dotBox: { height: 22, justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  complaintText: { backgroundColor: colors.surfaceRaised, borderRadius: radius.input, padding: spacing.md },
  buttonRow: { flexDirection: 'row', gap: spacing.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  errorBox: { backgroundColor: colors.dangerLight, borderColor: colors.dangerBorder, borderWidth: 1, borderRadius: radius.input, padding: 12 },
  footer: { padding: screenPadding, backgroundColor: colors.background },
  missing: { flex: 1, padding: screenPadding, justifyContent: 'center' },
});
