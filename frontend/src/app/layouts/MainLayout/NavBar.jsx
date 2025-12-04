import { Building2, Users, Bell, LogOut } from "lucide-react";
import { Search } from "components/template/Search";
import { Button } from "components/ui";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import SearchIcon from "assets/dualicons/search.svg?react";
import { Notifications } from "components/template/Notifications";
import { useNavigate } from "react-router";
import { useAuthContext } from "app/contexts/auth/context";
import axios from "utils/axios";

function SlashIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="20"
      aria-hidden="true"
      {...props}
    >
      <path
        fill="none"
        stroke="currentColor"
        d="M3.5.5h12c1.7 0 3 1.3 3 3v13c0 1.7-1.3 3-3 3h-12c-1.7 0-3-1.3-3-3v-13c0-1.7 1.3-3 3-3z"
        opacity="0.4"
      />
      <path fill="currentColor" d="M11.8 6L8 15.1h-.9L10.8 6h1z" />
    </svg>
  );
}

export default function NavBar({ showNotifications = false }) {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthContext();
  const { role } = useAuthContext();

  const handleLogout = async () => {
    try {
      // Llamar al backend para invalidar refresh token
      const refreshToken = sessionStorage.getItem("refreshToken");
      if (refreshToken) {
        await axios.post("/logout/", { refresh: refreshToken });
      }
    } catch (err) {
      console.error("Error invalidando token:", err);
    } finally {
      // Limpiar tokens y contexto
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("refreshToken");
      logout(); // limpia contexto de usuario
      navigate("/escomunidad-admin-panel", { replace: true });
    }
  };

  const handleEntidadesClick = () => {
    navigate("/administracion/entidades");
  };

  return (
    <header className="w-full fixed top-0 left-0 z-50 bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-700 shadow-sm">
      <div className="w-full flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-8 cursor-pointer"
            onClick={() => navigate(isAuthenticated ? "/administracion/entidades" : "/principal")}
          />
        </div>

        {/* Barra de búsqueda 
        <div className="flex items-center gap-2">
          <Search
            renderButton={(open) => (
              <>
                
                <Button
                  onClick={open}
                  unstyled
                  className="h-8 w-64 justify-between gap-2 rounded-full border border-gray-200 px-3 text-xs-plus hover:border-gray-400 dark:border-dark-500 dark:hover:border-dark-400 max-sm:hidden"
                >
                  <div className="flex items-center gap-2">
                    <MagnifyingGlassIcon className="size-4" />
                    <span className="text-gray-400 dark:text-dark-300">
                      Buscar...
                    </span>
                  </div>
                  <SlashIcon />
                </Button>

                
                <Button
                  onClick={open}
                  variant="flat"
                  isIcon
                  className="relative size-9 rounded-full sm:hidden"
                >
                  <SearchIcon className="size-6 text-gray-900 dark:text-dark-100" />
                </Button>
              </>
            )}
          />
        </div>
        */}

        {/* Navegación + Notificaciones */}
        <div className="flex items-center space-x-6">
          <nav className="flex items-center space-x-6">
            <button className="flex flex-col items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              onClick={handleEntidadesClick}
            >
              <Building2 className="h-6 w-6" />
              <span className="sr-only">Entidades</span>
            </button>
            {role === "superadmin" && (
              <button
                className="flex flex-col items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                onClick={() => navigate("/administracion/users-datatable")}
              >
                <Users className="h-6 w-6" />
                <span className="sr-only">Usuarios</span>
              </button>
            )}
          </nav>

          {/* Notificaciones solo si está habilitado */}
          {showNotifications && isAuthenticated && (
            <div className="relative">
              <Notifications>
                <Button
                  variant="flat"
                  isIcon
                  className="relative size-9 rounded-full"
                >
                  <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  {/* Badge */}
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                </Button>
              </Notifications>
            </div>
          )}
          {/* Cerrar sesión solo si está autenticado */}
          {isAuthenticated && (
            <div className="relative">
              <Button
                variant="flat"
                isIcon
                className="relative size-9 rounded-full"
                onClick={handleLogout}
              >
                <LogOut className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                <span className="sr-only">Cerrar sesión</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
