// src/app/pages/administracion/anuncios/index.jsx

import { useNavigate, useParams, useLocation } from "react-router";
import NavBar from "app/layouts/MainLayout/NavBar";
import { useEffect, useState } from "react";

// Local Imports
import BlogCard7 from "app/pages/prototypes/blog-card-7";
import { Page } from "components/shared/Page";
import { Banner } from "app/pages/dashboards/principal/Banner";
import axios from "utils/axios";

// ----------------------------------------------------------------------

export default function AnunciosPage() {
  const navigate = useNavigate();
  const { id: entidadId } = useParams();
  const location = useLocation();

  const mostrandoPendientes = location.pathname.includes("pendientes");
  const mostrandoRechazados = location.pathname.includes("rechazados");

  const [entidades, setEntidades] = useState([]);
  
    useEffect(() => {
      const fetchEntidades = async () => {
        try {
          const res = await axios.get("/entidades/"); // 👈 endpoint real
          setEntidades(res.data);
        } catch (err) {
          console.error("Error cargando entidades:", err);
        }
      };
      fetchEntidades();
    }, []);

  return (
    <Page title={mostrandoPendientes ? "Anuncios Pendientes" : "Anuncios"}>
      <div className="w-full fixed top-0 left-0 z-50">
        <NavBar showNotifications />
      </div>
      
      <main className="pt-[65px] min-h-screen flex flex-col items-center bg-gray-50 dark:bg-dark-900 space-y-10 [overflow-anchor:none]">
        {!mostrandoPendientes && !mostrandoRechazados &&(
          <section className="w-full">
            <Banner entidadId={entidadId} />
          </section>
        )}

        <BlogCard7
          entidadId={entidadId}
          data={entidades}
          mostrandoPendientes={mostrandoPendientes}
          onCardClick={(anuncio) =>
            navigate(`/administracion/anuncios/${anuncio.id}`)
          }
        />
      </main>
    </Page>
  );
}
