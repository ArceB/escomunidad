// src/app/pages/administracion/nuevo-anuncio/index.jsx

import NavBar from "app/layouts/MainLayout/NavBar";
import { useParams } from "react-router";
import NewPostForm from "app/pages/forms/new-post-form";
import { Page } from "components/shared/Page";

export default function NuevoAnuncioPage() {
  const { id: entidadId } = useParams(); // 👈 sacamos el id de la URL
  console.log("Entidad ID desde URL:", entidadId);

  return (
    <Page title="Nuevo Anuncio">
      <NavBar showNotifications />
      <main className="pt-20 px-6">
        {/* Pasamos el id al formulario */}
        <NewPostForm entidadId={entidadId} />
      </main>
    </Page>
  );
}
