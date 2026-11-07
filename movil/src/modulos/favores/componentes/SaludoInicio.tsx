// Ruta: src/modulos/favores/componentes/SaludoInicio.tsx
// Título de 2 líneas con el botón «?» de la guía de ayuda a la derecha (RF37) y el subtítulo.
import { ESPACIO, MAX_ESCALA_FUENTE, TACTIL_MIN, TIPO, useTema } from "@/compartido/tema";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { TEXTOS_INICIO } from "../constantes";

type Props = { nombre: string; onAyuda: () => void };

export function SaludoInicio({ nombre, onAyuda }: Props) {
  const { colores } = useTema();
  return (
    <View style={styles.raiz}>
      <View style={styles.fila}>
        <Text
          style={[styles.titulo, { color: colores.texto }]}
          accessibilityRole="header"
          maxFontSizeMultiplier={MAX_ESCALA_FUENTE}
        >
          {TEXTOS_INICIO.saludo(nombre)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={TEXTOS_INICIO.ayuda}
          onPress={onAyuda}
          style={[styles.ayuda, { borderColor: colores.borde, backgroundColor: colores.superficie }]}
        >
          <Text style={[styles.signo, { color: colores.texto }]} maxFontSizeMultiplier={1}>
            ?
          </Text>
        </Pressable>
      </View>
      <Text style={[styles.subtitulo, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
        {TEXTOS_INICIO.subtitulo}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: ESPACIO.xs },
  fila: { flexDirection: "row", alignItems: "flex-start", gap: ESPACIO.m },
  titulo: { ...TIPO.titulo, flex: 1 },
  ayuda: {
    width: TACTIL_MIN,
    height: TACTIL_MIN,
    borderRadius: TACTIL_MIN / 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  signo: { fontSize: 20, fontWeight: "700" },
  subtitulo: TIPO.cuerpo,
});
