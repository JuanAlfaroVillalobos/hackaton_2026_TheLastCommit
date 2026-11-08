// Ruta: src/modulos/emergencia/tipos.ts
// Modo emergencia de la zona (RF21–RF25, README 5.2). Copian api-mock/src/datos/tipos.ts.

export type EstadoVecinoEmergencia = "SIN_RESPONDER" | "NECESITA_AYUDA" | "A_SALVO";

/** `emergencias/{id}`: la celda que cruzó el umbral (RN-11) y sus 6 vecinas. */
export type Emergencia = {
  id: string;
  celdaCentro: string;
  centro: { lat: number; lng: number };
  celdas: string[];
  estado: "ACTIVA" | "FINALIZADA";
  activadaEn: number;
  ultimaAlertaEn: number;
  finalizadaEn: number | null;
  motivoFin: "TODOS_A_SALVO" | "SIN_ALERTAS" | "MANUAL" | null;
};

/** `emergencias/{id}/vecinos/{uid}`. */
export type VecinoEnEmergencia = {
  id: string;
  uid: string;
  nombre: string;
  estado: EstadoVecinoEmergencia;
  lat: number;
  lng: number;
  ultimaAlertaEn: number | null;
  respondidoEn: number | null;
  creadoEn: number;
};

/** Respuesta de GET /emergencia/actual, POST /presencia y POST /respuesta. */
export type EstadoEmergencia = {
  emergencia: Emergencia | null;
  yo: VecinoEnEmergencia | null;
};
