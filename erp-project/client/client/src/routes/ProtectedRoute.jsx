import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

// `roles` is optional - omit it to just require "logged in", or pass an
// array to also gate by role, e.g. <ProtectedRoute roles={['hr','admin']} />
export default function ProtectedRoute({ roles }) {
  const { user, booting } = useAuth();

  if (booting) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
