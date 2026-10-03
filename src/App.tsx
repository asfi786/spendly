import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './store/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import AppShell from './components/AppShell';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import Budgets from './pages/Budgets';
import Goals from './pages/Goals';
import CalendarPage from './pages/CalendarPage';
import Settings from './pages/Settings';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';

function RequireOnboarded({ children }: { children: React.ReactNode }) {
  const { state } = useStore();
  const location = useLocation();
  if (!state.onboarded) {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

function RedirectIfOnboarded({ children }: { children: React.ReactNode }) {
  const { state } = useStore();
  if (state.onboarded) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route
        path="/onboarding"
        element={
          <RedirectIfOnboarded>
            <Onboarding />
          </RedirectIfOnboarded>
        }
      />
      <Route
        path="/app"
        element={
          <RequireOnboarded>
            <AppShell />
          </RequireOnboarded>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="goals" element={<Goals />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <AppRoutes />
      </StoreProvider>
    </ErrorBoundary>
  );
}
