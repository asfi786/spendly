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
  Budget,
  CurrencyCode,
  Goal,
  NotificationPrefs,
  ThemePref,
  Transaction,
  TxType,
  UserProfile,
} from '../types';
import { currentMonthKey, formatMoney, formatMoneyCompact, uid } from '../utils/format';
import { buildDemoBudgets, buildDemoGoals, buildDemoTransactions } from '../data/demoData';

/* ================= State ================= */

const STORAGE_KEY = 'spendly:v1';

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
    notifications: { budgetAlerts: true, dailyReminder: false },
    demoData: false,
    selectedMonth: currentMonthKey(),
  };
}

function loadState(): AppState {
  const base = defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...base,
      ...parsed,
      user: { ...base.user, ...(parsed.user ?? {}) },
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      notifications: { ...base.notifications, ...(parsed.notifications ?? {}) },
      selectedMonth: typeof parsed.selectedMonth === 'string' ? parsed.selectedMonth : currentMonthKey(),
    };
  } catch {
    return base;
  }
}

/* ================= Actions ================= */

type Action =
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
  | { type: 'SET_NOTIFICATIONS'; patch: Partial<NotificationPrefs> }
  | { type: 'LOAD_DEMO' }
  | { type: 'CLEAR_DEMO' }
  | { type: 'IMPORT_TXS'; txs: Transaction[] }
  | { type: 'SET_MONTH'; month: string }
  | { type: 'CLEAR_ALL' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
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
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: { ...state.notifications, ...action.patch } };
    case 'LOAD_DEMO':
      return {
        ...state,
        demoData: true,
        transactions: buildDemoTransactions(),
        budgets: buildDemoBudgets(),
        goals: buildDemoGoals(),
      };
    case 'CLEAR_DEMO':
      return { ...state, demoData: false, transactions: [], budgets: [], goals: [] };
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
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
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

  /* Persist */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full / unavailable — app still works in-memory */
    }
  }, [state]);

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

  /* Budget alert check */
  const checkBudgetAlert = useCallback(
    (tx: Transaction, allTxs: Transaction[], budgets: Budget[]) => {
      if (tx.type !== 'income' && state.notifications.budgetAlerts) {
        const month = tx.date.slice(0, 7);
        const b = budgets.find((x) => x.month === month && x.category === tx.category);
        if (b) {
          const spent = allTxs
            .filter((t) => t.type === 'expense' && t.date.slice(0, 7) === month && t.category === tx.category)
            .reduce((s, t) => s + t.amount, 0);
          const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
          if (pct >= 100) toast(`You've exceeded your ${b.category} budget for this month.`, 'warning');
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

      setNotifications: (patch) => dispatch({ type: 'SET_NOTIFICATIONS', patch }),
      loadDemo: () => dispatch({ type: 'LOAD_DEMO' }),
      clearDemo: () => dispatch({ type: 'CLEAR_DEMO' }),
      importTransactions: (txs) => dispatch({ type: 'IMPORT_TXS', txs }),
      setMonth: (m) => dispatch({ type: 'SET_MONTH', month: m }),
      clearAll: () => {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* noop */
        }
        dispatch({ type: 'CLEAR_ALL' });
      },
      logout: () => {
        dispatch({ type: 'CLEAR_ALL' });
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
    }),
    [
      state,
      toasts,
      toast,
      dismissToast,
      resolvedTheme,
      money,
      moneyCompact,
      txForm,
      budgetForm,
      goalForm,
      contributeGoal,
      txDetail,
      checkBudgetAlert,
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
