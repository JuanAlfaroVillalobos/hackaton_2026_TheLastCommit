// Ruta: src/modulos/favores/hooks/useMiPublicacion.ts
// Necesidad activa propia (RN-04), para la tarjeta «Tu publicación» de P04 (frame 04-B).
import { useEffect, useState } from "react";
import { esActiva } from "../reglas";
import { suscribirPublicacion } from "../servicios/publicacionesServicio";
import type { PublicacionConAutor } from "../tipos";

export function useMiPublicacion(necesidadActivaId: string | null): PublicacionConAutor | null {
  const [publicacion, setPublicacion] = useState<PublicacionConAutor | null>(null);

  useEffect(() => {
    if (!necesidadActivaId) {
      setPublicacion(null);
      return;
    }
    return suscribirPublicacion(necesidadActivaId, setPublicacion);
  }, [necesidadActivaId]);

  return publicacion && esActiva(publicacion.estado) ? publicacion : null;
}
