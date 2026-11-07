// Ruta: src/modulos/favores/hooks/useVecinoActual.ts
// Vecino actual para P04. Une la sesión real (nucleo/sesion, Persona A: Firebase Auth) con los datos
// del perfil que todavía no se leen de Firestore (barrio, oficios, puntero RN-04 y ubicación).
// ADAPTADOR TEMPORAL: cuando exista el listener de `usuarios/{uid}`, el resto sale de ahí.
import { useSesion } from "@/nucleo/sesion";
import { vecinoActualMock } from "@/simulaciones";
import { useMemo } from "react";
import type { VecinoActual } from "../tipos";

export function useVecinoActual(): VecinoActual {
  const { usuario } = useSesion();
  const uid = usuario?.uid;
  const nombre = usuario?.displayName;

  return useMemo(
    () => ({
      ...vecinoActualMock,
      // En modo desarrollo (sin cuenta) no hay usuario: se usa el de la simulación.
      uid: uid ?? vecinoActualMock.uid,
      nombre: nombre?.trim() || vecinoActualMock.nombre,
    }),
    [uid, nombre],
  );
}
