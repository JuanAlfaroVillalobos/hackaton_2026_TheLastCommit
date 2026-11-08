// Ruta: src/modulos/emergencia/zona.ts
// Modo emergencia de una zona (RF21–RF25, RN-11, README 5.2):
//   - RF21: al llegar una alerta, si la celda cumple el umbral crea `emergencias/{id}` sobre la celda y
//     sus 6 vecinas, suma a los vecinos de la zona en `emergencias/{id}/vecinos/{uid}` y avisa por push.
//   - RF24: «Estoy bien» / «Necesito ayuda» cambian el estado del vecino.
//   - RF23 + RF25: tareaEmergencia() (cada minuto) reenvía «¿Estás bien?» y cierra la emergencia.
// Cuando haya Cloud Functions, procesarAlerta() pasa a un trigger de `alertas` y tareaEmergencia() a
// `cadaMinuto`; las rutas solo llaman a estas funciones.
import { cellToLatLng, gridDisk } from 'h3-js';
import { almacen, vecinosDeEmergencia } from '../../datos/almacen.js';
import type { AlertaEmergencia, Emergencia, Usuario, VecinoEnEmergencia } from '../../datos/tipos.js';
import { conflicto } from '../../nucleo/errores.js';
import { notificar, type CargaNotificacion } from '../../nucleo/notificar.js';
import { nuevoId } from '../../nucleo/utilidades.js';
import { ACTIVO_MS, CIERRE_SIN_ALERTAS_MS, MINIMO_ALERTANTES, PORCENTAJE_ALERTANTES } from './config.js';
import { alertasVigentes } from './conteo.js';

/** Lo que la app necesita para saber si está en modo emergencia y cómo está el vecino. */
export interface EstadoEmergencia {
  emergencia: Emergencia | null;
  yo: VecinoEnEmergencia | null;
}

// ---------- consultas ----------

export const emergenciasActivas = () => almacen.emergencias.listar({ estado: 'ACTIVA' });

/** La emergencia activa más reciente que cubre la celda, o null. */
export async function emergenciaQueCubre(celdaH3: string): Promise<Emergencia | null> {
  const activas = (await emergenciasActivas()).filter((e) => e.celdas.includes(celdaH3));
  return activas.sort((a, b) => b.activadaEn - a.activadaEn)[0] ?? null;
}

/** Vecinos cuya última ubicación está en alguna de las celdas y tiene menos de 30 min. */
async function vecinosActivos(celdas: string[], ahora: number): Promise<Usuario[]> {
  const listas = await Promise.all(celdas.map((celdaH3) => almacen.usuarios.listar({ celdaH3 })));
  return listas.flat().filter((u) => (u.ubicacionEn ?? 0) >= ahora - ACTIVO_MS);
}

/** RN-11: al menos MINIMO alertantes y MÁS del PORCENTAJE de los vecinos activos de la celda. */
export function cumpleUmbral(alertantes: number, activos: number): boolean {
  return alertantes >= MINIMO_ALERTANTES && alertantes * 100 > PORCENTAJE_ALERTANTES * Math.max(activos, alertantes);
}

/**
 * Emergencia del vecino: la que ya lo cuenta en `vecinos/{uid}` o, si no, la que cubre su celda
 * (todavía sin `yo`: entra al registrar su presencia).
 */
export async function estadoDe(usuario: Usuario): Promise<EstadoEmergencia> {
  const activas = await emergenciasActivas();
  for (const emergencia of activas) {
    const yo = await vecinosDeEmergencia(emergencia.id).obtener(usuario.id);
    if (yo) return { emergencia, yo };
  }
  const celda = usuario.celdaH3;
  const emergencia = celda ? (activas.find((e) => e.celdas.includes(celda)) ?? null) : null;
  return { emergencia, yo: null };
}

// ---------- notificaciones ----------

