// Ruta: src/modulos/emergencia/pantallas/AlertaEmergenciaPantalla.tsx
// P12 · «¿Estás bien?» (RF23, RF24). Se abre a pantalla completa desde la notificación del canal
// Emergencias (también con el teléfono bloqueado) o dentro de la app. Dos botones grandes:
// «Estoy bien» → A_SALVO (sale del mapa de todos y deja de recibir alertas) y «Necesito ayuda».
import { ESPACIO, MAX_ESCALA_FUENTE, RADIO, TACTIL_MIN, TIPO, useTema } from "@/compartido/tema";
import { Icono, type NombreIcono } from "@/compartido/ui";
import { quitarNotificacion } from "@/nucleo/notificaciones";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { refrescarEmergencia, responder, useEmergencia, useEmergenciaStore } from "../estado";
import { ID_NOTIFICACION_ALERTA } from "../notificaciones";

type Props = {
  /** Tras responder, o con «Ver el mapa»: ir a P11. */
  onVerMapa: () => void;
  /** Sin emergencia activa (ya terminó): volver. */
  onSalir: () => void;
};

const BLANCO = "#FFFFFF";

function minutosDesde(marca: number): string {
  const minutos = Math.max(0, Math.floor((Date.now() - marca) / 60_000));
  return minutos < 1 ? "hace un momento" : `hace ${minutos} min`;
}

export function AlertaEmergenciaPantalla({ onVerMapa, onSalir }: Props) {
  const { colores } = useTema();
  const margen = useSafeAreaInsets();
  const { emergencia, yo, cargado } = useEmergencia();
  const [enviando, setEnviando] = useState<"A_SALVO" | "NECESITA_AYUDA" | null>(null);

  useEffect(() => {
    useEmergenciaStore.getState().setEnAlerta(true);
    void quitarNotificacion(ID_NOTIFICACION_ALERTA);
    void refrescarEmergencia();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    return () => useEmergenciaStore.getState().setEnAlerta(false);
  }, []);

  async function enviar(estado: "A_SALVO" | "NECESITA_AYUDA") {
    setEnviando(estado);
    try {
      await responder(estado);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (useEmergenciaStore.getState().emergencia) onVerMapa();
      else onSalir(); // con el último «Estoy bien» la emergencia terminó (RF25)
    } catch (error) {
      Alert.alert("No se pudo enviar", error instanceof Error ? error.message : "Inténtalo de nuevo.");
    } finally {
      setEnviando(null);
    }
  }

  const fondo = colores.primario;

  if (!emergencia) {
    return (
      <View style={[styles.raiz, { backgroundColor: fondo, paddingTop: margen.top, paddingBottom: margen.bottom }]}>
        <View style={styles.centro}>
          {cargado ? (
            <>
              <Icono nombre="check_circle" color={BLANCO} tamano={72} />
              <Text style={styles.titulo} accessibilityRole="header" maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
                La emergencia terminó
              </Text>
              <Text style={styles.subtitulo} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
                Tu zona volvió a la normalidad.
              </Text>
              <BotonGrande texto="Volver al inicio" icono="home" fondo={BLANCO} color={fondo} onPress={onSalir} />
            </>
          ) : (
            <ActivityIndicator size="large" color={BLANCO} />
          )}
        </View>
      </View>
    );
  }

  const aSalvo = yo?.estado === "A_SALVO";
  const pidioAyuda = yo?.estado === "NECESITA_AYUDA";

  return (
    <View style={[styles.raiz, { backgroundColor: fondo }]}>
      <ScrollView
        contentContainerStyle={[styles.contenido, { paddingTop: margen.top + ESPACIO.xxl, paddingBottom: margen.bottom + ESPACIO.xl }]}
      >
        <View style={styles.centro} accessible accessibilityRole="alert">
          <Icono nombre="warning" color={BLANCO} tamano={72} />
          <Text style={styles.titulo} accessibilityRole="header" maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            ¿Estás bien?
          </Text>
          <Text style={styles.subtitulo} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            Tu zona está en emergencia desde {minutosDesde(emergencia.activadaEn)}. Cuéntales a tus vecinos cómo estás.
          </Text>
          {aSalvo || pidioAyuda ? (
            <Text style={styles.estado} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
              {aSalvo ? "Avisaste que estás a salvo." : "Avisaste que necesitas ayuda. Tus vecinos te ven en el mapa."}
            </Text>
          ) : null}
        </View>

        <View style={styles.botones}>
          <BotonGrande
            texto="Estoy bien"
            icono="check_circle"
            fondo={colores.exito}
            color={BLANCO}
            cargando={enviando === "A_SALVO"}
            deshabilitado={enviando !== null}
            accessibilityHint="Dejas de aparecer en el mapa y de recibir estas alertas"
            onPress={() => void enviar("A_SALVO")}
          />
          <BotonGrande
            texto="Necesito ayuda"
            icono="sos"
            fondo={BLANCO}
            color={fondo}
            cargando={enviando === "NECESITA_AYUDA"}
            deshabilitado={enviando !== null}
            accessibilityHint="Tus vecinos te verán en el mapa de emergencia"
            onPress={() => void enviar("NECESITA_AYUDA")}
          />
          <Pressable
            accessibilityRole="link"
            onPress={onVerMapa}
            style={({ pressed }) => [styles.enlace, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Icono nombre="map" color={BLANCO} tamano={20} />
            <Text style={styles.textoEnlace} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
              Ver el mapa de la zona
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function BotonGrande({
  texto,
  icono,
  fondo,
  color,
  onPress,
  cargando = false,
  deshabilitado = false,
  accessibilityHint,
}: {
  texto: string;
  icono: NombreIcono;
  fondo: string;
  color: string;
  onPress: () => void;
  cargando?: boolean;
  deshabilitado?: boolean;
  accessibilityHint?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: deshabilitado, busy: cargando }}
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        styles.botonGrande,
        { backgroundColor: fondo, opacity: deshabilitado && !cargando ? 0.6 : pressed ? 0.85 : 1 },
      ]}
    >
      {cargando ? <ActivityIndicator color={color} /> : <Icono nombre={icono} color={color} tamano={30} />}
      <Text style={[styles.textoBoton, { color }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
        {texto}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { flexGrow: 1, justifyContent: "space-between", paddingHorizontal: ESPACIO.l, gap: ESPACIO.xxl },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", gap: ESPACIO.m, paddingHorizontal: ESPACIO.l },
  titulo: { ...TIPO.titulo, fontSize: 36, lineHeight: 42, color: BLANCO, textAlign: "center" },
  subtitulo: { ...TIPO.cuerpo, fontSize: 18, lineHeight: 26, color: BLANCO, textAlign: "center" },
  estado: {
    ...TIPO.cuerpo,
    color: BLANCO,
    textAlign: "center",
    fontWeight: "700",
    marginTop: ESPACIO.s,
  },
  botones: { gap: ESPACIO.m },
  botonGrande: {
    minHeight: TACTIL_MIN + 28,
    borderRadius: RADIO.tarjeta,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ESPACIO.m,
    paddingHorizontal: ESPACIO.xl,
    elevation: 3,
  },
  textoBoton: { fontSize: 22, fontWeight: "800" },
  enlace: {
    minHeight: TACTIL_MIN,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ESPACIO.s,
  },
  textoEnlace: { ...TIPO.cuerpo, color: BLANCO, fontWeight: "700", textDecorationLine: "underline" },
});
