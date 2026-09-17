import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="flex h-screen flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-bold text-slate-900">You don't have access to this page</h1>
      <p className="mt-2 text-sm text-slate-500">Your role doesn't permit viewing this section.</p>
      <Link to="/" className="mt-6 text-sm font-medium text-primary-700 hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