/** RF23: «¿Estás bien?» a pantalla completa, con las acciones de RF24 (las arma la app). */
const cargaAlerta = (emergencia: Emergencia): CargaNotificacion => ({
  modulo: 'emergencia',
  tipo: 'alerta',
  canal: 'emergencias',
  titulo: '¿Estás bien?',
  cuerpo: 'Tu zona está en emergencia. Cuéntales a tus vecinos cómo estás.',
  ruta: '/emergencia/alerta',
  pantallaCompleta: 'si',
  emergenciaId: emergencia.id,
});

async function avisarAlerta(emergencia: Emergencia, uids: string[]): Promise<void> {
  if (uids.length) await notificar(uids, cargaAlerta(emergencia));
}

/** Aviso silencioso (sin título) para que las apps de la zona refresquen el mapa (RF22, RF24 ≤ 5 s). */
async function avisarCambio(emergencia: Emergencia): Promise<void> {
  const vecinos = await vecinosDeEmergencia(emergencia.id).listar();
  if (vecinos.length) await notificar(vecinos.map((v) => v.uid), { modulo: 'emergencia', tipo: 'mapa', emergenciaId: emergencia.id });
}

// ---------- RF21: activación ----------

function nuevoVecino(
  usuario: Pick<Usuario, 'id' | 'nombre'>,
  estado: VecinoEnEmergencia['estado'],
  coordenada: { lat: number; lng: number },
  ahora: number,
): VecinoEnEmergencia {
  return {
    id: usuario.id,
    uid: usuario.id,
    nombre: usuario.nombre,
    estado,
    lat: coordenada.lat,
    lng: coordenada.lng,
    ultimaAlertaEn: estado === 'NECESITA_AYUDA' ? ahora : null,
    respondidoEn: null,
    creadoEn: ahora,
  };
}

async function activar(celdaCentro: string, ahora: number): Promise<Emergencia> {
  const celdas = gridDisk(celdaCentro, 1);
  const [lat, lng] = cellToLatLng(celdaCentro);
  // Atómico: si dos alertas cruzan el umbral a la vez, solo una crea la emergencia.
  const { fila: emergencia, creada } = await almacen.emergencias.crearSiNoExiste(
    {
      id: nuevoId('em'),
      celdaCentro,
      centro: { lat, lng },
      celdas,
      estado: 'ACTIVA',
      activadaEn: ahora,
      ultimaAlertaEn: ahora,
      finalizadaEn: null,
      motivoFin: null,
    },
    { estado: 'ACTIVA', celdaCentro },
  );
  if (!creada) return emergencia;

  // Quienes pidieron ayuda en la zona en los últimos 10 min (su última alerta) → NECESITA_AYUDA.
  const alertas = (await Promise.all(celdas.map((c) => alertasVigentes(c, ahora)))).flat().sort((a, b) => a.creadoEn - b.creadoEn);
  const ultimaPorVecino = new Map(alertas.map((a) => [a.autorId, a]));
  const vecinos: VecinoEnEmergencia[] = [...ultimaPorVecino.values()].map((a) => ({
    ...nuevoVecino({ id: a.autorId, nombre: a.autorNombre }, 'NECESITA_AYUDA', a, ahora),
    ultimaAlertaEn: a.creadoEn,
  }));
  // El resto de vecinos activos de la zona → SIN_RESPONDER.
  for (const usuario of await vecinosActivos(celdas, ahora)) {
    if (!ultimaPorVecino.has(usuario.id)) vecinos.push(nuevoVecino(usuario, 'SIN_RESPONDER', usuario.ubicacion, ahora));
  }

  const repo = vecinosDeEmergencia(emergencia.id);
  await Promise.all(vecinos.map((v) => repo.guardar(v)));
  await Promise.all(alertas.map((a) => almacen.alertas.actualizar(a.id, { emergenciaId: emergencia.id })));
  await avisarAlerta(emergencia, vecinos.map((v) => v.uid));
  console.log(`[emergencia] ACTIVADA ${emergencia.id} en ${celdaCentro} (+6 vecinas): ${ultimaPorVecino.size} piden ayuda, ${vecinos.length} vecinos en la zona`);
  return emergencia;
}

