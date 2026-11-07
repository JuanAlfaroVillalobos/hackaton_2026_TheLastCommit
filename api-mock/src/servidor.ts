// Ruta: src/servidor.ts
import { networkInterfaces } from 'node:os';
import { crearApp } from './app.js';
import { CLAVE_DEMO } from './datos/semillas.js';

const PUERTO = Number(process.env.PORT ?? 3000);

/** IPs de la red local, para escribirlas en EXPO_PUBLIC_API_URL si el celular no la detecta solo. */
const ipsLocales = Object.values(networkInterfaces())
  .flat()
  .filter((red) => red && red.family === 'IPv4' && !red.internal)
  .map((red) => red!.address);

crearApp().listen(PUERTO, '0.0.0.0', () => {
  console.log(`API simulada de Vecinos en http://localhost:${PUERTO}/api/v1`);
  for (const ip of ipsLocales) console.log(`  desde el celular: http://${ip}:${PUERTO}/api/v1`);
  console.log(`  cuenta de prueba: ana@vecinos.pe / ${CLAVE_DEMO}`);
});
