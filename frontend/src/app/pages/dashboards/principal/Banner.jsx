import { useEffect, useState } from "react";
import axios from "utils/axios";
import { useNavigate } from "react-router";

export function Banner({ entidadId }) {
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnuncios = async () => {
      try {
        let url = "/anuncios/public/";
        if (entidadId) {
          url = `/anuncios/?entidad_id=${entidadId}&estado=aprobado`;
        }

        const res = await axios.get(url);
        let anuncios = res.data;

        console.log("Banners obtenidos:", anuncios);

        anuncios = anuncios.filter(a => a.estado === "aprobado" && a.banner);

        // 🔹 Los 5 más recientes
        const ultimosCinco = [...anuncios]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);

        // 🔹 Los 5 con fecha de fin más próxima (solo los que tienen fecha)
        const conFechaFin = anuncios.filter(a => a.fecha_fin !== null);
        const proximosCinco = [...conFechaFin]
          .sort((a, b) => new Date(a.fecha_fin) - new Date(b.fecha_fin))
          .slice(0, 5);

        // 🔹 Combinar ambos, sin duplicados
        const combinados = [
          ...ultimosCinco,
          ...proximosCinco.filter(
            (p) => !ultimosCinco.some((u) => u.id === p.id)
          ),
        ];

        // 🔹 Si hay menos de 10, completar con los que faltan
        if (combinados.length < 10) {
          const faltantes = anuncios.filter(
            (a) => !combinados.some((c) => c.id === a.id)
          );
          combinados.push(...faltantes.slice(0, 10 - combinados.length));
        }

        setBanners(combinados);
      } catch (err) {
        console.error("Error cargando banners:", err);
      }
    };

    fetchAnuncios();
  }, [entidadId]);


  useEffect(() => {
    if (banners.length > 0) {
      const interval = setInterval(() => {
        setCurrent((prev) => (prev + 1) % banners.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [banners]);

  const handleBannerClick = (anuncioId) => {
    console.log(`Redirigiendo al anuncio con ID: ${anuncioId}`); // Verifica que el ID sea correcto
    if (anuncioId) {
      navigate(`/administracion/anuncios/${anuncioId}`);
    } else {
      console.error('No se proporcionó un anuncio ID');
    }
  };

  return (
    <section className="relative w-full h-[250px] sm:h-[300px] lg:h-[350px] overflow-hidden">
      {banners.map((anuncio, index) => (
        <div
          key={anuncio.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${index === current ? "opacity-100" : "opacity-0"
            }`}
        >
          <img
            src={banners[current].banner}
            alt={banners[current].titulo}
            className="w-full h-full object-cover"
            onClick={() => handleBannerClick(banners[current].id)}
          />

        </div>
      ))}

      {/* Indicadores */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-2 h-2 rounded-full ${index === current ? "bg-white" : "bg-gray-400"
              }`}
          />
        ))}
      </div>
    </section>
  );
}
