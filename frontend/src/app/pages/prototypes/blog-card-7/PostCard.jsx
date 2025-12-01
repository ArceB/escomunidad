// Import Dependencies
import PropTypes from "prop-types";
import { EditIcon, TrashIcon } from 'lucide-react';

// Local Imports
import { Highlight } from "components/shared/Highlight";
import { Button, Card } from "components/ui";

import { useAuthContext } from "app/contexts/auth/context";
import { useNavigate } from "react-router";
import { useState } from "react";

import { DeleteAnnouncementModal } from "app/pages/components/modal/DeleteAnnouncementModal";
import { ShowCommentModal } from "app/pages/components/modal/ShowCommentModal";

// ----------------------------------------------------------------------

export function PostCard({ anuncio, cover, category, created_at, title, description, query, }) {
  const { role } = useAuthContext();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);

  const navigate = useNavigate();

  return (
    <Card className="flex flex-col">
      <img
        src={cover}
        className=" w-full rounded-t-lg object-cover object-center aspect-[19/6]"
        alt={title}
      />
      <div className="flex grow flex-col p-4">
        <div className="flex">
          <a
            className="text-tiny-plus text-gray-400 dark:text-dark-300"
          >
            <Highlight query={String(query || "")}>{String(category || "")}</Highlight>
          </a>
          <div className="mx-2 my-0.5 w-px bg-gray-200 dark:bg-dark-500"></div>
          <span className="text-tiny-plus text-gray-400 dark:text-dark-300">
            {created_at}
          </span>
        </div>
        <div className="flex line-clamp-2 pt-2">
          <a
            className="text-base font-bold text-gray-700 hover:text-primary-600 focus:text-primary-600 dark:text-dark-100 dark:hover:text-primary-400 dark:focus:text-primary-400"
          >
            <Highlight query={String(query || "")}>{String(title || "")}</Highlight>
          </a>
        </div>
        <p className="grow pt-2">{description}</p>

        {(role === "superadmin" || role === "admin" || role === "responsable") && (
          <div className="mt-3 text-end">
            <Button
              data-tooltip
              data-tooltip-content="Editar"
              unstyled
              className="size-7 rounded-full hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/administracion/entidades/${anuncio.entidad}/anuncios/${anuncio.id}/editar`);
              }}
            >
              <EditIcon className="size-4.5 stroke-2 stroke-blue-800" />
            </Button>
            <Button
              data-tooltip
              data-tooltip-content="Eliminar"
              unstyled
              className="size-7 rounded-full hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteModal(true);
              }}
            >
              <TrashIcon className="size-4.5 stroke-2 stroke-blue-800" />
            </Button>
          </div>
        )}
        {role === "usuario" && window.location.pathname.includes("rechazados") && (
          <div className="mt-3 text-end">
            {/* Botón de Editar */}
            <Button
              data-tooltip
              data-tooltip-content="Editar"
              unstyled
              className="size-7 rounded-full hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/administracion/entidades/${anuncio.entidad}/anuncios/${anuncio.id}/editar`);
              }}
            >
              <EditIcon className="size-4.5 stroke-2 stroke-blue-800" />
            </Button>

            {/* Botón de comentarios */}
            <Button
              data-tooltip
              data-tooltip-content="Ver comentario de rechazo"
              unstyled
              className="size-7 rounded-full hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setShowCommentModal(true);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="blue"
                className="size-4.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 10h8M8 14h5m-9 4h10l4 4V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12z"
                />
              </svg>
            </Button>
          </div>
        )}
      </div>
      {/* Modal de eliminación */}
      {showDeleteModal && (
        <DeleteAnnouncementModal
          anuncioId={anuncio.id}
          anuncioTitle={anuncio.titulo}
          onDeleted={() => {
            // Aquí podrías hacer que actualice la lista de anuncios
            setShowDeleteModal(false); // Cierra el modal después de eliminar
          }}
        />
      )}
      {showCommentModal && (
        <ShowCommentModal
          show={showCommentModal}
          onClose={() => setShowCommentModal(false)}
          comentario={anuncio.comentarios_rechazo}
        />

      )}

    </Card>
  );
}

PostCard.propTypes = {
  cover: PropTypes.string,
  category: PropTypes.string,
  created_at: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  likes: PropTypes.number,
  query: PropTypes.string,
};
