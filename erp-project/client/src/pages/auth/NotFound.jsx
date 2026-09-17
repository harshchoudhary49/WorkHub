import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
      <Link to="/" className="mt-6 text-sm font-medium text-primary-700 hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
