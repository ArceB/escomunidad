// Import Dependencies
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import axios from "utils/axios";
import NavBar from "app/layouts/MainLayout/NavBar";

// Local Imports
import BlogCard5 from "app/pages/prototypes/blog-card-5";
import { Page } from "components/shared/Page";
import { Banner } from "app/pages/dashboards/principal/Banner";

export default function EntidadesPage() {
  const navigate = useNavigate();
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

  const handleDeleted = (deletedId) => {
    setEntidades((prev) => prev.filter((e) => e.id !== deletedId));
  };

  return (
    <Page title="Entidades">
      <NavBar showNotifications />

      <main className="pt-20 px-6">

        <section className="w-full">
          <Banner />
        </section>
        <BlogCard5
          data={entidades}
          onCardClick={(entidad) => navigate(`/administracion/entidades/${entidad.id}/anuncios`)}
          onDeleted={handleDeleted}
        />
      </main>
    </Page>
  );
}
