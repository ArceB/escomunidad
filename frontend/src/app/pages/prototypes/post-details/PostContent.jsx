import PropTypes from "prop-types";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";

import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { Building2 } from "lucide-react";
import axios from "utils/axios";

import Bienvenido from "app/pages/administracion/bienvenido";
import { useAuthContext } from "app/contexts/auth/context";


export function PostContent({ anuncio }) {
  const navigate = useNavigate();
  const [entidad, setEntidad] = useState(null);
  const { isAuthenticated } = useAuthContext();

  // 🔥 Cargar entidad usando anuncio.entidad_id
  useEffect(() => {
    if (!anuncio?.entidad_id) return;

    const fetchEntidad = async () => {
      try {
        const res = await axios.get(`/entidades/${anuncio.entidad_id}/`);
        setEntidad(res.data);
      } catch (err) {
        console.error("Error cargando entidad:", err);
      }
    };

    fetchEntidad();
  }, [anuncio?.entidad_id]);

  return (
    <div className="mt-6 text-base text-gray-600 dark:text-dark-200">
      <div className="flex items-center space-x-2 mb-10">
        {isAuthenticated && <Bienvenido />}
      </div>

      {/* 🔵 Breadcrumb */}
      <div className="flex items-center space-x-2 mb-4">

        {/* Ícono tipo "Entidades" */}
        <button
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
          onClick={() => navigate("/administracion/entidades")}
        >
          <Building2 className="h-5 w-5" />
        </button>
        <span className="text-gray-400">/</span>

        {/* Nombre de la entidad -> CLICK para ir a anuncios de esa entidad */}
        <button
          className="truncate text-lg font-medium text-gray-700 dark:text-dark-50 hover:text-blue-600 dark:hover:text-blue-400"
          onClick={() => navigate(`/administracion/entidades/${entidad?.id}/anuncios`)}
        >
          {entidad ? entidad.nombre : "Entidad"}
        </button>

        {/* / separador */}
        <span className="text-gray-400">/</span>

        {/* Nombre del anuncio */}
        <span className="truncate text-lg font-medium text-gray-700 dark:text-dark-50">
          {anuncio.titulo}
        </span>
      </div>


      <h1 className="text-3xl font-medium text-gray-900 dark:text-dark-50 lg:text-4xl">
        {anuncio.titulo}
      </h1>
      {anuncio.fecha_inicio && anuncio.fecha_fin && (
        <p className="mt-3 text-xs">
          {anuncio.fecha_inicio}&nbsp;&nbsp;&nbsp;&nbsp;||&nbsp;&nbsp;&nbsp;&nbsp;{anuncio.fecha_fin}&nbsp;&nbsp;&nbsp;
        </p>
      )}
      <h3 className="mt-3">{anuncio.frase}</h3>


      {anuncio.banner && (
        <section className="mt-5 relative w-full aspect-[19/6] overflow-hidden">
          <img
            className="w-full rounded-lg object-cover object-center "
            src={anuncio.banner}
            alt={anuncio.titulo}
          />
        </section>
      )}

      {anuncio.descripcion && (
        <div
          className="mt-5 prose dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: anuncio.descripcion }}
        />
      )}
      {anuncio.archivo_pdf && (
        <div className="mt-6 flex items-center">
          <DocumentTextIcon className="mr-2 size-6 text-primary-600 dark:text-primary-400" />
          <a
            href={anuncio.archivo_pdf}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 underline"
          >
            {anuncio.titulo} PDF
          </a>
        </div>
      )}
    </div>
  );
}
PostContent.propTypes = {
  anuncio: PropTypes.shape({
    titulo: PropTypes.string,
    frase: PropTypes.string,
    descripcion: PropTypes.string, // guardada como HTML desde el editor
    banner: PropTypes.string,
    archivo_pdf: PropTypes.string,

  }),
};