// Ruta: src/datos/semillas.ts
// Datos de arranque. Copian movil/src/simulaciones/ (escenario «muro»). Zona: Plaza de Armas de Trujillo.
// Las fechas se calculan al levantar el servidor, así que las publicaciones nunca aparecen vencidas.
import { geohashForLocation } from 'geofire-common';
import type {
  AlertaEmergencia,
  FichaEmergencia,
  Publicacion,
  RecursoCritico,
  ReporteVulnerabilidad,
  ServicioDirectorio,
  Usuario,
  VecinoEmergencia,
} from './tipos.js';

export const ZONA_DEMO = { lat: -8.1116, lng: -79.0288 };
export const UID_DEMO = 'u00';
/** Clave de todas las cuentas sembradas. */
export const CLAVE_DEMO = 'vecinos123';

const MIN = 60_000;
const hace = (min: number) => Date.now() - min * MIN;
const en = (min: number) => Date.now() + min * MIN;
const ghCoord = (lat: number, lng: number) => geohashForLocation([lat, lng], 7);
/** Desplaza la zona `norte` y `este` metros y devuelve el geohash de precisión 7. */
const gh = (norte: number, este: number) => ghCoord(ZONA_DEMO.lat + norte / 111_320, ZONA_DEMO.lng + este / 110_200);

const usuario = (id: string, nombre: string, correo: string, extra: Partial<Usuario> = {}): Usuario => ({
  id,
  nombre,
  correo,
  clave: CLAVE_DEMO,
  barrio: 'Barrio Los Olivos',
  oficios: [],
  necesidadActivaId: null,
  servicioActivoId: null,
  horasAyudadas: 0,
  horasSolicitadas: 0,
  promedio: null,
  numCalificaciones: 0,
  ubicacion: ZONA_DEMO,
  identidad: {
    estado: 'PENDIENTE',
    dni: '',
    nombres: nombre,
    apellidos: '',
    enviadaEn: hace(30 * 24 * 60),
    revisadaEn: null,
    motivo: null,
  },
  creadoEn: hace(30 * 24 * 60),
  ...extra,
});

export const usuarios: Usuario[] = [
  usuario(UID_DEMO, 'Ana Morales', 'ana@vecinos.pe', { oficios: ['tecnologia', 'clases-tutorias'] }),
  usuario('u11', 'Rosa Vega', 'rosa@vecinos.pe'),
  usuario('u12', 'Jorge Quispe', 'jorge@vecinos.pe', { oficios: ['gasfiteria'] }),
  usuario('u13', 'Carmen Huamán', 'carmen@vecinos.pe'),
  usuario('u16', 'Luis Paredes', 'luis@vecinos.pe', { oficios: ['mascotas'] }),
];

const base = {
  prestadorId: null,
  prestadorNombre: null,
  etaMinutos: null,
  llegadaEstimada: null,
  inicioServicio: null,
  finServicio: null,
  finSolicitadoPor: null,
  bloques: null,
  devolucionEn: null,
  devolucionRegistradaEn: null,
  retrasoAvisadoEn: null,
};

