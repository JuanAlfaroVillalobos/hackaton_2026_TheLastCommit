// Ruta: src/modulos/emergencia/dev.ts
// Atajos para probar el modo emergencia (solo fuera de producción, montado en /dev/emergencia):
//   GET  /dev/emergencia            → emergencias activas con sus vecinos
//   POST /dev/emergencia/finalizar  → cierra todas las activas (motivo MANUAL) y avisa a la zona
//   POST /dev/emergencia/tarea      → corre ya la tarea de cada minuto (reenvío RF23 y cierre RF25)
import { Router } from 'express';
import { vecinosDeEmergencia } from '../../datos/almacen.js';
import { emergenciasActivas, finalizar, tareaEmergencia } from './zona.js';

export const rutasDevEmergencia = Router();

rutasDevEmergencia.get('/', async (_req, res) => {
  const activas = await emergenciasActivas();
  res.json(
    await Promise.all(
      activas.map(async (e) => ({ ...e, vecinos: await vecinosDeEmergencia(e.id).listar() })),
    ),
  );
});

rutasDevEmergencia.post('/finalizar', async (_req, res) => {
  const activas = await emergenciasActivas();
  for (const emergencia of activas) await finalizar(emergencia, 'MANUAL');
  res.json({ finalizadas: activas.map((e) => e.id) });
});

rutasDevEmergencia.post('/tarea', async (_req, res) => {
  await tareaEmergencia();
  res.status(204).end();
});
