import { useEffect, useState } from "react";
import axios from "utils/axios";

export function Banner() {
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const fetchAnuncios = async () => {
      try {
        const res = await axios.get("/anuncios/public/");
        setBanners(res.data);
      } catch (err) {
        console.error("Error cargando banners públicos:", err);
      }
    };
    fetchAnuncios();
  }, []);

  useEffect(() => {
    if (banners.length > 0) {
      const interval = setInterval(() => {
        setCurrent((prev) => (prev + 1) % banners.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [banners]);

  return (
    <section className="relative w-full h-[250px] sm:h-[300px] lg:h-[350px] overflow-hidden">
      {banners.map((anuncio, index) => (
        <div
          key={anuncio.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === current ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={anuncio.banner}
            alt={anuncio.titulo}
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      {/* Indicadores */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-2 h-2 rounded-full ${
              index === current ? "bg-white" : "bg-gray-400"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
