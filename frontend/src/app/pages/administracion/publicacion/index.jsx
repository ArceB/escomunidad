// Import Dependencies
import { useParams } from "react-router";
import { useEffect, useState } from "react";
import axios from "axios";
import NavBar from "app/layouts/MainLayout/NavBar";
import { Card } from "components/ui";
import { Helmet } from "react-helmet-async";


// Local Imports
import { Page } from "components/shared/Page";
import { PostContent } from "app/pages/prototypes/post-details/PostContent";
import { RecentArticles } from "app/pages/prototypes/post-details/RecentArticles";
import { PostHeader } from "app/pages/prototypes/post-details/PostHeader";
import { useAuthContext } from "app/contexts/auth/context";
import RechazoDrawer from "app/pages/components/drawer/RechazoDrawer";
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
          `http://https://backend-ec72.onrender.com/api/anuncios/${anuncioId}/`,
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

  const estado = anuncio ? anuncio.estado : "pendiente";

  return (
    <>
      {anuncio && (
        <Helmet>
          <title>{anuncio.titulo} | Escomunidad</title>
          <meta property="og:title" content={anuncio.titulo} />
          <meta property="og:description" content={anuncio.frase || "Consulta este anuncio importante"} />
          <meta property="og:image" content={anuncio.banner || "/default-banner.png"} />
          <meta property="og:url" content={window.location.href} />
          <meta property="og:type" content="article" />
        </Helmet>
      )}
      <Page title="Administración - Publicación">
        <NavBar showNotifications />
        <main className="transition-content w-full px-(--margin-x) pt-24 pb-8">
          <Card className="p-4 lg:p-6">
            
            {anuncio ? (
              <PostContent anuncio={anuncio} />
            ) : (
              <p>No se encontró el anuncio.</p>
            )}
            <PostHeader
              anuncio={anuncio}
              onStatusChange={(action) => {
                setAnuncio((prev) => ({
                  ...prev,
                  estado: action === "aprobar" ? "aprobado" : "rechazado",
                }));
              }}
              estado={estado}
            />
          </Card>

          {!isAuthenticated && <RecentArticles />}
        </main>
        {/* ✅ Drawer de comentarios de rechazo */}
        {anuncio?.estado === "rechazado" && (
          <RechazoDrawer
            comentario={anuncio.comentarios_rechazo}
            titulo={anuncio.titulo}
          />
        )}
      </Page>
    </>
  );
}