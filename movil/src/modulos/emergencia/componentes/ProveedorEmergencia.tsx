// Ruta: src/modulos/emergencia/componentes/ProveedorEmergencia.tsx
// Pone la app en modo emergencia (RF21, RF22, RF25). Va en el layout (privado) y no dibuja nada propio:
//   - Al abrir la app y al volver del segundo plano anuncia la presencia del vecino (una sola llamada:
//     los cambios posteriores llegan por push, ver notificaciones.ts).
//   - Con emergencia activa: tema rojo en toda la app (RF29) y P11 en lugar de P04; si el vecino aún no
//     respondió, abre P12.
//   - Al terminar: vuelve al tema del clima y, si estaba en P11/P12, al inicio.
import { useTemaStore } from "@/compartido/tema";
import { useSesion } from "@/nucleo/sesion";
import { router, usePathname } from "expo-router";
import { useEffect, useRef, type ReactNode } from "react";
import { AppState } from "react-native";
import { anunciarPresencia, useEmergencia } from "../estado";
import { RUTA_ALERTA } from "../notificaciones";

export const RUTA_MAPA = "/emergencia";

export function ProveedorEmergencia({ children }: { children: ReactNode }) {
  const { autenticado, modoDesarrollo } = useSesion();
  const { emergencia, yo, cargado } = useEmergencia();
  const ruta = usePathname();
  const rutaActual = useRef(ruta);
  useEffect(() => {
    rutaActual.current = ruta;
  }, [ruta]);

  useEffect(() => {
    if (!autenticado || modoDesarrollo) return;
    void anunciarPresencia();
    const suscripcion = AppState.addEventListener("change", (estado) => {
      if (estado === "active") void anunciarPresencia();
    });
    return () => suscripcion.remove();
  }, [autenticado, modoDesarrollo]);

  // Tema rojo mientras dure (las pantallas de /emergencia lo ponen también fuera de una emergencia).
  const id = emergencia?.id ?? null;
  useEffect(() => {
    const { nombre, temaClima, setTema } = useTemaStore.getState();
    if (id) setTema("emergencia");
    else if (nombre === "emergencia" && !rutaActual.current.startsWith(RUTA_MAPA)) setTema(temaClima ?? "normal");
  }, [id]);

  // Navegación solo en los cambios: entra a una emergencia → P11 (y P12 si no respondió); termina → inicio.
  const anterior = useRef<string | null | undefined>(undefined);
  const sinResponder = yo?.estado === "SIN_RESPONDER";
  useEffect(() => {
    if (!cargado) return;
    const previo = anterior.current;
    anterior.current = id;
    if (id && id !== previo) {
      if (!rutaActual.current.startsWith(RUTA_MAPA)) router.push(RUTA_MAPA as never);
      if (sinResponder && rutaActual.current !== RUTA_ALERTA) setTimeout(() => router.push(RUTA_ALERTA as never), 0);
    } else if (!id && previo && rutaActual.current.startsWith(RUTA_MAPA)) {
      router.replace("/inicio");
    }
  }, [id, cargado, sinResponder]);

  return children;
}
