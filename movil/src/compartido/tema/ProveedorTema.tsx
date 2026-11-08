// Ruta: src/compartido/tema/ProveedorTema.tsx
// Proveedor de tema (README, sección 8): expone useTema() y ajusta la barra de estado.
// El tema activo vive en un store de Zustand (estado de UI); nucleo/clima y el modo emergencia
// lo cambian con `useTemaStore.getState().setTema(...)`. Cambiar de tema no reinicia la app.
// Prioridad: emergencia > tema forzado (menú de demo) > clima real > normal.
import { StatusBar } from "expo-status-bar";
import { createContext, useContext, type ReactNode } from "react";
import { create } from "zustand";
import { TEMAS, type NombreTema, type Tema } from "./temas";

const TEMAS_VALIDOS = Object.keys(TEMAS) as NombreTema[];

export type TemaSinEmergencia = Exclude<NombreTema, "emergencia">;

/** Tema inicial. Para revisar el diseño se puede forzar con EXPO_PUBLIC_TEMA=lluvia|calor|emergencia. */
function temaInicial(): NombreTema {
  const forzado = process.env.EXPO_PUBLIC_TEMA as NombreTema | undefined;
  return forzado && TEMAS_VALIDOS.includes(forzado) ? forzado : "normal";
}

type EstadoTema = {
  nombre: NombreTema;
  /** Tema que dice el clima real de la zona. */
  temaClima: TemaSinEmergencia | null;
  /** Tema elegido a mano en el menú oculto de demo; null = automático. */
  temaForzado: TemaSinEmergencia | null;
  setTema: (nombre: NombreTema) => void;
  setTemaClima: (nombre: TemaSinEmergencia) => void;
  setTemaForzado: (nombre: TemaSinEmergencia | null) => void;
  /** Al salir del modo emergencia: vuelve al tema forzado, o al del clima, o al normal. */
  salirDeEmergencia: () => void;
};

export const useTemaStore = create<EstadoTema>((set) => ({
  nombre: temaInicial(),
  temaClima: null,
  temaForzado: null,
  setTema: (nombre) => set({ nombre }),
  setTemaClima: (temaClima) =>
    set((e) => ({ temaClima, nombre: e.nombre === "emergencia" ? "emergencia" : (e.temaForzado ?? temaClima) })),
  setTemaForzado: (temaForzado) =>
    set((e) => ({
      temaForzado,
      nombre: e.nombre === "emergencia" ? "emergencia" : (temaForzado ?? e.temaClima ?? "normal"),
    })),
  salirDeEmergencia: () => set((e) => ({ nombre: e.temaForzado ?? e.temaClima ?? "normal" })),
}));

const ContextoTema = createContext<Tema>(TEMAS.normal);

export function ProveedorTema({ children }: { children: ReactNode }) {
  const nombre = useTemaStore((s) => s.nombre);
  const tema = TEMAS[nombre];
  return (
    <ContextoTema.Provider value={tema}>
      <StatusBar style={tema.oscuro ? "light" : "dark"} />
      {children}
    </ContextoTema.Provider>
  );
}

export function useTema(): Tema {
  return useContext(ContextoTema);
}