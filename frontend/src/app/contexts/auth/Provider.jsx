// Import Dependencies
import { useEffect, useReducer } from "react";
import PropTypes from "prop-types";

// Local Imports
import axios from "utils/axios";
import { setSession } from "utils/jwt";
import { AuthContext } from "./context";

// ----------------------------------------------------------------------

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
    // ✅ Al iniciar, NO auto-logueamos aunque exista token.
    // Solo reinyectamos el token en axios si estuviera, para llamadas abiertas.
    const authToken = sessionStorage.getItem("authToken");
    if (authToken) setSession(authToken);

    dispatch({
      type: "INITIALIZE",
      payload: { isAuthenticated: false, user: null, role: null },
    });
  }, []);

  // 🔥 Login contra Django SimpleJWT
  const login = async ({ username, password }) => {
    dispatch({ type: "LOGIN_REQUEST" });

    try {
      // Ajusta si tu backend usa otra ruta
      const resp = await axios.post("http://localhost:8000/api/token/", {
        username,
        password,
      });

      const { access } = resp.data;
      if (!access) throw new Error("Token inválido");

      setSession(access);

      // Decodificar token para leer claims (role, username, etc.)
      const payload = JSON.parse(atob(access.split(".")[1]));
      const role = payload.role || "usuario";
      const user = {
        id: payload.user_id,
        username: payload.username,
        entidad_id: payload.entidad_id ?? null,
      };

      dispatch({ type: "LOGIN_SUCCESS", payload: { user, role } });
      return role; // 👉 el login page lo usa para redirigir
    } catch (err) {
      dispatch({
        type: "LOGIN_ERROR",
        payload: { errorMessage: err.response?.data || err.message || "Login error" },
      });
      throw err;
    }
  };

  const logout = async () => {
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
