// Ruta: src/modulos/ayuda-humanitaria/hooks/useVecinosEmergencia.ts
import { useEffect, useState } from "react";
import { mensajeDeError } from "../acciones";
import { listarVecinosEmergencia, obtenerCentroZona } from "../servicios/vecinosEmergenciaServicio";
import type { Coordenada, VecinoEmergencia } from "../tipos";

const REFRESCO_RELOJ_MS = 30_000;
/** Mientras no haya Firestore (tiempo real), se vuelve a pedir la lista cada tanto. */
const REFRESCO_DATOS_MS = 15_000;

export function useVecinosEmergencia() {
  const [vecinos, setVecinos] = useState<VecinoEmergencia[]>([]);
  const [centro, setCentro] = useState<Coordenada | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Se actualiza cada 30 s para que «hace 3 min» avance sin recargar los datos.
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    let activo = true;
    const cargar = () =>
      Promise.all([listarVecinosEmergencia(), obtenerCentroZona()])
        .then(([lista, zona]) => {
          if (!activo) return;
          setVecinos(lista);
          setCentro(zona);
          setError(null);
        })
        .catch((e) => {
          if (activo) setError(mensajeDeError(e));
        })
        .finally(() => {
          if (activo) setCargando(false);
        });
    cargar();
    const datos = setInterval(cargar, REFRESCO_DATOS_MS);
    const reloj = setInterval(() => setAhora(Date.now()), REFRESCO_RELOJ_MS);
    return () => {
      activo = false;
      clearInterval(datos);
      clearInterval(reloj);
    };
  }, []);

  return { vecinos, centro, cargando, error, ahora };
}
