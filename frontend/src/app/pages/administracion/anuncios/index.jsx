// src/app/pages/administracion/anuncios/index.jsx

import { useNavigate, useParams } from "react-router";
import NavBar from "app/layouts/MainLayout/NavBar";

// Local Imports
import BlogCard7 from "app/pages/prototypes/blog-card-7";
import { Page } from "components/shared/Page";
import { Banner } from "app/pages/dashboards/principal/Banner";

// ----------------------------------------------------------------------

export default function AnunciosPage() {
  const navigate = useNavigate();
  const { id: entidadId } = useParams();

  return (
    <Page title="Anuncios">
      <div className="w-full fixed top-0 left-0 z-50">
        <NavBar showNotifications />
      </div>
      
      <main className="pt-[65px] min-h-screen flex flex-col items-center bg-gray-50 dark:bg-dark-900 space-y-10 [overflow-anchor:none]">
        <section className="w-full">
          <Banner entidadId={entidadId} />
        </section>
        <BlogCard7
          entidadId={entidadId}
          onCardClick={(anuncio) =>
            navigate(`/administracion/anuncios/${anuncio.id}`)
          }
        />
      </main>
    </Page>
  );
}
