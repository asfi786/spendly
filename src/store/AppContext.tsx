import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import type {
  AppState,
  Bill,
  Budget,
  CurrencyCode,
  Goal,
  GoogleProfile,
  NotificationPrefs,
  ThemePref,
  Transaction,
  TxType,
  UserProfile,
} from '../types';
import { currentMonthKey, formatMoney, formatMoneyCompact, todayISO, uid } from '../utils/format';
import { advanceBillDue } from '../utils/bills';
import { buildDemoBills, buildDemoBudgets, buildDemoGoals, buildDemoTransactions } from '../data/demoData';

/* ================= Storage ================= */

const AUTH_KEY = 'spendly:auth';
const LEGACY_KEY = 'spendly:v1'; // anonymous / pre-Google data

/** Namespaced state key so each Google profile keeps separate data on one browser. */
export function stateKeyFor(googleId: string | null): string {
  return googleId ? `spendly:v1:g:${googleId}` : LEGACY_KEY;
}

function loadAuth(): GoogleProfile | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as GoogleProfile;
    return p && typeof p.googleId === 'string' ? p : null;
  } catch {
    return null;
  }
}

/* ================= State ================= */

function defaultUser(): UserProfile {
  return {
    id: uid('user'),
    name: '',
    email: '',
    avatar: null,
    currency: 'PKR',
    theme: 'system',
  };
}

function defaultState(): AppState {
  return {
    onboarded: false,
    user: defaultUser(),
    transactions: [],
    budgets: [],
    goals: [],
    bills: [],
    notifications: { budgetAlerts: true, dailyReminder: false },
    demoData: false,
    selectedMonth: currentMonthKey(),
  };
}

/** Schema-tolerant load: old saved states (without bills / budget periods) still load. */
function loadState(key: string): AppState {
  const base = defaultState();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<AppState> & { budgets?: any[] };
    const budgets = Array.isArray(parsed.budgets)
      ? parsed.budgets.map((b: any) => ({
          period: b.period === 'yearly' ? 'yearly' : 'monthly',
          year: typeof b.year === 'string' ? b.year : String(b.month ?? '').slice(0, 4) || new Date().getFullYear().toString(),
          ...b,
        }))
      : [];
    return {
      ...base,
      ...parsed,
      user: { ...base.user, ...(parsed.user ?? {}) },
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      budgets,
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      bills: Array.isArray((parsed as any).bills) ? (parsed as any).bills : [],
      notifications: { ...base.notifications, ...(parsed.notifications ?? {}) },
      selectedMonth: typeof parsed.selectedMonth === 'string' ? parsed.selectedMonth : currentMonthKey(),
    };
  } catch {
    return base;
  }
}

function hasMeaningfulData(s: AppState): boolean {
  return (
    s.onboarded ||
    s.transactions.length > 0 ||
    s.budgets.length > 0 ||
    s.goals.length > 0 ||
    s.bills.length > 0 ||
    s.user.name !== ''
  );
}

/* ================= Actions ================= */

