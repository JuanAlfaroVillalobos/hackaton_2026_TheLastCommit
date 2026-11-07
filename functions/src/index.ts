import { setGlobalOptions } from 'firebase-functions/v2';

// Todas las funciones en la misma región que Firestore (README 9.2).
setGlobalOptions({ region: 'southamerica-east1', maxInstances: 10 });

// Cada dueño exporta aquí sus funciones, en la sección de su módulo (PLAN, sección 1).

// ── cuentas ──────────────────────────────

// ── identidad ────────────────────────────

// ── directorio ───────────────────────────

// ── trabajos ─────────────────────────────

// ── favores ──────────────────────────────

// ── emergencia ───────────────────────────

// ── ayuda-humanitaria ────────────────────

// ── contingencia-sms ─────────────────────

// ── clima ────────────────────────────────

// ── programadas ──────────────────────────