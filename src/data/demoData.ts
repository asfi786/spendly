import type { Bill, Budget, Goal, Transaction } from '../types';
import { currentMonthKey, shiftMonth, toISODate, uid } from '../utils/format';

/**
 * Realistic PKR demo data across the last 3 months.
 * Deterministic — same every load.
 */

interface DemoTx {
  type: 'expense' | 'income';
  amount: number;
  title: string;
  category: string;
  date: string;
  paymentMethod: string;
  notes?: string;
  recurring?: boolean;
}

type DemoRow = Omit<DemoTx, 'date'> & { day: number };

function monthTx(monthOffset: number, rows: DemoRow[]): DemoTx[] {
  const month = shiftMonth(currentMonthKey(), monthOffset);
  return rows.map(({ day, ...rest }) => ({
    ...rest,
    date: `${month}-${String(day).padStart(2, '0')}`,
  }));
}

const BASE: DemoRow[] = [
  // ---- Income ----
  { type: 'income', amount: 120000, title: 'Monthly Salary', category: 'Salary', day: 1, paymentMethod: 'Bank', notes: 'Software house payroll', recurring: true },
  { type: 'income', amount: 45000, title: 'Freelance UI Project', category: 'Freelance', day: 14, paymentMethod: 'Bank', notes: 'Landing page design client' },
  // ---- Housing & bills ----
  { type: 'expense', amount: 35000, title: 'House Rent', category: 'Bills', day: 5, paymentMethod: 'Bank', notes: 'Monthly house rent', recurring: true },
  { type: 'expense', amount: 4850, title: 'Electricity Bill', category: 'Bills', day: 12, paymentMethod: 'Mobile Wallet', recurring: true },
  { type: 'expense', amount: 3500, title: 'Internet Package', category: 'Bills', day: 8, paymentMethod: 'Debit Card', recurring: true },
  { type: 'expense', amount: 1200, title: 'Water Bill', category: 'Bills', day: 15, paymentMethod: 'Cash' },
  // ---- Food ----
  { type: 'expense', amount: 8200, title: 'Monthly Groceries', category: 'Food', day: 3, paymentMethod: 'Debit Card', notes: 'Metro Cash & Carry' },
  { type: 'expense', amount: 6400, title: 'Grocery Top-up', category: 'Food', day: 17, paymentMethod: 'Cash', notes: 'Local sabzi mandi + dairy' },
  { type: 'expense', amount: 1850, title: 'Dinner with Friends', category: 'Food', day: 10, paymentMethod: 'Credit Card', notes: 'Food street' },
  { type: 'expense', amount: 950, title: 'Lunch at Office', category: 'Food', day: 22, paymentMethod: 'Cash' },
  { type: 'expense', amount: 2400, title: 'Bakery & Snacks', category: 'Food', day: 26, paymentMethod: 'Mobile Wallet' },
  // ---- Transport ----
  { type: 'expense', amount: 3200, title: 'Petrol', category: 'Transport', day: 6, paymentMethod: 'Cash', notes: 'Bike fuel', recurring: true },
  { type: 'expense', amount: 3200, title: 'Petrol', category: 'Transport', day: 20, paymentMethod: 'Cash', notes: 'Bike fuel', recurring: true },
  { type: 'expense', amount: 1800, title: 'Careem Rides', category: 'Transport', day: 13, paymentMethod: 'Mobile Wallet', notes: 'Late office nights' },
  // ---- Shopping ----
  { type: 'expense', amount: 7500, title: 'Winter Jacket', category: 'Shopping', day: 9, paymentMethod: 'Debit Card' },
  { type: 'expense', amount: 2200, title: 'Phone Accessories', category: 'Shopping', day: 24, paymentMethod: 'Mobile Wallet', notes: 'Charger + case' },
  // ---- Health ----
  { type: 'expense', amount: 1600, title: 'Pharmacy', category: 'Health', day: 11, paymentMethod: 'Cash', notes: 'Vitamins' },
  // ---- Entertainment ----
  { type: 'expense', amount: 1500, title: 'Cinema Tickets', category: 'Entertainment', day: 19, paymentMethod: 'Credit Card' },
  { type: 'expense', amount: 999, title: 'Netflix Subscription', category: 'Entertainment', day: 2, paymentMethod: 'Debit Card', recurring: true },
  // ---- Education ----
  { type: 'expense', amount: 5000, title: 'Online Course', category: 'Education', day: 16, paymentMethod: 'Debit Card', notes: 'Advanced React course' },
  { type: 'expense', amount: 1200, title: 'Books', category: 'Education', day: 21, paymentMethod: 'Cash' },
];

