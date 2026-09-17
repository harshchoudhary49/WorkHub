import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const ROLE_LANDING = {
  employee: '/employee/dashboard',
  manager: '/manager/dashboard',
  hr: '/hr/dashboard',
  admin: '/hr/dashboard',
};

// Sends "/" to the right dashboard for whoever is logged in.
export default function RoleRedirect() {
  const { user } = useAuth();
  return <Navigate to={ROLE_LANDING[user?.role] || '/employee/dashboard'} replace />;
}
