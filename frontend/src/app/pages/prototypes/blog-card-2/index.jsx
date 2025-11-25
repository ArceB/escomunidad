

// Local Imports
import { Page } from "components/shared/Page";
import { Toolbar } from "./Toolbar";
import { PostCard } from "./PostCard";
import { useFuse } from "hooks";



export default function BlogCard2({ onCardClick, data }) {
  console.log("Datos recibidos:", data);
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
          {filteredPosts
            .sort((a, b) => {
              const nombreA = a.item.nombre;
              const nombreB = b.item.nombre;

              // 1. Si A es "General", va primero
              if (nombreA === "General") return -1;

              // 2. Si B es "General", va primero
              if (nombreB === "General") return 1;

              // 3. Si ninguno es "General", ordenar alfabéticamente
              return nombreA.localeCompare(nombreB, "es", { sensitivity: "base" });
            })
            .map(({ item: entidad }) => (
              <div
                key={entidad.id}
                onClick={() => onCardClick?.(entidad)}
                className="cursor-pointer"
              >
                <PostCard
                  entidad={entidad}
                  cover={entidad.foto_portada || "/images/800x600.png"}
                  title={entidad.nombre}
                  description={entidad.descripcion}
                  category={entidad.correo}
                  created_at={entidad.telefono}
                  query={query}
                />
              </div>
            ))}

        </div>
      </div>
    </Page>
  );
}
