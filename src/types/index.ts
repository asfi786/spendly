export type ThemePref = 'light' | 'dark' | 'system';

export type CurrencyCode = 'PKR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SAR';

export type TxType = 'expense' | 'income';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  currency: CurrencyCode;
  theme: ThemePref;
}

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  title: string;
  category: string;
  date: string; // yyyy-MM-dd
  paymentMethod: string;
  notes: string;
  receipt: string | null; // dataURL
  recurring: boolean;
  createdAt: string; // ISO
  nature?: 'fixed' | 'variable'; // expense only; older data simply lacks it
}

export type BudgetPeriod = 'monthly' | 'yearly';

export interface Budget {
  id: string;
  category: string;
  amount: number;
  month: string; // yyyy-MM (used when period === 'monthly')
  period: BudgetPeriod;
  year: string; // yyyy (used when period === 'yearly')
  createdAt: string;
}

export interface GoalContribution {
  id: string;
  amount: number;
  date: string; // yyyy-MM-dd
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // yyyy-MM-dd
  createdAt: string;
  contributions: GoalContribution[];
}

export interface NotificationPrefs {
  budgetAlerts: boolean;
  dailyReminder: boolean;
}

export type BillFrequency = 'weekly' | 'monthly' | 'yearly' | 'once';

export interface BillPayment {
  id: string;
  paidAt: string; // ISO
  transactionId: string;
  amount: number;
  skipped?: boolean;
}

export interface Bill {
  id: string;
  title: string;
  amount: number;
  category: string;
  frequency: BillFrequency;
  dayOfMonth: number; // 1-28 preferred for monthly/yearly
  nextDue: string | null; // yyyy-MM-dd; null = completed (once bills)
  notes: string;
  createdAt: string; // ISO
  history: BillPayment[];
}

export interface GoogleProfile {
  googleId: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface AppState {
  onboarded: boolean;
  user: UserProfile;
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  bills: Bill[];
  notifications: NotificationPrefs;
  demoData: boolean;
  selectedMonth: string; // yyyy-MM
}

export interface CategoryDef {
  name: string;
  icon: string; // lucide icon key used by CategoryIcon
  color: string;
}
