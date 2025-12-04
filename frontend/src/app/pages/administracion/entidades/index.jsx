// Import Dependencies
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import axios from "utils/axios";
import NavBar from "app/layouts/MainLayout/NavBar";

// Local Imports
import BlogCard2 from "app/pages/prototypes/blog-card-2";
import { Page } from "components/shared/Page";
import { Banner } from "app/pages/dashboards/principal/Banner";
import Bienvenido from "app/pages/administracion/bienvenido";
import { useAuthContext } from "app/contexts/auth/context";


export default function EntidadesPage() {
  const navigate = useNavigate();
  const [entidades, setEntidades] = useState([]);
  const { isAuthenticated } = useAuthContext();

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

  const handleDeleted = (deletedId) => {
    setEntidades((prev) => prev.filter((e) => e.id !== deletedId));
  };

  return (
    <Page title="Entidades">
      <div className="w-full fixed top-0 left-0 z-50">
        <NavBar showNotifications />
      </div>

      <main className="pt-[65px] min-h-screen flex flex-col items-center bg-gray-50 dark:bg-dark-900 space-y-10 [overflow-anchor:none]">

        <section className="w-full">
          <Banner />
        </section>
        {isAuthenticated && <Bienvenido />}
        <BlogCard2
          data={entidades}
          onCardClick={(entidad) => navigate(`/administracion/entidades/${entidad.id}/anuncios`)}
          onDeleted={handleDeleted}
        />
      </main>
    </Page>
  );
}
