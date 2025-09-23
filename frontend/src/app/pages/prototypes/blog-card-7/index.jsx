import { useEffect, useState } from "react";
import { useParams } from "react-router";
import axios from "utils/axios";

// Local Imports
import { Page } from "components/shared/Page";
import { Toolbar } from "./Toolbar";
import { PostCard } from "./PostCard";
import { useFuse } from "hooks";

// ----------------------------------------------------------------------

export default function BlogCard7({ onCardClick }) {
  const { id: entidadId } = useParams(); // 👈 el parámetro de la ruta
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchAnuncios = async () => {
      try {
        const token = sessionStorage.getItem("authToken");
        const res = await axios.get(
          `/anuncios/?entidad_id=${entidadId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPosts(res.data); // 👈 anuncios obtenidos de la API
      } catch (err) {
        console.error("Error cargando anuncios:", err);
      }
    };

    if (entidadId) fetchAnuncios();
  }, [entidadId]);

  // 🔍 Buscador Fuse.js
  const { result: filteredPosts, query, setQuery } = useFuse(posts, {
    keys: ["titulo", "frase", "descripcion"],
    threshold: 0.2,
    matchAllOnEmptyQuery: true,
  });

  return (
    <Page title="Anuncios">
      <div className="transition-content w-full px-(--margin-x) pb-8">
        <Toolbar setQuery={setQuery} query={query} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
          {filteredPosts.map(({ item: anuncio }) => (
            <div
              key={anuncio.id}
              onClick={() => onCardClick?.(anuncio)}
              className="cursor-pointer"
            >
              <PostCard
                cover={anuncio.banner || "/images/800x600.png"} // fallback
                category={anuncio.fecha_inicio}
                created_at={anuncio.fecha_fin}
                title={anuncio.titulo}
                description={anuncio.frase}
                likes={anuncio.likes || 0}
                query={query}
              />
            </div>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <p className="text-center text-gray-500 mt-10">
            No hay anuncios para esta entidad.
          </p>
        )}
      </div>
    </Page>
  );
}
