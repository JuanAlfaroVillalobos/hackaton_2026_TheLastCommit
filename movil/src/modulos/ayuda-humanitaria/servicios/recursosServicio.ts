// Ruta: src/modulos/ayuda-humanitaria/servicios/recursosServicio.ts
// Hoy habla con la API simulada (api-mock). Después se cambia el cuerpo por Firestore
// (recursosCriticos) y funciones; las firmas y las pantallas no cambian.
// El aviso al autor cuando alguien se asigna lo enviará una Cloud Function al pasar a ASIGNADO.
import { api } from "@/nucleo/api";
import type { NuevoRecurso, RecursoCritico } from "../tipos";
import { crearOyentes } from "./oyentes";

const RUTA = "/ayuda-humanitaria/recursos";
const oyentes = crearOyentes();

/** Equivale a onSnapshot: avisa cada vez que cambia la lista. Devuelve la función para dejar de escuchar. */
export const suscribirRecursos = oyentes.suscribir;

export async function listarRecursos(): Promise<RecursoCritico[]> {
  return api<RecursoCritico[]>(RUTA);
}

export async function crearRecurso(datos: NuevoRecurso): Promise<RecursoCritico> {
  try {
    return await api<RecursoCritico>(RUTA, { metodo: "POST", cuerpo: { ...datos, canal: "APP" } });
  } finally {
    oyentes.avisar();
  }
}

/** «Lo tengo» / «Lo necesito»: ABIERTO → ASIGNADO, salvo que sea tu propio recurso. */
export async function asignarRecurso(id: string): Promise<void> {
  try {
    await api(`${RUTA}/${id}/asignar`, { metodo: "POST" });
  } finally {
    oyentes.avisar();
  }
}

/** Cierra el recurso; solo lo puede hacer quien lo publicó. */
export async function cerrarRecurso(id: string): Promise<void> {
  try {
    await api(`${RUTA}/${id}/cerrar`, { metodo: "POST" });
  } finally {
    oyentes.avisar();
  }
}
