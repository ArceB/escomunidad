// Import Dependencies
import { useParams } from "react-router";
import { useEffect, useState } from "react";
import axios from "axios";
import NavBar from "app/layouts/MainLayout/NavBar";

// Local Imports
import { Page } from "components/shared/Page";
import { PostContent } from "app/pages/prototypes/post-details/PostContent";

// ----------------------------------------------------------------------

export default function PublicacionPage() {
  const { anuncioId } = useParams(); // 👈 solo anuncioId
  const [anuncio, setAnuncio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnuncio = async () => {
      try {
        const token = sessionStorage.getItem("authToken"); // 👈 aquí se define token
        const res = await axios.get(
          `http://localhost:8000/api/anuncios/${anuncioId}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setAnuncio(res.data);
      } catch (err) {
        console.error("Error al cargar el anuncio:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnuncio();
  }, [anuncioId]);

  return (
    <Page title="Administración - Publicación">
      <NavBar showNotifications />

      <main className="transition-content w-full px-(--margin-x) pt-24 pb-8">
        {loading ? (
          <p>Cargando anuncio...</p>
        ) : anuncio ? (
          <PostContent anuncio={anuncio} />
        ) : (
          <p>No se encontró el anuncio.</p>
        )}
      </main>
    </Page>
  );
}
