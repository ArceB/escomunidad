// src/middleware/AdminGuard.jsx
import { Navigate, Outlet } from "react-router";
import { useAuthContext } from "app/contexts/auth/context";

export default function AdminGuard() {
  const { role, isAuthenticated } = useAuthContext();

  // Si no está autenticado, redirige al login
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Solo admin o superadmin pueden acceder
  if (role !== "admin" && role !== "superadmin") {
    return <Navigate to="/administracion/entidades" replace />;
  }

  // Si tiene permisos, renderiza las rutas hijas
  return <Outlet />;
}
