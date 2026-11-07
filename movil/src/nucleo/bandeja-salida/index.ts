// Ruta: src/nucleo/bandeja-salida/index.ts
// Bandeja de salida (RF41).
// ADAPTADOR TEMPORAL: solo expone el número de acciones pendientes, desde simulaciones/.
// Persona A implementa enviarAccion() (internet → SMS → cola) y este hook pasa a leer la cola real.
import { pendientesBandejaMock } from "@/simulaciones";

export function usePendientesBandeja(): number {
  return pendientesBandejaMock;
}
