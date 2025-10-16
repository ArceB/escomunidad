import PropTypes from "prop-types";
import {  DocumentTextIcon } from "@heroicons/react/24/outline";

export function PostContent({ anuncio }) {
  return (
    <div className="mt-6 text-base text-gray-600 dark:text-dark-200">
      <h1 className="text-xl font-medium text-gray-900 dark:text-dark-50 lg:text-2xl">
        {anuncio.titulo}
      </h1>
      <h3 className="mt-1">{anuncio.frase}</h3>
      
      {anuncio.banner && (
        <img
          className="mt-5 h-80 w-full rounded-lg object-cover object-center"
          src={anuncio.banner}
          alt={anuncio.titulo}
        />
      )}

      {anuncio.descripcion && (
        <div
          className="mt-4 prose dark:prose-invert"
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
            Ver documento PDF
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
