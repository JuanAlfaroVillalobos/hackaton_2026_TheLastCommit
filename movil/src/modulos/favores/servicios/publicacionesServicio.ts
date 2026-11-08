// Acceso a publicaciones. El proveedor inicial es la API REST local; Firebase se habilita
// cuando la integración de Auth/Functions de la persona A esté disponible.
import { api } from "@/nucleo/api";
import type { Coordenada } from "@/compartido/utilidades/geo";
import type { Calificacion, NotificacionFavor, PublicacionConAutor } from "../tipos";

type DejarDeEscuchar = () => void;
type ErrorListener = (error: Error) => void;

const INTERVALO_ACTUALIZACION_MS = 5_000;
const refrescos = new Set<() => Promise<void>>();

export type ProveedorFavores = "mock" | "firebase";

export function proveedorFavoresSeleccionado(): ProveedorFavores {
  const configurado = process.env.EXPO_PUBLIC_FAVORES_BACKEND?.trim().toLowerCase();
  if (!configurado || configurado === "mock") return "mock";
  if (configurado === "firebase") return "firebase";
  throw new Error(`EXPO_PUBLIC_FAVORES_BACKEND debe ser "mock" o "firebase"; se recibió "${configurado}".`);
}

function exigirProveedorMock(): void {
  if (proveedorFavoresSeleccionado() === "firebase") {
    throw new Error(
      "Firebase para favores todavía está pendiente de la integración de autenticación de la persona A. Usa EXPO_PUBLIC_FAVORES_BACKEND=mock.",
    );
  }
}

async function consultarPublicaciones(): Promise<PublicacionConAutor[]> {
  exigirProveedorMock();
  return api<PublicacionConAutor[]>("/favores/publicaciones?estado=PUBLICADA");
}

function observar<T>(
  consultar: () => Promise<T>,
  alCambiar: (valor: T) => void,
  alError?: ErrorListener,
): DejarDeEscuchar {
  let activa = true;
  let consultando = false;
  const cargar = async () => {
    if (!activa || consultando) return;
    consultando = true;
    try {
      const resultado = await consultar();
      if (activa) alCambiar(resultado);
    } catch (error) {
      if (activa) alError?.(error instanceof Error ? error : new Error("No se pudieron cargar las publicaciones."));
    } finally {
      consultando = false;
    }
  };
  const refrescar = () => cargar();
  refrescos.add(refrescar);
  void cargar();
  const intervalo = setInterval(refrescar, INTERVALO_ACTUALIZACION_MS);
  return () => {
    activa = false;
    clearInterval(intervalo);
    refrescos.delete(refrescar);
  };
}

/** La API mock se actualiza por sondeo; el proveedor Firebase usará onSnapshot al integrarse. */
export function suscribirMuro(
  _centro: Coordenada,
  _radioM: number,
  alCambiar: (lista: PublicacionConAutor[]) => void,
  alError?: ErrorListener,
): DejarDeEscuchar {
  return observar(consultarPublicaciones, alCambiar, alError);
}

export function suscribirPublicacion(
  id: string,
  alCambiar: (publicacion: PublicacionConAutor | null) => void,
  alError?: ErrorListener,
): DejarDeEscuchar {
  return observar(async () => {
    exigirProveedorMock();
    try {
      return await api<PublicacionConAutor>(`/favores/publicaciones/${encodeURIComponent(id)}`);
    } catch (error) {
      if (error instanceof Error && "estado" in error && error.estado === 404) return null;
      throw error;
    }
  }, alCambiar, alError);
}

export async function refrescarMuro(): Promise<void> {
  await Promise.all([...refrescos].map((refrescar) => refrescar()));
}

export type NuevaPublicacion = {
  tipo: "NECESITO" | "OFREZCO";
  categoria: string;
  oficioId: string | null;
  descripcion: string;
  lat: number;
  lng: number;
  devolucionEn?: number | null;
};

async function mutacionPublicacion(id: string, accion: string, cuerpo?: unknown): Promise<PublicacionConAutor> {
  exigirProveedorMock();
  return api<PublicacionConAutor>(`/favores/publicaciones/${encodeURIComponent(id)}/${accion}`, {
    metodo: "POST",
    cuerpo,
  });
}

export async function crearPublicacion(datos: NuevaPublicacion): Promise<PublicacionConAutor> {
  exigirProveedorMock();
  return api<PublicacionConAutor>("/favores/publicaciones", { metodo: "POST", cuerpo: datos });
}

export function aceptarPublicacion(id: string, etaMinutos: 5 | 10 | 15): Promise<PublicacionConAutor> {
  return mutacionPublicacion(id, "aceptar", { etaMinutos });
}

export function marcarLlegada(id: string, coordenada?: Coordenada) {
  return mutacionPublicacion(id, "llegada", coordenada);
}

export function confirmarLlegada(id: string) {
  return mutacionPublicacion(id, "confirmar-llegada");
}

export function rechazarLlegada(id: string) {
  return mutacionPublicacion(id, "aun-no-llega");
}

export function solicitarFin(id: string) {
  return mutacionPublicacion(id, "solicitar-fin");
}

export function rechazarFin(id: string) {
  return mutacionPublicacion(id, "rechazar-fin");
}

export function confirmarFin(id: string) {
  return mutacionPublicacion(id, "confirmar-fin");
}

export function cancelarPublicacion(id: string) {
  return mutacionPublicacion(id, "cancelar");
}

export function desistirPublicacion(id: string) {
  return mutacionPublicacion(id, "desistir");
}

export function registrarDevolucion(id: string) {
  return mutacionPublicacion(id, "registrar-devolucion");
}

export async function publicarUbicacionPrestador(id: string, coordenada: Coordenada): Promise<void> {
  exigirProveedorMock();
  await api(`/favores/publicaciones/${encodeURIComponent(id)}/ubicacion-prestador`, {
    metodo: "POST",
    cuerpo: coordenada,
  });
}

export async function calificarPublicacion(id: string, estrellas: number): Promise<Calificacion> {
  exigirProveedorMock();
  return api<Calificacion>(`/favores/publicaciones/${encodeURIComponent(id)}/calificar`, {
    metodo: "POST",
    cuerpo: { estrellas },
  });
}

export async function listarMisPublicaciones(): Promise<PublicacionConAutor[]> {
  exigirProveedorMock();
  return api<PublicacionConAutor[]>("/favores/mis-publicaciones");
}

export async function listarNotificaciones(): Promise<NotificacionFavor[]> {
  exigirProveedorMock();
  return api<NotificacionFavor[]>("/favores/notificaciones");
}

export async function marcarNotificacionLeida(id: string): Promise<NotificacionFavor> {
  exigirProveedorMock();
  return api<NotificacionFavor>(`/favores/notificaciones/${encodeURIComponent(id)}/leida`, { metodo: "PATCH" });
}
