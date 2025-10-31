// Import Dependencies
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import axios from "utils/axios";
import { useNavigate } from "react-router";

// Local Imports
import { Card } from "components/ui";

// ----------------------------------------------------------------------

export function RecentArticles({ entidadId }) {
  const [anuncios, setAnuncios] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnuncios = async () => {
      try {
        let url = "/anuncios/public/";
        if (entidadId) {
          // ✅ Solo los aprobados y con entidad específica
          url = `/anuncios/?entidad_id=${entidadId}&estado=aprobado`;
        }

        const res = await axios.get(url);
        let data = res.data;

        // 🔹 Filtramos por anuncios aprobados con banner
        data = data
          .filter((a) => a.estado === "aprobado" && a.banner)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5); // los 5 más recientes

        setAnuncios(data);
      } catch (err) {
        console.error("Error cargando anuncios recientes:", err);
      }
    };

    fetchAnuncios();
  }, [entidadId]);

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between">
        <p className="text-lg font-medium text-gray-800 dark:text-dark-100">
          Anuncios Recientes
        </p>
        <button
          onClick={() => navigate("/administracion/anuncios-todos")}
          className="border-b border-dotted border-current pb-0.5 text-xs-plus font-medium text-primary-600 outline-hidden transition-colors duration-300 hover:text-primary-600/70 focus:text-primary-600/70 dark:text-primary-400 dark:hover:text-primary-400/70 dark:focus:text-primary-400/70"
        >
          Ver todos
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-1 lg:gap-6">
        {anuncios.map((a) => (
          <PostCard
            key={a.id}
            anuncio={a}
            cover={a.banner}
            category={a.entidad?.nombre || "Entidad desconocida"}
            title={a.titulo}
            description={a.frase || "Sin frase destacada"}
            author_name={a.fecha_inicio || "—"}
            created_at={a.fecha_fin || "—"}
            onClick={() => navigate(`/administracion/anuncios/${a.id}`)}
          />
        ))}

        {anuncios.length === 0 && (
          <p className="text-gray-500 text-sm mt-3">
            No hay anuncios aprobados recientes.
          </p>
        )}
      </div>
    </div>
  );
}

function PostCard({
  cover,
  category,
  title,
  description,
  author_name,
  created_at,
  onClick,
}) {
  return (
    <Card
      className="flex flex-col lg:flex-row cursor-pointer transition hover:shadow-md"
      onClick={onClick}
    >
      <div className="relative h-48 w-full shrink-0 lg:h-auto lg:w-48">
        <img
          className="h-48 w-full rounded-t-lg object-cover object-center lg:h-full lg:ltr:rounded-l-lg lg:ltr:rounded-tr-none lg:rtl:rounded-r-lg lg:rtl:rounded-tl-none"
          src={cover || "/images/800x600.png"}
          alt={title}
        />
      </div>
      <div className="flex w-full grow flex-col p-4 sm:px-5">
        <div className="-mt-2 flex items-center justify-between">
          <span className="text-xs-plus text-info dark:text-info-lighter">
            {category}
          </span>
        </div>
        <div>
          <p className="text-lg font-medium text-gray-700 hover:text-primary-600 dark:text-dark-100">
            {title}
          </p>
        </div>
        <p className="mt-1 line-clamp-3">{description}</p>
        <div className="mt-4 grow">
          <div className="flex items-center text-xs text-gray-400 dark:text-dark-300">
            <span>{author_name}</span>
            <div className="mx-3 my-1 w-px self-stretch bg-gray-200 dark:bg-dark-500"></div>
            <span>{created_at}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

PostCard.propTypes = {
  cover: PropTypes.string,
  category: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  author_name: PropTypes.string, // fecha inicio
  created_at: PropTypes.string, // fecha fin
  onClick: PropTypes.func,
};
