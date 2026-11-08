// Ruta: src/nucleo/arranque.ts
// Prepara los datos antes de abrir el puerto:
//  1. Firestore: crea las semillas que falten y repara punteros que apuntan a publicaciones que ya no
//     existen (si `publicaciones` sigue en memoria y se reinició la API, un vecino quedaría bloqueado con
//     «Ya tienes una necesidad activa»).
//  2. Firebase Auth: crea las cuentas de prueba (ana@vecinos.pe, …) con su mismo uid y la clave de demo.
import { almacen, sembrarFirestore, USA_FIRESTORE } from '../datos/almacen.js';
import { CLAVE_DEMO, usuarios as usuariosSemilla } from '../datos/semillas.js';
import { crearCuentaAuth, obtenerCuentaAuth, problemaConfiguracionAuth, USA_FIREBASE_AUTH } from './firebaseAuth.js';

const mensaje = (error: unknown) => (error instanceof Error ? error.message : String(error));

async function prepararFirestore(): Promise<string> {
  const sembrados = await sembrarFirestore();
  let reparados = 0;
  for (const u of await almacen.usuarios.listar()) {
    const cambios: { necesidadActivaId?: null; servicioActivoId?: null } = {};
    if (u.necesidadActivaId && !(await almacen.publicaciones.obtener(u.necesidadActivaId))) cambios.necesidadActivaId = null;
    if (u.servicioActivoId && !(await almacen.publicaciones.obtener(u.servicioActivoId))) cambios.servicioActivoId = null;
    if (Object.keys(cambios).length) {
      await almacen.usuarios.actualizar(u.id, cambios);
      reparados++;
    }
  }
  return `semillas creadas: ${sembrados}; perfiles reparados: ${reparados}`;
}

async function prepararAuth(): Promise<string> {
  const problema = problemaConfiguracionAuth();
  if (problema) return `⚠ ${problema}`;
  let creadas = 0;
  for (const semilla of usuariosSemilla) {
    if (!(await obtenerCuentaAuth(semilla.id))) {
      await crearCuentaAuth({ uid: semilla.id, correo: semilla.correo, clave: CLAVE_DEMO, nombre: semilla.nombre, verificado: true });
      creadas++;
    }
    // Con Firebase Auth la clave no se guarda en el perfil.
    const perfil = await almacen.usuarios.obtener(semilla.id);
    if (perfil?.clave) await almacen.usuarios.actualizar(semilla.id, { clave: '' });
  }
  return `cuentas de prueba creadas: ${creadas}`;
}

/**
 * @description Prepara Firestore y Firebase Auth. Devuelve líneas para el log; nunca impide que la API arranque.
 */
export async function prepararDatos(): Promise<string[]> {
  const lineas: string[] = [];
  if (USA_FIRESTORE) {
    try {
      lineas.push(`Firestore: ${await prepararFirestore()}`);
    } catch (error) {
      lineas.push(`⚠ Firestore no respondió (${mensaje(error)}). ¿Está encendido el emulador o son válidas las credenciales?`);
    }
  }
  if (USA_FIREBASE_AUTH) {
    try {
      lineas.push(`Firebase Auth: ${await prepararAuth()}`);
    } catch (error) {
      lineas.push(`⚠ Firebase Auth no respondió (${mensaje(error)}). ¿Está encendido el emulador de Auth?`);
    }
  }
  return lineas;
}
