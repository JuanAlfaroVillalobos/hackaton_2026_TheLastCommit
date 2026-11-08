// Ruta: src/servidor.ts
// Las variables de .env las carga Node antes de importar nada (--env-file-if-exists en package.json).
import { networkInterfaces } from 'node:os';
import { crearApp } from './app.js';
import { COLECCIONES_FIRESTORE } from './datos/almacen.js';
import { CLAVE_DEMO } from './datos/semillas.js';
import { ejecutarTareasFavoresMock } from './modulos/favores/rutas.js';
import { PROYECTO_FIREBASE } from './nucleo/firebase.js';
import { INTERVALO_ALERTA_MS } from './modulos/emergencia/config.js';
import { tareaEmergencia } from './modulos/emergencia/zona.js';

const PUERTO = Number(process.env.PORT ?? 3000);
const INTERVALO_TAREAS_MS = 60_000;

/** IPs de la red local, para escribirlas en EXPO_PUBLIC_API_URL si el celular no la detecta solo. */
const ipsLocales = Object.values(networkInterfaces())
  .flat()
  .filter((red) => red && red.family === 'IPv4' && !red.internal)
  .map((red) => red!.address);

crearApp().listen(PUERTO, '0.0.0.0', () => {
  console.log(`API de Vecinos en http://localhost:${PUERTO}/api/v1`);
  for (const ip of ipsLocales) console.log(`  desde el celular: http://${ip}:${PUERTO}/api/v1`);
  console.log(`  cuenta de prueba: ana@vecinos.pe / ${CLAVE_DEMO}`);
  if (COLECCIONES_FIRESTORE.length) {
    const destino = process.env.FIRESTORE_EMULATOR_HOST
      ? `emulador ${process.env.FIRESTORE_EMULATOR_HOST}`
      : `proyecto ${PROYECTO_FIREBASE}`;
    console.log(`  Firestore (${destino}): ${COLECCIONES_FIRESTORE.join(', ')}; el resto en memoria`);
  } else {
    console.log('  todo en memoria (ALMACEN=firestore en .env para guardar alertas en Firestore)');
  }
});

const tareas = setInterval(() => {
  ejecutarTareasFavoresMock().catch((error: unknown) => {
    console.error('Falló la tarea programada del módulo favores.', error);
  });
}, INTERVALO_TAREAS_MS);
tareas.unref();
ejecutarTareasFavoresMock().catch((error: unknown) => {
  console.error('Falló la ejecución inicial de tareas del módulo favores.', error);
});

// RF23 + RF25: «¿Estás bien?» cada minuto y cierre de las emergencias (en Functions será `cadaMinuto`).
const tareasEmergencia = setInterval(() => {
  tareaEmergencia().catch((error: unknown) => console.error('Falló la tarea programada del módulo emergencia.', error));
}, INTERVALO_ALERTA_MS);
tareasEmergencia.unref();
