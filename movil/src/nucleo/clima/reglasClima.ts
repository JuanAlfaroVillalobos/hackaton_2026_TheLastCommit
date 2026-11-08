// Ruta: src/nucleo/clima/reglasClima.ts
// Reglas puras del tema por clima (README RF29). Sin red ni React Native: se prueban con datos de ejemplo.
// Prioridad completa: emergencia > calor > lluvia > normal. «Emergencia» la decide el módulo emergencia;
// aquí solo se decide entre calor, lluvia y normal.

export type TemaClima = "calor" | "lluvia" | "normal";

export type DatosClima = {
  /** Código de clima WMO de ahora (Open-Meteo `weather_code`). */
  codigoClima: number;
  /** Precipitación en mm de la última hora. */
  precipitacion: number;
  /** Temperatura aparente en °C. */
  temperaturaAparente: number;
  /** Temperaturas máximas diarias de los últimos 30 días (sin contar hoy). */
  maximasUltimos30Dias: number[];
};

export const UMBRAL_PRECIPITACION_MM = 0.2;
export const UMBRAL_CALOR_ABSOLUTO_C = 30;
export const MARGEN_CALOR_SOBRE_MEDIA_C = 5;

/** Lluvia, llovizna o tormenta: códigos WMO 51–67, 80–82 y 95–99. */
export function esCodigoDeLluvia(codigo: number): boolean {
  return (codigo >= 51 && codigo <= 67) || (codigo >= 80 && codigo <= 82) || (codigo >= 95 && codigo <= 99);
}

export function hayLluvia(d: Pick<DatosClima, "codigoClima" | "precipitacion">): boolean {
  return esCodigoDeLluvia(d.codigoClima) || d.precipitacion > UMBRAL_PRECIPITACION_MM;
}

/** Calor inusual: aparente ≥ 30 °C, o ≥ media de las máximas de 30 días + 5 °C. */
export function hayCalorInusual(d: Pick<DatosClima, "temperaturaAparente" | "maximasUltimos30Dias">): boolean {
  if (d.temperaturaAparente >= UMBRAL_CALOR_ABSOLUTO_C) return true;
  const m = d.maximasUltimos30Dias;
  if (m.length === 0) return false;
  const media = m.reduce((a, b) => a + b, 0) / m.length;
  return d.temperaturaAparente >= media + MARGEN_CALOR_SOBRE_MEDIA_C;
}

/** calor > lluvia > normal. */
export function temaPorClima(d: DatosClima): TemaClima {
  if (hayCalorInusual(d)) return "calor";
  if (hayLluvia(d)) return "lluvia";
  return "normal";
}