type Action =
  | { type: 'HYDRATE'; state: AppState }
  | { type: 'SET_ONBOARDED'; value: boolean }
  | { type: 'UPDATE_PROFILE'; patch: Partial<UserProfile> }
  | { type: 'SET_CURRENCY'; currency: CurrencyCode }
  | { type: 'SET_THEME'; theme: ThemePref }
  | { type: 'ADD_TX'; tx: Transaction }
  | { type: 'UPDATE_TX'; tx: Transaction }
  | { type: 'DELETE_TX'; id: string }
  | { type: 'ADD_BUDGET'; budget: Budget }
  | { type: 'UPDATE_BUDGET'; budget: Budget }
  | { type: 'DELETE_BUDGET'; id: string }
  | { type: 'ADD_GOAL'; goal: Goal }
  | { type: 'UPDATE_GOAL'; goal: Goal }
  | { type: 'DELETE_GOAL'; id: string }
  | { type: 'ADD_CONTRIBUTION'; goalId: string; amount: number; date: string }
  | { type: 'ADD_BILL'; bill: Bill }
  | { type: 'UPDATE_BILL'; bill: Bill }
  | { type: 'DELETE_BILL'; id: string }
  | { type: 'BILL_ADVANCE'; billId: string; nextDue: string | null; payment: Bill['history'][number] }
  | { type: 'SET_NOTIFICATIONS'; patch: Partial<NotificationPrefs> }
  | { type: 'LOAD_DEMO' }
  | { type: 'CLEAR_DEMO' }
  | { type: 'IMPORT_TXS'; txs: Transaction[] }
  | { type: 'SET_MONTH'; month: string }
  | { type: 'CLEAR_ALL' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state;
    case 'SET_ONBOARDED':
      return { ...state, onboarded: action.value };
    case 'UPDATE_PROFILE':
      return { ...state, user: { ...state.user, ...action.patch } };
    case 'SET_CURRENCY':
      return { ...state, user: { ...state.user, currency: action.currency } };
    case 'SET_THEME':
      return { ...state, user: { ...state.user, theme: action.theme } };
    case 'ADD_TX':
      return { ...state, transactions: [action.tx, ...state.transactions] };
    case 'UPDATE_TX':
      return {
        ...state,
        transactions: state.transactions.map((t) => (t.id === action.tx.id ? action.tx : t)),
      };
    case 'DELETE_TX':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) };
    case 'ADD_BUDGET':
      return { ...state, budgets: [action.budget, ...state.budgets] };
    case 'UPDATE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.map((b) => (b.id === action.budget.id ? action.budget : b)),
      };
    case 'DELETE_BUDGET':
      return { ...state, budgets: state.budgets.filter((b) => b.id !== action.id) };
    case 'ADD_GOAL':
      return { ...state, goals: [action.goal, ...state.goals] };
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map((g) => (g.id === action.goal.id ? action.goal : g)),
      };
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter((g) => g.id !== action.id) };
    case 'ADD_CONTRIBUTION':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.goalId
            ? {
                ...g,
                currentAmount: g.currentAmount + action.amount,
                contributions: [
                  { id: uid('gc'), amount: action.amount, date: action.date },
                  ...g.contributions,
                ],
              }
            : g,
        ),
      };
    case 'ADD_BILL':
      return { ...state, bills: [action.bill, ...state.bills] };
    case 'UPDATE_BILL':
      return {
        ...state,
        bills: state.bills.map((b) => (b.id === action.bill.id ? action.bill : b)),
      };
    case 'DELETE_BILL':
      return { ...state, bills: state.bills.filter((b) => b.id !== action.id) };
    case 'BILL_ADVANCE':
      return {
        ...state,
        bills: state.bills.map((b) =>
          b.id === action.billId
            ? { ...b, nextDue: action.nextDue, history: [action.payment, ...b.history] }
            : b,
        ),
      };
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: { ...state.notifications, ...action.patch } };
    case 'LOAD_DEMO':
      return {
        ...state,
        demoData: true,
        transactions: buildDemoTransactions(),
        budgets: buildDemoBudgets(),
        goals: buildDemoGoals(),
        bills: buildDemoBills(),
      };
    case 'CLEAR_DEMO':
      return { ...state, demoData: false, transactions: [], budgets: [], goals: [], bills: [] };
    case 'IMPORT_TXS':
      return { ...state, transactions: [...action.txs, ...state.transactions], demoData: false };
    case 'SET_MONTH':
      return { ...state, selectedMonth: action.month };
    case 'CLEAR_ALL':
      return { ...defaultState(), onboarded: false };
    default:
      return state;
  }
}

/* ================= Toasts ================= */

export interface Toast {
  id: string;
  message: string;
  kind: 'success' | 'error' | 'info' | 'warning';
}

export interface TxFormState {
  open: boolean;
  txType: 'expense' | 'income';
  editing: Transaction | null;
}

/* ================= Context ================= */

interface StoreContextValue {
  state: AppState;
  toasts: Toast[];
  toast: (message: string, kind?: Toast['kind']) => void;
  dismissToast: (id: string) => void;

  // Google auth (identity only — financial data stays local)
  auth: GoogleProfile | null;
  signInWithGoogle: (profile: GoogleProfile) => void;
  signOut: () => void;

  setOnboarded: (v: boolean) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  setCurrency: (c: CurrencyCode) => void;
  setTheme: (t: ThemePref) => void;
  resolvedTheme: 'light' | 'dark';

  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Transaction;
  updateTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;

  addBudget: (b: Omit<Budget, 'id' | 'createdAt'>) => void;
  updateBudget: (b: Budget) => void;
  deleteBudget: (id: string) => void;

  addGoal: (g: Omit<Goal, 'id' | 'createdAt' | 'contributions'>) => void;
  updateGoal: (g: Goal) => void;
  deleteGoal: (id: string) => void;
  addContribution: (goalId: string, amount: number, date: string) => void;

