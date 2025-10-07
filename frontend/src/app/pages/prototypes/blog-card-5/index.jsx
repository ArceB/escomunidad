// Import Dependencies

// Local Imports
import { Page } from "components/shared/Page";
import { Toolbar } from "./Toolbar";
import { PostCard } from "./PostCard";
import { useFuse } from "hooks";

// ----------------------------------------------------------------------

export default function BlogCard5({ onCardClick, data }) {
  const {
    result: filteredPosts,
    query,
    setQuery,
  } = useFuse(data, {
    keys: ["nombre", "correo", "telefono"],
    threshold: 0.2,
    matchAllOnEmptyQuery: true,
  });

  return (
    <Page title="Entidades">
      <div className="transition-content w-full px-(--margin-x) pb-8">
        <Toolbar setQuery={setQuery} query={query} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {filteredPosts.map(({ item: entidad }) => (
            <div
              key={entidad.id}
              onClick={() => onCardClick?.(entidad)}
              className="cursor-pointer"
            >
              <PostCard
                entidad={entidad}
                cover={entidad.foto_portada || "/images/800x600.png"} // fallback
                title={entidad.nombre}
                category={entidad.correo}
                created_at={entidad.telefono}
                CategoryIcon={() => <span className="text-xs">👤</span>} // un ícono fijo de placeholder
                query={query}
              />
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}
