// Ruta: src/modulos/ayuda-humanitaria/hooks/useDirectorio.ts
import { useEffect, useState } from "react";
import { mensajeDeError } from "../acciones";
import { ordenarFichas } from "../directorio";
import { listarDirectorio, suscribirDirectorio } from "../servicios/directorioServicio";
import type { FichaDirectorio } from "../tipos";

/** Todas las fichas conocidas, ordenadas. Quien muestra decide cuáles ve el vecino (fichasVisibles). */
export function useDirectorio() {
  const [fichas, setFichas] = useState<FichaDirectorio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    const cargar = () =>
      listarDirectorio()
        .then((lista) => {
          if (!activo) return;
          setFichas(ordenarFichas(lista));
          setError(null);
        })
        .catch((e) => {
          if (activo) setError(mensajeDeError(e));
        })
        .finally(() => {
          if (activo) setCargando(false);
        });
    cargar();
    const dejarDeEscuchar = suscribirDirectorio(cargar);
    return () => {
      activo = false;
      dejarDeEscuchar();
    };
  }, []);

  return { fichas, cargando, error };
}
