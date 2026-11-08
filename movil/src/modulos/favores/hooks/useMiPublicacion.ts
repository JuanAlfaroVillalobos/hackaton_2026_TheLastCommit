import { useEffect, useState } from "react";
import { esActiva } from "../reglas";
import { suscribirPublicacion } from "../servicios/publicacionesServicio";
import type { PublicacionConAutor } from "../tipos";

export function useMiPublicacion(id: string | null) {
  const [publicacion, setPublicacion] = useState<PublicacionConAutor | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setPublicacion(null);
      setError(null);
      return;
    }
    return suscribirPublicacion(
      id,
      (actual) => {
        setPublicacion(actual);
        setError(null);
      },
      (e) => setError(e.message),
    );
  }, [id]);

  return { publicacion: publicacion && esActiva(publicacion.estado) ? publicacion : null, error };
}
