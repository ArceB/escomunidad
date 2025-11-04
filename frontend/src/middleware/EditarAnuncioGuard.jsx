// src/middleware/EditarAnuncioGuard.jsx
import { Navigate, Outlet, useParams } from "react-router";
import { useAuthContext } from "app/contexts/auth/context";
import { useEffect, useState } from "react";
import axios from "utils/axios";
import { Spinner } from "components/ui";

export default function EditarAnuncioGuard() {
  const { role, isAuthenticated } = useAuthContext();
  const { anuncioId } = useParams();

  const [allowed, setAllowed] = useState(null); // null = cargando, true/false = permiso
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verificarPermisos = async () => {
      try {
        if (!isAuthenticated) {
          setAllowed(false);
          return;
        }

        // Si es superadmin, admin o responsable → acceso directo
        if (role === "superadmin" || role === "admin" || role === "responsable") {
          setAllowed(true);
          return;
        }

        // Si es usuario → verificar que el anuncio le pertenezca y esté rechazado
        if (role === "usuario") {
          const token = sessionStorage.getItem("authToken");
          const headers = token ? { Authorization: `Bearer ${token}` } : {};

          const res = await axios.get(`/anuncios/${anuncioId}/`, { headers });

          const anuncio = res.data;
          // ✅ Permitir si el anuncio está rechazado y pertenece al usuario
          if (anuncio.estado === "rechazado" && anuncio.usuario === anuncio.usuario_id) {
            setAllowed(true);
          } else {
            setAllowed(false);
          }
          return;
        }

        // Cualquier otro rol o error → sin permiso
        setAllowed(false);
      } catch (err) {
        console.error("Error verificando permisos:", err);
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    verificarPermisos();
  }, [role, anuncioId, isAuthenticated]);

  // Mientras verifica
  if (loading || allowed === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // Si no está autenticado → redirige al login
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Si no tiene permiso → regresa al listado de entidades
  if (!allowed) return <Navigate to="/administracion/entidades" replace />;

  // ✅ Si tiene permiso, muestra el contenido (Outlet)
  return <Outlet />;
}
