import axios from "axios";
import { JWT_HOST_API } from "configs/auth.config";

const axiosInstance = axios.create({
  baseURL: JWT_HOST_API,
});

// 🔹 Interceptor para agregar el access token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔹 Interceptor para manejar tokens expirados y renovarlos automáticamente
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es por token expirado y no hemos intentado renovar aún
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      sessionStorage.getItem("refreshToken")
    ) {
      originalRequest._retry = true;
      try {
        // Pedimos un nuevo access token usando el refresh token
        const resp = await axios.post(`${JWT_HOST_API}/token/refresh/`, {
          refresh: sessionStorage.getItem("refreshToken"),
        });

        const newAccess = resp.data.access;
        if (newAccess) {
          // Guardar y aplicar el nuevo token
          sessionStorage.setItem("authToken", newAccess);
          sessionStorage.setItem("lastActivity", Date.now());

          axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${newAccess}`;
          originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;

          console.log("🔄 Token renovado automáticamente");

          // Repetimos la petición original con el nuevo token
          return axiosInstance(originalRequest);
        }
      } catch (err) {
        console.error("❌ Error al refrescar el token:", err);
        sessionStorage.clear();
        window.location.href = "/escomunidad-admin-panel"; // redirige al login
      }
    }

    return Promise.reject(
      (error.response && error.response.data) || "Something went wrong"
    );
  }
);

export default axiosInstance;
