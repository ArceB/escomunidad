import PropTypes from "prop-types";

// 👇 1. Importa los iconos y el Card
import { FaFacebook, FaTwitter } from "react-icons/fa";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { Card } from "components/ui";

// ... (Aquí va tu función getStatusInfo que ya tienes)
const getStatusInfo = (fechaFin) => {
  if (!fechaFin) {
    return { text: "Vigente", colorClass: "bg-green-600 text-white" };
  }
  const hoy = new Date();
  const fechaFinal = new Date(fechaFin + "T23:59:59");
  const sieteDias = new Date();
  sieteDias.setDate(hoy.getDate() + 7);

  if (hoy > fechaFinal) {
    return { text: "Vencido", colorClass: "bg-red-600 text-white" };
  }
  if (fechaFinal <= sieteDias) {
    return { text: "Por Vencer", colorClass: "bg-yellow-400 text-gray-800" };
  }
  return { text: "Vigente", colorClass: "bg-green-600 text-white" };
};



export function PostContent({ anuncio }) {
  
  const status = getStatusInfo(anuncio.fecha_fin);
  const shareUrl = window.location.href; 
  const shareTitle = anuncio.titulo;

  return (

    // 👇 2. Reemplazamos el 'div' por un 'Card' con padding
    <Card className="p-4 sm:p-6 lg:p-8">
      
      {/* --- Banner (Movido al inicio) --- */}
      {anuncio.banner && (
        <img
          className="mb-5 h-80 w-full rounded-lg object-cover object-center"
          src={anuncio.banner}
          alt={anuncio.titulo}
        />

      )}

      {/* --- Encabezado: Título y Semáforo --- */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-50 lg:text-3xl">
          {anuncio.titulo}
        </h1>
        {status && (
          // Añadimos 'shrink-0' para que no se rompa en pantallas pequeñas
          <span 
            className={`text-sm font-semibold px-3 py-1 rounded-full ${status.colorClass} shrink-0`}
          >
            {status.text}
          </span>
        )}
      </div>

      {/* --- Frase (Subtítulo) --- */}
      <h3 className="mt-1 text-lg italic text-gray-600 dark:text-dark-200">
        &ldquo;{anuncio.frase}&rdquo;
      </h3>

      {/* --- Descripción --- */}
      {anuncio.descripcion && (
        <div
          // Añadimos borde superior y quitamos 'max-w-none' si no es necesario
          className="mt-6 pt-6 border-t dark:border-gray-700 prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: anuncio.descripcion }}
        />
      )}


      {/* --- Sección de Archivos y Redes (Juntas) --- */}
      <div className="mt-8 pt-6 border-t dark:border-gray-700 space-y-6">
        
        {/* PDF Link (con mejor estilo) */}
        {anuncio.archivo_pdf && (
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-dark-100 mb-3">
              Documento Adjunto
            </h4>
            <a
              href={anuncio.archivo_pdf}
              target="_blank"
              rel="noopener noreferrer"
              // Le añadimos un icono y mejoramos el hover
              className="inline-flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700"
            >
              <DocumentTextIcon className="size-5" />
              <span>Ver documento PDF</span>
            </a>
          </div>
        )}

        {/* Social Links */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-dark-100">
            Compartir en redes
          </h4>
          <div className="flex items-center gap-4 mt-3">
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Compartir en Facebook"
              className="text-gray-500 hover:text-blue-600 transition-colors"
            >
              <FaFacebook size={28} />
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Compartir en X"
              className="text-gray-500 hover:text-black dark:hover:text-white transition-colors"
            >
              <FaTwitter size={28} />
            </a>
          </div>

        </div>
      </div>

    </Card> // <-- Cerramos el Card
  );
}

// ... (Tus PropTypes se quedan igual)
PostContent.propTypes = {
  anuncio: PropTypes.shape({
    titulo: PropTypes.string,
    frase: PropTypes.string,
    descripcion: PropTypes.string,
    banner: PropTypes.string,
    archivo_pdf: PropTypes.string,
    fecha_inicio: PropTypes.string,
    fecha_fin: PropTypes.string,
  }),
};