export function buildDemoTransactions(): Transaction[] {
  const now = new Date();
  const currentDay = now.getDate();
  const rows: DemoTx[] = [];
  // Two full months + current month (only days up to today)
  for (const offset of [-2, -1]) rows.push(...monthTx(offset, BASE));
  rows.push(...monthTx(0, BASE.filter((r) => r.day <= currentDay)));
  return rows.map((r) => ({
    id: uid('tx'),
    type: r.type,
    amount: r.amount,
    title: r.title,
    category: r.category,
    date: r.date,
    paymentMethod: r.paymentMethod,
    notes: r.notes ?? '',
    receipt: null,
    recurring: r.recurring ?? false,
    createdAt: new Date(`${r.date}T10:00:00`).toISOString(),
  }));
}

export function buildDemoBudgets(): Budget[] {
  const month = currentMonthKey();
  const year = month.slice(0, 4);
  return [
    { id: uid('bd'), category: 'Food', amount: 20000, month, period: 'monthly', year, createdAt: new Date().toISOString() },
    { id: uid('bd'), category: 'Transport', amount: 10000, month, period: 'monthly', year, createdAt: new Date().toISOString() },
    { id: uid('bd'), category: 'Entertainment', amount: 8000, month, period: 'monthly', year, createdAt: new Date().toISOString() },
    { id: uid('bd'), category: 'Travel', amount: 120000, month, period: 'yearly', year, createdAt: new Date().toISOString() },
  ];
}

export function buildDemoBills(): Bill[] {
  const now = new Date();
  const iso = (d: Date) => toISODate(d);
  const mk = (title: string, amount: number, category: string, freq: Bill['frequency'], daysFromNow: number, notes = '') => {
    const due = new Date(now);
    due.setDate(now.getDate() + daysFromNow);
    return {
      id: uid('bill'),
      title,
      amount,
      category,
      frequency: freq,
      dayOfMonth: due.getDate(),
      nextDue: iso(due),
      notes,
      createdAt: new Date().toISOString(),
      history: [],
    } as Bill;
  };
  return [
    mk('House Rent', 35000, 'Bills', 'monthly', 6, 'Pay before the 10th'),
    mk('Electricity Bill', 4850, 'Bills', 'monthly', 3),
    mk('Internet Package', 3500, 'Bills', 'monthly', 12),
    mk('Netflix Subscription', 999, 'Entertainment', 'monthly', 20),
  ];
}

export function buildDemoGoals(): Goal[] {
  const now = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const c1 = new Date(now); c1.setDate(now.getDate() - 40);
  const c2 = new Date(now); c2.setDate(now.getDate() - 18);
  const c3 = new Date(now); c3.setDate(now.getDate() - 5);
  const contributions = [
    { id: uid('gc'), amount: 30000, date: iso(c1) },
    { id: uid('gc'), amount: 25000, date: iso(c2) },
    { id: uid('gc'), amount: 20000, date: iso(c3) },
  ];
  return [
    {
      id: uid('goal'),
      name: 'Emergency Fund',
      targetAmount: 500000,
      currentAmount: 75000,
      targetDate: '2027-06-30',
      createdAt: c1.toISOString(),
      contributions,
    },
  ];
}
