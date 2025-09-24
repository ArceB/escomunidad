// src/app/pages/administracion/anuncios/index.jsx

import { useNavigate } from "react-router";
import NavBar from "app/layouts/MainLayout/NavBar";

// Local Imports
import BlogCard7 from "app/pages/prototypes/blog-card-7";
import { Page } from "components/shared/Page";

// ----------------------------------------------------------------------

export default function AnunciosPage() {
  const navigate = useNavigate();

  return (
    <Page title="Anuncios">
      <NavBar showNotifications />
      <main className="pt-20 px-6">
        <BlogCard7
        onCardClick={(anuncio) =>
          navigate(`/administracion/anuncios/${anuncio.id}`)
        }
        />
      </main>
    </Page>
  );
}
