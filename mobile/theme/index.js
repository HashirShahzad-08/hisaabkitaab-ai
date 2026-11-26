// The app theme, built from theme/tokens.js. Screens import from '../theme'.
import { MD3DarkTheme, configureFonts } from 'react-native-paper';

import { palette, radius } from './tokens';

export {
  palette, healthColors, categoryColors, paymentColors, spacing, screenPadding, cardGap, radius, sizes,
} from './tokens';

// Color names used across the screens, mapped to the tokens
export const colors = {
  primary: palette.blue,
  primaryDark: palette.blueHover, // strong text on a soft blue background
  primaryLight: palette.blueTint,
  accentLight: palette.blueLight, // links, active tab, income amounts
  accent: '#FBBF24', // gold: goals
  danger: palette.danger,
  dangerLight: palette.dangerCard,
  dangerBorder: palette.dangerBorder,
  dangerText: palette.dangerText,
  warning: palette.warningIcon,
  warningLight: palette.warningCard,
  warningBorder: palette.warningBorder,
  warningTitle: palette.warningTitle,
  warningBody: palette.warningBody,
  info: palette.blueLight,
  background: palette.background,
  surface: palette.card,
  surfaceRaised: palette.cardRaised,
  divider: palette.divider,
  tabBar: palette.tabBar,
  text: palette.textPrimary,
  textBody: palette.textSecondary,
  textSecondary: palette.textMuted,
  border: palette.border,
  onPrimary: palette.white,
};

// Section 3: fonts (names come from the expo-google-fonts packages)
export const fonts = {
  en: {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semibold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
  },
  ur: {
    regular: 'NotoNastaliqUrdu_400Regular',
    medium: 'NotoNastaliqUrdu_500Medium',
    semibold: 'NotoNastaliqUrdu_600SemiBold',
    bold: 'NotoNastaliqUrdu_700Bold',
  },
};
// Money amounts and numbers stay in Poppins in both languages.
export const numberFont = fonts.en;

// Section 3: type scale (English sizes; Urdu is 10% smaller with lineHeight 1.9x)
const baseTypography = {
  display: { size: 34, weight: 'bold' },
  h1: { size: 24, weight: 'semibold' },
  h2: { size: 18, weight: 'semibold' },
  body: { size: 15, weight: 'regular' },
  bodyMedium: { size: 15, weight: 'medium' },
  caption: { size: 12, weight: 'regular' },
  amount: { size: 16, weight: 'semibold' },
};

export function getTypography(lang) {
  const isUrdu = lang === 'ur';
  const family = fonts[isUrdu ? 'ur' : 'en'];
  const result = {};
  for (const [name, { size, weight }] of Object.entries(baseTypography)) {
    const fontSize = isUrdu ? Math.round(size * 0.9) : size;
    result[name] = {
      fontFamily: family[weight],
      fontSize,
      ...(isUrdu ? { lineHeight: Math.round(fontSize * 1.9) } : {}),
    };
  }
  return result;
}

// React Native Paper (Material 3) DARK theme: inputs, dialogs, snackbars, switches and menus.
export function getPaperTheme(lang) {
  const family = fonts[lang === 'ur' ? 'ur' : 'en'];
  return {
    ...MD3DarkTheme,
    dark: true,
    roundness: radius.input,
    colors: {
      ...MD3DarkTheme.colors,
      primary: palette.blue,
      onPrimary: palette.white,
      primaryContainer: palette.blueTint,
      onPrimaryContainer: palette.blueHover,
      secondary: palette.blueLight,
      onSecondary: palette.white,
      secondaryContainer: palette.blueTint, // selected chips and segmented buttons
      onSecondaryContainer: palette.textPrimary,
      tertiary: palette.warningIcon,
      error: palette.danger,
      onError: palette.white,
      errorContainer: palette.dangerCard,
      onErrorContainer: palette.dangerText,
      background: palette.background,
      onBackground: palette.textPrimary,
      surface: palette.card,
      onSurface: palette.textPrimary,
      surfaceVariant: palette.cardRaised,
      onSurfaceVariant: palette.textMuted,
      surfaceDisabled: 'rgba(243,244,246,0.12)',
      onSurfaceDisabled: 'rgba(243,244,246,0.38)',
      outline: palette.border,
      outlineVariant: palette.divider,
      inverseSurface: palette.cardRaised, // snackbar
      inverseOnSurface: palette.textPrimary,
      inversePrimary: palette.blueLight,
      backdrop: palette.scrim,
      elevation: {
        level0: 'transparent',
        level1: palette.card,
        level2: palette.cardRaised, // menus
        level3: palette.cardRaised, // dialogs
        level4: palette.cardRaised,
        level5: palette.cardRaised,
      },
      // Extra tokens so screens can write theme.colors.warning etc.
      accent: colors.accent,
      danger: palette.danger,
      dangerLight: palette.dangerCard,
      warning: palette.warningIcon,
      warningLight: palette.warningCard,
      info: palette.blueLight,
      text: palette.textPrimary,
      textSecondary: palette.textMuted,
      border: palette.border,
    },
    fonts: configureFonts({ config: { fontFamily: family.regular } }),
  };
}
