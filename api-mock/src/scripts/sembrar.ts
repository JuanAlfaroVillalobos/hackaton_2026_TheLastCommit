// Ruta: src/scripts/sembrar.ts
// Carga en Firestore las cuentas de prueba (semillas.usuarios) que faltan. No pisa las que ya existen.
//   npm run sembrar             → solo crea las que faltan
//   npm run sembrar -- --activos → además marca a todas como «activas» en la zona de la demo (ubicación
//                                  de hace un instante), para probar el umbral RN-11 sin abrir 3 teléfonos
// Por seguridad solo corre contra el emulador; para el proyecto real hay que pasar --proyecto-real.
import { almacen, USA_FIRESTORE } from '../datos/almacen.js';
import * as semillas from '../datos/semillas.js';

const args = new Set(process.argv.slice(2));

if (!USA_FIRESTORE) {
  console.error('ALMACEN no es «firestore»: en memoria las semillas ya se cargan solas. Revisa tu .env.');
  process.exit(1);
}
if (!process.env.FIRESTORE_EMULATOR_HOST && !args.has('--proyecto-real')) {
  console.error('FIRESTORE_EMULATOR_HOST no está definido: esto escribiría en el proyecto real.');
  console.error('Si es lo que quieres, repite con: npm run sembrar -- --proyecto-real');
  process.exit(1);
}

let creados = 0;
for (const usuario of semillas.usuarios) {
  if (!(await almacen.usuarios.obtener(usuario.id))) {
    await almacen.usuarios.crear(usuario);
    creados++;
  }
  if (args.has('--activos')) {
    await almacen.usuarios.actualizar(usuario.id, {
      ubicacion: semillas.ZONA_DEMO,
      celdaH3: usuario.celdaH3,
      ubicacionEn: Date.now(),
    });
  }
}

console.log(`usuarios: ${creados} creados, ${semillas.usuarios.length - creados} ya existían.`);
if (args.has('--activos')) console.log(`Los ${semillas.usuarios.length} vecinos de prueba quedan activos durante 30 min.`);
console.log(`Cuentas: ${semillas.usuarios.map((u) => u.correo).join(', ')} · clave ${semillas.CLAVE_DEMO}`);
process.exit(0);
