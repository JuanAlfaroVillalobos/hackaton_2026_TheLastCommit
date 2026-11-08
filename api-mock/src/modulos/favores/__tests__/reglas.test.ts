import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Publicacion, Usuario } from '../../../datos/tipos.js';
import {
  calcularBloques,
  esEstadoActivo,
  esParticipante,
  puedeAceptarPorIdentidad,
  puedeCancelar,
  puedeVerUbicacionPrestador,
  puedeVerUbicacionSolicitante,
} from '../reglas.js';

const publicacion = (cambios: Partial<Publicacion> = {}): Publicacion => ({
  id: 'nc01',
  autorId: 'solicitante',
  autorNombre: 'Vecina',
  solicitanteId: 'solicitante',
  prestadorId: 'prestador',
  prestadorNombre: 'Vecino',
  tipo: 'NECESITO',
  categoria: 'FAVOR_OFICIO',
  oficioId: 'gasfiteria',
  descripcion: 'Descripción válida de prueba',
  geohash: '6gkzwgjz',
  estado: 'ACEPTADA',
  etaMinutos: 10,
  llegadaEstimada: Date.now() + 10 * 60_000,
  inicioServicio: null,
  finServicio: null,
  finSolicitadoPor: null,
  bloques: null,
  devolucionEn: null,
  devolucionRegistradaEn: null,
  retrasoAvisadoEn: null,
  expiraEn: Date.now() + 24 * 60 * 60_000,
  creadoEn: Date.now(),
  ...cambios,
});

const usuario = (estadoIdentidad: NonNullable<Usuario['identidad']>['estado']): Usuario => ({
  id: 'u1',
  correo: 'u1@example.test',
  clave: 'secreto',
  nombre: 'Vecino',
  barrio: 'Barrio',
  oficios: [],
  necesidadActivaId: null,
  servicioActivoId: null,
  horasAyudadas: 0,
  horasSolicitadas: 0,
  promedio: null,
  numCalificaciones: 0,
  ubicacion: { lat: -8.1, lng: -79.0 },
  creadoEn: Date.now(),
  identidad: {
    estado: estadoIdentidad,
    dni: '',
    nombres: 'Vecino',
    apellidos: '',
    enviadaEn: null,
    revisadaEn: null,
    motivo: null,
  },
});

describe('reglas de favores', () => {
  it('considera activos solo los estados del ciclo no terminales', () => {
    for (const estado of ['PUBLICADA', 'ACEPTADA', 'EN_SITIO', 'EN_CURSO', 'FIN_SOLICITADO'] as const) {
      assert.equal(esEstadoActivo(estado), true);
    }
    for (const estado of ['FINALIZADO', 'CANCELADA', 'EXPIRADA'] as const) {
      assert.equal(esEstadoActivo(estado), false);
    }
  });

  it('permite cancelar solo antes de que el servicio inicie', () => {
    assert.equal(puedeCancelar('PUBLICADA'), true);
    assert.equal(puedeCancelar('ACEPTADA'), true);
    assert.equal(puedeCancelar('EN_SITIO'), true);
    assert.equal(puedeCancelar('EN_CURSO'), false);
    assert.equal(puedeCancelar('FINALIZADO'), false);
  });

  it('aplica la identidad pendiente o verificada al aceptar', () => {
    assert.equal(puedeAceptarPorIdentidad(usuario('PENDIENTE')), true);
    assert.equal(puedeAceptarPorIdentidad(usuario('VERIFICADA')), true);
    assert.equal(puedeAceptarPorIdentidad(usuario('NO_ENVIADA')), false);
    assert.equal(puedeAceptarPorIdentidad(usuario('RECHAZADA')), false);
  });

  it('calcula bloques de 30 minutos con mínimo 1 y tope 16', () => {
    const inicio = 10_000;
    assert.equal(calcularBloques(inicio, inicio), 1);
    assert.equal(calcularBloques(inicio, inicio + 30 * 60_000), 1);
    assert.equal(calcularBloques(inicio, inicio + 31 * 60_000), 2);
    assert.equal(calcularBloques(inicio, inicio + 9 * 60 * 60_000), 16);
  });

  it('oculta ubicaciones exactas a quienes no son el participante autorizado', () => {
    const p = publicacion();
    assert.equal(puedeVerUbicacionSolicitante(p, 'prestador'), true);
    assert.equal(puedeVerUbicacionSolicitante(p, 'otro'), false);
    assert.equal(puedeVerUbicacionPrestador(p, 'solicitante'), true);
    assert.equal(puedeVerUbicacionPrestador(p, 'otro'), false);
    assert.equal(puedeVerUbicacionPrestador(publicacion({ estado: 'EN_CURSO' }), 'solicitante'), false);
  });

  it('reconoce al autor y a los participantes de una oferta con roles invertidos', () => {
    const oferta = publicacion({
      autorId: 'prestador',
      solicitanteId: 'receptor',
      prestadorId: 'prestador',
      tipo: 'OFREZCO',
      categoria: 'PRESTAMO',
    });
    assert.equal(esParticipante(oferta, 'prestador'), true);
    assert.equal(esParticipante(oferta, 'receptor'), true);
    assert.equal(esParticipante(oferta, 'otro'), false);
  });
});
