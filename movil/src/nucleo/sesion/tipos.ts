// Ruta: src/nucleo/sesion/tipos.ts
// Formas del usuario de la sesión y de su perfil (`usuarios/{uid}`, README 5.4).
import type { OficioId } from '@/compartido/constantes/oficios';
import type { Coordenada } from '@/compartido/utilidades/geo';

/** Subconjunto de FirebaseAuthTypes.User que usa la app; mismos nombres para que volver a Firebase sea directo. */
export interface UsuarioSesion {
  uid: string;
  displayName: string | null;
  email: string | null;
}

/** Perfil del vecino con sesión. Lo leen P04 (vía useVecinoActual), P10 y el encabezado. */
export interface PerfilVecino {
  uid: string;
  nombre: string;
  correo: string;
  /** E.164, p. ej. «+51987654321». Obligatorio para usar SMS (RF01, RN-19). */
  telefono: string | null;
  barrio: string | null;
  oficios: OficioId[];
  fotoUrl: string | null;
  /** Puntero de RN-04: lo escribe solo el backend. */
  necesidadActivaId: string | null;
  /** Última ubicación validada (RF42). */
  ubicacion: Coordenada | null;
  ubicacionEn: number | null;
  /** RF36: la insignia «Identidad verificada» solo aparece con VERIFICADA. */
  estadoIdentidad: EstadoIdentidad;
  /** Puede revisar identidades (equivale al custom claim `validador`). */
  validador: boolean;
}

export type EstadoIdentidad = 'NO_ENVIADA' | 'PENDIENTE' | 'VERIFICADA' | 'RECHAZADA';

/** Usuario tal como lo devuelve la API simulada (`aPublico` en api-mock/src/modulos/auth). */
export interface UsuarioApi {
  id: string;
  nombre: string;
  correo: string;
  telefono?: string | null;
  barrio?: string | null;
  oficios?: string[];
  fotoUrl?: string | null;
  necesidadActivaId?: string | null;
  ubicacion?: Coordenada | null;
  ubicacionEn?: number | null;
  estadoIdentidad?: EstadoIdentidad;
  validador?: boolean;
}

export interface DatosRegistro {
  nombre: string;
  correo: string;
  /** 9 dígitos que empiezan en 9; la app agrega «+51». */
  telefono: string;
  clave: string;
  /** Consentimiento de la política de privacidad (Ley 29733); la API lo exige. */
  aceptaTerminos: boolean;
}

export type CambiosPerfil = Partial<Pick<PerfilVecino, 'nombre' | 'barrio' | 'oficios' | 'telefono'>>;
