// Ruta: src/modulos/emergencia/componentes/BotonSos.tsx
// Botón «SOS» del encabezado (RF20, README sección 7): mantener pulsado 2 s, vibración de confirmación
// con expo-haptics y luego confirmar «¿Necesitas ayuda?». Un toque corto explica cómo usarlo.
import { Icono } from "@/compartido/ui";
import { ESPACIO, MAX_ESCALA_FUENTE, RADIO, TACTIL_MIN, useTema } from "@/compartido/tema";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, ToastAndroid } from "react-native";
import { refrescarEmergencia } from "../estado";
import { registrarAlerta } from "../servicios/alertaServicio";

const PULSACION_MS = 2000;
const TITULO = "¿Necesitas ayuda?";
const DETALLE = "Avisaremos a los vecinos de tu zona.";

/** ToastAndroid solo existe en Android; en web Alert.alert no muestra nada. */
function avisar(texto: string) {
  if (Platform.OS === "android") ToastAndroid.show(texto, ToastAndroid.SHORT);
  else if (Platform.OS === "web") window.alert(texto);
  else Alert.alert(texto);
}

/** Pregunta antes de enviar. En web, Alert.alert con botones no aparece: se usa window.confirm. */
function preguntar(alConfirmar: () => void) {
  if (Platform.OS === "web") {
    if (window.confirm(`${TITULO}\n${DETALLE}`)) alConfirmar();
    return;
  }
  Alert.alert(TITULO, DETALLE, [
    { text: "Cancelar", style: "cancel" },
    { text: "Sí, necesito ayuda", style: "destructive", onPress: alConfirmar },
  ]);
}

export function BotonSos() {
  const { colores } = useTema();
  const [enviando, setEnviando] = useState(false);

  function confirmar() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    preguntar(async () => {
      setEnviando(true);
      try {
        await registrarAlerta();
        avisar("Alerta enviada");
        // Si esta alerta completó el umbral (RF21), la app entra al modo emergencia sin esperar el push.
        void refrescarEmergencia();
      } catch (error) {
        avisar(`No se pudo enviar la alerta. ${error instanceof Error ? error.message : "Inténtalo de nuevo."}`);
      } finally {
        setEnviando(false);
      }
    });
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="SOS, pedir ayuda de emergencia"
      accessibilityHint="Mantén pulsado 2 segundos para pedir ayuda"
      accessibilityState={{ busy: enviando }}
      disabled={enviando}
      delayLongPress={PULSACION_MS}
      onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})}
      onPress={() => avisar("Mantén pulsado 2 segundos para pedir ayuda")}
      onLongPress={confirmar}
      style={({ pressed }) => [
        styles.boton,
        { backgroundColor: colores.sosFondo, borderColor: colores.sos, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Icono nombre="gpp_maybe" color={colores.sos} tamano={22} />
      <Text style={[styles.texto, { color: colores.sos }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
        SOS
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    minHeight: TACTIL_MIN + 8,
    minWidth: TACTIL_MIN,
    paddingHorizontal: ESPACIO.l,
    borderRadius: RADIO.boton,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIO.s,
  },
  texto: { fontSize: 18, fontWeight: "800", letterSpacing: 0.5 },
});