export const publicaciones: Publicacion[] = [
  {
    ...base, id: 'nc01', autorId: 'u11', solicitanteId: 'u11', autorNombre: 'Rosa Vega', tipo: 'NECESITO', categoria: 'FAVOR_OFICIO',
    oficioId: 'tecnologia', descripcion: 'Necesito ayuda para configurar el WhatsApp del celular de mi mamá.',
    geohash: gh(300, 0), estado: 'PUBLICADA', expiraEn: en(24 * 60 - 10), creadoEn: hace(10),
  },
  {
    ...base, id: 'nc02', autorId: 'u12', solicitanteId: 'u12', autorNombre: 'Jorge Quispe', tipo: 'NECESITO', categoria: 'FAVOR_OFICIO',
    oficioId: 'gasfiteria', descripcion: 'Se rompió la llave del lavadero y gotea toda la noche. ¿Alguien me ayuda?',
    geohash: gh(-600, 0), estado: 'PUBLICADA', expiraEn: en(24 * 60 - 25), creadoEn: hace(25),
  },
  {
    ...base, id: 'nc03', autorId: 'u13', solicitanteId: null, prestadorId: 'u13', prestadorNombre: 'Carmen Huamán',
    autorNombre: 'Carmen Huamán', tipo: 'OFREZCO', categoria: 'PRESTAMO',
    oficioId: null, descripcion: 'Presto una escalera de 6 peldaños para trabajos en casa.',
    geohash: gh(0, 1200), estado: 'PUBLICADA', devolucionEn: en(36 * 60), expiraEn: en(23 * 60), creadoEn: hace(60),
  },
  // No deben verse en el muro: fuera del radio y vencida (RF09). Sirven para probar el filtro de la app.
  {
    ...base, id: 'nc04', autorId: 'u14', solicitanteId: 'u14', autorNombre: 'Pedro Salas', tipo: 'NECESITO', categoria: 'FAVOR_OFICIO',
    oficioId: 'carpinteria', descripcion: 'Necesito arreglar una puerta.',
    geohash: gh(5000, 0), estado: 'PUBLICADA', expiraEn: en(600), creadoEn: hace(5),
  },
  {
    ...base, id: 'nc05', autorId: 'u15', solicitanteId: 'u15', autorNombre: 'Lucía Torres', tipo: 'NECESITO', categoria: 'FAVOR_OFICIO',
    oficioId: 'mandados-compras', descripcion: '¿Alguien me trae pan?',
    geohash: gh(200, 200), estado: 'PUBLICADA', expiraEn: hace(1), creadoEn: hace(24 * 60 + 1),
  },
];

export const directorio: ServicioDirectorio[] = [
  {
    id: '1', tipo: 'oficio', categoria: 'Gasfitería', titulo: 'Gasfitero Juan', descripcion: 'Reparación de tuberías y fugas',
    telefono: '999999999', whatsapp: '51999999999', direccion: 'Trujillo', vistosBuenos: 12,
  },
  {
    id: '2', tipo: 'servicio', categoria: 'Electricidad', titulo: 'Electricista Pedro', descripcion: 'Instalación eléctrica residencial',
    telefono: '988888888', whatsapp: '51988888888', direccion: 'Trujillo', vistosBuenos: 5,
  },
];

const vecino = (uid: string, nombre: string, estado: VecinoEmergencia['estado'], lat: number, lng: number, min: number): VecinoEmergencia => ({
  id: uid, uid, nombre, estado, lat, lng, ultimaAlertaEn: hace(min),
});

export const vecinosEmergencia: VecinoEmergencia[] = [
  vecino('u01', 'Rosa Quispe', 'NECESITA_AYUDA', -8.1108, -79.0279, 2),
  vecino('u02', 'Carlos Vásquez', 'SIN_RESPONDER', -8.1124, -79.0301, 6),
  vecino('u03', 'Marta Ruiz', 'NECESITA_AYUDA', -8.1099, -79.0295, 1),
  vecino('u04', 'Luis Cabrera', 'ESTOY_BIEN', -8.1131, -79.0272, 15),
  vecino('u05', 'Elena Paredes', 'SIN_RESPONDER', -8.1112, -79.0312, 9),
];

