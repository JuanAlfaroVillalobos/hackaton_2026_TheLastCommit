import { serviciosMock } from "@/simulaciones/directorio";
import type { ServicioDirectorio } from "../tipos";

let directorio: ServicioDirectorio[] = [...serviciosMock];

export async function listarDirectorio(): Promise<ServicioDirectorio[]> {
  return [...directorio];
}