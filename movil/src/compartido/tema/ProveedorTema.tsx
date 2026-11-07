// Ruta: src/compartido/tema/ProveedorTema.tsx
// Proveedor de tema (README, sección 8): expone useTema() y ajusta la barra de estado.
// El tema activo vive en un store de Zustand (estado de UI); nucleo/clima y el modo emergencia
// lo cambian con `useTemaStore.getState().setTema(...)`. Cambiar de tema no reinicia la app.
import { StatusBar } from "expo-status-bar";
import { createContext, useContext, type ReactNode } from "react";
import { create } from "zustand";
import { TEMAS, type NombreTema, type Tema } from "./temas";

const TEMAS_VALIDOS = Object.keys(TEMAS) as NombreTema[];

/** Tema inicial. Para revisar el diseño se puede forzar con EXPO_PUBLIC_TEMA=lluvia|calor|emergencia. */
function temaInicial(): NombreTema {
  const forzado = process.env.EXPO_PUBLIC_TEMA as NombreTema | undefined;
  return forzado && TEMAS_VALIDOS.includes(forzado) ? forzado : "normal";
}

type EstadoTema = {
  nombre: NombreTema;
  setTema: (nombre: NombreTema) => void;
};

export const useTemaStore = create<EstadoTema>((set) => ({
  nombre: temaInicial(),
  setTema: (nombre) => set({ nombre }),
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
