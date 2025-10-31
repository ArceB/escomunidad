// Import Dependencies
import { useParams } from "react-router";
import { useEffect, useState } from "react";
import axios from "axios";
import NavBar from "app/layouts/MainLayout/NavBar";
import { Card } from "components/ui";

// Local Imports
import { Page } from "components/shared/Page";
import { PostContent } from "app/pages/prototypes/post-details/PostContent";
import { RecentArticles } from "app/pages/prototypes/post-details/RecentArticles";
import { PostHeader } from "app/pages/prototypes/post-details/PostHeader";
import { useAuthContext } from "app/contexts/auth/context";

// ----------------------------------------------------------------------

export default function PublicacionPage() {
  const { anuncioId } = useParams();
  const [anuncio, setAnuncio] = useState(null);
  const [loading, setLoading] = useState(true);

  const { isAuthenticated } = useAuthContext();

  useEffect(() => {
    const fetchAnuncio = async () => {
      try {
        const token = sessionStorage.getItem("authToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(
          `http://localhost:8000/api/anuncios/${anuncioId}/`,
          { headers }
        );
        setAnuncio(res.data);
      } catch (err) {
        console.error("Error al cargar el anuncio:", err);
      } finally {
        setLoading(false);
      }
    };
    if (anuncioId) {
      fetchAnuncio();
    }
  }, [anuncioId]);

  if (loading) return <p>Cargando anuncio...</p>;

  

  if (loading) return <p>Cargando anuncio...</p>;
  const estado = anuncio ? anuncio.estado : "pendiente";

  return (
    <Page title="Administración - Publicación">
      <NavBar showNotifications />

      <main className="transition-content w-full px-(--margin-x) pt-24 pb-8">
        <Card className="p-4 lg:p-6">
          <PostHeader
            anuncioId={anuncioId}
            onStatusChange={(action) => {
              setAnuncio(prev => ({ ...prev, estado: action === "aprobar" ? "aprobado" : "rechazado" }));
            }}
            estado={estado} />
          {anuncio ? (
            <PostContent anuncio={anuncio} />
          ) : (
            <p>No se encontró el anuncio.</p>
          )}
        </Card>
        {!isAuthenticated && <RecentArticles />}
      </main>
    </Page>
  );
}
