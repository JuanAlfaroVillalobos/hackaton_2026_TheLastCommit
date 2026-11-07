// Ruta: src/modulos/favores/constantes.ts
// Textos y catálogos del módulo. Los mensajes literales salen del README (4.7, 5.3) y de diseno/P04-Inicio.
import type { CategoriaPublicacion, FiltroMuro, TipoPublicacion } from "./tipos";

/** Radio del muro (RF09, supuesto de la pregunta 3 de la 12.2). */
export const RADIO_MURO_M = 3000;

export const ETIQUETA_TIPO: Record<TipoPublicacion, string> = {
  NECESITO: "Necesito",
  OFREZCO: "Ofrezco",
};

/** Etiquetas cortas de los filtros (supuesto del diseño P04). */
export const FILTROS_MURO: { valor: FiltroMuro; texto: string }[] = [
  { valor: "TODO", texto: "Todo" },
  { valor: "FAVOR_OFICIO", texto: "Favores y oficios" },
  { valor: "PRESTAMO", texto: "Préstamos" },
  { valor: "DONACION", texto: "Donaciones" },
  { valor: "INTERCAMBIO", texto: "Intercambios" },
  { valor: "MOVILIDAD", texto: "Movilidad" },
];

/** Chip del detalle cuando la publicación no tiene oficio (RF35). */
export const ETIQUETA_CATEGORIA: Record<CategoriaPublicacion, string> = {
  FAVOR_OFICIO: "Favor",
  PRESTAMO: "Préstamo de herramienta",
  DONACION: "Donación de materiales",
  INTERCAMBIO: "Intercambio de habilidades",
  MOVILIDAD: "Movilidad solidaria",
};

export const TEXTOS_INICIO = {
  saludo: (nombre: string) => `Hola, ${nombre}. Tu barrio está aquí.`,
  subtitulo: "Pide o ofrece una mano a tus vecinos.",
  crearPublicacion: "Crear publicación",
  reportarVulnerabilidad: "Reportar vulnerabilidad",
  enElMuro: "En el muro",
  cercaDeTi: "Cerca de ti · 3 km",
  actualizado: (hace: string) => `actualizado ${hace}`,
  coincide: "Coincide con tu oficio",
  verDetalle: "Ver detalle",
  tuPublicacion: "Tu publicación",
  verMiFavor: "Ver mi favor",
  devolucion: (fecha: string) => `Devolución: ${fecha}`,
  llegaEn: (min: number) => `Llega en unos ${min} min`,
  /** RF09. */
  vacio: "No hay necesidades cerca. ¿Necesitas algo? Publícalo",
  /** RF10 / RN-04. */
  necesidadActiva: "Ya tienes una necesidad activa. Termínala o cancélala para publicar otra.",
  /** RF08. */
  sinNotificaciones: "No recibirás avisos de ayuda ni de emergencia",
  irAjustes: "Ir a Ajustes",
  ayuda: "Abrir la guía de ayuda",
} as const;
