// Ruta: src/compartido/utilidades/formatos.ts
// Formatos de español de Perú (README, sección 4 y 9): distancias redondeadas a 100 m con coma decimal,
// tiempo relativo corto y fechas cortas con date-fns (locale `es`). Funciones puras.
import { format } from "date-fns";
import { es } from "date-fns/locale";

const MINUTO = 60_000;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

/** «a 300 m», «a 1,2 km». Redondea a 100 m y nunca muestra menos de 100 m (RN-14). */
export function formatearDistancia(metros: number): string {
  const redondeado = Math.max(100, Math.round(metros / 100) * 100);
  if (redondeado < 1000) return `a ${redondeado} m`;
  const km = (redondeado / 1000).toFixed(1).replace(".", ",").replace(/,0$/, "");
  return `a ${km} km`;
}

/** «hace un momento», «hace 10 min», «hace 1 h», «hace 2 d». */
export function formatearHace(desde: number, ahora: number): string {
  const transcurrido = Math.max(0, ahora - desde);
  if (transcurrido < MINUTO) return "hace un momento";
  if (transcurrido < HORA) return `hace ${Math.floor(transcurrido / MINUTO)} min`;
  if (transcurrido < DIA) return `hace ${Math.floor(transcurrido / HORA)} h`;
  return `hace ${Math.floor(transcurrido / DIA)} d`;
}

/** «dom 8 nov» (hora local del teléfono, Perú). */
export function formatearFechaCorta(fecha: number): string {
  return format(fecha, "EEE d MMM", { locale: es });
}

/** Recorta un texto en el último espacio antes de `maximo` y agrega «…». */
export function extracto(texto: string, maximo = 80): string {
  const limpio = texto.trim().replace(/\s+/g, " ");
  if (limpio.length <= maximo) return limpio;
  const corte = limpio.slice(0, maximo - 1);
  const ultimoEspacio = corte.lastIndexOf(" ");
  return `${(ultimoEspacio > maximo * 0.6 ? corte.slice(0, ultimoEspacio) : corte).trimEnd()}…`;
}

/** «Rosa Vega» → «RV». */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  return ((partes[0]?.[0] ?? "") + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

/** Primer nombre para el saludo: «Ana Morales» → «Ana». */
export function primerNombre(nombre: string): string {
  return nombre.trim().split(/\s+/)[0] ?? "";
}
