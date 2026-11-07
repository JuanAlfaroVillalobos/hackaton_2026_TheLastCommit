// Ruta: src/modulos/favores/componentes/AvisoNotificaciones.tsx
// Aviso permanente cuando el vecino rechazó las notificaciones (RF08, frame 04-D).
import { Icono } from "@/compartido/ui";
import { ESPACIO, MAX_ESCALA_FUENTE, RADIO, TACTIL_MIN, TIPO, useTema } from "@/compartido/tema";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { TEXTOS_INICIO } from "../constantes";

type Props = { onIrAjustes: () => void };

export function AvisoNotificaciones({ onIrAjustes }: Props) {
  const { colores, oscuro } = useTema();
  return (
    <View
      style={[styles.aviso, { backgroundColor: colores.acentoFondo, borderColor: colores.acento }]}
      accessibilityRole="alert"
    >
      <Icono nombre="notifications_off" color={oscuro ? colores.acento : colores.primarioOscuro} tamano={22} />
      <Text style={[styles.texto, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
        {TEXTOS_INICIO.sinNotificaciones}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${TEXTOS_INICIO.irAjustes} para activar las notificaciones`}
        onPress={onIrAjustes}
        style={styles.boton}
      >
        <Text style={[styles.enlace, { color: colores.enlace }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          {TEXTOS_INICIO.irAjustes}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  aviso: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIO.m,
    borderWidth: 1,
    borderRadius: RADIO.tarjeta,
    paddingLeft: ESPACIO.l,
    paddingRight: ESPACIO.s,
    paddingVertical: ESPACIO.xs,
  },
  texto: { ...TIPO.pequeno, fontWeight: "600", flex: 1 },
  boton: { minHeight: TACTIL_MIN, justifyContent: "center", paddingHorizontal: ESPACIO.s },
  enlace: { ...TIPO.pequeno, fontWeight: "700" },
});
