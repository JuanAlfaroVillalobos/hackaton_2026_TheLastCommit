// Ruta: src/modulos/ayuda-humanitaria/tipos.ts
// Tipos del módulo. Cuando Malek publique `compartido/src/modelos`, este archivo los re-exporta.
// Fechas en milisegundos (Date.now()) para no depender de Firebase en los mocks.

/** Estados del README 5.2 (los fija el módulo emergencia, RF21–RF24). */
export type EstadoVecino = "NECESITA_AYUDA" | "SIN_RESPONDER" | "A_SALVO";

export type VecinoEmergencia = {
  uid: string;
  nombre: string;
  estado: EstadoVecino;
  lat: number;
  lng: number;
  ultimaAlertaEn: number;
};

export type TipoVulnerabilidad =
  | "HERIDO"
  | "ADULTO_MAYOR_O_DISCAPACIDAD"
  | "NINOS_SOLOS"
  | "SIN_AGUA_ALIMENTOS"
  | "VIVIENDA_DANADA"
  | "OTRO";

export type EstadoReporte = "ABIERTO" | "EN_ATENCION" | "RESUELTO";
export type Canal = "APP" | "SMS";

export type ReporteVulnerabilidad = {
  id: string;
  codigo: string; // 6 caracteres, para citarlo por SMS
  autorId: string;
  tipo: TipoVulnerabilidad;
  personas: number; // 1–99
  nota: string; // ≤ 60
  geohash: string;
  lat: number;
  lng: number;
  estado: EstadoReporte;
  atiendeId: string | null;
  canal: Canal;
  creadoEn: number;
  /** El reporte lleva foto (se pide aparte con obtenerFotoReporte). */
  tieneFoto?: boolean;
};

export type ModoRecurso = "OFREZCO" | "NECESITO";
export type TipoRecurso =
  | "AGUA"
  | "ALIMENTOS"
  | "MEDICINAS"
  | "REFUGIO"
  | "TRANSPORTE"
  | "HERRAMIENTAS"
  | "ENERGIA"
  | "CARGA_CELULARES";
export type EstadoRecurso = "ABIERTO" | "ASIGNADO" | "CERRADO";

export type RecursoCritico = {
  id: string;
  codigo: string;
  autorId: string;
  modo: ModoRecurso;
  tipo: TipoRecurso;
  cantidad: number;
  geohash: string;
  lat: number;
  lng: number;
  estado: EstadoRecurso;
  asignadoId: string | null;
  canal: Canal;
  creadoEn: number;
};

export type TipoFichaDirectorio =
  | "BOMBEROS"
  | "SERENAZGO"
  | "COMISARIA"
  | "CENTRO_SALUD"
  | "BRIGADA"
  | "OLLA_COMUN"
  | "GRUPO_WHATSAPP";

export type FichaDirectorio = {
  id: string;
  nombre: string;
  tipo: TipoFichaDirectorio;
  telefono: string;
  whatsapp: string | null;
  direccion: string;
  horario: string;
  geohash: string;
  aprobado: boolean;
  /** Solo en fichas propuestas por un vecino: quién la propuso (mientras `aprobado` sea false). */
  propuestaPorId?: string;
};

export type Coordenada = { lat: number; lng: number };

/** Lo que el vecino llena al reportar (RF38). El resto lo completa el servicio. */
export type NuevoReporte = Pick<
  ReporteVulnerabilidad,
  "tipo" | "personas" | "nota" | "lat" | "lng"
> & {
  /** Foto opcional en JPEG codificado en base64 (sin prefijo). Solo con internet. */
  foto?: string;
};

/** Lo que el vecino llena al publicar un recurso (RF39). El resto lo completa el servicio. */
export type NuevoRecurso = Pick<RecursoCritico, "modo" | "tipo" | "cantidad" | "lat" | "lng">;

/** Lo que el vecino llena al proponer una ficha (RF40). El resto lo completa el servicio. */
export type NuevaFicha = Pick<
  FichaDirectorio,
  "nombre" | "tipo" | "telefono" | "whatsapp" | "direccion" | "horario"
>;