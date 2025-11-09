// src/app/pages/administracion/todos-anuncios/index.jsx

import { useNavigate } from "react-router";
import NavBar from "app/layouts/MainLayout/NavBar";

// Local Imports
import BlogCard1 from "app/pages/prototypes/blog-card-1";
import { Page } from "components/shared/Page";

// ----------------------------------------------------------------------

export default function AllAnunciosPage() {
  const navigate = useNavigate();

  return (
    <Page title="Todos los Anuncios">
      {/* Barra de navegación fija */}
      <div className="w-full fixed top-0 left-0 z-50">
        <NavBar showNotifications />
      </div>

      {/* Contenido principal */}
      <main className="pt-[65px] min-h-screen flex flex-col items-center bg-gray-50 dark:bg-dark-900 space-y-10 [overflow-anchor:none]">
        <section className="w-full">
          {/* BlogCard1 con navegación a detalle */}
          <BlogCard1
            onCardClick={(anuncio) =>
              navigate(`/administracion/anuncios/${anuncio.id}`)
            }
          />
        </section>
      </main>
    </Page>
  );
}
