// Ruta: src/modulos/ayuda-humanitaria/hooks/useReportes.ts
import { useEffect, useState } from "react";
import { mensajeDeError } from "../acciones";
import { ordenarReportes } from "../reglas";
import { listarReportes, suscribirReportes } from "../servicios/reportesServicio";
import type { ReporteVulnerabilidad } from "../tipos";

const REFRESCO_RELOJ_MS = 30_000;
/** Mientras no haya Firestore (tiempo real), se vuelve a pedir la lista cada tanto para ver lo que hacen los demás. */
const REFRESCO_DATOS_MS = 15_000;

export function useReportes() {
  const [reportes, setReportes] = useState<ReporteVulnerabilidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    let activo = true;
    const cargar = () =>
      listarReportes()
        .then((lista) => {
          if (!activo) return;
          setReportes(ordenarReportes(lista));
          setError(null);
        })
        .catch((e) => {
          if (activo) setError(mensajeDeError(e));
        })
        .finally(() => {
          if (activo) setCargando(false);
        });
    cargar();
    const dejarDeEscuchar = suscribirReportes(cargar);
    const datos = setInterval(cargar, REFRESCO_DATOS_MS);
    const reloj = setInterval(() => setAhora(Date.now()), REFRESCO_RELOJ_MS);
    return () => {
      activo = false;
      dejarDeEscuchar();
      clearInterval(datos);
      clearInterval(reloj);
    };
  }, []);

  return { reportes, cargando, error, ahora };
}
