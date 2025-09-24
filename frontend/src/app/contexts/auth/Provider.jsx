// Import Dependencies
import { useEffect, useReducer } from "react";
import PropTypes from "prop-types";

// Local Imports
import axios from "utils/axios";
import { setSession } from "utils/jwt";
import { AuthContext } from "./context";

// ----------------------------------------------------------------------
const SESSION_DURATION = 180 * 60 * 1000; // 180 minutos en ms
let logoutTimer = null;


const initialState = {
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  errorMessage: null,
  user: null,
  role: null,
};

const reducerHandlers = {
  INITIALIZE: (state, action) => {
    const { isAuthenticated, user, role } = action.payload;
    return {
      ...state,
      isAuthenticated,
      isInitialized: true,
      user,
      role
    };
  },

  LOGIN_REQUEST: (state) => ({ ...state, isLoading: true, errorMessage: null }),

  LOGIN_SUCCESS: (state, action) => {
    const { user, role } = action.payload;
    return {
      ...state,
      isAuthenticated: true,
      isLoading: false,
      user,
      role
    };
  },

  LOGIN_ERROR: (state, action) => ({
    ...state,
    errorMessage: action.payload.errorMessage,
    isLoading: false,
  }),

  LOGOUT: (state) => ({
    ...state,
    isAuthenticated: false,
    user: null,
    role: null
  }),
};

const reducer = (state, action) => {
  const handler = reducerHandlers[action.type];
  return handler ? handler(state, action) : state;
};

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const authToken = sessionStorage.getItem("authToken");
    const lastActivity = sessionStorage.getItem("lastActivity");

    if (authToken && lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity, 10);

      if (elapsed < SESSION_DURATION) {
        // Reinyectar token en axios
        setSession(authToken);

        // Reprogramar cierre automático
        if (logoutTimer) clearTimeout(logoutTimer);
        logoutTimer = setTimeout(() => logout(), SESSION_DURATION - elapsed);

        // Decodificar token para reconstruir usuario
        const payload = JSON.parse(atob(authToken.split(".")[1]));
        const role = payload.role || "usuario";
        const user = {
          id: payload.user_id,
          username: payload.username,
          entidad_id: payload.entidad_id ?? null,
        };

        // Actualizar la hora de última actividad al refrescar
        sessionStorage.setItem("lastActivity", Date.now());

        dispatch({
          type: "INITIALIZE",
          payload: { isAuthenticated: true, user, role },
        });
        return;
      } else {
        logout();
      }
    }

    dispatch({
      type: "INITIALIZE",
      payload: { isAuthenticated: false, user: null, role: null },
    });
  }, []);

  // 🔥 Login contra Django SimpleJWT
  const login = async ({ username, password }) => {
    dispatch({ type: "LOGIN_REQUEST" });

    try {
      const resp = await axios.post("http://localhost:8000/api/token/", {
        username,
        password,
      });

      const { access, refresh, role } = resp.data;
      if (!access) throw new Error("Token inválido");

      setSession(access);
      sessionStorage.setItem("refreshToken", refresh);
      sessionStorage.setItem("lastActivity", Date.now());

      // Decodificar token solo para otros datos (user_id, username, etc.)
      const payload = JSON.parse(atob(access.split(".")[1]));
      const user = {
        id: payload.user_id,
        username: payload.username,
        entidad_id: payload.entidad_id ?? null,
      };

      // Usar el role devuelto por el backend (si existe)
      const finalRole = role || payload.role || "usuario";

      // Programar cierre automático
      if (logoutTimer) clearTimeout(logoutTimer);
      logoutTimer = setTimeout(() => logout(), SESSION_DURATION);

      dispatch({ type: "LOGIN_SUCCESS", payload: { user, role: finalRole } });
      console.log("ROL desde backend:", finalRole); // 👈 ahora sí
      return finalRole;
    } catch (err) {
      dispatch({
        type: "LOGIN_ERROR",
        payload: {
          errorMessage:
            err.response?.data || err.message || "Login error",
        },
      });
      throw err;
    }
  };

  const logout = () => {
    if (logoutTimer) clearTimeout(logoutTimer);
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("lastActivity");
    setSession(null);
    dispatch({ type: "LOGOUT" });
  };

  if (!children) return null;

  return (
    <AuthContext value={{ ...state, login, logout }}>
      {children}
    </AuthContext>
  );
}

AuthProvider.propTypes = { children: PropTypes.node };
