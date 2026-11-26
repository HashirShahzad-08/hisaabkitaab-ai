// The app's text input: dark raised box, 12px radius, blue border while focused.
// Takes every Paper TextInput prop. font: override the language's font (for numbers or SMS text).
import { StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { colors, fonts, radius } from '../../theme';

export default function FormInput({ style, contentStyle, font, ...rest }) {
  const { i18n } = useTranslation();
  const family = font || fonts[i18n.language === 'ur' ? 'ur' : 'en'].regular;
  return (
    <TextInput
      mode="outlined"
      outlineColor={colors.border}
      activeOutlineColor={colors.primary}
      outlineStyle={styles.outline}
      style={[styles.input, style]}
      contentStyle={[{ fontFamily: family }, contentStyle]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: { backgroundColor: colors.surfaceRaised },
  outline: { borderRadius: radius.input },
});
