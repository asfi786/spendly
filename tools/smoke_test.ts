import { parseQuickAdd } from '../src/utils/quickParse';
import { parseReceiptText } from '../src/utils/receipt';
import { computeGoalStats } from '../src/utils/goals';
import { advanceBillDue, dueLabel } from '../src/utils/bills';
import { buildAdvisorTips } from '../src/utils/advisor';

let pass = 0, fail = 0;
const eq = (name: string, got: any, want: any) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  if (!ok) console.log(`FAIL ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
};

// --- quickParse ---
let p = parseQuickAdd('850 lunch food');
eq('amount', p.amount, 850); eq('category', p.category, 'Food'); eq('type', p.type, 'expense');
p = parseQuickAdd('coffee 300');
eq('amount2', p.amount, 300); eq('title2', p.title, 'Coffee');
p = parseQuickAdd('5000 salary');
eq('income', p.type, 'income'); eq('amount3', p.amount, 5000);
p = parseQuickAdd('paid 2.5k rent yesterday');
eq('k-suffix', p.amount, 2500);
const y = new Date(); y.setDate(y.getDate() - 1);
eq('yesterday', p.date, y.toISOString().slice(0, 10));
p = parseQuickAdd('grocery 1,250');
eq('comma', p.amount, 1250);
p = parseQuickAdd('dinner');
eq('no-amount', p.amount, null);

// --- receipt ---
const r = parseReceiptText('CARREFOUR\nLahore\nTOTAL: Rs 4,850.00\nDate: 12/10/2026\nThank you');
eq('receipt amount', r.amount, 4850);
eq('receipt merchant', r.title, 'CARREFOUR');
eq('receipt date', r.date, '2026-10-12');

// --- goals ---
const g: any = {
  id: 'g1', name: 'Laptop', targetAmount: 120000, currentAmount: 30000,
  targetDate: '2027-04-04', contributions: [
    { id: 'c1', amount: 15000, date: '2026-08-01' },
    { id: 'c2', amount: 15000, date: '2026-09-01' },
  ],
};
const gs = computeGoalStats(g, new Date('2026-10-04'));
console.log('goal stats:', JSON.stringify(gs));
eq('requiredMonthly', gs.requiredMonthly, 15000);
eq('paceStatus', gs.paceStatus, 'behind'); eq('catchUp', Math.round(gs.catchUpMonthly ?? 0), 714);
eq('projectedDate', gs.projectedDate, '2027-04-14');

// --- bills ---
eq('advance monthly', advanceBillDue('2026-10-05', 'monthly', 5), '2026-11-05');
eq('advance once', advanceBillDue('2026-10-05', 'once', 5), null);
const dl = dueLabel('2026-10-07');
console.log('dueLabel:', JSON.stringify(dl));

// --- advisor ---
const tips = buildAdvisorTips({
  transactions: [
    { id: 't1', type: 'expense', amount: 50000, title: 'Rent', category: 'Bills', date: '2026-10-01', paymentMethod: 'Bank', notes: '', receipt: null, recurring: true, createdAt: '', nature: 'fixed' },
    { id: 't2', type: 'expense', amount: 40000, title: 'Food', category: 'Food', date: '2026-10-02', paymentMethod: 'Cash', notes: '', receipt: null, recurring: false, createdAt: '' },
    { id: 't3', type: 'income', amount: 100000, title: 'Salary', category: 'Salary', date: '2026-10-01', paymentMethod: 'Bank', notes: '', receipt: null, recurring: false, createdAt: '' },
    { id: 't4', type: 'expense', amount: 10000, title: 'Food', category: 'Food', date: '2026-09-05', paymentMethod: 'Cash', notes: '', receipt: null, recurring: false, createdAt: '' },
  ] as any,
  budgets: [{ id: 'b1', category: 'Food', amount: 30000, month: '2026-10', period: 'monthly' } as any],
  goals: [], bills: [], month: '2026-10', currency: 'PKR',
});
console.log('tips:', tips.map(t => `[${t.severity}] ${t.title}`).join(' | '));
eq('tips>0', tips.length > 0, true);
eq('budget tip', tips.some(t => t.title.includes('budget exceeded')), true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
