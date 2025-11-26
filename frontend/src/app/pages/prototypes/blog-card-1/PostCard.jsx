import PropTypes from "prop-types"; 
import { Highlight } from "components/shared/Highlight"; 
import { Card } from "components/ui";

export function PostCard({
  cover,
  category,
  title,
  description,
  author_name,
  created_at,
  query,
  onCategoryClick, // ← nuevo callback
}) {
  return (
    <Card className="flex flex-col lg:flex-row cursor-pointer hover:shadow-md transition">

      {/* Imagen */}
      <div className="relative h-48 w-full shrink-0 lg:h-auto lg:w-48">
        <img
          className="h-48 w-full rounded-t-lg object-cover object-center lg:h-full lg:ltr:rounded-l-lg lg:ltr:rounded-tr-none lg:rtl:rounded-r-lg lg:rtl:rounded-tl-none"
          src={cover}
          alt={title}
        />
      </div>

      {/* Contenido */}
      <div className="flex w-full grow flex-col p-4 sm:px-5">

        {/* CATEGORY — ahora clickeable */}
        <div className="flex items-center justify-between">
          <span
            onClick={(e) => {
              e.stopPropagation();   // ❗ evita que active el click del card
              onCategoryClick?.();   // ❗ ejecuta la redirección
            }}
            className="text-xs-plus text-info dark:text-info-lighter underline cursor-pointer"
          >
            <Highlight query={query}>{category}</Highlight>
          </span>
        </div>

        <div>
          <p className="text-lg font-medium text-gray-700 dark:text-dark-100">
            <Highlight query={query}>{title}</Highlight>
          </p>
        </div>

        <p className="mt-1 line-clamp-3 text-gray-600 dark:text-dark-300">
          <Highlight query={query}>{description}</Highlight>
        </p>

        <div className="mt-4 grow text-xs text-gray-400 dark:text-dark-300 flex items-center gap-2">
          <span>Inicio: {author_name}</span>
          <span>|</span>
          <span>Fin: {created_at}</span>
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
  author_name: PropTypes.string,
  created_at: PropTypes.string,
  query: PropTypes.string,
  onCategoryClick: PropTypes.func, // ← agregar proptype
};
