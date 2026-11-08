// Ruta: src/modulos/ayuda-humanitaria/hooks/useTemaEmergencia.ts
// Pone el tema rojo mientras se está dentro de /emergencia y, al salir, vuelve al tema forzado (demo),
// al del clima real o al normal, según corresponda.
import { useTemaStore } from "@/compartido/tema";
import { useEffect } from "react";

export function useTemaEmergencia(): void {
  useEffect(() => {
    useTemaStore.getState().setTema("emergencia");
    return () => {
      useTemaStore.getState().salirDeEmergencia();
    };
  }, []);
}