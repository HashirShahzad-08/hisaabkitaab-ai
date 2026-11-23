// Categories and payment types, with the icons from DESIGN.md section 2.
// The English names are what gets saved in Firestore (and match the backend).
import { categoryColors, paymentColors } from '../theme';

export const CATEGORY_ICONS = {
  Food: 'fast-food',
  Transport: 'car',
  Bills: 'flash',
  Shopping: 'bag-handle',
  Health: 'medkit',
  Education: 'school',
  Mobile: 'phone-portrait',
  Family: 'gift',
  Rent: 'home',
  Other: 'ellipsis-horizontal',
  Income: 'wallet',
};

export const EXPENSE_CATEGORIES = [
  'Food', 'Transport', 'Bills', 'Shopping', 'Health',
  'Education', 'Mobile', 'Family', 'Rent', 'Other',
];
export const INCOME_CATEGORIES = ['Income', 'Family', 'Other'];
export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, 'Income'];

export const PAYMENT_TYPES = ['Cash', 'JazzCash', 'Easypaisa', 'Bank card'];

export const categoryColor = (name) => categoryColors[name] || categoryColors.Other;
export const categoryIcon = (name) => CATEGORY_ICONS[name] || CATEGORY_ICONS.Other;
export const paymentColor = (name) => paymentColors[name] || paymentColors.Cash;

// Translation keys (see i18n files)
export const categoryKey = (name) => `categories.${CATEGORY_ICONS[name] ? name : 'Other'}`;
export const paymentKey = (name) => `payments.${name === 'Bank card' ? 'BankCard' : name}`;
