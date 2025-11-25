import { Navigate, Outlet } from "react-router";
import { useAuthContext } from "app/contexts/auth/context";

export default function RoleGuard({ }) {
  const { role, isAuthenticated } = useAuthContext();

  // Si no está autenticado, redirige al login
  if (!isAuthenticated) return <Navigate to="/escomunidad-admin-panel" replace />;

  // Si tiene permisos, renderiza las rutas hijas
  return <Outlet />;
}
