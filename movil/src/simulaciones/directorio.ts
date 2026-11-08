
import type { ServicioDirectorio, TrabajoDirectorio } from "@/modulos/directorio/tipos";

const ana = {
  uid: "u00",
  nombre: "Ana Morales",
  fotoUrl: null,
  identidad: "VERIFICADA" as const,
  telefono: "+51987654321",
  whatsapp: "51987654321",
  barrio: "Barrio Los Olivos",
  ubicacion: { lat: -8.1116, lng: -79.0288 },
};

export const serviciosMock: ServicioDirectorio[] = [
  {
    id: "servicio-1",
    tipo: "oficio",
    categoria: "Gasfitería",
    titulo: "Gasfitería y pequeñas reparaciones",
    descripcion: "Reparo grifos, fugas y conexiones de agua. Atiendo en Los Olivos de lunes a sábado, de 9:00 a 18:00. Cuéntame qué necesitas y coordinamos una visita. Presupuesto según el trabajo.",
    horario: "Lunes a sábado, 9:00 a 18:00",
    fotos: [],
    telefono: ana.telefono,
    whatsapp: ana.whatsapp,
    direccion: ana.barrio,
    autor: ana,
    ubicacion: { lat: -8.1108, lng: -79.0279 },
    activo: true,
    creadoEn: Date.now() - 3_600_000,
    vistosBuenos: 12,
    vistosBuenosUids: ["u31", "u32", "u33"],
    comentariosVistoBueno: [
      { uid: "u31", nombre: "Diego Paredes", texto: "Llegó puntual y dejó todo funcionando.", creadoEn: Date.now() - 86_400_000 },
      { uid: "u32", nombre: "Elena Quispe", texto: "Muy buen trato y precio justo.", creadoEn: Date.now() - 172_800_000 },
      { uid: "u33", nombre: "Luis Rojas", texto: "Solucionó una fuga difícil en casa.", creadoEn: Date.now() - 259_200_000 },
    ],
    horasAyudadas: 18,
  },
  {
    id: "servicio-2",
    tipo: "servicio",
    categoria: "Costura y arreglos",
    titulo: "Arreglos de ropa con cariño",
    descripcion: "Bastas, cierres y ajustes. Trabajo por encargo en el sector B; conversemos sobre tu prenda.",
    horario: "Lunes a viernes, 10:00 a 17:00",
    fotos: [],
    telefono: "+51988888888",
    whatsapp: "51988888888",
    direccion: "Sector B, Los Olivos",
    autor: { ...ana, uid: "u02", nombre: "Elena Quispe", identidad: "PENDIENTE", ubicacion: { lat: -8.116, lng: -79.031 } },
    ubicacion: { lat: -8.116, lng: -79.031 },
    activo: true,
    creadoEn: Date.now() - 86_400_000,
    vistosBuenos: 5,
    vistosBuenosUids: ["u41", "u42", "u43", "u44", "u45"],
    comentariosVistoBueno: [],
    horasAyudadas: 7,
  },
];

export const trabajosMock: TrabajoDirectorio[] = [
  {
    id: "trabajo-1",
    oficio: "Gasfitería",
    descripcion: "Necesito revisar un grifo que gotea y cambiar el flexible de la cocina.",
    fechaHora: new Date(Date.now() + 86_400_000).toISOString(),
    pago: "a convenir",
    autor: { ...ana, uid: "u04", nombre: "María Fernanda", telefono: "+51999999111", whatsapp: "51999999111" },
    ubicacion: { lat: -8.113, lng: -79.03 },
    creadoEn: Date.now() - 2 * 86_400_000,
    venceEn: Date.now() + 5 * 86_400_000,
    estado: "ABIERTO",
    interesados: [],
  },
];