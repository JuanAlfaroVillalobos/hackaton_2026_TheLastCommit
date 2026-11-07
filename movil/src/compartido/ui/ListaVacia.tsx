// Ruta: src/compartido/ui/ListaVacia.tsx
// Estado vacío de una lista: ilustración lineal de casas con corazón (diseño 04-C), texto y una acción opcional.
import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from "@/compartido/tema";
import { StyleSheet, Text, View } from "react-native";
import { Boton } from "./Boton";
import { Icono } from "./Icono";
import { Tarjeta } from "./Tarjeta";

type Props = {
  texto: string;
  accion?: { texto: string; onPress: () => void };
};

export function ListaVacia({ texto, accion }: Props) {
  const { colores } = useTema();
  return (
    <Tarjeta style={styles.tarjeta}>
      <View style={styles.ilustracion} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Icono nombre="favorite" color={colores.acento} tamano={28} style={styles.corazon} />
        <Icono nombre="holiday_village" color={colores.acento} tamano={72} />
      </View>
      <Text
        style={[styles.texto, { color: colores.texto }]}
        accessibilityRole="text"
        maxFontSizeMultiplier={MAX_ESCALA_FUENTE}
      >
        {texto}
      </Text>
      {accion ? <Boton texto={accion.texto} onPress={accion.onPress} variante="secundario" /> : null}
    </Tarjeta>
  );
}

const styles = StyleSheet.create({
  tarjeta: { alignItems: "center", paddingVertical: ESPACIO.xxl, gap: ESPACIO.l },
  ilustracion: { alignItems: "center" },
  corazon: { marginBottom: -ESPACIO.s },
  texto: { ...TIPO.cuerpo, fontSize: 17, lineHeight: 24, textAlign: "center", paddingHorizontal: ESPACIO.l },
});
