// Ruta: src/modulos/bienvenida/servicios/voz.ts
// Lectura en voz alta de la guía (RF37, expo-speech). Si el APK instalado aún no trae el módulo nativo
// (se agregó después del último build), la guía funciona igual y el botón «Escuchar» se oculta.
type ModuloVoz = typeof import('expo-speech');

let voz: ModuloVoz | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  voz = require('expo-speech') as ModuloVoz;
} catch {
  voz = null;
}

export const vozDisponible = () => voz !== null;

/**
 * @description Lee el texto en español (Perú) un poco más lento de lo normal; llama a `alTerminar` al acabar o al detenerse.
 */
export function leerEnVozAlta(texto: string, alTerminar: () => void): void {
  if (!voz) return alTerminar();
  void voz.stop();
  voz.speak(texto, { language: 'es-PE', rate: 0.9, onDone: alTerminar, onStopped: alTerminar, onError: alTerminar });
}

export function detenerVoz(): void {
  void voz?.stop();
}
