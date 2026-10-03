import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import Logo from '../components/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-6 text-center dark:bg-night-950">
      <Logo size={56} />
      <div className="mt-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
        <Compass size={30} aria-hidden />
      </div>
      <h1 className="mt-4 text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">404</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        This page wandered off like an unlogged expense. Let's get you back on track.
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/" className="btn-secondary">
          <Home size={16} aria-hidden /> Landing page
        </Link>
        <Link to="/app" className="btn-primary">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
