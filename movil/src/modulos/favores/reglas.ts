// Ruta: src/modulos/favores/reglas.ts
// Reglas de negocio puras del muro (RF09, RF35, RN-04, sección 5.3). Sin React ni Firebase: se prueban con Jest.
import type { OficioId } from "@/compartido/constantes/oficios";
import { centroGeohash, distanciaMetros, type Coordenada } from "@/compartido/utilidades/geo";
import { RADIO_MURO_M, TEXTOS_INICIO } from "./constantes";
import type { ElementoMuro, EstadoNecesidad, FiltroMuro, PublicacionConAutor } from "./tipos";

const ESTADOS_ACTIVOS: EstadoNecesidad[] = ["PUBLICADA", "ACEPTADA", "EN_SITIO", "EN_CURSO", "FIN_SOLICITADO"];

/** Necesidad activa (sección 5, conceptos derivados). */
export function esActiva(estado: EstadoNecesidad): boolean {
  return ESTADOS_ACTIVOS.includes(estado);
}

/** Solo las necesidades que piden un oficio que yo ofrezco llevan «Coincide con tu oficio» (RF09). */
export function coincideConOficio(p: Pick<PublicacionConAutor, "tipo" | "oficioId">, misOficios: OficioId[]): boolean {
  return p.tipo === "NECESITO" && p.oficioId !== null && misOficios.includes(p.oficioId);
}

type ContextoMuro = {
  uid: string;
  oficios: OficioId[];
  centro: Coordenada;
  ahora: number;
  filtro: FiltroMuro;
  radioM?: number;
};

/**
 * RF09: `PUBLICADA`, no vencidas, sin las mías y dentro del radio; luego el filtro por tipo (RF35).
 * Orden: (1) coinciden con mis oficios, (2) distancia ascendente, (3) más recientes.
 */
export function prepararMuro(publicaciones: PublicacionConAutor[], ctx: ContextoMuro): ElementoMuro[] {
  const radio = ctx.radioM ?? RADIO_MURO_M;
  return publicaciones
    .filter((p) => p.estado === "PUBLICADA" && p.expiraEn > ctx.ahora && p.autorId !== ctx.uid)
    .filter((p) => ctx.filtro === "TODO" || p.categoria === ctx.filtro)
    .map((p) => ({
      ...p,
      distanciaM: distanciaMetros(ctx.centro, centroGeohash(p.geohash)),
      coincideConOficio: coincideConOficio(p, ctx.oficios),
    }))
    .filter((p) => p.distanciaM <= radio)
    .sort(
      (a, b) =>
        Number(b.coincideConOficio) - Number(a.coincideConOficio) ||
        a.distanciaM - b.distanciaM ||
        b.creadoEn - a.creadoEn,
    );
}

/** RN-09: bloques de 30 minutos, con mínimo 1 y máximo de 8 horas por servicio. */
export function calcularBloques(inicio: number, fin: number): number {
  const minutos = Math.max(0, (fin - inicio) / 60_000);
  return Math.min(16, Math.max(1, Math.ceil(minutos / 30)));
}

/** RN-04: con una necesidad activa no se puede crear otra publicación. */
export function puedeCrearPublicacion(necesidadActivaId: string | null): { permitido: boolean; motivo: string | null } {
  return necesidadActivaId
    ? { permitido: false, motivo: TEXTOS_INICIO.necesidadActiva }
    : { permitido: true, motivo: null };
}

/** Etiqueta del estado para el solicitante (sección 5.3). */
export function etiquetaEstadoSolicitante(estado: EstadoNecesidad, prestadorNombre: string | null): string {
  const nombre = prestadorNombre?.trim() || "Tu vecino";
  switch (estado) {
    case "PUBLICADA":
      return "Esperando a un vecino";
    case "ACEPTADA":
      return `${nombre} va en camino`;
    case "EN_SITIO":
      return `${nombre} dice que llegó`;
    case "EN_CURSO":
      return "Servicio en curso";
    case "FIN_SOLICITADO":
      return "Esperando confirmación";
    case "FINALIZADO":
      return "Finalizado";
    case "CANCELADA":
      return "Cancelada";
    case "EXPIRADA":
      return "Venció sin respuesta";
  }
}

/** Minutos que faltan para la llegada estimada (solo en ACEPTADA). `null` si ya pasó o no aplica. */
export function minutosParaLlegar(
  p: Pick<PublicacionConAutor, "estado" | "llegadaEstimada">,
  ahora: number,
): number | null {
  if (p.estado !== "ACEPTADA" || p.llegadaEstimada === null) return null;
  const minutos = Math.ceil((p.llegadaEstimada - ahora) / 60_000);
  return minutos > 0 ? minutos : null;
}
