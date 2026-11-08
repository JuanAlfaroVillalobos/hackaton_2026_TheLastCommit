// Ruta: src/modulos/ayuda-humanitaria/servicios/directorioServicio.ts
// Hoy habla con la API simulada (api-mock). Después se cambia el cuerpo por Firestore
// (directorioEmergencia); las firmas y las pantallas no cambian.
// Sin conexión (RF40): se guarda la última lista descargada y se devuelve cuando la API no responde.
// La copia se guarda también en el teléfono (almacen.ts) para que sirva aunque se cierre la app; con Firestore,
// su persistencia offline hará ese papel.
import { api, ErrorApi } from "@/nucleo/api";
import { soloDigitos } from "../directorio";
import type { FichaDirectorio, NuevaFicha } from "../tipos";
import { guardarLocal, leerLocal } from "./almacen";
import { crearOyentes } from "./oyentes";
import { obtenerUbicacionValidada } from "./ubicacionServicio";

const CLAVE_LOCAL = "ah.directorio";
const RUTA = "/ayuda-humanitaria/fichas";
const oyentes = crearOyentes();
let copia: FichaDirectorio[] | null = null;

/** Equivale a onSnapshot: avisa cada vez que cambia la lista. Devuelve la función para dejar de escuchar. */
export const suscribirDirectorio = oyentes.suscribir;

/** Fichas aprobadas, más las que propuse yo y siguen pendientes. Sin conexión devuelve la última copia. */
export async function listarDirectorio(): Promise<FichaDirectorio[]> {
  try {
    copia = await api<FichaDirectorio[]>(RUTA);
    void guardarLocal(CLAVE_LOCAL, copia);
    return copia;
  } catch (error) {
    if (error instanceof ErrorApi && error.codigo === "SIN_CONEXION") {
      copia = copia ?? (await leerLocal<FichaDirectorio[]>(CLAVE_LOCAL));
      if (copia) return copia;
    }
    throw error;
  }
}

/** «Se descarga entero al abrir la app» (RF40): se llama una vez al arrancar para dejar la copia lista. */
export async function descargarDirectorio(): Promise<void> {
  await listarDirectorio().catch(() => undefined);
  oyentes.avisar();
}

/** Un vecino propone una ficha: queda pendiente (`aprobado = false`) hasta que un validador la acepte. */
export async function proponerFicha(datos: NuevaFicha): Promise<FichaDirectorio> {
  const { lat, lng } = await obtenerUbicacionValidada();
  try {
    return await api<FichaDirectorio>(RUTA, {
      metodo: "POST",
      cuerpo: {
        ...datos,
        nombre: datos.nombre.trim(),
        whatsapp: datos.whatsapp && soloDigitos(datos.whatsapp) ? soloDigitos(datos.whatsapp) : null,
        direccion: datos.direccion.trim() || "—",
        horario: datos.horario.trim() || "—",
        lat,
        lng,
      },
    });
  } finally {
    oyentes.avisar();
  }
}