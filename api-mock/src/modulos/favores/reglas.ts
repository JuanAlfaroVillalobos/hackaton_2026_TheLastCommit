import type { EstadoNecesidad, Publicacion, Usuario } from '../../datos/tipos.js';

const ESTADOS_ACTIVOS: EstadoNecesidad[] = ['PUBLICADA', 'ACEPTADA', 'EN_SITIO', 'EN_CURSO', 'FIN_SOLICITADO'];

export function esEstadoActivo(estado: EstadoNecesidad): boolean {
  return ESTADOS_ACTIVOS.includes(estado);
}

export function puedeCancelar(estado: EstadoNecesidad): boolean {
  return estado === 'PUBLICADA' || estado === 'ACEPTADA' || estado === 'EN_SITIO';
}

export function esParticipante(publicacion: Publicacion, uid: string): boolean {
  return publicacion.autorId === uid || publicacion.solicitanteId === uid || publicacion.prestadorId === uid;
}

export function uidSolicitante(publicacion: Publicacion): string | null {
  return publicacion.solicitanteId;
}

export function uidPrestador(publicacion: Publicacion): string | null {
  return publicacion.prestadorId;
}

export function puedeAceptarPorIdentidad(usuario: Usuario): boolean {
  return usuario.identidad?.estado === 'PENDIENTE' || usuario.identidad?.estado === 'VERIFICADA';
}

export function calcularBloques(inicio: number, fin: number): number {
  const minutos = Math.max(0, (fin - inicio) / 60_000);
  return Math.min(16, Math.max(1, Math.ceil(minutos / 30)));
}

export function puedeVerUbicacionSolicitante(publicacion: Publicacion, uid: string): boolean {
  return (
    uid === publicacion.prestadorId &&
    (publicacion.estado === 'ACEPTADA' || publicacion.estado === 'EN_SITIO')
  );
}

export function puedeVerUbicacionPrestador(publicacion: Publicacion, uid: string): boolean {
  return (
    uid === publicacion.solicitanteId &&
    (publicacion.estado === 'ACEPTADA' || publicacion.estado === 'EN_SITIO')
  );
}
