import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-slate-200 dark:text-slate-700">404</h1>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-4">Page Not Found</h2>
        <p className="text-slate-500 mt-2 mb-8">The page you're looking for doesn't exist.</p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/" className="btn btn-primary">
            <Home size={18} />
            Go Home
          </Link>
          <button onClick={() => window.history.back()} className="btn btn-secondary">
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
