// Ruta: src/servidor.ts
// Las variables de .env las carga Node antes de importar nada (--env-file-if-exists en package.json).
import { networkInterfaces } from 'node:os';
import { crearApp } from './app.js';
import { COLECCIONES_FIRESTORE } from './datos/almacen.js';
import { CLAVE_DEMO } from './datos/semillas.js';
import { PROYECTO_FIREBASE } from './nucleo/firebase.js';

const PUERTO = Number(process.env.PORT ?? 3000);

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
