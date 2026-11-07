// Ruta: src/modulos/ayuda-humanitaria/hooks/useReportes.ts
import { useEffect, useState } from "react";
import { ordenarReportes } from "../reglas";
import { listarReportes, suscribirReportes } from "../servicios/reportesServicio";
import type { ReporteVulnerabilidad } from "../tipos";

const REFRESCO_RELOJ_MS = 30_000;

export function useReportes() {
  const [reportes, setReportes] = useState<ReporteVulnerabilidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    let activo = true;
    const cargar = () =>
      listarReportes().then((lista) => {
        if (!activo) return;
        setReportes(ordenarReportes(lista));
        setCargando(false);
      });
    cargar();
    const dejarDeEscuchar = suscribirReportes(cargar);
    const reloj = setInterval(() => setAhora(Date.now()), REFRESCO_RELOJ_MS);
    return () => {
      activo = false;
      dejarDeEscuchar();
      clearInterval(reloj);
    };
  }, []);

  return { reportes, cargando, ahora };
}