// All colors, fonts, spacing and shapes come from DESIGN.md. Change them here only.
import { MD3LightTheme, configureFonts } from 'react-native-paper';

// Section 2: colors
export const colors = {
  primary: '#0B8A5F',
  primaryDark: '#075E42',
  primaryLight: '#E6F6EF',
  accent: '#F5B301',
  danger: '#E5484D',
  dangerLight: '#FDECEC',
  warning: '#F59E0B',
  warningLight: '#FEF5E7',
  info: '#2563EB',
  background: '#F6F8F7',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
};

export const categoryColors = {
  Food: '#F97316',
  Transport: '#3B82F6',
  Bills: '#EAB308',
  Shopping: '#EC4899',
  Health: '#EF4444',
  Education: '#8B5CF6',
  Mobile: '#06B6D4',
  Family: '#F43F5E',
  Rent: '#64748B',
  Other: '#94A3B8',
  Income: '#0B8A5F',
};

export const paymentColors = {
  Cash: '#16A34A',
  JazzCash: '#D7263D',
  Easypaisa: '#1BA85C',
  'Bank card': '#2563EB',
};

// Section 4: spacing and shape
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const screenPadding = 16;
export const cardGap = 12;
export const radius = { card: 16, input: 12, button: 12, pill: 999 };
export const sizes = { button: 52, touch: 44, tabBar: 64, addButton: 56 };

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

// React Native Paper (Material 3) theme. Light only (principle 8).
export function getPaperTheme(lang) {
  const family = fonts[lang === 'ur' ? 'ur' : 'en'];
  return {
    ...MD3LightTheme,
    dark: false,
    roundness: radius.input,
    colors: {
      ...MD3LightTheme.colors,
      primary: colors.primary,
      onPrimary: '#FFFFFF',
      primaryContainer: colors.primaryLight,
      onPrimaryContainer: colors.primaryDark,
      secondary: colors.accent,
      error: colors.danger,
      errorContainer: colors.dangerLight,
      background: colors.background,
      onBackground: colors.text,
      surface: colors.surface,
      onSurface: colors.text,
      onSurfaceVariant: colors.textSecondary,
      outline: colors.border,
      // Extra tokens so screens can write theme.colors.warning etc.
      primaryDark: colors.primaryDark,
      primaryLight: colors.primaryLight,
      accent: colors.accent,
      danger: colors.danger,
      dangerLight: colors.dangerLight,
      warning: colors.warning,
      warningLight: colors.warningLight,
      info: colors.info,
      text: colors.text,
      textSecondary: colors.textSecondary,
      border: colors.border,
    },
    fonts: configureFonts({ config: { fontFamily: family.regular } }),
  };
}