/** RN-11 sobre la celda de la alerta. Devuelve la emergencia si se activó. */
async function evaluarUmbral(celdaH3: string, ahora: number): Promise<Emergencia | null> {
  const alertantes = new Set((await alertasVigentes(celdaH3, ahora)).map((a) => a.autorId));
  const activos = new Set((await vecinosActivos([celdaH3], ahora)).map((u) => u.id));
  // Quien alertó cuenta como activo aunque su perfil tenga una ubicación vieja.
  const total = new Set([...activos, ...alertantes]).size;
  const cumple = cumpleUmbral(alertantes.size, total);
  console.log(
    `[emergencia] celda ${celdaH3}: ${alertantes.size} de ${total} vecinos activos (mínimo ${MINIMO_ALERTANTES}, > ${PORCENTAJE_ALERTANTES} %) → ${cumple ? 'se activa' : 'aún no'}`,
  );
  return cumple ? activar(celdaH3, ahora) : null;
}

/** Suma o actualiza al vecino en la emergencia. SIN_RESPONDER nunca pisa un estado que ya tenía. */
async function sumarVecino(
  emergencia: Emergencia,
  usuario: Usuario,
  estado: 'SIN_RESPONDER' | 'NECESITA_AYUDA',
  coordenada: { lat: number; lng: number },
  ahora: number,
): Promise<VecinoEnEmergencia> {
  const repo = vecinosDeEmergencia(emergencia.id);
  const previo = await repo.obtener(usuario.id);
  if (!previo) return repo.guardar(nuevoVecino(usuario, estado, coordenada, ahora));
  if (estado === 'SIN_RESPONDER') return previo;
  return repo.guardar({ ...previo, estado, lat: coordenada.lat, lng: coordenada.lng, ultimaAlertaEn: ahora });
}

/**
 * Tras guardar una alerta (RF20): si su celda ya está en emergencia, el vecino pasa a NECESITA_AYUDA en
 * ella (también si estaba A_SALVO, README 5.2); si no, se evalúa el umbral (RF21).
 */
export async function procesarAlerta(alerta: AlertaEmergencia, autor: Usuario, ahora = Date.now()): Promise<EstadoEmergencia> {
  const cubre = await emergenciaQueCubre(alerta.celdaH3);
  if (cubre) {
    const yo = await sumarVecino(cubre, autor, 'NECESITA_AYUDA', alerta, ahora);
    if (alerta.emergenciaId !== cubre.id) await almacen.alertas.actualizar(alerta.id, { emergenciaId: cubre.id });
    const emergencia = (await almacen.emergencias.actualizar(cubre.id, { ultimaAlertaEn: ahora })) ?? cubre;
    await avisarCambio(emergencia);
    return { emergencia, yo };
  }
  const emergencia = await evaluarUmbral(alerta.celdaH3, ahora);
  if (!emergencia) return { emergencia: null, yo: null };
  return { emergencia, yo: await vecinosDeEmergencia(emergencia.id).obtener(autor.id) };
}

/**
 * La app abrió o volvió del segundo plano. Si el vecino está en una zona en emergencia y aún no
 * figura en ella, entra como SIN_RESPONDER (le llegará «¿Estás bien?»).
 */
export async function registrarPresencia(usuario: Usuario, ahora = Date.now()): Promise<EstadoEmergencia> {
  const estado = await estadoDe(usuario);
  if (!estado.emergencia || estado.yo) return estado;
  const yo = await sumarVecino(estado.emergencia, usuario, 'SIN_RESPONDER', usuario.ubicacion, ahora);
  await avisarCambio(estado.emergencia);
  return { emergencia: estado.emergencia, yo };
}

// ---------- RF24: respuesta del vecino ----------

