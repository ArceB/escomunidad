import { Navigate, useOutlet } from "react-router";
import { useAuthContext } from "app/contexts/auth/context";
import { REDIRECT_URL_KEY } from "constants/app.constant";

export default function GhostGuard() {
  const outlet = useOutlet();
  const { isAuthenticated, role } = useAuthContext();

  const url = new URLSearchParams(window.location.search).get(REDIRECT_URL_KEY);

  if (isAuthenticated) {
    // 🔹 Si había redirect en query string, respetarlo
    if (url && url !== "") return <Navigate to={url} replace />;

    // 🔹 Redirección centralizada según rol
    if (role === "usuario") return <Navigate to="/administracion/entidades" replace />;
    if (role === "responsable") return <Navigate to="/administracion/entidades" replace />;
    if (role === "admin") return <Navigate to="/administracion/entidades" replace />;
    if (role === "superadmin") return <Navigate to="/administracion/entidades" replace />;

    // 🔹 Fallback si no hay rol válido
    return <Navigate to="/dashboards/sales" replace />;
  }
  // 🔹 Si no hay sesión, renderiza las rutas públicas (login, principal, etc.)
  return <>{outlet}</>;
}
