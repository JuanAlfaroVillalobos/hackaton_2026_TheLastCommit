// Ruta: src/modulos/ayuda-humanitaria/componentes/AvisoSinConexion.tsx
// Franja que avisa que, sin internet, el envío saldrá por SMS (RF26, RF41).
import { useTema } from "@/compartido/tema";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Colores } from "../estilos";

export function AvisoSinConexion() {
  const { colores: T } = useTema();
  const styles = useMemo(() => crearEstilos(T), [T]);
  return (
    <View style={styles.franja} accessibilityRole="alert">
      <Text style={styles.texto}>📵 Sin conexión: se enviará por SMS.</Text>
    </View>
  );
}

const crearEstilos = (T: Colores) =>
  StyleSheet.create({
    franja: { backgroundColor: T.acentoFondo, borderRadius: 12, borderWidth: 1, borderColor: T.borde, padding: 12, marginBottom: 12 },
    texto: { color: T.texto, fontSize: 14, fontWeight: "700" },
  });