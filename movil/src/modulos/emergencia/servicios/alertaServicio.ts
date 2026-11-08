// Ruta: src/modulos/emergencia/servicios/alertaServicio.ts
// RF20: registra la alerta de emergencia.
// Va a la API (POST /emergencia/alertas), que la guarda en `alertas` (Firestore con ALMACEN=firestore)
// y recalcula el conteo de su celda H3 en `celdas` (RN-11, RN-12). Una pulsación repetida en 10 min
// devuelve la misma alerta. Pendiente: ubicación validada (RF42), bandeja de salida (RF41) y, sin
// internet, SMS tipo `E` (RF26). La firma no cambia, así que BotonSos tampoco.
import { api, ErrorApi } from "@/nucleo/api";

export async function registrarAlerta(ubicacion?: { lat: number; lng: number }): Promise<void> {
  try {
    await api("/emergencia/alertas", { metodo: "POST", cuerpo: { ...ubicacion } });
  } catch (error) {
    // En «Entrar sin cuenta» no hay token: se simula el envío para poder probar el botón.
    if (__DEV__ && error instanceof ErrorApi && error.codigo === "SIN_SESION") return;
    throw error;
  }
}
