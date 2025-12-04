// Local Imports
import { Page } from "components/shared/Page";
import { Card } from "components/ui";
import { PostHeader } from "./PostHeader";
import { PostContent } from "./PostContent";
import { PostFooter } from "./PostFooter";
import { RecentArticles } from "./RecentArticles";
import { AuthorInfo } from "./AuthorInfo";
import { AuthorPosts } from "./AuthorPosts";

import { useParams } from "react-router";
import { useEffect, useState } from "react";
import axios from "utils/axios";

import Bienvenido from "app/pages/administracion/bienvenido";
import { useAuthContext } from "app/contexts/auth/context";

// ----------------------------------------------------------------------

export default function PostDetails() {
  const { id } = useParams(); // ID del anuncio
  const [anuncio, setAnuncio] = useState(null);
  const { isAuthenticated } = useAuthContext();

  console.log("Anuncio recibido:", anuncio);

  useEffect(() => {
    const fetchAnuncio = async () => {
      try {
        const res = await axios.get(`/anuncios/${id}/`);
        setAnuncio(res.data);
      } catch (err) {
        console.error("Error cargando anuncio:", err);
      }
    };

    fetchAnuncio();
  }, [id]);

  if (!anuncio) return <p className="p-10">Cargando anuncio...</p>;
  
  return (
    <Page title="Post Details">
      <div className="transition-content grid w-full grid-cols-12 px-(--margin-x) lg:gap-6">
        <div className="col-span-12 pt-6 lg:col-span-8 lg:pb-6">
          <Card className="p-4 lg:p-6">
            {isAuthenticated && <Bienvenido />}
            <PostHeader />
            
            <PostContent anuncio={anuncio} />
            <PostFooter />
          </Card>
          <RecentArticles />
        </div>
        <div className="col-span-12 py-6 lg:sticky lg:top-16 lg:col-span-4 lg:self-start">
          <AuthorInfo />
          <AuthorPosts/>
        </div>
      </div>
    </Page>
  );
}
