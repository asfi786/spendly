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
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  month: string; // yyyy-MM
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

export interface AppState {
  onboarded: boolean;
  user: UserProfile;
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  notifications: NotificationPrefs;
  demoData: boolean;
  selectedMonth: string; // yyyy-MM
}

export interface CategoryDef {
  name: string;
  icon: string; // lucide icon key used by CategoryIcon
  color: string;
}
