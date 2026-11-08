// Ruta: src/modulos/emergencia/notificaciones.ts
// Avisos del módulo «emergencia» (los envía api-mock/src/modulos/emergencia/zona.ts con notificar()).
// Se registra al cargar este archivo, que importa src/nucleo/arranque.ts: así funciona con la app cerrada.
//   - «alerta» (RF23): «¿Estás bien?» en el canal Emergencias, a pantalla completa con el teléfono
//     bloqueado y como aviso flotante si está en uso, con las acciones «Estoy bien» / «Necesito ayuda»
//     (RF24) que funcionan sin abrir la app. Fuera de Android (web, iOS) abre P12 dentro de la app.
//   - «mapa»: silencioso; P11 vuelve a pedir los vecinos (RF22, RF24 ≤ 5 s).
//   - «finalizada» (RF25): se quita la alerta y nucleo muestra el aviso.
import { cabecerasSesion, fijarToken } from "@/nucleo/api";
import {
  mostrarNotificacion,
  quitarNotificacion,
  registrarManejadorNotificaciones,
  type CargaNotificacion,
} from "@/nucleo/notificaciones";
import { CLAVE_TOKEN } from "@/nucleo/sesion";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { refrescarEmergencia, responder, useEmergenciaStore } from "./estado";

/** Id fijo: cada reenvío de RF23 reemplaza al anterior en vez de apilarse. */
export const ID_NOTIFICACION_ALERTA = "emergencia-alerta";
export const RUTA_ALERTA = "/emergencia/alerta";

const ACCION_A_SALVO = "a-salvo";
const ACCION_NECESITO_AYUDA = "necesito-ayuda";

/** Si Android revivió la app solo para el aviso, el token de la sesión no está en memoria. */
async function asegurarToken(): Promise<void> {
  if (cabecerasSesion().Authorization) return;
  const token = await SecureStore.getItemAsync(CLAVE_TOKEN).catch(() => null);
  if (token) fijarToken(token);
}

function abrirAlerta(): void {
  try {
    router.push(RUTA_ALERTA as never);
  } catch {
    // navegación aún no montada: la abre la notificación inicial
  }
}

async function mostrarAlerta(carga: CargaNotificacion): Promise<void> {
  await mostrarNotificacion({
    id: ID_NOTIFICACION_ALERTA,
    titulo: carga.titulo ?? "¿Estás bien?",
    cuerpo: carga.cuerpo,
    canal: "emergencias",
    carga,
    pantallaCompleta: true,
    acciones: [
      { id: ACCION_A_SALVO, texto: "Estoy bien" },
      { id: ACCION_NECESITO_AYUDA, texto: "Necesito ayuda" },
    ],
  });
}

registrarManejadorNotificaciones("emergencia", {
  alRecibir: async (carga, { enPrimerPlano }) => {
    switch (carga.tipo) {
      case "mapa":
        useEmergenciaStore.getState().tocar();
        void refrescarEmergencia();
        return true;

      case "alerta": {
        await asegurarToken();
        void refrescarEmergencia();
        if (useEmergenciaStore.getState().enAlerta) return true; // P12 ya está en pantalla
        if (enPrimerPlano && Platform.OS !== "android") abrirAlerta();
        else await mostrarAlerta(carga);
        return true;
      }

      case "finalizada":
        await quitarNotificacion(ID_NOTIFICACION_ALERTA);
        await asegurarToken();
        await refrescarEmergencia();
        return false; // nucleo muestra «La emergencia terminó»
    }
    return false;
  },

  alPulsar: async (_carga, accionId) => {
    if (accionId !== ACCION_A_SALVO && accionId !== ACCION_NECESITO_AYUDA) return;
    await quitarNotificacion(ID_NOTIFICACION_ALERTA);
    await asegurarToken();
    await responder(accionId === ACCION_A_SALVO ? "A_SALVO" : "NECESITA_AYUDA").catch(() => undefined);
  },
});
