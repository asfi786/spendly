import type { CategoryDef } from '../types';

/** Expense categories — fixed defaults with brand-distinct chart colors. */
export const EXPENSE_CATEGORIES: CategoryDef[] = [
  { name: 'Food', icon: 'UtensilsCrossed', color: '#10b981' },
  { name: 'Transport', icon: 'CarFront', color: '#3b82f6' },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#8b5cf6' },
  { name: 'Bills', icon: 'ReceiptText', color: '#f59e0b' },
  { name: 'Entertainment', icon: 'Clapperboard', color: '#ec4899' },
  { name: 'Health', icon: 'HeartPulse', color: '#ef4444' },
  { name: 'Education', icon: 'GraduationCap', color: '#06b6d4' },
  { name: 'Travel', icon: 'Plane', color: '#14b8a6' },
  { name: 'Other', icon: 'Shapes', color: '#64748b' },
];

/** Income categories. */
export const INCOME_CATEGORIES: CategoryDef[] = [
  { name: 'Salary', icon: 'Briefcase', color: '#10b981' },
  { name: 'Freelance', icon: 'Laptop', color: '#3b82f6' },
  { name: 'Business', icon: 'Store', color: '#8b5cf6' },
  { name: 'Investment', icon: 'TrendingUp', color: '#f59e0b' },
  { name: 'Gift', icon: 'Gift', color: '#ec4899' },
  { name: 'Other', icon: 'Shapes', color: '#64748b' },
];

export const PAYMENT_METHODS = ['Cash', 'Bank', 'Debit Card', 'Credit Card', 'Mobile Wallet', 'Other'] as const;

export function categoryColor(category: string, type: 'expense' | 'income'): string {
  const list = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  return list.find((c) => c.name === category)?.color ?? '#64748b';
}

export function categoryIcon(category: string, type: 'expense' | 'income'): string {
  const list = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  return list.find((c) => c.name === category)?.icon ?? 'Shapes';
}
