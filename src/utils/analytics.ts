import type { CurrencyCode, Transaction } from '../types';
import { monthRange, parseISODate, shiftMonth, formatMoney } from './format';

/* ---------- Basic filters ---------- */

export function txInMonth(tx: Transaction, month: string): boolean {
  return tx.date.slice(0, 7) === month;
}

export function sumByType(txs: Transaction[], type: 'expense' | 'income'): number {
  return txs.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);
}

export interface CategoryTotal {
  category: string;
  amount: number;
  count: number;
  pct: number;
}

/** Expense totals per category, sorted desc, with % share. */
export function categoryTotals(txs: Transaction[], type: 'expense' | 'income' = 'expense'): CategoryTotal[] {
  const map = new Map<string, { amount: number; count: number }>();
  for (const t of txs) {
    if (t.type !== type) continue;
    const e = map.get(t.category) ?? { amount: 0, count: 0 };
    e.amount += t.amount;
    e.count += 1;
    map.set(t.category, e);
  }
  const total = [...map.values()].reduce((s, e) => s + e.amount, 0);
  return [...map.entries()]
    .map(([category, e]) => ({ category, amount: e.amount, count: e.count, pct: total > 0 ? (e.amount / total) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

/* ---------- Time series ---------- */

export interface DayPoint {
  key: string; // yyyy-MM-dd
  label: string;
  income: number;
  expenses: number;
  balance: number; // cumulative net up to this day
}

export function dailySeries(txs: Transaction[], days: number): DayPoint[] {
  const out: DayPoint[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayTxs = txs.filter((t) => t.date === key);
    out.push({
      key,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      income: sumByType(dayTxs, 'income'),
      expenses: sumByType(dayTxs, 'expense'),
      balance: 0,
    });
  }
  // cumulative balance trend
  let run = 0;
  for (const p of out) {
    run += p.income - p.expenses;
    p.balance = run;
  }
  return out;
}

export interface MonthPoint {
  key: string; // yyyy-MM
  label: string;
  income: number;
  expenses: number;
  savings: number;
}

export function monthlySeries(txs: Transaction[], months: number): MonthPoint[] {
  const now = new Date();
  const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const keys = monthRange(shiftMonth(cur, -(months - 1)), cur);
  return keys.map((key) => {
    const mtx = txs.filter((t) => txInMonth(t, key));
    const income = sumByType(mtx, 'income');
    const expenses = sumByType(mtx, 'expense');
    return {
      key,
      label: new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1).toLocaleDateString('en-US', {
        month: 'short',
      }),
      income,
      expenses,
      savings: income - expenses,
    };
  });
}

/* ---------- Insights (factual only) ---------- */

export interface Insight {
  id: string;
  icon: 'trend-up' | 'trend-down' | 'pie' | 'wallet' | 'target' | 'calendar';
  title: string;
  body: string;
  tone: 'good' | 'warn' | 'neutral';
}

export function buildInsights(txs: Transaction[], month: string, currency: CurrencyCode): Insight[] {
  const insights: Insight[] = [];
  const cur = txs.filter((t) => txInMonth(t, month));
  const prev = txs.filter((t) => txInMonth(t, shiftMonth(month, -1)));

  const curExp = sumByType(cur, 'expense');
  const prevExp = sumByType(prev, 'expense');
  const curInc = sumByType(cur, 'income');

  if (curExp > 0) {
    const cats = categoryTotals(cur, 'expense');
    const top = cats[0];
    if (top) {
      insights.push({
        id: 'top-cat',
        icon: 'pie',
        title: `${top.category} is your biggest expense`,
        body: `${top.category} accounts for ${top.pct.toFixed(0)}% of your total spending this month.`,
        tone: 'neutral',
      });
    }
    // biggest month-over-month category change
    const prevMap = new Map(categoryTotals(prev, 'expense').map((c) => [c.category, c.amount]));
    let best: { category: string; change: number } | null = null;
    for (const c of cats) {
      const p = prevMap.get(c.category) ?? 0;
      if (p > 0 && c.amount > p) {
        const change = ((c.amount - p) / p) * 100;
        if (!best || change > best.change) best = { category: c.category, change };
      }
    }
    if (best && best.change >= 5) {
      insights.push({
        id: 'cat-rise',
        icon: 'trend-up',
        title: `${best.category} spending is up`,
        body: `You spent ${best.change.toFixed(0)}% more on ${best.category} this month than last month.`,
        tone: 'warn',
      });
    }
    // overall trend
    if (prevExp > 0 && curExp !== prevExp) {
      const ch = ((curExp - prevExp) / prevExp) * 100;
      insights.push({
        id: 'overall',
        icon: ch > 0 ? 'trend-up' : 'trend-down',
        title: ch > 0 ? 'Spending increased' : 'Spending decreased',
        body:
          ch > 0
            ? `Total spending is ${ch.toFixed(0)}% higher than last month.`
            : `Total spending is ${Math.abs(ch).toFixed(0)}% lower than last month. Nice control.`,
        tone: ch > 0 ? 'warn' : 'good',
      });
    }
    // daily average
    const daysElapsed = Math.max(
      1,
      cur.length
        ? new Set(cur.map((t) => t.date)).size
        : 1,
    );
    const avg = curExp / daysElapsed;
    insights.push({
      id: 'daily-avg',
      icon: 'calendar',
      title: 'Daily average spend',
      body: `You are spending about ${formatMoney(avg, currency)} per active day this month.`,
      tone: 'neutral',
    });
    // biggest single expense
    const biggest = cur.filter((t) => t.type === 'expense').sort((a, b) => b.amount - a.amount)[0];
    if (biggest) {
      insights.push({
        id: 'biggest',
        icon: 'wallet',
        title: 'Largest single expense',
        body: `Your biggest expense this month was "${biggest.title}" (${biggest.category}).`,
        tone: 'neutral',
      });
    }
  }

  if (curInc > 0 && curExp > 0) {
    const rate = ((curInc - curExp) / curInc) * 100;
    insights.push({
      id: 'savings-rate',
      icon: 'target',
      title: 'Savings rate',
      body:
        rate >= 0
          ? `You saved ${rate.toFixed(0)}% of your income this month.`
          : `You spent ${Math.abs(rate).toFixed(0)}% more than you earned this month.`,
      tone: rate >= 20 ? 'good' : rate >= 0 ? 'neutral' : 'warn',
    });
  }

  return insights;
}

/* ---------- Calendar ---------- */

export interface DayAggregate {
  date: string;
  income: number;
  expenses: number;
  count: number;
}

export function aggregateByDay(txs: Transaction[]): Map<string, DayAggregate> {
  const map = new Map<string, DayAggregate>();
  for (const t of txs) {
    const e = map.get(t.date) ?? { date: t.date, income: 0, expenses: 0, count: 0 };
    if (t.type === 'income') e.income += t.amount;
    else e.expenses += t.amount;
    e.count += 1;
    map.set(t.date, e);
  }
  return map;
}

/* ---------- Search ---------- */

export function searchTransactions(txs: Transaction[], q: string): Transaction[] {
  const query = q.trim().toLowerCase();
  if (!query) return txs;
  return txs.filter(
    (t) =>
      t.title.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query) ||
      t.notes.toLowerCase().includes(query) ||
      t.paymentMethod.toLowerCase().includes(query),
  );
}

/* ---------- CSV / JSON ---------- */

const CSV_HEADERS = ['id', 'type', 'title', 'amount', 'category', 'date', 'paymentMethod', 'notes', 'recurring', 'createdAt'] as const;

function csvCell(v: string | number | boolean): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function transactionsToCSV(txs: Transaction[]): string {
  const lines = [CSV_HEADERS.join(',')];
  for (const t of txs) {
    lines.push(
      [t.id, t.type, t.title, t.amount, t.category, t.date, t.paymentMethod, t.notes, t.recurring, t.createdAt]
        .map(csvCell)
        .join(','),
    );
  }
  return lines.join('\n');
}

function parseCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

/** Returns parsed transactions or throws a friendly Error. */
export function csvToTransactions(csv: string): Transaction[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error('The CSV file has no transaction rows.');
  const headers = parseCSVLine(lines[0]).map((h) => h.trim());
  const required = ['type', 'title', 'amount', 'category', 'date'];
  for (const r of required) {
    if (!headers.includes(r)) throw new Error(`CSV is missing the required column: ${r}`);
  }
  const idx = (name: string) => headers.indexOf(name);
  const out: Transaction[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    const type = cells[idx('type')]?.trim().toLowerCase();
    const title = cells[idx('title')]?.trim() ?? '';
    const amount = Number(cells[idx('amount')]);
    const category = cells[idx('category')]?.trim() ?? 'Other';
    const date = cells[idx('date')]?.trim() ?? '';
    if (type !== 'expense' && type !== 'income') throw new Error(`Row ${i + 1}: type must be "expense" or "income".`);
    if (!title) throw new Error(`Row ${i + 1}: title is required.`);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error(`Row ${i + 1}: amount must be a positive number.`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parseISODate(date).getTime()))
      throw new Error(`Row ${i + 1}: date must be yyyy-MM-dd.`);
    out.push({
      id: cells[idx('id')]?.trim() || `imp_${Date.now().toString(36)}_${i}`,
      type,
      amount,
      title,
      category,
      date,
      paymentMethod: cells[idx('paymentMethod')]?.trim() || 'Cash',
      notes: cells[idx('notes')]?.trim() || '',
      receipt: null,
      recurring: ['true', '1', 'yes'].includes((cells[idx('recurring')] ?? '').trim().toLowerCase()),
      createdAt: cells[idx('createdAt')]?.trim() || new Date().toISOString(),
    });
  }
  return out;
}
