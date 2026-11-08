// Ruta: src/modulos/emergencia/estado.ts
// Estado del modo emergencia en la app (Zustand, igual que el tema). Lo llenan ProveedorEmergencia y los
// avisos push; lo leen P11, P12, el tema y favores (que bloquea publicar mientras dure, RF22).
import { ErrorApi } from "@/nucleo/api";
import { create } from "zustand";
import { obtenerEstadoEmergencia, registrarPresencia, responderEmergencia } from "./servicios/emergenciaServicio";
import type { Emergencia, EstadoEmergencia, VecinoEnEmergencia } from "./tipos";

type EstadoStore = {
  emergencia: Emergencia | null;
  yo: VecinoEnEmergencia | null;
  /** true tras la primera respuesta de la API (antes no se sabe si hay emergencia). */
  cargado: boolean;
  /** Sube con cada cambio en la zona (aviso «mapa»): P11 vuelve a pedir los vecinos. */
  version: number;
  /** P12 está en pantalla: no se repite la alerta encima. */
  enAlerta: boolean;
  fijar: (estado: EstadoEmergencia) => void;
  tocar: () => void;
  setEnAlerta: (valor: boolean) => void;
};

export const useEmergenciaStore = create<EstadoStore>((set) => ({
  emergencia: null,
  yo: null,
  cargado: false,
  version: 0,
  enAlerta: false,
  fijar: ({ emergencia, yo }) =>
    set((s) => ({
      emergencia: emergencia?.estado === "ACTIVA" ? emergencia : null,
      yo: emergencia?.estado === "ACTIVA" ? yo : null,
      cargado: true,
      version: s.version + 1,
    })),
  tocar: () => set((s) => ({ version: s.version + 1 })),
  setEnAlerta: (enAlerta) => set({ enAlerta }),
}));

/** Sin sesión (modo desarrollo) o sin red no hay nada que actualizar: se conserva el último estado. */
async function aplicar(peticion: Promise<EstadoEmergencia>): Promise<EstadoEmergencia | null> {
  try {
    const estado = await peticion;
    useEmergenciaStore.getState().fijar(estado);
    return estado;
  } catch (error) {
    if (error instanceof ErrorApi && (error.codigo === "SIN_SESION" || error.codigo === "SIN_CONEXION")) return null;
    throw error;
  }
}

/** Vuelve a pedir el estado (tras un push o al entrar a P11/P12). */
export const refrescarEmergencia = () => aplicar(obtenerEstadoEmergencia()).catch(() => null);

/** Al abrir la app o volver del segundo plano (con la ubicación si hay permiso). */
export const anunciarPresencia = () => aplicar(registrarPresencia()).catch(() => null);

/** RF24. Lanza el error para que P12 lo muestre. */
export const responder = (estado: "A_SALVO" | "NECESITA_AYUDA") => aplicar(responderEmergencia(estado));

/** true si la zona del vecino está en emergencia ahora mismo (fuera de React). */
export const hayEmergenciaActiva = () => useEmergenciaStore.getState().emergencia !== null;

/** Emergencia activa y estado del vecino en ella. */
export function useEmergencia() {
  const emergencia = useEmergenciaStore((s) => s.emergencia);
  const yo = useEmergenciaStore((s) => s.yo);
  const cargado = useEmergenciaStore((s) => s.cargado);
  return { emergencia, yo, cargado, activa: emergencia !== null };
}

/** Número que cambia con cada novedad de la zona; útil como dependencia para recargar listas. */
export const useVersionEmergencia = () => useEmergenciaStore((s) => s.version);
