import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Minus,
  Moon,
  PiggyBank,
  Plus,
  Settings,
  Sun,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
  X,
} from 'lucide-react';
import Logo from './Logo';
import MonthPicker from './MonthPicker';
import TransactionForm from './TransactionForm';
import BudgetForm from './BudgetForm';
import GoalForm from './GoalForm';
import ContributeModal from './ContributeModal';
import TxDetailModal from './TxDetailModal';
import ConfirmModal from './ConfirmModal';
import ToastHost from './Toast';
import { useStore } from '../store/AppContext';

const NAV = [
  { to: '/app', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/app/budgets', label: 'Budgets', icon: Wallet },
  { to: '/app/goals', label: 'Goals', icon: Target },
  { to: '/app/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

const MOBILE_TABS = [
  { to: '/app', end: true, label: 'Home', icon: LayoutDashboard },
  { to: '/app/transactions', label: 'Activity', icon: ArrowLeftRight },
  { to: '/app/analytics', label: 'Insights', icon: BarChart3 },
  { to: '/app/budgets', label: 'Budgets', icon: Wallet },
  { to: '/app/goals', label: 'Goals', icon: Target },
];

function ThemeToggle() {
  const { state, setTheme } = useStore();
  const theme = state.user.theme;
  const cycle = () => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light');
  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Sun;
  return (
    <button
      onClick={cycle}
      aria-label={`Theme: ${theme}. Activate to change.`}
      title={`Theme: ${theme} (click to change)`}
      className="rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-night-700 dark:hover:text-amber-300"
    >
      <Icon size={19} aria-hidden />
    </button>
  );
}

function AvatarMenu() {
  const { state, logout, toast } = useStore();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const initial = (state.user.name || 'S').charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white shadow-md transition-transform hover:scale-105"
      >
        {state.user.avatar ? (
          <img src={state.user.avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </button>
      {open && (
        <div role="menu" className="card absolute right-0 z-50 mt-2 w-60 p-2 animate-scale-in">
          <div className="flex items-center gap-3 px-2.5 py-2.5">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white">
              {state.user.avatar ? <img src={state.user.avatar} alt="" className="h-full w-full object-cover" /> : initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                {state.user.name || 'Spendly user'}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {state.user.email || 'No email set'}
              </p>
            </div>
          </div>
          <div className="divider my-1 border-t" />
          <Link
            to="/app/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-night-700"
          >
            <User size={16} aria-hidden /> Profile & settings
          </Link>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setConfirming(true);
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10"
          >
            <LogOut size={16} aria-hidden /> Sign out
          </button>
        </div>
      )}
      <ConfirmModal
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          logout();
          toast('Signed out. Your local data was cleared.', 'info');
          navigate('/', { replace: true });
        }}
        title="Sign out?"
        message="This clears your profile and all data stored on this device, then takes you back to the landing page."
        confirmLabel="Sign out"
        danger
      />
    </div>
  );
}

export default function AppShell() {
  const { openTxForm, openBudgetForm, openGoalForm, state } = useStore();
  const [collapsed, setCollapsed] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const location = useLocation();

  // Close FAB sheet + scroll to top on navigation
  useEffect(() => {
    setFabOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  const quickActions = [
    { label: 'Add Expense', icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10', fn: () => openTxForm('expense') },
    { label: 'Add Income', icon: TrendingUp, color: 'text-brand-500', bg: 'bg-brand-500/10', fn: () => openTxForm('income') },
    { label: 'Add Budget', icon: Wallet, color: 'text-amber-500', bg: 'bg-amber-500/10', fn: () => openBudgetForm() },
    { label: 'Add Goal', icon: PiggyBank, color: 'text-sky-500', bg: 'bg-sky-500/10', fn: () => openGoalForm() },
  ];

  return (
    <div className="min-h-screen">
      {/* ============ Desktop sidebar ============ */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r divider bg-white transition-all duration-200 dark:bg-night-900 lg:flex ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
        aria-label="Main navigation"
      >
        <div className={`flex h-16 items-center gap-2.5 px-5 ${collapsed ? 'justify-center px-0' : ''}`}>
          <Logo size={34} />
          {!collapsed && (
            <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              Spendly
            </span>
          )}
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <item.icon size={20} aria-hidden className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="border-t divider p-3">
          <div className={`flex items-center gap-3 ${collapsed ? 'flex-col' : ''}`}>
            <button
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-night-800 dark:hover:text-white"
            >
              <ChevronLeft size={19} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {state.user.name || 'Spendly user'}
                </p>
                <p className="truncate text-xs capitalize text-slate-500 dark:text-slate-400">
                  {state.user.currency} · {state.user.theme} mode
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ============ Mobile top bar ============ */}
      <header className="fixed inset-x-0 top-0 z-40 border-b divider bg-white/85 backdrop-blur-lg dark:bg-night-900/85 lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link to="/app" className="flex items-center gap-2" aria-label="Spendly home">
            <Logo size={30} />
            <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">Spendly</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <AvatarMenu />
          </div>
        </div>
      </header>

      {/* ============ Main column ============ */}
      <div className={`flex min-h-screen flex-col transition-all duration-200 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-64'}`}>
        {/* Desktop top bar */}
        <header className="sticky top-0 z-30 hidden border-b divider bg-slate-100/80 backdrop-blur-lg dark:bg-night-950/80 lg:block">
          <div className="flex h-16 items-center justify-between gap-4 px-6 xl:px-8">
            <MonthPicker />
            <div className="flex items-center gap-2">
              <button className="btn-secondary btn-sm !py-2" onClick={() => openTxForm('income')}>
                <Plus size={15} aria-hidden /> Income
              </button>
              <button className="btn-primary btn-sm !py-2" onClick={() => openTxForm('expense')}>
                <Minus size={15} aria-hidden /> Add Expense
              </button>
              <ThemeToggle />
              <AvatarMenu />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-28 pt-20 sm:px-6 lg:px-8 lg:pb-12 lg:pt-6 xl:px-10">
          <div key={location.pathname} className="mx-auto max-w-6xl animate-fade-up">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ============ Mobile bottom tabs ============ */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t divider bg-white/90 backdrop-blur-lg dark:bg-night-900/90 lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-5 px-1">
          {MOBILE_TABS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[10px] font-semibold transition-colors ${
                  isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'
                }`
              }
            >
              <item.icon size={21} aria-hidden />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ============ FAB + quick actions ============ */}
      {fabOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] animate-fade-in lg:hidden"
          onClick={() => setFabOpen(false)}
          aria-hidden
        />
      )}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2.5 lg:bottom-8 lg:right-8">
        {fabOpen && (
          <div className="flex flex-col items-end gap-2 animate-fade-up">
            {quickActions.map((a) => (
              <button
                key={a.label}
                onClick={() => {
                  a.fn();
                  setFabOpen(false);
                }}
                className="card-hover card flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${a.bg} ${a.color}`}>
                  <a.icon size={18} aria-hidden />
                </span>
                {a.label}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setFabOpen((o) => !o)}
          aria-label={fabOpen ? 'Close quick actions' : 'Quick actions'}
          aria-expanded={fabOpen}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-[0_10px_24px_-6px_rgb(16_185_129/0.7)] transition-transform hover:scale-105 active:scale-95 lg:hidden"
        >
          {fabOpen ? <X size={24} aria-hidden /> : <Plus size={26} aria-hidden />}
        </button>
      </div>

      {/* Global overlays */}
      <TransactionForm />
      <BudgetForm />
      <GoalForm />
      <ContributeModal />
      <TxDetailModal />
      <ToastHost />
    </div>
  );
}
