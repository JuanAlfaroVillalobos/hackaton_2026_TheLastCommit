// Ruta: src/modulos/ayuda-humanitaria/hooks/useTemaEmergencia.ts
// Pone el tema rojo mientras se está dentro de /emergencia y devuelve el tema anterior al salir.
import { useTemaStore } from "@/compartido/tema";
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
      useTemaStore.getState().setTema(previo ?? "normal");
      previo = null;
    };
  }, []);
}