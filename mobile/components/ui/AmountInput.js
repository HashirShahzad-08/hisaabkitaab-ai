// A big "Rs 1,200" number field in a dark box with a blue border while focused.
// value is the digits string; onChangeText gets the raw text, so each screen keeps its own cleaning rules.
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fonts, radius, spacing } from '../../theme';
import { formatNumber } from '../../utils/format';

export default function AmountInput({ value, onChangeText, size = 34, accessibilityLabel }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.box, focused && styles.focused]}>
      <Text style={styles.unit}>Rs</Text>
      <TextInput
        value={value ? formatNumber(value) : ''}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="0"
        placeholderTextColor={colors.textSecondary}
        keyboardType="number-pad"
        style={[styles.input, { fontSize: size }]}
        selectionColor={colors.primary}
        accessibilityLabel={accessibilityLabel}
        maxLength={13}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    direction: 'ltr', // "Rs" stays before the number in both languages
    gap: spacing.sm,
    minHeight: 72,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
  },
  focused: { borderColor: colors.primary, borderWidth: 2 },
  unit: { fontFamily: fonts.en.semibold, fontSize: 20, color: colors.textSecondary },
  input: { fontFamily: fonts.en.bold, color: colors.text, minWidth: 80, textAlign: 'center', padding: 0 },
});
