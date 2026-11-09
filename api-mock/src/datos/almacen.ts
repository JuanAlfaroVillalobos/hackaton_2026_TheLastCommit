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
  AccionProcesada,
  ArchivoGuardado,
  AlertaEmergencia,
  CodigoClave,
  ConteoCelda,
  Emergencia,
  FichaEmergencia,
  IntentoIngreso,
  NotificacionBuzon,
  Publicacion,
  RecursoCritico,
  ReporteVulnerabilidad,
  ServicioDirectorio,
  Sesion,
  Usuario,
  VecinoEmergencia,
  VecinoEnEmergencia,
} from './tipos.js';

export const USA_FIRESTORE = process.env.ALMACEN === 'firestore';

/** Colecciones que hoy van a Firestore, para el log de arranque. */
export const COLECCIONES_FIRESTORE: string[] = [];

/** Semillas de las colecciones en Firestore: se crean al arrancar si faltan (ver sembrarFirestore). */
const SEMILLAS_FIRESTORE: { coleccion: string; repo: Repositorio<Entidad>; semilla: Entidad[] }[] = [];

/** Colección migrada: Firestore con ALMACEN=firestore; si no, memoria con la semilla. */
function persistente<T extends Entidad>(coleccion: string, semilla: T[] = []): Repositorio<T> {
  if (!USA_FIRESTORE) return new RepositorioMemoria(semilla);
  COLECCIONES_FIRESTORE.push(coleccion);
  const repo = new RepositorioFirestore<T>(coleccion);
  if (semilla.length) SEMILLAS_FIRESTORE.push({ coleccion, repo: repo as unknown as Repositorio<Entidad>, semilla });
  return repo;
}

/**
 * Crea en Firestore los documentos de las semillas que falten (p. ej. la cuenta de Ana). No toca los
 * que ya existen, así que no borra lo que hizo el equipo. Se llama una vez al arrancar el servidor.
 */
export async function sembrarFirestore(): Promise<number> {
  let creados = 0;
  for (const { repo, semilla } of SEMILLAS_FIRESTORE) {
    for (const fila of semilla) {
      if (!(await repo.obtener(fila.id))) {
        await repo.guardar(structuredClone(fila));
        creados++;
      }
    }
  }
  return creados;
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
  codigosClave: Repositorio<CodigoClave>;
  intentosIngreso: Repositorio<IntentoIngreso>;
  notificaciones: Repositorio<NotificacionBuzon>;
  accionesProcesadas: Repositorio<AccionProcesada>;
  archivos: Repositorio<ArchivoGuardado>;
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
  // --- cuentas y nucleo (Persona A) ---
  sesiones: persistente('sesiones'),
  codigosClave: persistente('codigosClave'),
  intentosIngreso: persistente('intentosIngreso'),
  notificaciones: persistente('notificaciones'),
  accionesProcesadas: persistente('accionesProcesadas'),
  archivos: persistente('archivos'),
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
