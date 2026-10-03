import type { Bill, BillFrequency } from '../types';
import { parseISODate, toISODate } from './format';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Advance a bill's due date by one period.
 * Returns null when the bill is complete (frequency 'once').
 */
export function advanceBillDue(fromISO: string, freq: BillFrequency, dayOfMonth: number): string | null {
  if (freq === 'once') return null;
  const [y, m, d] = fromISO.split('-').map(Number);
  if (freq === 'weekly') {
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
    dt.setDate(dt.getDate() + 7);
    return toISODate(dt);
  }
  if (freq === 'yearly') {
    const day = Math.min(dayOfMonth || d || 1, daysInMonth(y + 1, m));
    return `${y + 1}-${pad(m)}-${pad(day)}`;
  }
  // monthly
  let ny = y;
  let nm = m + 1;
  if (nm > 12) {
    nm = 1;
    ny += 1;
  }
  const day = Math.min(dayOfMonth || d || 1, daysInMonth(ny, nm));
  return `${ny}-${pad(nm)}-${pad(day)}`;
}

/** Days from today until the due date (negative = overdue). */
export function daysUntilDue(nextDue: string | null): number | null {
  if (!nextDue) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((parseISODate(nextDue).getTime() - today.getTime()) / 86400000);
}

export function dueLabel(nextDue: string | null): { text: string; tone: 'overdue' | 'soon' | 'ok' } {
  const d = daysUntilDue(nextDue);
  if (d === null) return { text: 'Completed', tone: 'ok' };
  if (d < 0) return { text: `Overdue by ${Math.abs(d)} ${Math.abs(d) === 1 ? 'day' : 'days'}`, tone: 'overdue' };
  if (d === 0) return { text: 'Due today', tone: 'soon' };
  if (d === 1) return { text: 'Due tomorrow', tone: 'soon' };
  if (d <= 7) return { text: `Due in ${d} days`, tone: 'soon' };
  return { text: `Due in ${d} days`, tone: 'ok' };
}

/** Active (not completed) bills sorted by due date ascending. */
export function upcomingBills(bills: Bill[]): Bill[] {
  return bills
    .filter((b) => b.nextDue !== null)
    .sort((a, b) => (a.nextDue! < b.nextDue! ? -1 : 1));
}

export function isBillCompleted(bill: Bill): boolean {
  return bill.nextDue === null;
}

const FREQ_LABEL: Record<BillFrequency, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  once: 'One-time',
};

export function frequencyLabel(f: BillFrequency): string {
  return FREQ_LABEL[f];
}
