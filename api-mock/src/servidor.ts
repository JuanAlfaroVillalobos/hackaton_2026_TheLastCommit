// Ruta: src/servidor.ts
// Las variables de .env las carga Node antes de importar nada (--env-file-if-exists en package.json).
import { networkInterfaces } from 'node:os';
import { crearApp } from './app.js';
import { COLECCIONES_FIRESTORE } from './datos/almacen.js';
import { CLAVE_DEMO } from './datos/semillas.js';
import { ejecutarTareasFavoresMock } from './modulos/favores/rutas.js';
import { destinoArchivos } from './nucleo/archivos.js';
import { prepararDatos } from './nucleo/arranque.js';
import { PROYECTO_FIREBASE } from './nucleo/firebase.js';
import { destinoAuth } from './nucleo/firebaseAuth.js';
import { USA_FCM } from './nucleo/notificar.js';

const PUERTO = Number(process.env.PORT ?? 3000);
const INTERVALO_TAREAS_MS = 60_000;

/** IPs de la red local, para escribirlas en EXPO_PUBLIC_API_URL si el celular no la detecta solo. */
const ipsLocales = Object.values(networkInterfaces())
  .flat()
  .filter((red) => red && red.family === 'IPv4' && !red.internal)
  .map((red) => red!.address);

const preparacion = await prepararDatos();

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
    console.log('  todo en memoria (ALMACEN=firestore en .env para guardar en Firestore)');
  }
  for (const linea of preparacion) console.log(`  ${linea}`);
  console.log(`  cuentas: ${destinoAuth()}`);
  console.log(`  fotos: ${destinoArchivos()} · FCM: ${USA_FCM ? 'activado' : 'apagado (solo buzón)'}`);
  if (process.env.NODE_ENV !== 'production') console.log(`  datos: http://localhost:${PUERTO}/dev`);
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
