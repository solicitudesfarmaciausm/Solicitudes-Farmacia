import { Navigate, useLocation } from 'react-router';
import { isAuthenticated } from './session.js';

export default function RequireAuth({ children }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
