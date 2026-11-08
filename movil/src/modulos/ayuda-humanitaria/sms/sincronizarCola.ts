// Ruta: src/modulos/ayuda-humanitaria/sms/sincronizarCola.ts
// SIMULA al móvil intermediario: cuando vuelve internet, lee los SMS pendientes (V y R), los decodifica con los
// mismos códigos del protocolo y los sube a la API. Con el transporte real de Manuel la cola simulada queda vacía
// y esto no hace nada.
import { useConexion } from "@/nucleo/red";
import NetInfo from "@react-native-community/netinfo";
import { useEffect } from "react";
import { Alert } from "react-native";
import { crearRecurso } from "../servicios/recursosServicio";
import { crearReporte } from "../servicios/reportesServicio";
import { decodificarR, decodificarV } from "./ayudaSms";
import { recursoDesdeR, reporteDesdeV } from "./convertir";
import { primeroDeLaCola, quitarPrimeroDeLaCola, restaurarCola } from "./transporte";

let vaciando = false;

/** Sube en orden los mensajes pendientes. Si uno falla se detiene y queda en cola. Devuelve cuántos subió. */
export async function vaciarColaSimulada(): Promise<number> {
  if (vaciando) return 0;
  vaciando = true;
  let subidos = 0;
  try {
    for (let m = primeroDeLaCola(); m; m = primeroDeLaCola()) {
      if (m.texto.startsWith("V|")) {
        const { canal: _c, ...datos } = reporteDesdeV(decodificarV(m.texto));
        await crearReporte(datos);
      } else if (m.texto.startsWith("R|")) {
        const { canal: _c, ...datos } = recursoDesdeR(decodificarR(m.texto));
        await crearRecurso(datos);
      }
      quitarPrimeroDeLaCola();
      subidos++;
    }
  } catch (e) {
    // sigue sin poder subir: se reintenta más tarde
    if (__DEV__) console.log("[SMS cola] no se pudo subir todavía:", e instanceof Error ? e.message : e);
  } finally {
    vaciando = false;
  }
  return subidos;
}

function avisarSubidos(n: number): void {
  if (n > 0) Alert.alert("Enviado", n === 1 ? "Se envió 1 mensaje pendiente." : `Se enviaron ${n} mensajes pendientes.`);
}

let escuchando = false;
const CADA_MS = 8000;

/**
 * Vigila la red mientras la app esté abierta, esté el vecino en la pantalla que esté: al volver internet sube lo
 * pendiente. Se activa solo la primera vez que algo queda en cola.
 */
export function iniciarSincronizacionAutomatica(): void {
  if (escuchando) return;
  escuchando = true;
  const intentar = () => {
    if (primeroDeLaCola()) vaciarColaSimulada().then(avisarSubidos);
  };
  NetInfo.addEventListener((estado) => {
    if (estado.isConnected && estado.isInternetReachable !== false) intentar();
  });
  // Respaldo: el estado de red del emulador a veces tarda o no avisa; el intento mismo dice si hay conexión.
  setInterval(intentar, CADA_MS);
}

/** Úsalo en una pantalla del módulo: al volver internet sube lo pendiente y avisa. */
export function useVaciarColaSms(): void {
  const { sinConexion } = useConexion();
  useEffect(() => {
    if (sinConexion) return;
    vaciarColaSimulada().then(avisarSubidos);
  }, [sinConexion]);
}

// Al cargar el módulo: si quedaron mensajes guardados de una sesión anterior, se retoma la sincronización.
restaurarCola().then((n) => {
  if (n > 0) iniciarSincronizacionAutomatica();
});