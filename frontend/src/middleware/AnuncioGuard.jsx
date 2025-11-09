import { Navigate, Outlet } from "react-router";
import { useAuthContext } from "app/contexts/auth/context";

export default function AnuncioGuard() {
  const { role, isAuthenticated } = useAuthContext();

  // Si no está autenticado, redirige al login
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Solo admin, superadmin o usuario pueden acceder
  if (role !== "admin" && role !== "superadmin" && role !== "usuario") {
    return <Navigate to="/administracion/entidades" replace />;
  }

  // Si tiene permisos, renderiza las rutas hijas
  return <Outlet />;
}
