// One transaction (Home and History). In History, swipe left to show a red delete action.
// meta="source" shows "Today · SMS" under the title; otherwise payment type and time.
import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useTranslation } from 'react-i18next';

import AmountText from './ui/AmountText';
import AppText from './AppText';
import CategoryIcon from './CategoryIcon';
import { categoryKey, paymentKey } from '../constants/categories';
import { colors, sizes } from '../theme';
import { formatDayLabel, formatTime } from '../utils/format';
import { useIsRTL } from '../utils/rtl';

// How a transaction was entered, as saved in Firestore -> the label to show
const SOURCE_LABEL = { sms: 'sms', voice: 'voice', quick: 'voice', bill: 'bill' };

export default function TransactionRow({ item, onDelete, meta, last = false }) {
  const { t } = useTranslation();
  const rtl = useIsRTL();
  const ref = useRef(null);

  const title = item.note || t(categoryKey(item.category));
  const caption = meta === 'source'
    ? `${formatDayLabel(item.date, t)} · ${t(`home.source.${SOURCE_LABEL[item.source] || 'manual'}`)}`
    : `${t(paymentKey(item.paymentType))} · ${formatTime(item.dateTime, t)}`;

  const renderRight = () => (
    <Pressable
      onPress={() => { ref.current?.close(); onDelete(item); }}
      style={styles.deleteAction}
      accessibilityRole="button"
      accessibilityLabel={t('history.delete')}
    >
      <Ionicons name="trash-outline" size={22} color={colors.danger} />
      <AppText variant="caption" color={colors.dangerText}>{t('history.delete')}</AppText>
    </Pressable>
  );

  const content = (
    <View style={[styles.row, last && styles.last]}>
      <CategoryIcon category={item.category} />
      <View style={styles.texts}>
        <AppText variant="bodyMedium" numberOfLines={1}>{title}</AppText>
        <AppText variant="caption" color={colors.textSecondary}>{caption}</AppText>
      </View>
      <AmountText amount={item.amount} type={item.type} />
    </View>
  );

  // Without onDelete (for example on Home) the row is plain, with no swipe.
  if (!onDelete) return content;

  return (
    <ReanimatedSwipeable
      ref={ref}
      {...(rtl
        ? { renderLeftActions: renderRight, overshootLeft: false }
        : { renderRightActions: renderRight, overshootRight: false })}
      friction={2}
    >
      {content}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 68,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  last: { borderBottomWidth: 0 },
  texts: { flex: 1, marginHorizontal: 12 },
  deleteAction: {
    width: 88,
    minHeight: sizes.touch,
    backgroundColor: colors.dangerLight,
    borderStartWidth: 1,
    borderColor: colors.dangerBorder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
