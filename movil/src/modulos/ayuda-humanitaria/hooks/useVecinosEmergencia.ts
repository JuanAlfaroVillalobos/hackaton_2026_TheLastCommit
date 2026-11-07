// Ruta: src/modulos/ayuda-humanitaria/hooks/useVecinosEmergencia.ts
import { useEffect, useState } from "react";
import { obtenerCentroZona, listarVecinosEmergencia } from "../servicios/vecinosEmergenciaServicio";
import type { VecinoEmergencia } from "../tipos";

const REFRESCO_RELOJ_MS = 30_000;

export function useVecinosEmergencia() {
  const [vecinos, setVecinos] = useState<VecinoEmergencia[]>([]);
  const [centro, setCentro] = useState<{ lat: number; lng: number } | null>(null);
  const [cargando, setCargando] = useState(true);
  // Se actualiza cada 30 s para que «hace 3 min» avance sin recargar los datos.
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    let activo = true;
    Promise.all([listarVecinosEmergencia(), obtenerCentroZona()]).then(([lista, zona]) => {
      if (!activo) return;
      setVecinos(lista);
      setCentro(zona);
      setCargando(false);
    });
    const reloj = setInterval(() => setAhora(Date.now()), REFRESCO_RELOJ_MS);
    return () => {
      activo = false;
      clearInterval(reloj);
    };
  }, []);

  return { vecinos, centro, cargando, ahora };
}