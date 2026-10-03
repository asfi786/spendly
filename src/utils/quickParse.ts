import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/categories';
import { toISODate } from './format';

export interface ParsedQuickTx {
  amount: number | null;
  title: string;
  category: string;
  type: 'expense' | 'income';
  date: string; // yyyy-MM-dd
  paymentMethod: string;
  tokens: string[]; // leftover words used for the title
}

const INCOME_HINTS = ['salary', 'income', 'received', 'got paid', 'paycheck', 'wage', 'earning', 'freelance pay'];
const EXPENSE_HINTS = ['spent', 'paid', 'expense', 'bought', 'purchase'];

/** keyword -> category name */
const CATEGORY_KEYWORDS: [string, string][] = [
  // expense
  ['lunch', 'Food'], ['dinner', 'Food'], ['breakfast', 'Food'], ['food', 'Food'],
  ['coffee', 'Food'], ['tea', 'Food'], ['restaurant', 'Food'], ['pizza', 'Food'],
  ['burger', 'Food'], ['groceries', 'Food'], ['grocery', 'Food'], ['snack', 'Food'],
  ['chai', 'Food'], ['biryani', 'Food'], ['meal', 'Food'], ['eat', 'Food'],
  ['taxi', 'Transport'], ['uber', 'Transport'], ['careem', 'Transport'], ['petrol', 'Transport'],
  ['fuel', 'Transport'], ['diesel', 'Transport'], ['bus', 'Transport'], ['rickshaw', 'Transport'],
  ['transport', 'Transport'], ['parking', 'Transport'], ['toll', 'Transport'], ['metro', 'Transport'],
  ['shopping', 'Shopping'], ['clothes', 'Shopping'], ['shirt', 'Shopping'], ['shoes', 'Shopping'],
  ['amazon', 'Shopping'], ['daraz', 'Shopping'], ['mall', 'Shopping'], ['gift shop', 'Shopping'],
  ['bill', 'Bills'], ['bills', 'Bills'], ['electricity', 'Bills'], ['gas bill', 'Bills'],
  ['water', 'Bills'], ['internet', 'Bills'], ['wifi', 'Bills'], ['phone bill', 'Bills'],
  ['rent', 'Bills'], ['mobile recharge', 'Bills'], ['recharge', 'Bills'], ['utility', 'Bills'],
  ['movie', 'Entertainment'], ['cinema', 'Entertainment'], ['netflix', 'Entertainment'],
  ['game', 'Entertainment'], ['concert', 'Entertainment'], ['entertainment', 'Entertainment'],
  ['spotify', 'Entertainment'],
  ['doctor', 'Health'], ['medicine', 'Health'], ['pharmacy', 'Health'], ['hospital', 'Health'],
  ['health', 'Health'], ['gym', 'Health'], ['clinic', 'Health'],
  ['school', 'Education'], ['college', 'Education'], ['university', 'Education'], ['course', 'Education'],
  ['book', 'Education'], ['books', 'Education'], ['tuition', 'Education'], ['fee', 'Education'],
  ['education', 'Education'], ['exam', 'Education'],
  ['flight', 'Travel'], ['hotel', 'Travel'], ['trip', 'Travel'], ['travel', 'Travel'],
  ['vacation', 'Travel'],
  // income
  ['salary', 'Salary'], ['paycheck', 'Salary'], ['wage', 'Salary'],
  ['freelance', 'Freelance'], ['client', 'Freelance'], ['project pay', 'Freelance'],
  ['business', 'Business'], ['shop income', 'Business'], ['sale', 'Business'],
  ['investment', 'Investment'], ['dividend', 'Investment'], ['interest', 'Investment'],
  ['gift received', 'Gift'],
];

const VALID_CATEGORIES = new Set([
  ...EXPENSE_CATEGORIES.map((c) => c.name.toLowerCase()),
  ...INCOME_CATEGORIES.map((c) => c.name.toLowerCase()),
]);

function parseAmountToken(tok: string): number | null {
  const t = tok.toLowerCase().replace(/,/g, '').replace(/^(rs\.?|pkr|\$|€|£)/, '');
  const kMatch = t.match(/^(\d+(?:\.\d+)?)k$/);
  if (kMatch) {
    const v = Number(kMatch[1]) * 1000;
    return Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : null;
  }
  if (/^\d+(?:\.\d{1,2})?$/.test(t)) {
    const v = Number(t);
    return Number.isFinite(v) && v > 0 && v < 1_000_000_000 ? Math.round(v * 100) / 100 : null;
  }
  return null;
}

/**
 * Parse free text like "850 lunch food", "coffee 300 yesterday", "5000 salary"
 * into a transaction draft. Never throws; missing pieces stay null/empty.
 */
export function parseQuickAdd(raw: string): ParsedQuickTx {
  const today = new Date();
  const input = raw.trim();
  const lower = input.toLowerCase();

  let type: 'expense' | 'income' = 'expense';
  if (INCOME_HINTS.some((h) => lower.includes(h))) type = 'income';

  let date = toISODate(today);
  let dateWord: string | null = null;
  if (/\byesterday\b/.test(lower)) {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    date = toISODate(d);
    dateWord = 'yesterday';
  } else if (/\btoday\b/.test(lower)) {
    dateWord = 'today';
  }

  // category: direct name match first, then keyword match
  let category = '';
  const words = lower.split(/\s+/);
  for (const w of words) {
    if (VALID_CATEGORIES.has(w)) {
      category = w.charAt(0).toUpperCase() + w.slice(1);
      break;
    }
  }
  if (!category) {
    for (const [kw, cat] of CATEGORY_KEYWORDS) {
      if (lower.includes(kw)) {
        // income keywords only apply to income type and vice versa
        const isIncomeCat = INCOME_CATEGORIES.some((c) => c.name === cat);
        if (isIncomeCat === (type === 'income') || cat === 'Gift') {
          category = cat;
          break;
        }
      }
    }
  }
  if (!category) category = type === 'income' ? 'Other' : 'Other';

  // amount: first amount-like token
  let amount: number | null = null;
  let amountToken = '';
  const tokens = input.split(/\s+/).filter(Boolean);
  for (const tok of tokens) {
    const v = parseAmountToken(tok);
    if (v !== null) {
      amount = v;
      amountToken = tok;
      break;
    }
  }

  // title: leftover words minus amount/category/type/date words
  const skip = new Set<string>();
  if (amountToken) skip.add(amountToken.toLowerCase());
  if (dateWord) skip.add(dateWord);
  const catLower = category.toLowerCase();
  const leftovers = tokens.filter((tok) => {
    const l = tok.toLowerCase();
    if (skip.has(l)) return false;
    if (l === catLower) return false;
    if (INCOME_HINTS.includes(l) || EXPENSE_HINTS.includes(l)) return false;
    return true;
  });
  // Capitalize first letter of each word for a tidy title
  const title = leftovers
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());

  return {
    amount,
    title: title || (amount !== null ? category : ''),
    category,
    type,
    date,
    paymentMethod: 'Cash',
    tokens: leftovers,
  };
}
