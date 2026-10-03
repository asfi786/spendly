import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowDownWideNarrow,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { useStore } from '../store/AppContext';
import CategoryIcon from '../components/CategoryIcon';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS, categoryColor, categoryIcon } from '../data/categories';
import { formatDate } from '../utils/format';
import { searchTransactions } from '../utils/analytics';
import type { Transaction } from '../types';

const PAGE_SIZE = 10;
type SortKey = 'newest' | 'oldest' | 'amount-desc' | 'amount-asc';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'amount-desc', label: 'Amount: high to low' },
  { key: 'amount-asc', label: 'Amount: low to high' },
];

export default function Transactions() {
  const { state, money, openTxForm, openTxDetail, deleteTransaction, toast } = useStore();
  const [params, setParams] = useSearchParams();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(params.get('category') ?? '');
  const [type, setType] = useState('');
  const [method, setMethod] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const allCategories = useMemo(
    () => [...EXPENSE_CATEGORIES.map((c) => c.name), ...INCOME_CATEGORIES.filter((c) => c.name !== 'Other').map((c) => c.name)],
    [],
  );

  const filtered = useMemo(() => {
    let list = searchTransactions(state.transactions, query);
    if (category) list = list.filter((t) => t.category === category);
    if (type) list = list.filter((t) => t.type === type);
    if (method) list = list.filter((t) => t.paymentMethod === method);
    if (from) list = list.filter((t) => t.date >= from);
    if (to) list = list.filter((t) => t.date <= to);
    const sorted = [...list];
    switch (sort) {
      case 'newest':
        sorted.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt.localeCompare(a.createdAt)));
        break;
      case 'oldest':
        sorted.sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : a.createdAt.localeCompare(b.createdAt)));
        break;
      case 'amount-desc':
        sorted.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount-asc':
        sorted.sort((a, b) => a.amount - b.amount);
        break;
    }
    return sorted;
  }, [state.transactions, query, category, type, method, from, to, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const activeFilterCount = [category, type, method, from, to].filter(Boolean).length;

  const resetPage = () => setPage(1);
  const clearFilters = () => {
    setCategory('');
    setType('');
    setMethod('');
    setFrom('');
    setTo('');
    setQuery('');
    setParams({});
    resetPage();
  };

  const pickCategory = (c: string) => {
    setCategory(c);
    setParams(c ? { category: c } : {});
    resetPage();
  };

  const rowActions = (t: Transaction) => (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          openTxForm(t.type, t);
        }}
        aria-label={`Edit ${t.title}`}
        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-night-700 dark:hover:text-slate-200"
      >
        <Pencil size={16} aria-hidden />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setDeleting(t);
        }}
        aria-label={`Delete ${t.title}`}
        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
      >
        <Trash2 size={16} aria-hidden />
      </button>
    </>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">
            {filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'}
            {query && (
              <>
                {' '}matching <span className="font-semibold text-slate-700 dark:text-slate-200">“{query}”</span>
              </>
            )}
          </p>
        </div>
        <button className="btn-primary btn-sm !py-2" onClick={() => openTxForm('expense')}>
          <Plus size={15} aria-hidden /> Add transaction
        </button>
      </div>

      {/* Search + sort + filter toggle */}
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              resetPage();
            }}
            placeholder="Search title, category, notes, payment method…"
            aria-label="Search transactions"
            className="input !pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`btn-secondary btn-sm relative ${filtersOpen ? '!border-brand-500 !text-brand-600 dark:!text-brand-400' : ''}`}
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal size={15} aria-hidden /> Filters
            {activeFilterCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          <label className="sr-only" htmlFor="tx-sort">
            Sort transactions
          </label>
          <div className="relative">
            <ArrowDownWideNarrow size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
            <select
              id="tx-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="input btn-sm !w-auto !pl-9 pr-8"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div className="card grid grid-cols-2 gap-3 p-4 animate-fade-in sm:grid-cols-3 lg:grid-cols-5">
          <div>
            <label className="label" htmlFor="f-category">Category</label>
            <select id="f-category" className="input" value={category} onChange={(e) => pickCategory(e.target.value)}>
              <option value="">All</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f-type">Type</label>
            <select id="f-type" className="input" value={type} onChange={(e) => { setType(e.target.value); resetPage(); }}>
              <option value="">All</option>
              <option value="expense">Expenses</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f-method">Payment method</label>
            <select id="f-method" className="input" value={method} onChange={(e) => { setMethod(e.target.value); resetPage(); }}>
              <option value="">All</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f-from">From</label>
            <input id="f-from" type="date" className="input" value={from} onChange={(e) => { setFrom(e.target.value); resetPage(); }} />
          </div>
          <div>
            <label className="label" htmlFor="f-to">To</label>
            <input id="f-to" type="date" className="input" value={to} onChange={(e) => { setTo(e.target.value); resetPage(); }} />
          </div>
          {(activeFilterCount > 0 || query) && (
            <div className="col-span-2 flex items-end sm:col-span-3 lg:col-span-5">
              <button className="btn-ghost btn-sm" onClick={clearFilters}>
                <X size={14} aria-hidden /> Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* List */}
      {state.transactions.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No transactions yet"
          body="Start tracking your spending to see your financial insights here. Your first entry takes less than 30 seconds."
          actionLabel="Add your first transaction"
          onAction={() => openTxForm('expense')}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches found"
          body="Try a different search term or loosen your filters."
          actionLabel="Clear filters"
          onAction={clearFilters}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="card hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b divider bg-slate-50/60 text-xs uppercase tracking-wide text-slate-400 dark:bg-night-800/60">
                  <th scope="col" className="px-5 py-3 font-semibold">Transaction</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Category</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Date</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Method</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Amount</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divider">
                {pageItems.map((t) => {
                  const isExp = t.type === 'expense';
                  return (
                    <tr
                      key={t.id}
                      onClick={() => openTxDetail(t)}
                      className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-night-800/60"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <CategoryIcon icon={categoryIcon(t.category, t.type)} color={categoryColor(t.category, t.type)} size={18} />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{t.title}</p>
                            {t.recurring && <p className="text-xs text-brand-600 dark:text-brand-400">Recurring</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{t.category}</td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{formatDate(t.date)}</td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{t.paymentMethod}</td>
                      <td className={`px-5 py-3.5 text-right font-bold tabular-nums ${isExp ? 'text-slate-900 dark:text-white' : 'text-brand-600 dark:text-brand-400'}`}>
                        {isExp ? '−' : '+'}{money(t.amount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1">{rowActions(t)}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="card divide-y divider overflow-hidden md:hidden">
            {pageItems.map((t) => {
              const isExp = t.type === 'expense';
              return (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3.5">
                  <button
                    onClick={() => openTxDetail(t)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    aria-label={`View details for ${t.title}`}
                  >
                    <CategoryIcon icon={categoryIcon(t.category, t.type)} color={categoryColor(t.category, t.type)} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{t.title}</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">
                        {t.category} · {formatDate(t.date)} · {t.paymentMethod}
                      </span>
                    </span>
                    <span className={`shrink-0 text-sm font-bold tabular-nums ${isExp ? 'text-slate-900 dark:text-white' : 'text-brand-600 dark:text-brand-400'}`}>
                      {isExp ? '−' : '+'}{money(t.amount)}
                    </span>
                  </button>
                  <span className="flex shrink-0 gap-0.5">{rowActions(t)}</span>
                </li>
              );
            })}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Transaction pages" className="flex items-center justify-center gap-2">
              <button
                className="btn-secondary btn-sm"
                disabled={safePage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="text-sm tabular-nums text-slate-500 dark:text-slate-400" aria-live="polite">
                Page {safePage} of {totalPages}
              </span>
              <button
                className="btn-secondary btn-sm"
                disabled={safePage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}

      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteTransaction(deleting.id);
            toast('Transaction deleted.');
          }
        }}
        title="Delete transaction?"
        message={deleting ? `"${deleting.title}" will be permanently removed. This can't be undone.` : ''}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