export const reportes: ReporteVulnerabilidad[] = [
  {
    id: 'rv01', codigo: 'K3F9AZ', autorId: 'u01', tipo: 'ADULTO_MAYOR_O_DISCAPACIDAD', personas: 1,
    nota: 'Señora sola, no puede salir', geohash: ghCoord(-8.1106, -79.0281), lat: -8.1106, lng: -79.0281,
    estado: 'ABIERTO', atiendeId: null, canal: 'APP', creadoEn: hace(5),
  },
  {
    id: 'rv02', codigo: 'P8Q2LM', autorId: 'u03', tipo: 'NINOS_SOLOS', personas: 3,
    nota: 'Tres niños sin adultos', geohash: ghCoord(-8.1097, -79.0297), lat: -8.1097, lng: -79.0297,
    estado: 'EN_ATENCION', atiendeId: 'u04', canal: 'SMS', creadoEn: hace(12),
  },
  {
    id: 'rv03', codigo: 'T1X7BC', autorId: 'u05', tipo: 'VIVIENDA_DANADA', personas: 4,
    nota: 'Techo caído en la cocina', geohash: ghCoord(-8.1115, -79.031), lat: -8.1115, lng: -79.031,
    estado: 'ABIERTO', atiendeId: null, canal: 'APP', creadoEn: hace(20),
  },
  {
    id: 'rv04', codigo: 'H5N4DE', autorId: 'u02', tipo: 'SIN_AGUA_ALIMENTOS', personas: 6,
    nota: 'Sin agua desde ayer', geohash: ghCoord(-8.1127, -79.0299), lat: -8.1127, lng: -79.0299,
    estado: 'RESUELTO', atiendeId: 'u04', canal: 'APP', creadoEn: hace(90),
  },
];

export const recursos: RecursoCritico[] = [
  {
    id: 'rc01', codigo: 'A2B3CD', autorId: 'u04', modo: 'OFREZCO', tipo: 'AGUA', cantidad: 20,
    geohash: ghCoord(-8.113, -79.0273), lat: -8.113, lng: -79.0273, estado: 'ABIERTO', asignadoId: null, canal: 'APP', creadoEn: hace(8),
  },
  {
    id: 'rc02', codigo: 'E4F5GH', autorId: 'u01', modo: 'NECESITO', tipo: 'MEDICINAS', cantidad: 2,
    geohash: ghCoord(-8.1109, -79.0278), lat: -8.1109, lng: -79.0278, estado: 'ABIERTO', asignadoId: null, canal: 'SMS', creadoEn: hace(4),
  },
  {
    id: 'rc03', codigo: 'J6K7LM', autorId: 'u02', modo: 'OFREZCO', tipo: 'CARGA_CELULARES', cantidad: 5,
    geohash: ghCoord(-8.1122, -79.0303), lat: -8.1122, lng: -79.0303, estado: 'ASIGNADO', asignadoId: 'u05', canal: 'APP', creadoEn: hace(30),
  },
  {
    id: 'rc04', codigo: 'N8P9QR', autorId: 'u03', modo: 'NECESITO', tipo: 'REFUGIO', cantidad: 3,
    geohash: ghCoord(-8.1101, -79.0293), lat: -8.1101, lng: -79.0293, estado: 'ABIERTO', asignadoId: null, canal: 'APP', creadoEn: hace(11),
  },
];

const ficha = (id: string, nombre: string, tipo: string, telefono: string, horario: string, extra: Partial<FichaEmergencia> = {}): FichaEmergencia => ({
  id, nombre, tipo, telefono, horario, whatsapp: null, direccion: 'Trujillo (dato de ejemplo)',
  geohash: ghCoord(ZONA_DEMO.lat, ZONA_DEMO.lng), aprobado: true, ...extra,
});

export const fichasEmergencia: FichaEmergencia[] = [
  ficha('d01', 'Bomberos Trujillo', 'BOMBEROS', '116', '24 horas'),
  ficha('d02', 'Serenazgo', 'SERENAZGO', '000000000', '24 horas'),
  ficha('d03', 'Comisaría del sector', 'COMISARIA', '105', '24 horas'),
  ficha('d04', 'Centro de salud del barrio', 'CENTRO_SALUD', '000000000', '8:00–20:00'),
  ficha('d05', 'Olla común Santa Rosa', 'OLLA_COMUN', '000000000', '12:00–14:00', { whatsapp: '51900000000' }),
  ficha('d06', 'Grupo WhatsApp del barrio', 'GRUPO_WHATSAPP', '000000000', '—', { whatsapp: '51900000001', direccion: '—', aprobado: false }),
];

export const alertas: AlertaEmergencia[] = [];
