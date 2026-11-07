// Ruta: src/simulaciones/ayudaHumanitaria.ts
// Datos falsos del módulo ayuda-humanitaria. Zona: Plaza de Armas de Trujillo.
// Los servicios reales tendrán las mismas firmas; solo cambia el origen de los datos.
import { geohashForLocation } from "geofire-common";
import type {
  FichaDirectorio,
  RecursoCritico,
  ReporteVulnerabilidad,
  VecinoEmergencia,
} from "@/modulos/ayuda-humanitaria";

export const ZONA_DEMO = { lat: -8.1116, lng: -79.0288 };
export const UID_YO = "u00";

const hace = (min: number) => Date.now() - min * 60_000;
const gh = (lat: number, lng: number) => geohashForLocation([lat, lng], 7);

export const vecinosEmergenciaMock: VecinoEmergencia[] = [
  { uid: "u01", nombre: "Rosa Quispe", estado: "NECESITA_AYUDA", lat: -8.1108, lng: -79.0279, ultimaAlertaEn: hace(2) },
  { uid: "u02", nombre: "Carlos Vásquez", estado: "SIN_RESPONDER", lat: -8.1124, lng: -79.0301, ultimaAlertaEn: hace(6) },
  { uid: "u03", nombre: "Marta Ruiz", estado: "NECESITA_AYUDA", lat: -8.1099, lng: -79.0295, ultimaAlertaEn: hace(1) },
  { uid: "u04", nombre: "Luis Cabrera", estado: "ESTOY_BIEN", lat: -8.1131, lng: -79.0272, ultimaAlertaEn: hace(15) },
  { uid: "u05", nombre: "Elena Paredes", estado: "SIN_RESPONDER", lat: -8.1112, lng: -79.0312, ultimaAlertaEn: hace(9) },
];

export const reportesMock: ReporteVulnerabilidad[] = [
  {
    id: "rv01", codigo: "K3F9AZ", autorId: "u01", tipo: "ADULTO_MAYOR_O_DISCAPACIDAD", personas: 1,
    nota: "Señora sola, no puede salir", geohash: gh(-8.1106, -79.0281), lat: -8.1106, lng: -79.0281,
    estado: "ABIERTO", atiendeId: null, canal: "APP", creadoEn: hace(5),
  },
  {
    id: "rv02", codigo: "P8Q2LM", autorId: "u03", tipo: "NINOS_SOLOS", personas: 3,
    nota: "Tres niños sin adultos", geohash: gh(-8.1097, -79.0297), lat: -8.1097, lng: -79.0297,
    estado: "EN_ATENCION", atiendeId: "u04", canal: "SMS", creadoEn: hace(12),
  },
  {
    id: "rv03", codigo: "T1X7BC", autorId: "u05", tipo: "VIVIENDA_DANADA", personas: 4,
    nota: "Techo caído en la cocina", geohash: gh(-8.1115, -79.031), lat: -8.1115, lng: -79.031,
    estado: "ABIERTO", atiendeId: null, canal: "APP", creadoEn: hace(20),
  },
  {
    id: "rv04", codigo: "H5N4DE", autorId: "u02", tipo: "SIN_AGUA_ALIMENTOS", personas: 6,
    nota: "Sin agua desde ayer", geohash: gh(-8.1127, -79.0299), lat: -8.1127, lng: -79.0299,
    estado: "RESUELTO", atiendeId: "u04", canal: "APP", creadoEn: hace(90),
  },
];

export const recursosMock: RecursoCritico[] = [
  {
    id: "rc01", codigo: "A2B3CD", autorId: "u04", modo: "OFREZCO", tipo: "AGUA", cantidad: 20,
    geohash: gh(-8.113, -79.0273), lat: -8.113, lng: -79.0273, estado: "ABIERTO",
    asignadoId: null, canal: "APP", creadoEn: hace(8),
  },
  {
    id: "rc02", codigo: "E4F5GH", autorId: "u01", modo: "NECESITO", tipo: "MEDICINAS", cantidad: 2,
    geohash: gh(-8.1109, -79.0278), lat: -8.1109, lng: -79.0278, estado: "ABIERTO",
    asignadoId: null, canal: "SMS", creadoEn: hace(4),
  },
  {
    id: "rc03", codigo: "J6K7LM", autorId: "u02", modo: "OFREZCO", tipo: "CARGA_CELULARES", cantidad: 5,
    geohash: gh(-8.1122, -79.0303), lat: -8.1122, lng: -79.0303, estado: "ASIGNADO",
    asignadoId: "u05", canal: "APP", creadoEn: hace(30),
  },
  {
    id: "rc04", codigo: "N8P9QR", autorId: "u03", modo: "NECESITO", tipo: "REFUGIO", cantidad: 3,
    geohash: gh(-8.1101, -79.0293), lat: -8.1101, lng: -79.0293, estado: "ABIERTO",
    asignadoId: null, canal: "APP", creadoEn: hace(11),
  },
];

export const directorioMock: FichaDirectorio[] = [
  { id: "d01", nombre: "Bomberos Trujillo", tipo: "BOMBEROS", telefono: "116", whatsapp: null, direccion: "Trujillo (dato de ejemplo)", horario: "24 horas", geohash: gh(-8.1116, -79.0288), aprobado: true },
  { id: "d02", nombre: "Serenazgo", tipo: "SERENAZGO", telefono: "000000000", whatsapp: null, direccion: "Trujillo (dato de ejemplo)", horario: "24 horas", geohash: gh(-8.1116, -79.0288), aprobado: true },
  { id: "d03", nombre: "Comisaría del sector", tipo: "COMISARIA", telefono: "105", whatsapp: null, direccion: "Trujillo (dato de ejemplo)", horario: "24 horas", geohash: gh(-8.1116, -79.0288), aprobado: true },
  { id: "d04", nombre: "Centro de salud del barrio", tipo: "CENTRO_SALUD", telefono: "000000000", whatsapp: null, direccion: "Trujillo (dato de ejemplo)", horario: "8:00–20:00", geohash: gh(-8.1116, -79.0288), aprobado: true },
  { id: "d05", nombre: "Olla común Santa Rosa", tipo: "OLLA_COMUN", telefono: "000000000", whatsapp: "51900000000", direccion: "Trujillo (dato de ejemplo)", horario: "12:00–14:00", geohash: gh(-8.1116, -79.0288), aprobado: true },
  { id: "d06", nombre: "Grupo WhatsApp del barrio", tipo: "GRUPO_WHATSAPP", telefono: "000000000", whatsapp: "51900000001", direccion: "—", horario: "—", geohash: gh(-8.1116, -79.0288), aprobado: false },
];