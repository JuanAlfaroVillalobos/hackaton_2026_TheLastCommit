// Ruta: src/modulos/favores/hooks/useMuro.ts
// Estado del muro de P04: escucha la zona, aplica las reglas de RF09 y el filtro de RF35.
import type { OficioId } from "@/compartido/constantes/oficios";
import type { Coordenada } from "@/compartido/utilidades/geo";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RADIO_MURO_M } from "../constantes";
import { prepararMuro } from "../reglas";
import { refrescarMuro, suscribirMuro } from "../servicios/publicacionesServicio";
import type { FiltroMuro, PublicacionConAutor } from "../tipos";

/** Cada cuánto se recalculan «hace N min» y los vencimientos sin recibir datos nuevos. */
const RELOJ_MS = 30_000;

type Params = { uid: string; oficios: OficioId[]; centro: Coordenada | null };

export function useMuro({ uid, oficios, centro }: Params) {
  const [crudas, setCrudas] = useState<PublicacionConAutor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [filtro, setFiltro] = useState<FiltroMuro>("TODO");
  const [actualizadoEn, setActualizadoEn] = useState<number | null>(null);
  const [ahora, setAhora] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);

  const lat = centro?.lat;
  const lng = centro?.lng;

  useEffect(() => {
    if (lat === undefined || lng === undefined) {
      setCargando(false);
      setError("Agrega una ubicación a tu perfil para ver publicaciones cercanas.");
      return;
    }
    const dejarDeEscuchar = suscribirMuro(
      { lat, lng },
      RADIO_MURO_M,
      (lista) => {
        setCrudas(lista);
        setCargando(false);
        setError(null);
        setActualizadoEn(Date.now());
      },
      (e) => {
        setCargando(false);
        setError(e.message);
      },
    );
    const reloj = setInterval(() => setAhora(Date.now()), RELOJ_MS);
    return () => {
      dejarDeEscuchar();
      clearInterval(reloj);
    };
  }, [lat, lng]);

  // Dependencias por valor: la sesión puede entregar objetos nuevos en cada render.
  const claveOficios = oficios.join(",");
  const elementos = useMemo(() => {
    if (lat === undefined || lng === undefined) return [];
    const misOficios = claveOficios ? (claveOficios.split(",") as OficioId[]) : [];
    return prepararMuro(crudas, { uid, oficios: misOficios, centro: { lat, lng }, ahora, filtro });
  }, [crudas, uid, claveOficios, lat, lng, ahora, filtro]);

  const refrescar = useCallback(async () => {
    setRefrescando(true);
    try {
      if (lat === undefined || lng === undefined) {
        setError("Agrega una ubicación a tu perfil para ver publicaciones cercanas.");
        return;
      }
      await refrescarMuro();
      setAhora(Date.now());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar el muro.");
    } finally {
      setRefrescando(false);
    }
  }, [lat, lng]);

  return { elementos, cargando, refrescando, refrescar, filtro, setFiltro, actualizadoEn, ahora, error };
}
