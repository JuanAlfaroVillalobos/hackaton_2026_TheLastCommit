// Ruta: src/datos/almacen.ts
// ÚNICO lugar que decide dónde viven los datos.
// - Las colecciones migradas usan `persistente(...)`: Firestore si ALMACEN=firestore, memoria si no
//   (así nadie queda bloqueado si no tiene el emulador ni credenciales).
// - Las demás siguen en memoria con sus semillas.
// Para pasar otra colección a Firestore: cámbiala a `persistente(...)`. Las rutas no cambian.
import { RepositorioMemoria, type Entidad, type Repositorio } from '../nucleo/repositorio.js';
import { RepositorioFirestore } from '../nucleo/repositorioFirestore.js';
import * as semillas from './semillas.js';
import type {
  AlertaEmergencia,
  ConteoCelda,
  FichaEmergencia,
  Publicacion,
  RecursoCritico,
  ReporteVulnerabilidad,
  ServicioDirectorio,
  Usuario,
  VecinoEmergencia,
} from './tipos.js';

export const USA_FIRESTORE = process.env.ALMACEN === 'firestore';

/** Colecciones que hoy van a Firestore, para el log de arranque. */
export const COLECCIONES_FIRESTORE: string[] = [];

/** Colección migrada: Firestore con ALMACEN=firestore; si no, memoria con la semilla. */
function persistente<T extends Entidad>(coleccion: string, semilla: T[] = []): Repositorio<T> {
  if (!USA_FIRESTORE) return new RepositorioMemoria(semilla);
  COLECCIONES_FIRESTORE.push(coleccion);
  return new RepositorioFirestore<T>(coleccion);
}

export const almacen: {
  usuarios: Repositorio<Usuario>;
  publicaciones: Repositorio<Publicacion>;
  directorio: Repositorio<ServicioDirectorio>;
  vecinosEmergencia: Repositorio<VecinoEmergencia>;
  reportes: Repositorio<ReporteVulnerabilidad>;
  recursos: Repositorio<RecursoCritico>;
  fichasEmergencia: Repositorio<FichaEmergencia>;
  alertas: Repositorio<AlertaEmergencia>;
  celdas: Repositorio<ConteoCelda>;
} = {
  // --- en memoria ---
  usuarios: new RepositorioMemoria(semillas.usuarios),
  publicaciones: new RepositorioMemoria(semillas.publicaciones),
  directorio: new RepositorioMemoria(semillas.directorio),
  vecinosEmergencia: new RepositorioMemoria(semillas.vecinosEmergencia),
  reportes: new RepositorioMemoria(semillas.reportes),
  recursos: new RepositorioMemoria(semillas.recursos),
  fichasEmergencia: new RepositorioMemoria(semillas.fichasEmergencia),
  // --- migradas (Firestore con ALMACEN=firestore) ---
  alertas: persistente('alertas', semillas.alertas),
  celdas: persistente('celdas'),
};
