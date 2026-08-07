import { Navigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Wrap a route element with this to require login (and optionally a
// specific permission code). Unauthenticated users are sent to /login;
// authenticated users lacking the permission are sent to /403.
// Pass `permission` for a fixed code, or `permissionFor(params)` when the
// required code depends on a route param (e.g. /management/:category).
export default function ProtectedRoute({ permission, permissionFor, children }) {
  const { isAuthenticated, loading, hasPermission } = useAuth();
  const location = useLocation();
  const params = useParams();

  if (loading) {
    return <div className="p-6 text-sm text-gray-400">Memuat...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const requiredPermission = permissionFor ? permissionFor(params) : permission;
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
