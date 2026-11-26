// Money text. English: "Rs 12,500". Urdu: "12,500 روپے". Numbers always use Poppins.
// With type="income" -> light blue "+", type="expense" -> primary text with a minus. Without type: plain.
// fit: shrink to stay on one line (for very large numbers).
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, fonts, getTypography } from '../../theme';
import { formatNumber } from '../../utils/format';

export default function AmountText({ amount, type, variant = 'amount', color, size, fit = false }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'ur' ? 'ur' : 'en';
  const base = getTypography('en')[variant]; // numbers stay in Poppins
  const typo = size ? { ...base, fontSize: size } : base;
  const tint = color || (type === 'income' ? colors.accentLight : colors.text);
  const sign = type === 'income' ? '+' : type === 'expense' ? '−' : !type && amount < 0 ? '−' : '';
  const number = formatNumber(amount);
  const unitStyle = { color: tint, fontFamily: lang === 'ur' ? fonts.ur.medium : typo.fontFamily, fontSize: lang === 'ur' ? typo.fontSize * 0.8 : typo.fontSize };

  return (
    <View style={[styles.row, lang === 'ur' && styles.rowUrdu]}>
      <Text style={[typo, { color: tint }, fit && styles.shrink]} numberOfLines={fit ? 1 : undefined} adjustsFontSizeToFit={fit}>
        {lang === 'en' ? `${sign}Rs ${number}` : `${sign}${number}`}
      </Text>
      {lang === 'ur' ? <Text style={unitStyle}> {t('common.rupees')}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', direction: 'ltr' },
  rowUrdu: { alignItems: 'baseline' },
  shrink: { flexShrink: 1 },
});
