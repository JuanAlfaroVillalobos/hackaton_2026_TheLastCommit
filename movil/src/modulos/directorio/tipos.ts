import type { Coordenada } from "@/compartido/utilidades/geo";
import type { EstadoIdentidad } from "@/nucleo/sesion";

export type TipoDirectorio =
  | "oficio"
  | "servicio"
  | "producto";

export type ComentarioVistoBueno = { uid: string; nombre: string; texto: string; creadoEn: number };

export type VecinoDirectorio = {
  uid: string;
  nombre: string;
  fotoUrl: string | null;
  identidad: EstadoIdentidad;
  telefono: string | null;
  whatsapp: string | null;
  barrio: string;
  ubicacion: Coordenada;
};

export interface ServicioDirectorio {
  id: string;
  tipo: TipoDirectorio;
  categoria: string;
  titulo: string;
  descripcion: string;
  precio?: number | "a convenir";
  horario?: string;
  fotos?: string[];
  telefono: string;
  whatsapp: string;
  direccion: string;
  autor: VecinoDirectorio;
  ubicacion: Coordenada;
  activo: boolean;
  creadoEn: number;
  vistosBuenos: number;
  vistosBuenosUids: string[];
  comentariosVistoBueno: ComentarioVistoBueno[];
  horasAyudadas: number;
}

export type NuevoServicio = Pick<ServicioDirectorio, "tipo" | "categoria" | "titulo" | "descripcion" | "horario" | "fotos"> & {
  precio?: number | "a convenir";
};

export type InteresTrabajo = {
  uid: string;
  nombre: string;
  fotoUrl: string | null;
  telefono: string | null;
  whatsapp: string | null;
  vistosBuenos: number;
  creadoEn: number;
};

export type TrabajoDirectorio = {
  id: string;
  oficio: string;
  descripcion: string;
  fechaHora: string;
  pago?: number | "a convenir";
  autor: VecinoDirectorio;
  ubicacion: Coordenada;
  creadoEn: number;
  venceEn: number;
  estado: "ABIERTO" | "CUBIERTO";
  interesados: InteresTrabajo[];
};