// Ruta: src/simulaciones/favores.ts
// Datos falsos del módulo favores (P04) y de la sesión. Zona: la misma de ayudaHumanitaria (Trujillo).
// Los servicios reales tendrán las mismas firmas; solo cambia el origen de los datos.
import type { PublicacionConAutor, VecinoActual } from "@/modulos/favores";
import type { EstadoPermiso } from "@/nucleo/notificaciones";
import { geohashForLocation } from "geofire-common";
import { UID_YO, ZONA_DEMO } from "./ayudaHumanitaria";
import { ESCENARIO_DEMO } from "./escenario";

const MIN = 60_000;
const hace = (min: number) => Date.now() - min * MIN;
const en = (min: number) => Date.now() + min * MIN;
/** Desplaza la zona de la demo `norte` y `este` metros y devuelve el geohash de precisión 7. */
const gh = (norte: number, este: number) =>
  geohashForLocation([ZONA_DEMO.lat + norte / 111_320, ZONA_DEMO.lng + este / 110_200], 7);

const ID_MI_PUBLICACION = "nc00";

export const vecinoActualMock: VecinoActual = {
  uid: UID_YO,
  nombre: "Ana Morales",
  barrio: "Barrio Los Olivos",
  oficios: ["tecnologia", "clases-tutorias"],
  necesidadActivaId: ESCENARIO_DEMO === "activa" ? ID_MI_PUBLICACION : null,
  ubicacion: ZONA_DEMO,
};

export const pendientesBandejaMock = ESCENARIO_DEMO === "sin-conexion" ? 1 : 0;

export const permisoNotificacionesMock: EstadoPermiso = ESCENARIO_DEMO === "sin-conexion" ? "denegado" : "concedido";

const base = { prestadorId: null, etaMinutos: null, llegadaEstimada: null, devolucionEn: null, prestadorNombre: null };

const muro: PublicacionConAutor[] = [
  {
    ...base,
    id: "nc01",
    solicitanteId: "u11",
    autorNombre: "Rosa Vega",
    tipo: "NECESITO",
    categoria: "FAVOR_OFICIO",
    oficioId: "tecnologia",
    descripcion: "Necesito ayuda para configurar el WhatsApp del celular de mi mamá.",
    geohash: gh(300, 0),
    estado: "PUBLICADA",
    expiraEn: en(24 * 60 - 10),
    creadoEn: hace(10),
  },
  {
    ...base,
    id: "nc02",
    solicitanteId: "u12",
    autorNombre: "Jorge Quispe",
    tipo: "NECESITO",
    categoria: "FAVOR_OFICIO",
    oficioId: "gasfiteria",
    descripcion: "Se rompió la llave del lavadero y gotea toda la noche. ¿Alguien me ayuda?",
    geohash: gh(-600, 0),
    estado: "PUBLICADA",
    expiraEn: en(24 * 60 - 25),
    creadoEn: hace(25),
  },
  {
    ...base,
    id: "nc03",
    solicitanteId: "u13",
    autorNombre: "Carmen Huamán",
    tipo: "OFREZCO",
    categoria: "PRESTAMO",
    oficioId: null,
    descripcion: "Presto una escalera de 6 peldaños para trabajos en casa.",
    geohash: gh(0, 1200),
    estado: "PUBLICADA",
    devolucionEn: new Date(2026, 10, 8, 18).getTime(),
    expiraEn: en(23 * 60),
    creadoEn: hace(60),
  },
  // No deben verse: fuera del radio, vencida y aceptada por otro (RF09, RF19).
  {
    ...base,
    id: "nc04",
    solicitanteId: "u14",
    autorNombre: "Pedro Salas",
    tipo: "NECESITO",
    categoria: "FAVOR_OFICIO",
    oficioId: "carpinteria",
    descripcion: "Necesito arreglar una puerta.",
    geohash: gh(5000, 0),
    estado: "PUBLICADA",
    expiraEn: en(600),
    creadoEn: hace(5),
  },
  {
    ...base,
    id: "nc05",
    solicitanteId: "u15",
    autorNombre: "Lucía Torres",
    tipo: "NECESITO",
    categoria: "FAVOR_OFICIO",
    oficioId: "mandados-compras",
    descripcion: "¿Alguien me trae pan?",
    geohash: gh(200, 200),
    estado: "PUBLICADA",
    expiraEn: hace(1),
    creadoEn: hace(24 * 60 + 1),
  },
];

const miPublicacion: PublicacionConAutor = {
  ...base,
  id: ID_MI_PUBLICACION,
  solicitanteId: UID_YO,
  autorNombre: vecinoActualMock.nombre,
  prestadorId: "u16",
  prestadorNombre: "Luis Paredes",
  tipo: "NECESITO",
  categoria: "FAVOR_OFICIO",
  oficioId: "mascotas",
  descripcion: "Necesito que alguien pasee a mi perro Toby esta tarde, me torcí el tobillo.",
  geohash: gh(0, 0),
  estado: "ACEPTADA",
  etaMinutos: 10,
  llegadaEstimada: en(10),
  expiraEn: en(23 * 60),
  creadoEn: hace(15),
};

export const publicacionesMock: PublicacionConAutor[] =
  ESCENARIO_DEMO === "vacio" ? [] : ESCENARIO_DEMO === "activa" ? [...muro, miPublicacion] : muro;
