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
  const { id: entidadId } = useParams();
  const [posts, setPosts] = useState([]);

  const fetchAnuncios = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      let url = `/anuncios/?entidad_id=${entidadId}`;

      const path = window.location.pathname;
      if (path.includes("pendientes-usuario")) {
        url += "&estado=pendiente&propios=true"; // 👈 parámetro extra
      } else if (path.includes("pendientes")) {
        url += "&estado=pendiente";
      } else if (path.includes("rechazados")) {
        url += "&estado=rechazado";
      } else {
        url += "&estado=aprobado";
      }
      console.log("Solicitando anuncios desde:", url);
      const res = await axios.get(url, { headers });
      setPosts(res.data);
    } catch (err) {
      console.error("Error cargando anuncios:", err);
    }
  };

  useEffect(() => {
    if (entidadId) fetchAnuncios();
  }, [entidadId, window.location.pathname]);

  // 🔍 Buscador Fuse.js
  const { result: filteredPosts, query, setQuery } = useFuse(posts, {
    keys: ["titulo", "frase", "descripcion"],
    threshold: 0.2,
    matchAllOnEmptyQuery: true,
  });

  return (
    <Page title="Anuncios">
      <div className="transition-content w-full px-(--margin-x) pb-8">
        <Toolbar
          setQuery={setQuery}
          query={query}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
          {filteredPosts.map((f) => {
            const anuncio = f.item; // Asegúrate de usar f.item
            return (
              <div
                key={anuncio.id}
                onClick={() => onCardClick?.(anuncio)}
                className="cursor-pointer"
              >
                <PostCard
                  anuncio={anuncio} // Pasamos el objeto completo para el modal/editar
                  cover={anuncio.banner || "/images/800x600.png"}
                  category={anuncio.fecha_inicio}
                  created_at={anuncio.fecha_fin}
                  title={anuncio.titulo}
                  description={anuncio.frase}
                  likes={anuncio.likes || 0}
                  query={query}
                />
              </div>
            );
          })}

        </div>

        {filteredPosts.length === 0 && (
          <p className="text-center text-gray-500 mt-10">
            {window.location.pathname.includes("pendientes")
              ? "No hay anuncios pendientes de revisión."
              : window.location.pathname.includes("rechazados")
                ? "No hay anuncios rechazados."
                : "No hay anuncios para esta entidad."}
          </p>
        )}

      </div>
    </Page>
  );
}
