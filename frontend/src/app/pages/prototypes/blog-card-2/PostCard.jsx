// Import Dependencies
import { PropTypes } from "prop-types";
import { EditIcon, TrashIcon } from 'lucide-react';
import { useAuthContext } from "app/contexts/auth/context";
import { useDisclosure } from "hooks";
import { useNavigate } from "react-router";

// Local Imports
import { Highlight } from "components/shared/Highlight";
import { Button, Card } from "components/ui";
import { DeleteEntityModal } from "app/pages/components/modal/DeleteEntityModal";


// ----------------------------------------------------------------------
export function PostCard({ entidad, created_at, cover, title, category, query, onDeleted, description }) {
  const { role } = useAuthContext();
  const [isDeleteOpen, { open: openDelete, close: closeDelete }] = useDisclosure();
  const navigate = useNavigate();

  return (
    <Card className="relative flex grow flex-col">
      <div className="p-2.5">
        <img
          src={cover}
          className="h-48 w-full rounded-lg object-cover object-center"
          alt={title}
        />

        <div className="flex grow flex-col px-4 pb-5 pt-1 text-center sm:px-5">
          <div className="mt-1">
            <a
              href="##"
              className="text-lg font-medium text-gray-700 hover:text-primary-600 focus:text-primary-600 dark:text-dark-100 dark:hover:text-primary-400 dark:focus:text-primary-400"
            >
              <Highlight query={query}>{title}</Highlight>
            </a>
          </div>
          <div className="my-2 flex items-center space-x-3 text-xs">
            <div className="h-px flex-1 bg-gray-200 dark:bg-dark-500"></div>
            {category && created_at && (
              <p>{category}&nbsp;&nbsp;&nbsp;&nbsp;||&nbsp;&nbsp;&nbsp;&nbsp;{created_at}</p>
            )}
            <div className="h-px flex-1 bg-gray-200 dark:bg-dark-500"></div>
          </div>
          {description && (
            <div
              dangerouslySetInnerHTML={{ __html: description }}
            />

          )}
        </div>
        {(role === "superadmin" || role === "admin") && (
          <div className="flex gap-2 p-3 pointer-events-auto">
            <Button
              data-tooltip
              data-tooltip-content="Editar"
              unstyled
              className="size-7 rounded-full hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/administracion/entidades/${entidad.id}/editar`);
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
                openDelete();
              }}
            >
              <TrashIcon className="size-4.5 stroke-2 stroke-blue-800" />
            </Button>

            {isDeleteOpen && (
              <DeleteEntityModal
                entidadId={entidad.id}
                entidadNombre={entidad.nombre}
                onDeleted={() => {
                  onDeleted?.(entidad.id);
                  closeDelete();
                }}
              />
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

PostCard.propTypes = {
  entidad: PropTypes.object.isRequired,
  cover: PropTypes.string,
  category: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  created_at: PropTypes.string,
  query: PropTypes.string,
  onDeleted: PropTypes.func,
};
