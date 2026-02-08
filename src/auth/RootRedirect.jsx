import { Navigate } from 'react-router';
import { isAuthenticated } from './session.js';

export default function RootRedirect() {
  return isAuthenticated() ? <Navigate to="/solicitudes" replace /> : <Navigate to="/login" replace />;
}
