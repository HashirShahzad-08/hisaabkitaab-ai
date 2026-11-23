// Text that picks the right font and size for the current language.
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, getTypography } from '../theme';

export default function AppText({ variant = 'body', color = colors.text, style, children, ...rest }) {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'ur' ? 'ur' : 'en';
  const typo = getTypography(lang)[variant];
  return (
    <Text
      {...rest}
      style={[typo, { color, textAlign: lang === 'ur' ? 'right' : 'left' }, style]}
    >
      {children}
    </Text>
  );
}
