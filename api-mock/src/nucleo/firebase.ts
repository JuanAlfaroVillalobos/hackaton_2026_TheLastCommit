// Ruta: src/nucleo/firebase.ts
// Conexión a Firestore con firebase-admin. Solo se abre si ALMACEN=firestore (ver src/datos/almacen.ts).
// Credenciales, en este orden:
//   1. FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 → usa el emulador local, sin credenciales.
//   2. GOOGLE_APPLICATION_CREDENTIALS=./credenciales/cuenta-servicio.json → cuenta de servicio del proyecto.
//   3. `gcloud auth application-default login` → credenciales por defecto de tu usuario de Google.
// firebase-admin ignora las reglas de Firestore: la API es la única que escribe.
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

export const PROYECTO_FIREBASE = process.env.FIREBASE_PROJECT_ID ?? 'vecinos-thelastcommit';

let db: Firestore | null = null;

export function firestore(): Firestore {
  if (db) return db;
  const app = getApps()[0] ?? initializeApp({ projectId: PROYECTO_FIREBASE });
  db = getFirestore(app);
  // Los campos opcionales que llegan como undefined se omiten en vez de romper la escritura.
  db.settings({ ignoreUndefinedProperties: true });
  return db;
}
