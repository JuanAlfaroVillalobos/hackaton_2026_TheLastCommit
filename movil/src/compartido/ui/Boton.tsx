// Ruta: src/compartido/ui/Boton.tsx
// Botón de acción. Variantes: `primario` (sólido), `secundario` (contorno) y `enlace` (texto con icono,
// para acciones que no deben competir con la principal, p. ej. «Reportar vulnerabilidad»).
// Si una regla lo deshabilita, se pasa `motivoDeshabilitado`: se muestra debajo y TalkBack lo lee (RNF03).
import { ESPACIO, MAX_ESCALA_FUENTE, RADIO, TACTIL_MIN, TIPO, useTema } from "@/compartido/tema";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icono, type NombreIcono } from "./Icono";

type Props = {
  texto: string;
  onPress: () => void;
  variante?: "primario" | "secundario" | "enlace";
  icono?: NombreIcono;
  deshabilitado?: boolean;
  motivoDeshabilitado?: string;
  accessibilityLabel?: string;
};

export function Boton({
  texto,
  onPress,
  variante = "primario",
  icono,
  deshabilitado = false,
  motivoDeshabilitado,
  accessibilityLabel,
}: Props) {
  const { colores } = useTema();
  const primario = variante === "primario";
  const enlace = variante === "enlace";

  const fondo = deshabilitado && !enlace ? colores.deshabilitado : primario ? colores.primario : "transparent";
  const colorTexto = deshabilitado
    ? colores.sobreDeshabilitado
    : primario
      ? colores.sobrePrimario
      : enlace
        ? colores.textoSecundario
        : colores.primario;

  return (
    <View style={styles.contenedor}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? texto}
        accessibilityHint={deshabilitado ? motivoDeshabilitado : undefined}
        accessibilityState={{ disabled: deshabilitado }}
        disabled={deshabilitado}
        onPress={onPress}
        style={({ pressed }) => [
          styles.boton,
          primario ? styles.sombra : null,
          {
            backgroundColor: pressed && primario ? colores.primarioOscuro : fondo,
            borderColor: deshabilitado ? colores.deshabilitado : colores.primario,
            borderWidth: primario || enlace ? 0 : 1.5,
            shadowColor: colores.primario,
            elevation: primario && !deshabilitado ? 3 : 0,
          },
        ]}
      >
        {icono ? <Icono nombre={icono} color={colorTexto} tamano={enlace ? 20 : 22} /> : null}
        <Text
          style={[styles.texto, enlace ? styles.textoEnlace : null, { color: colorTexto }]}
          maxFontSizeMultiplier={MAX_ESCALA_FUENTE}
        >
          {texto}
        </Text>
      </Pressable>

      {deshabilitado && motivoDeshabilitado ? (
        <View style={styles.motivo}>
          <Icono nombre="info" color={colores.textoSecundario} tamano={18} />
          <Text
            style={[styles.textoMotivo, { color: colores.textoSecundario }]}
            maxFontSizeMultiplier={MAX_ESCALA_FUENTE}
          >
            {motivoDeshabilitado}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: ESPACIO.s },
  boton: {
    minHeight: 52,
    minWidth: TACTIL_MIN,
    borderRadius: RADIO.boton,
    paddingHorizontal: ESPACIO.l,
    paddingVertical: ESPACIO.m,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ESPACIO.s,
  },
  sombra: { shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  texto: { ...TIPO.cuerpoFuerte, fontSize: 17, textAlign: "center", flexShrink: 1 },
  textoEnlace: { fontWeight: "400", fontSize: 16 },
  motivo: { flexDirection: "row", gap: ESPACIO.s, alignItems: "flex-start", paddingHorizontal: ESPACIO.xs },
  textoMotivo: { ...TIPO.pequeno, flex: 1 },
});
