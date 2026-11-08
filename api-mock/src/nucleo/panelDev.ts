// Ruta: src/nucleo/panelDev.ts
// Panel de datos para desarrollo: http://localhost:3000/dev muestra lo que hay en memoria ahora mismo.
// Solo existe fuera de producción (NODE_ENV !== 'production'). Nunca muestra claves ni tokens.
import { Router } from 'express';
import { almacen } from '../datos/almacen.js';

export const panelDev = Router();

type Coleccion = keyof typeof almacen;

/** Quita lo que no debe verse ni en desarrollo. */
function limpiar(coleccion: Coleccion, fila: Record<string, unknown>): Record<string, unknown> {
  if (coleccion !== 'usuarios') return fila;
  const { clave: _c, dispositivos, identidad, ...resto } = fila as Record<string, unknown> & {
    dispositivos?: string[];
    identidad?: { estado: string; dni?: string };
  };
  return {
    ...resto,
    dispositivos: dispositivos?.length ?? 0,
    identidad: identidad ? `${identidad.estado}${identidad.dni ? ` · DNI ••••${identidad.dni.slice(-4)}` : ''}` : 'NO_ENVIADA',
  };
}

async function leerTodo() {
  const datos: Record<string, Record<string, unknown>[]> = {};
  for (const nombre of Object.keys(almacen) as Coleccion[]) {
    if (nombre === 'sesiones') continue; // son tokens: nunca se muestran
    const filas = (await almacen[nombre].listar()) as unknown as Record<string, unknown>[];
    datos[nombre] = filas.map((f) => limpiar(nombre, f));
  }
  return datos;
}

const escapar = (v: unknown) =>
  String(typeof v === 'object' && v !== null ? JSON.stringify(v) : (v ?? '—'))
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const formatoCelda = (clave: string, v: unknown) =>
  typeof v === 'number' && /En$/.test(clave) && v > 1e12 ? new Date(v).toLocaleString('es-PE') : escapar(v);

panelDev.get('/datos', async (_req, res) => {
  res.json(await leerTodo());
});

panelDev.get('/', async (_req, res) => {
  const datos = await leerTodo();
  const secciones = Object.entries(datos)
    .map(([nombre, filas]) => {
      const columnas = [...new Set(filas.flatMap((f) => Object.keys(f)))];
      const cuerpo = filas
        .map((f) => `<tr>${columnas.map((c) => `<td>${formatoCelda(c, f[c])}</td>`).join('')}</tr>`)
        .join('');
      return `<details ${filas.length ? 'open' : ''}><summary>${nombre} <span>${filas.length}</span></summary>
        ${filas.length ? `<div class="tabla"><table><thead><tr>${columnas.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${cuerpo}</tbody></table></div>` : '<p>Vacía.</p>'}
      </details>`;
    })
    .join('');

  res.type('html').send(`<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>API simulada · datos</title>
<style>
  body{font:14px/1.45 system-ui,sans-serif;margin:0;padding:24px;background:#f6f8f5;color:#1c1917}
  h1{font-size:22px;margin:0 0 4px} p.meta{color:#57534e;margin:0 0 20px}
  details{background:#fff;border:1px solid #e7e5e4;border-radius:12px;margin:12px 0;padding:8px 12px}
  summary{font-weight:700;cursor:pointer;padding:6px 0} summary span{background:#ffedd5;color:#9a3412;border-radius:999px;padding:1px 8px;margin-left:6px;font-size:12px}
  .tabla{overflow-x:auto} table{border-collapse:collapse;width:100%;margin:8px 0}
  th,td{border-bottom:1px solid #f0efee;padding:6px 8px;text-align:left;vertical-align:top;white-space:nowrap;max-width:360px;overflow:hidden;text-overflow:ellipsis}
  th{position:sticky;top:0;background:#fafaf9;font-size:12px;color:#57534e}
  a{color:#9a3412}
</style></head><body>
<h1>API simulada de Vecinos</h1>
<p class="meta">Datos en memoria (actualizado: ${new Date().toLocaleTimeString('es-PE')}). Se reinician al reiniciar la API.
Recarga la página para ver cambios · <a href="/dev/datos">ver en JSON</a></p>
${secciones}
</body></html>`);
});
