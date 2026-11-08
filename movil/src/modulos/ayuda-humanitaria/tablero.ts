// Ruta: src/modulos/ayuda-humanitaria/tablero.ts
// Reglas puras del tablero humanitario (P22, RF39): qué se muestra, en qué orden y cómo se dibuja en el mapa.
import type { MarcadorMapa } from "@/compartido/ui/MapaBase";
import { COLOR_MARCADOR_REPORTE, ETIQUETA_TIPO_VULNERABILIDAD, ICONO_TIPO_VULNERABILIDAD } from "./constantes";
import {
  COLOR_MODO_RECURSO,
  ETIQUETA_MODO_RECURSO,
  ETIQUETA_TIPO_RECURSO,
  ICONO_TIPO_RECURSO,
} from "./constantesRecursos";
import type { RecursoCritico, ReporteVulnerabilidad } from "./tipos";

export type FiltroTablero = "TODO" | "REPORTES" | "RECURSOS" | "OFREZCO" | "NECESITO";

export type ItemTablero =
  | { clase: "REPORTE"; reporte: ReporteVulnerabilidad }
  | { clase: "RECURSO"; recurso: RecursoCritico };

/** Un reporte resuelto ya no hace falta en el tablero. */
export const esReporteActivo = (r: ReporteVulnerabilidad) => r.estado !== "RESUELTO";

/** Un recurso cerrado ya no hace falta en el tablero. */
export const esRecursoActivo = (r: RecursoCritico) => r.estado !== "CERRADO";

/**
 * Junta reportes y recursos en una sola lista. Primero los reportes (son lo más urgente) y luego los recursos.
 * Se espera que las listas ya vengan ordenadas (ordenarReportes / ordenarRecursos).
 */
export function armarTablero(
  reportes: ReporteVulnerabilidad[],
  recursos: RecursoCritico[],
  filtro: FiltroTablero,
): ItemTablero[] {
  const verReportes = filtro === "TODO" || filtro === "REPORTES";
  const verRecursos = filtro !== "REPORTES";
  const porModo = filtro === "OFREZCO" || filtro === "NECESITO";

  const itemsReportes: ItemTablero[] = verReportes
    ? reportes.filter(esReporteActivo).map((reporte) => ({ clase: "REPORTE", reporte }))
    : [];
  const itemsRecursos: ItemTablero[] = verRecursos
    ? recursos
        .filter(esRecursoActivo)
        .filter((r) => !porModo || r.modo === filtro)
        .map((recurso) => ({ clase: "RECURSO", recurso }))
    : [];
  return [...itemsReportes, ...itemsRecursos];
}

export function claveItem(i: ItemTablero): string {
  return i.clase === "REPORTE" ? `rv-${i.reporte.id}` : `rc-${i.recurso.id}`;
}

/** En el mapa solo van los pendientes de atender (ABIERTO); los ya atendidos o asignados quedan en la lista. */
export function marcadoresTablero(items: ItemTablero[]): MarcadorMapa[] {
  const marcadores: MarcadorMapa[] = [];
  for (const i of items) {
    if (i.clase === "REPORTE") {
      const r = i.reporte;
      if (r.estado !== "ABIERTO") continue;
      marcadores.push({
        id: claveItem(i),
        lat: r.lat,
        lng: r.lng,
        titulo: ETIQUETA_TIPO_VULNERABILIDAD[r.tipo],
        descripcion: `${r.personas} ${r.personas === 1 ? "persona" : "personas"} · ${r.codigo}`,
        color: COLOR_MARCADOR_REPORTE,
        icono: ICONO_TIPO_VULNERABILIDAD[r.tipo],
      });
    } else {
      const r = i.recurso;
      if (r.estado !== "ABIERTO") continue;
      marcadores.push({
        id: claveItem(i),
        lat: r.lat,
        lng: r.lng,
        titulo: `${ETIQUETA_MODO_RECURSO[r.modo]} · ${ETIQUETA_TIPO_RECURSO[r.tipo]} (${r.cantidad})`,
        descripcion: r.codigo,
        color: COLOR_MODO_RECURSO[r.modo],
        icono: ICONO_TIPO_RECURSO[r.tipo],
      });
    }
  }
  return marcadores;
}