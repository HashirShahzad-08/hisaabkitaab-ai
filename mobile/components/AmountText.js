// Money text. English: "Rs 12,500". Urdu: "12,500 روپے". Numbers always use Poppins.
// With type="income" -> green "+", type="expense" -> red minus. Without type: plain.
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, fonts, getTypography } from '../theme';
import { formatNumber } from '../utils/format';

export default function AmountText({ amount, type, variant = 'amount', color, size }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'ur' ? 'ur' : 'en';
  const base = getTypography('en')[variant]; // numbers stay in Poppins
  const typo = size ? { ...base, fontSize: size } : base;
  const tint = color || (type === 'income' ? colors.primary : type === 'expense' ? colors.danger : colors.text);
  const sign = type === 'income' ? '+' : type === 'expense' ? '−' : !type && amount < 0 ? '−' : '';
  const number = formatNumber(amount);
  const unitStyle = { color: tint, fontFamily: lang === 'ur' ? fonts.ur.medium : typo.fontFamily, fontSize: lang === 'ur' ? typo.fontSize * 0.8 : typo.fontSize };

  return (
    <View style={[styles.row, lang === 'ur' && styles.rowUrdu]}>
      <Text style={[typo, { color: tint }]}>
        {lang === 'en' ? `${sign}Rs ${number}` : `${sign}${number}`}
      </Text>
      {lang === 'ur' ? <Text style={unitStyle}> {t('common.rupees')}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', direction: 'ltr' },
  rowUrdu: { alignItems: 'baseline' },
});
