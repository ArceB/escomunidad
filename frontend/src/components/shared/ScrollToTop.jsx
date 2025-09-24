// src/components/shared/ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resetea el scroll al cambiar de ruta y desactiva la
 * restauración automática del navegador.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  // Evita que el navegador restaure el scroll en recargas/navegaciones
  useEffect(() => {
    const prev = window.history.scrollRestoration;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    return () => {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = prev || "auto";
      }
    };
  }, []);

  // Al cambiar la ruta, sube al tope (si no hay hash/anchor)
  useEffect(() => {
    if (hash) return; // si navegas a #id, deja que el navegador haga scroll al ancla
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
}