  addBill: (b: Omit<Bill, 'id' | 'createdAt' | 'history'>) => void;
  updateBill: (b: Bill) => void;
  deleteBill: (id: string) => void;
  markBillPaid: (bill: Bill) => void;
  skipBill: (bill: Bill) => void;

  setNotifications: (patch: Partial<NotificationPrefs>) => void;
  loadDemo: () => void;
  clearDemo: () => void;
  importTransactions: (txs: Transaction[]) => void;
  setMonth: (m: string) => void;
  clearAll: () => void;
  logout: () => void;

  money: (n: number, opts?: { decimals?: number }) => string;
  moneyCompact: (n: number) => string;

  // Global overlays
  txForm: TxFormState;
  openTxForm: (txType?: TxType, editing?: Transaction | null) => void;
  closeTxForm: () => void;
  budgetForm: { open: boolean; editing: Budget | null };
  openBudgetForm: (editing?: Budget | null) => void;
  closeBudgetForm: () => void;
  goalForm: { open: boolean; editing: Goal | null };
  openGoalForm: (editing?: Goal | null) => void;
  closeGoalForm: () => void;
  contributeGoal: { open: boolean; goal: Goal | null };
  openContribute: (goal: Goal) => void;
  closeContribute: () => void;
  txDetail: { open: boolean; tx: Transaction | null };
  openTxDetail: (tx: Transaction) => void;
  closeTxDetail: () => void;
  billForm: { open: boolean; editing: Bill | null };
  openBillForm: (editing?: Bill | null) => void;
  closeBillForm: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<GoogleProfile | null>(loadAuth);
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    loadState(stateKeyFor(loadAuth()?.googleId ?? null)),
  );
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [txForm, setTxForm] = useState<TxFormState>({ open: false, txType: 'expense', editing: null });
  const [budgetForm, setBudgetForm] = useState<{ open: boolean; editing: Budget | null }>({
    open: false,
    editing: null,
  });
  const [goalForm, setGoalForm] = useState<{ open: boolean; editing: Goal | null }>({
    open: false,
    editing: null,
  });
  const [contributeGoal, setContributeGoal] = useState<{ open: boolean; goal: Goal | null }>({
    open: false,
    goal: null,
  });
  const [txDetail, setTxDetail] = useState<{ open: boolean; tx: Transaction | null }>({
    open: false,
    tx: null,
  });
  const [billForm, setBillForm] = useState<{ open: boolean; editing: Bill | null }>({
    open: false,
    editing: null,
  });

  const profileId = auth?.googleId ?? null;

  /* Persist to the active profile's namespace */
  useEffect(() => {
    try {
      localStorage.setItem(stateKeyFor(profileId), JSON.stringify(state));
    } catch {
      /* storage full / unavailable — app still works in-memory */
    }
  }, [state, profileId]);

  /* Toasts */
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  const toast = useCallback(
    (message: string, kind: Toast['kind'] = 'success') => {
      const id = uid('toast');
      setToasts((prev) => [...prev.slice(-3), { id, message, kind }]);
      window.setTimeout(() => dismissToast(id), 4200);
    },
    [dismissToast],
  );

  /* Service-worker update announcements (dispatched from main.tsx via initPwa) */
  useEffect(() => {
    const onUpdate = () => toast('New version available — refresh to update.', 'info');
    window.addEventListener('spendly:sw-update', onUpdate);
    return () => window.removeEventListener('spendly:sw-update', onUpdate);
  }, [toast]);

  /* ---- Google auth ---- */

  const signInWithGoogle = useCallback(
    (profile: GoogleProfile) => {
      const targetKey = stateKeyFor(profile.googleId);
      let migrated = false;
      try {
        const existing = localStorage.getItem(targetKey);
        if (!existing) {
          // First sign-in for this Google profile: migrate anonymous data if it exists.
          const anonRaw = localStorage.getItem(LEGACY_KEY);
          if (anonRaw) {
            const anon = loadState(LEGACY_KEY);
            if (hasMeaningfulData(anon)) {
              localStorage.setItem(targetKey, anonRaw);
              migrated = true;
            }
          }
        }
        localStorage.setItem(AUTH_KEY, JSON.stringify(profile));
      } catch {
        /* best effort */
      }
      setAuth(profile);
      const next = loadState(targetKey);
      // Fill empty profile fields from Google identity (never overwrite user's edits)
      const patch: Partial<UserProfile> = {};
      if (!next.user.name && profile.name) patch.name = profile.name;
      if (!next.user.email && profile.email) patch.email = profile.email;
      if (!next.user.avatar && profile.avatar) patch.avatar = profile.avatar;
      dispatch({ type: 'HYDRATE', state: { ...next, user: { ...next.user, ...patch } } });
      toast(
        migrated
          ? 'Signed in with Google. Your existing data was moved to this profile.'
          : `Signed in as ${profile.name || profile.email}.`,
      );
    },
    [toast],
  );

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {
      /* noop */
    }
    setAuth(null);
    dispatch({ type: 'HYDRATE', state: loadState(LEGACY_KEY) });
    toast('Signed out of Google. Your data stays saved on this device.', 'info');
  }, [toast]);

  /* Theme resolution */
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const resolvedTheme: 'light' | 'dark' =
    state.user.theme === 'system' ? (systemDark ? 'dark' : 'light') : state.user.theme;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const money = useCallback(
    (n: number, opts?: { decimals?: number }) => formatMoney(n, state.user.currency, opts),
    [state.user.currency],
  );
  const moneyCompact = useCallback((n: number) => formatMoneyCompact(n, state.user.currency), [state.user.currency]);

  /* Budget alert check (monthly + yearly) */
  const checkBudgetAlert = useCallback(
    (tx: Transaction, allTxs: Transaction[], budgets: Budget[]) => {
      if (tx.type !== 'income' && state.notifications.budgetAlerts) {
        const b = budgets.find((x) => {
          if (x.category !== tx.category) return false;
          if (x.period === 'yearly') return x.year === tx.date.slice(0, 4);
          return x.month === tx.date.slice(0, 7);
        });
        if (b) {
          const inScope = (t: Transaction) =>
            t.type === 'expense' &&
            t.category === b.category &&
            (b.period === 'yearly' ? t.date.slice(0, 4) === b.year : t.date.slice(0, 7) === b.month);
          const spent = allTxs.filter(inScope).reduce((s, t) => s + t.amount, 0);
          const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
          if (pct >= 100) toast(`You've exceeded your ${b.category} budget.`, 'warning');
          else if (pct >= 80) toast(`Heads up: ${b.category} budget is ${Math.round(pct)}% used.`, 'info');
        }
      }
    },
    [state.notifications.budgetAlerts, toast],
  );

  const value: StoreContextValue = useMemo(
    () => ({
      state,
      toasts,
      toast,
      dismissToast,

      auth,
      signInWithGoogle,
      signOut,

      setOnboarded: (v) => dispatch({ type: 'SET_ONBOARDED', value: v }),
      updateProfile: (patch) => dispatch({ type: 'UPDATE_PROFILE', patch }),
      setCurrency: (c) => dispatch({ type: 'SET_CURRENCY', currency: c }),
      setTheme: (t) => dispatch({ type: 'SET_THEME', theme: t }),
      resolvedTheme,

      addTransaction: (input) => {
        const tx: Transaction = { ...input, id: uid('tx'), createdAt: new Date().toISOString() };
        const next = [tx, ...state.transactions];
        dispatch({ type: 'ADD_TX', tx });
        checkBudgetAlert(tx, next, state.budgets);
        return tx;
      },
      updateTransaction: (tx) => dispatch({ type: 'UPDATE_TX', tx }),
      deleteTransaction: (id) => dispatch({ type: 'DELETE_TX', id }),

      addBudget: (input) => dispatch({ type: 'ADD_BUDGET', budget: { ...input, id: uid('bd'), createdAt: new Date().toISOString() } }),
      updateBudget: (b) => dispatch({ type: 'UPDATE_BUDGET', budget: b }),
      deleteBudget: (id) => dispatch({ type: 'DELETE_BUDGET', id }),

      addGoal: (input) =>
        dispatch({
          type: 'ADD_GOAL',
          goal: { ...input, id: uid('goal'), createdAt: new Date().toISOString(), contributions: [] },
        }),
      updateGoal: (g) => dispatch({ type: 'UPDATE_GOAL', goal: g }),
      deleteGoal: (id) => dispatch({ type: 'DELETE_GOAL', id }),
      addContribution: (goalId, amount, date) => dispatch({ type: 'ADD_CONTRIBUTION', goalId, amount, date }),

      addBill: (input) =>
        dispatch({
          type: 'ADD_BILL',
          bill: { ...input, id: uid('bill'), createdAt: new Date().toISOString(), history: [] },
        }),
      updateBill: (b) => dispatch({ type: 'UPDATE_BILL', bill: b }),
      deleteBill: (id) => dispatch({ type: 'DELETE_BILL', id }),
      markBillPaid: (bill) => {
        if (!bill.nextDue) return;
        const tx: Transaction = {
          id: uid('tx'),
          createdAt: new Date().toISOString(),
          type: 'expense',
          amount: bill.amount,
          title: bill.title,
          category: bill.category,
          date: todayISO(),
          paymentMethod: 'Bank',
          notes: bill.notes ? `Bill payment — ${bill.notes}` : 'Bill payment',
          receipt: null,
          recurring: false,
          nature: 'fixed',
        };
        const next = [tx, ...state.transactions];
        dispatch({ type: 'ADD_TX', tx });
        const nextDue = advanceBillDue(bill.nextDue, bill.frequency, bill.dayOfMonth);
        dispatch({
          type: 'BILL_ADVANCE',
          billId: bill.id,
          nextDue,
          payment: { id: uid('bp'), paidAt: new Date().toISOString(), transactionId: tx.id, amount: bill.amount },
        });
        checkBudgetAlert(tx, next, state.budgets);
        toast(nextDue ? `Bill paid. Next due ${nextDue}.` : 'Bill paid and completed.');
      },
      skipBill: (bill) => {
        if (!bill.nextDue) return;
        const nextDue = advanceBillDue(bill.nextDue, bill.frequency, bill.dayOfMonth);
        dispatch({
          type: 'BILL_ADVANCE',
          billId: bill.id,
          nextDue,
          payment: { id: uid('bp'), paidAt: new Date().toISOString(), transactionId: '', amount: bill.amount, skipped: true },
        });
        toast(nextDue ? `Bill skipped. Next due ${nextDue}.` : 'Bill skipped.', 'info');
      },

      setNotifications: (patch) => dispatch({ type: 'SET_NOTIFICATIONS', patch }),
      loadDemo: () => dispatch({ type: 'LOAD_DEMO' }),
      clearDemo: () => dispatch({ type: 'CLEAR_DEMO' }),
      importTransactions: (txs) => dispatch({ type: 'IMPORT_TXS', txs }),
      setMonth: (m) => dispatch({ type: 'SET_MONTH', month: m }),
      clearAll: () => {
        try {
          localStorage.removeItem(stateKeyFor(profileId));
        } catch {
          /* noop */
        }
        dispatch({ type: 'CLEAR_ALL' });
      },
      logout: () => {
        if (profileId) {
          // Google session: sign out but keep all data
          try {
            localStorage.removeItem(AUTH_KEY);
          } catch {
            /* noop */
          }
          setAuth(null);
          dispatch({ type: 'HYDRATE', state: loadState(LEGACY_KEY) });
        } else {
          try {
            localStorage.removeItem(LEGACY_KEY);
          } catch {
            /* noop */
          }
          dispatch({ type: 'CLEAR_ALL' });
        }
      },

      money,
      moneyCompact,

      txForm,
      openTxForm: (txType = 'expense', editing = null) => setTxForm({ open: true, txType, editing }),
      closeTxForm: () => setTxForm((s) => ({ ...s, open: false })),
      budgetForm,
      openBudgetForm: (editing = null) => setBudgetForm({ open: true, editing }),
      closeBudgetForm: () => setBudgetForm((s) => ({ ...s, open: false })),
      goalForm,
      openGoalForm: (editing = null) => setGoalForm({ open: true, editing }),
      closeGoalForm: () => setGoalForm((s) => ({ ...s, open: false })),
      contributeGoal,
      openContribute: (goal) => setContributeGoal({ open: true, goal }),
      closeContribute: () => setContributeGoal((s) => ({ ...s, open: false })),
      txDetail,
      openTxDetail: (tx) => setTxDetail({ open: true, tx }),
      closeTxDetail: () => setTxDetail((s) => ({ ...s, open: false })),
      billForm,
      openBillForm: (editing = null) => setBillForm({ open: true, editing }),
      closeBillForm: () => setBillForm((s) => ({ ...s, open: false })),
    }),
    [
      state,
      toasts,
      toast,
      dismissToast,
      auth,
      signInWithGoogle,
      signOut,
      resolvedTheme,
      money,
      moneyCompact,
      txForm,
      budgetForm,
      goalForm,
      contributeGoal,
      txDetail,
      billForm,
      checkBudgetAlert,
      profileId,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

/** Convenience: user profile shortcut */
export function useUser() {
  return useStore().state.user;
}
