// Ruta: src/compartido/ui/FranjaSinConexion.tsx
// Franja «Sin conexión» de borde a borde, en dos líneas (RNF09, RF41; diseño 04-D y decisión 6).
// «Pendiente de enviar ({n})» solo se muestra cuando n > 0.
import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from "@/compartido/tema";
import { StyleSheet, Text, View } from "react-native";
import { Icono } from "./Icono";

type Props = { pendientes: number };

export function FranjaSinConexion({ pendientes }: Props) {
  const { colores } = useTema();
  return (
    <View
      style={[styles.franja, { backgroundColor: colores.franja }]}
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.fila}>
        <Icono nombre="cloud_off" color={colores.sobreFranja} tamano={18} />
        <Text style={[styles.texto, { color: colores.sobreFranja }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          Sin conexión · Mostrando lo último guardado
        </Text>
      </View>
      {pendientes > 0 ? (
        <Text style={[styles.texto, styles.pendientes, { color: colores.acento }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          Pendiente de enviar ({pendientes})
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  franja: { paddingHorizontal: ESPACIO.l, paddingVertical: ESPACIO.m, gap: ESPACIO.xs },
  fila: { flexDirection: "row", alignItems: "center", gap: ESPACIO.s },
  texto: { ...TIPO.pequeno, fontWeight: "600", flexShrink: 1 },
  pendientes: { fontWeight: "700" },
});
