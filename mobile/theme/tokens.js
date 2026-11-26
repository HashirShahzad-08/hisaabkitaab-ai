// "Charcoal + Blue" design tokens (DESIGN.md section 2). Every color, radius and spacing value
// in the app comes from here. There is no green anywhere.

export const palette = {
  // surfaces
  background: '#0E0F12',
  card: '#17181C',
  cardRaised: '#1E2026',
  border: '#26282E',
  divider: '#202228',
  tabBar: '#121316',

  // text
  textPrimary: '#F3F4F6',
  textSecondary: '#C9CCD3',
  textMuted: '#9A9DA6',
  white: '#FFFFFF',

  // accent
  blue: '#3B82F6',
  blueLight: '#60A5FA',
  blueHover: '#93C5FD',
  blueDeep: '#1E3A8A',
  blueTint: '#16233D', // soft blue background: selected chips, icon circles

  // hero card (Home balance)
  heroStart: '#2563EB',
  heroEnd: '#1E3A8A',
  heroBorder: '#3B6FE0',
  heroText: '#FFFFFF',
  heroSubtle: '#C7D7FE',
  heroLine: 'rgba(255,255,255,0.22)',

  // warning: budgets and "check" verdicts
  warningCard: '#1F1A12',
  warningBorder: '#4A3A1A',
  warningIcon: '#E9B949',
  warningTitle: '#F5E6C4',
  warningBody: '#BFA97A',

  // danger: scam alerts and "likely overbilled"
  danger: '#EF4444',
  dangerCard: '#2A1416',
  dangerBorder: '#5C2326',
  dangerText: '#FECACA',

  // overlays
  scrim: 'rgba(0,0,0,0.6)',
  shimmer: 'rgba(255,255,255,0.08)',
  shimmerClear: 'rgba(255,255,255,0)',
};

// Health Score bands
export const healthColors = {
  excellent: '#FBBF24',
  good: '#60A5FA',
  okay: '#F59E0B',
  care: '#F87171',
};

// Categories: blue tints, neutral greys and amber only
export const categoryColors = {
  Food: '#E9B949',
  Transport: '#60A5FA',
  Bills: '#FBBF24',
  Shopping: '#93C5FD',
  Health: '#3B82F6',
  Education: '#BFDBFE',
  Mobile: '#5B8DEF',
  Family: '#D9A441',
  Rent: '#C9CCD3',
  Other: '#9A9DA6',
  Income: '#60A5FA',
};

export const paymentColors = {
  Cash: '#9A9DA6',
  JazzCash: '#E9B949',
  Easypaisa: '#60A5FA',
  'Bank card': '#93C5FD',
};

// 8pt grid (4 is the half step)
export const spacing = { xs: 4, sm: 8, md: 16, lg: 16, xl: 24, xxl: 32 };
export const screenPadding = 16;
export const cardGap = 16;
export const radius = { input: 12, button: 12, card: 18, hero: 24, pill: 999 };
export const sizes = { button: 52, touch: 44, tabBar: 64, addButton: 52 };
