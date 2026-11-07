export type TipoDirectorio =
  | "oficio"
  | "servicio"
  | "producto";

export interface ServicioDirectorio {
  id: string;
  tipo: TipoDirectorio;
  categoria: string;
  titulo: string;
  descripcion: string;
  precio?: number;
  horario?: string;
  fotos?: string[];
  telefono: string;
  whatsapp: string;
  direccion: string;

  vistosBuenos: number;
}