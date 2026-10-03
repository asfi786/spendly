# Spendly — Simple & Smart Expense Tracker

A premium, mobile-first personal expense tracker. No backend, no account — all data lives in the
browser's `localStorage`.

## Tech stack

- Vite + React 18 + TypeScript
- Tailwind CSS (class-based dark mode)
- Recharts (charts), lucide-react (icons), react-router-dom (routing)

## Run locally

```bash
cd spendly
npm install
npm run dev      # → http://localhost:5173
npm run build    # type-check + production build → dist/
```

## Deploy (Vercel)

This is a static SPA. `vercel.json` rewrites all non-file routes to `/index.html`
(while still serving `/robots.txt`, `/sitemap.xml`, `/favicon.svg`):

```bash
npm run build
# then deploy the dist/ folder, or connect the repo to Vercel
```

## Data & environment variables

There are **no environment variables and no database**. Everything is stored client-side:

| Key | Location | Contents |
|---|---|---|
| `spendly:v1` | `localStorage` | profile, transactions, budgets, goals, preferences, selected month |

- Export: Settings → Your data → CSV (transactions) or JSON (everything)
- Import: Settings → CSV/JSON (validated, friendly errors)
- Erase: Settings → Clear all data (typed `DELETE` confirmation), or Sign out

## Project structure

```
src/
  components/   Logo, Modal, ConfirmModal, Toast, EmptyState, Skeleton,
                CategoryIcon, AnimatedNumber, MonthPicker, ErrorBoundary,
                SummaryCard, SpendingChart, CategoryDonut,
                TransactionForm, BudgetForm, GoalForm, ContributeModal,
                TxDetailModal, AppShell
  pages/        Landing, Onboarding, Dashboard, Transactions, Analytics,
                Budgets, Goals, CalendarPage, Settings, Privacy, Terms, NotFound
  store/        AppContext (reducer + localStorage persistence + toasts + theme)
  utils/        format (currency/dates), analytics (series, insights, CSV)
  data/         categories, demoData
  types/        User, Transaction, Budget, Goal
public/         favicon.svg, og-image.svg, robots.txt, sitemap.xml
```

## Routes

`/` landing · `/onboarding` · `/privacy` · `/terms` ·
`/app` dashboard · `/app/transactions` · `/app/analytics` · `/app/budgets` ·
`/app/goals` · `/app/calendar` · `/app/settings`