/** «Estoy bien» → A_SALVO; «Necesito ayuda» → NECESITA_AYUDA. Puede cerrar la emergencia (RF25). */
export async function responder(
  usuario: Usuario,
  estado: 'A_SALVO' | 'NECESITA_AYUDA',
  ahora = Date.now(),
): Promise<EstadoEmergencia> {
  const actual = await estadoDe(usuario);
  if (!actual.emergencia) throw conflicto('Tu zona no está en emergencia.');

  const base = actual.yo ?? nuevoVecino(usuario, 'SIN_RESPONDER', usuario.ubicacion, ahora);
  const yo = await vecinosDeEmergencia(actual.emergencia.id).guardar({
    ...base,
    estado,
    respondidoEn: ahora,
    ...(estado === 'NECESITA_AYUDA' ? { ultimaAlertaEn: ahora } : null),
  });

  if (estado === 'A_SALVO') {
    const finalizada = await finalizarSiCorresponde(actual.emergencia, ahora);
    if (finalizada) return { emergencia: finalizada, yo };
    await avisarCambio(actual.emergencia);
    return { emergencia: actual.emergencia, yo };
  }
  // «Necesito ayuda» cuenta como alerta nueva para el cierre por inactividad (RF25).
  const emergencia = (await almacen.emergencias.actualizar(actual.emergencia.id, { ultimaAlertaEn: ahora })) ?? actual.emergencia;
  await avisarCambio(emergencia);
  return { emergencia, yo };
}

// ---------- RF23 + RF25: tarea de cada minuto ----------

/** RF25: todos A_SALVO, o 30 min sin alertas y nadie NECESITA_AYUDA. Devuelve la emergencia finalizada o null. */
export async function finalizarSiCorresponde(emergencia: Emergencia, ahora = Date.now()): Promise<Emergencia | null> {
  const vecinos = await vecinosDeEmergencia(emergencia.id).listar();
  const todosASalvo = vecinos.length > 0 && vecinos.every((v) => v.estado === 'A_SALVO');
  const inactiva = ahora - emergencia.ultimaAlertaEn >= CIERRE_SIN_ALERTAS_MS && !vecinos.some((v) => v.estado === 'NECESITA_AYUDA');
  if (!todosASalvo && !inactiva) return null;

  const motivoFin = todosASalvo ? 'TODOS_A_SALVO' : 'SIN_ALERTAS';
  const finalizada = await almacen.emergencias.actualizar(emergencia.id, { estado: 'FINALIZADA', finalizadaEn: ahora, motivoFin });
  if (vecinos.length) {
    await notificar(vecinos.map((v) => v.uid), {
      modulo: 'emergencia',
      tipo: 'finalizada',
      canal: 'general',
      titulo: 'La emergencia terminó',
      cuerpo:
        motivoFin === 'TODOS_A_SALVO'
          ? 'Todos los vecinos de la zona están a salvo. Tu zona vuelve a la normalidad.'
          : 'No hubo alertas nuevas en un buen rato. Tu zona vuelve a la normalidad.',
      ruta: '/',
      emergenciaId: emergencia.id,
    });
  }
  console.log(`[emergencia] FINALIZADA ${emergencia.id} (${motivoFin})`);
  return finalizada;
}

/**
 * RF23 + RF25. Para cada emergencia activa: la cierra si corresponde o, si no, reenvía «¿Estás bien?»
 * a quienes están SIN_RESPONDER o NECESITA_AYUDA. Hoy la llama un setInterval en servidor.ts.
 */
export async function tareaEmergencia(ahora = Date.now()): Promise<void> {
  for (const emergencia of await emergenciasActivas()) {
    if (await finalizarSiCorresponde(emergencia, ahora)) continue;
    const pendientes = (await vecinosDeEmergencia(emergencia.id).listar()).filter((v) => v.estado !== 'A_SALVO');
    await avisarAlerta(emergencia, pendientes.map((v) => v.uid));
    if (pendientes.length) console.log(`[emergencia] ${emergencia.id}: «¿Estás bien?» a ${pendientes.length} vecino(s)`);
  }
}
