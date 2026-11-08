// Ruta: src/modulos/ayuda-humanitaria/hooks/useTemaEmergencia.ts
// Pone el tema rojo mientras se está dentro de /emergencia y devuelve el tema anterior al salir.
import { useTemaStore } from "@/compartido/tema";
import { hayEmergenciaActiva } from "@/modulos/emergencia";
import { useEffect } from "react";

type NombreTema = ReturnType<typeof useTemaStore.getState>["nombre"];

// Guardado a nivel de módulo: si el layout se remonta no se pierde el tema original ni se queda pegado el rojo.
let previo: NombreTema | null = null;

export function useTemaEmergencia(): void {
  useEffect(() => {
    const { nombre, setTema } = useTemaStore.getState();
    if (nombre !== "emergencia") previo = nombre;
    setTema("emergencia");
    return () => {
      // Si la zona sigue en emergencia, el rojo se queda (lo quita el módulo emergencia al terminar).
      if (hayEmergenciaActiva()) return;
      const { temaClima } = useTemaStore.getState();
      useTemaStore.getState().setTema(temaClima ?? previo ?? "normal");
      previo = null;
    };
  }, []);
}