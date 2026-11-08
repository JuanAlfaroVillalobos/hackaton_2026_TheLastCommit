// Ruta: src/modulos/ayuda-humanitaria/hooks/useRecursos.ts
import { useEffect, useState } from "react";
import { mensajeDeError } from "../acciones";
import { ordenarRecursos } from "../reglas";
import { listarRecursos, suscribirRecursos } from "../servicios/recursosServicio";
import type { RecursoCritico } from "../tipos";

const REFRESCO_RELOJ_MS = 30_000;
/** Mientras no haya Firestore (tiempo real), se vuelve a pedir la lista cada tanto para ver lo que hacen los demás. */
const REFRESCO_DATOS_MS = 15_000;

export function useRecursos() {
  const [recursos, setRecursos] = useState<RecursoCritico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    let activo = true;
    const cargar = () =>
      listarRecursos()
        .then((lista) => {
          if (!activo) return;
          setRecursos(ordenarRecursos(lista));
          setError(null);
        })
        .catch((e) => {
          if (activo) setError(mensajeDeError(e));
        })
        .finally(() => {
          if (activo) setCargando(false);
        });
    cargar();
    const dejarDeEscuchar = suscribirRecursos(cargar);
    const datos = setInterval(cargar, REFRESCO_DATOS_MS);
    const reloj = setInterval(() => setAhora(Date.now()), REFRESCO_RELOJ_MS);
    return () => {
      activo = false;
      dejarDeEscuchar();
      clearInterval(datos);
      clearInterval(reloj);
    };
  }, []);

  return { recursos, cargando, error, ahora };
}
