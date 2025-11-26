// src/app/pages/prototypes/blog-card-1/index.jsx

import { useEffect, useState } from "react";
import axios from "utils/axios";
import { useNavigate } from "react-router";

// Local Imports
import { Page } from "components/shared/Page";
import { Toolbar } from "./Toolbar";
import { PostCard } from "./PostCard";
import { useFuse } from "hooks";

// ----------------------------------------------------------------------

export default function BlogCard1({ onCardClick }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);

  const fetchAnuncios = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // 🔹 Obtener todos los anuncios aprobados
      const res = await axios.get(`/anuncios/?estado=aprobado`, { headers });

      const data = res.data.filter((a) => a.estado === "aprobado");
      setPosts(data);
    } catch (err) {
      console.error("❌ Error cargando anuncios:", err);
    }
  };

  useEffect(() => {
    fetchAnuncios();
  }, []);

  // 🔍 Buscador con Fuse.js
  const { result: filteredPosts, query, setQuery } = useFuse(posts, {
    keys: ["titulo", "frase", "entidad.nombre"],
    threshold: 0.2,
    matchAllOnEmptyQuery: true,
  });

  return (
    <Page title="Todos los Anuncios">
      <div className="transition-content w-full px-(--margin-x) pb-8">
        {/* Barra de herramientas con búsqueda */}
        <Toolbar setQuery={setQuery} query={query} />

        {/* Tarjetas */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6">
          {filteredPosts
            .sort((a, b) => {
              const dateA = new Date(a.item.created_at || a.item.fecha_inicio);
              const dateB = new Date(b.item.created_at || b.item.fecha_inicio);
              return dateB - dateA; // 🔥 Más reciente primero
            })
            .map(({ item: anuncio, refIndex }) => (

              <div
                key={refIndex}
                onClick={() => onCardClick?.(anuncio)}
                className="cursor-pointer"
              >
                <PostCard
                  cover={anuncio.banner || "/images/800x600.png"}
                  category={anuncio.entidad_nombre || "Entidad desconocida"}
                  title={anuncio.titulo}
                  description={anuncio.frase || "Sin descripción disponible."}
                  author_name={anuncio.fecha_inicio || "—"}
                  created_at={anuncio.fecha_fin || "—"}
                  query={query}
                  onCategoryClick={() =>
                    navigate(`/administracion/entidades/${anuncio.entidad_id}/anuncios`)
                  }
                />
              </div>
            ))}
        </div>

        {/* Mensaje si no hay resultados */}
        {filteredPosts.length === 0 && (
          <p className="text-center text-gray-500 mt-10">
            No hay anuncios aprobados disponibles.
          </p>
        )}
      </div>
    </Page>
  );
}
