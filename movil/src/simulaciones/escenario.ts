// Ruta: src/simulaciones/escenario.ts
// Escenario de datos para revisar cada frame del diseño sin backend.
// Se elige con EXPO_PUBLIC_ESCENARIO_P04 al levantar Metro, p. ej.:
//   EXPO_PUBLIC_ESCENARIO_P04=muro npx expo start --dev-client
// - vacio (por defecto) → 04-C: sin publicaciones cerca.
// - muro               → 04-A: tres tarjetas.
// - activa             → 04-B: «Tu publicación» y «Crear publicación» deshabilitado.
// - sin-conexion       → 04-D: franja «Sin conexión», 1 pendiente y notificaciones denegadas.
// El tema lluvia (04-E) se fuerza aparte con EXPO_PUBLIC_TEMA=lluvia.
export type EscenarioDemo = "vacio" | "muro" | "activa" | "sin-conexion";

const VALIDOS: EscenarioDemo[] = ["vacio", "muro", "activa", "sin-conexion"];
const elegido = process.env.EXPO_PUBLIC_ESCENARIO_P04 as EscenarioDemo | undefined;

export const ESCENARIO_DEMO: EscenarioDemo = elegido && VALIDOS.includes(elegido) ? elegido : "vacio";
