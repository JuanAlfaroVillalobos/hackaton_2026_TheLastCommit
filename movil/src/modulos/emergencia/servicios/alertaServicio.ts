// Ruta: src/modulos/emergencia/servicios/alertaServicio.ts
// RF20: registra la alerta de emergencia.
// SIMULADO: hoy no envía nada. Pendiente: ubicación validada (RF42), función invocable `registrarAlerta`
// a través de enviarAccion() de la bandeja de salida (RF41) y, sin internet, SMS tipo `E` (RF26).
export async function registrarAlerta(): Promise<void> {
  await new Promise((resolver) => setTimeout(resolver, 300));
}
