// Ruta: src/datos/tipos.ts
// Formas de los documentos. Copian los tipos de movil/src/modulos/*/tipos.ts; si cambian allá, se
// actualizan aquí. Las fechas van en milisegundos (Date.now()), igual que en la app.

export interface Coordenada {
  lat: number;
  lng: number;
}

/** Cuenta + perfil. `clave` nunca sale de la API (ver aPublico en modulos/auth). */
export interface Usuario {
  id: string;
  correo: string;
  clave: string;
  nombre: string;
  barrio: string;
  oficios: string[];
  necesidadActivaId: string | null;
  ubicacion: Coordenada;
  creadoEn: number;
  // --- cuentas (Persona A): opcionales para no tocar las semillas ---
  /** E.164 (+51 y 9 dígitos que empiezan en 9). Único entre perfiles (RN-01); identidad en los SMS (RN-19). */
  telefono?: string | null;
  fotoUrl?: string | null;
  /** Momento de la última ubicación validada (RF42). */
  ubicacionEn?: number | null;
  /** RF42: true si la ubicación se marcó moviendo el pin. */
  ubicacionManual?: boolean;
  /** Tokens de FCM de los teléfonos con sesión abierta (README 5.4). No salen en /vecinos/yo. */
  dispositivos?: string[];
  /** Momento en que aceptó la política de privacidad (Ley 29733). */
  terminosAceptadosEn?: number;
}

// --- favores (P04, RF09) ---
export interface Publicacion {
  id: string;
  solicitanteId: string;
  autorNombre: string;
  prestadorId: string | null;
  prestadorNombre: string | null;
  tipo: 'NECESITO' | 'OFREZCO';
  categoria: 'FAVOR_OFICIO' | 'PRESTAMO';
  oficioId: string | null;
  descripcion: string;
  geohash: string;
  estado: 'PUBLICADA' | 'ACEPTADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA';
  etaMinutos: number | null;
  llegadaEstimada: number | null;
  devolucionEn: number | null;
  expiraEn: number;
  creadoEn: number;
}

// --- directorio (economía local) ---
export interface ServicioDirectorio {
  id: string;
  tipo: 'oficio' | 'servicio' | 'comercio';
  categoria: string;
  titulo: string;
  descripcion: string;
  telefono: string;
  whatsapp?: string;
  direccion?: string;
  vistosBuenos: number;
}

// --- ayuda humanitaria ---
export interface VecinoEmergencia {
  id: string;
  uid: string;
  nombre: string;
  estado: 'NECESITA_AYUDA' | 'SIN_RESPONDER' | 'ESTOY_BIEN';
  lat: number;
  lng: number;
  ultimaAlertaEn: number;
}

export interface ReporteVulnerabilidad {
  id: string;
  codigo: string;
  autorId: string;
  tipo: string;
  personas: number;
  nota: string;
  geohash: string;
  lat: number;
  lng: number;
  estado: 'ABIERTO' | 'EN_ATENCION' | 'RESUELTO';
  atiendeId: string | null;
  canal: 'APP' | 'SMS';
  creadoEn: number;
}

export interface RecursoCritico {
  id: string;
  codigo: string;
  autorId: string;
  modo: 'OFREZCO' | 'NECESITO';
  tipo: string;
  cantidad: number;
  geohash: string;
  lat: number;
  lng: number;
  estado: 'ABIERTO' | 'ASIGNADO' | 'ENTREGADO';
  asignadoId: string | null;
  canal: 'APP' | 'SMS';
  creadoEn: number;
}

export interface FichaEmergencia {
  id: string;
  nombre: string;
  tipo: string;
  telefono: string;
  whatsapp: string | null;
  direccion: string;
  horario: string;
  geohash: string;
  aprobado: boolean;
}

// --- emergencia (RF20, botón SOS) ---
export interface AlertaEmergencia {
  id: string;
  autorId: string;
  autorNombre: string;
  lat: number;
  lng: number;
  estado: 'ACTIVA' | 'ATENDIDA' | 'CANCELADA';
  canal: 'APP' | 'SMS';
  creadoEn: number;
}
