import { Navigate } from 'react-router';
import { isAuthenticated } from './session.js';

export default function RedirectIfAuth({ children, to = '/solicitudes' }) {
  if (isAuthenticated()) {
    return <Navigate to={to} replace />;
  }

  return children;
}
