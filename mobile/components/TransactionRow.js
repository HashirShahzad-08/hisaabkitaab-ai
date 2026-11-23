// One transaction in the History list. Swipe left to show a red delete action.
import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useTranslation } from 'react-i18next';

import AmountText from './AmountText';
import AppText from './AppText';
import CategoryIcon from './CategoryIcon';
import { categoryKey, paymentKey } from '../constants/categories';
import { colors, radius, sizes } from '../theme';
import { formatTime } from '../utils/format';

export default function TransactionRow({ item, onDelete }) {
  const { t, i18n } = useTranslation();
  const ref = useRef(null);
  const isUrdu = i18n.language === 'ur';

  const title = item.note || t(categoryKey(item.category));
  const caption = `${t(paymentKey(item.paymentType))} · ${formatTime(item.dateTime)}`;

  const renderRight = () => (
    <Pressable
      onPress={() => { ref.current?.close(); onDelete(item); }}
      style={styles.deleteAction}
      accessibilityRole="button"
      accessibilityLabel={t('history.delete')}
    >
      <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
      <AppText variant="caption" color="#FFFFFF">{t('history.delete')}</AppText>
    </Pressable>
  );

  return (
    <ReanimatedSwipeable ref={ref} renderRightActions={renderRight} overshootRight={false} friction={2}>
      <View style={[styles.row, isUrdu && styles.rowUrdu]}>
        <CategoryIcon category={item.category} />
        <View style={styles.texts}>
          <AppText variant="bodyMedium" numberOfLines={1}>{title}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>{caption}</AppText>
        </View>
        <AmountText amount={item.amount} type={item.type} />
      </View>
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
    borderBottomColor: colors.border,
  },
  rowUrdu: { flexDirection: 'row-reverse' },
  texts: { flex: 1, marginHorizontal: 12 },
  deleteAction: {
    width: 88,
    minHeight: sizes.touch,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
