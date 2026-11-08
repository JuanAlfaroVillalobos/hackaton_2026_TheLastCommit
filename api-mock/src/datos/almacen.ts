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
  Emergencia,
  FichaEmergencia,
  Publicacion,
  Sesion,
  RecursoCritico,
  ReporteVulnerabilidad,
  ServicioDirectorio,
  Usuario,
  VecinoEmergencia,
  VecinoEnEmergencia,
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
  emergencias: Repositorio<Emergencia>;
  sesiones: Repositorio<Sesion>;
} = {
  // --- en memoria ---
  publicaciones: new RepositorioMemoria(semillas.publicaciones),
  directorio: new RepositorioMemoria(semillas.directorio),
  vecinosEmergencia: new RepositorioMemoria(semillas.vecinosEmergencia),
  reportes: new RepositorioMemoria(semillas.reportes),
  recursos: new RepositorioMemoria(semillas.recursos),
  fichasEmergencia: new RepositorioMemoria(semillas.fichasEmergencia),
  // --- migradas (Firestore con ALMACEN=firestore; con el emulador, `npm run sembrar` carga las cuentas) ---
  usuarios: persistente('usuarios', semillas.usuarios),
  alertas: persistente('alertas', semillas.alertas),
  celdas: persistente('celdas'),
  emergencias: persistente('emergencias'),
  sesiones: persistente('sesiones'),
};

const subcolecciones = new Map<string, Repositorio<Entidad>>();

/** Subcolección (p. ej. `emergencias/{id}/vecinos`): Firestore o memoria, igual que su colección padre. */
function subcoleccion<T extends Entidad>(ruta: string): Repositorio<T> {
  let repo = subcolecciones.get(ruta);
  if (!repo) {
    repo = USA_FIRESTORE ? new RepositorioFirestore<Entidad>(ruta) : new RepositorioMemoria<Entidad>();
    subcolecciones.set(ruta, repo);
  }
  return repo as unknown as Repositorio<T>;
}

/** `emergencias/{id}/vecinos/{uid}` (RF21, RF22, RF24). */
export const vecinosDeEmergencia = (emergenciaId: string) =>
  subcoleccion<VecinoEnEmergencia>(`emergencias/${emergenciaId}/vecinos`);
