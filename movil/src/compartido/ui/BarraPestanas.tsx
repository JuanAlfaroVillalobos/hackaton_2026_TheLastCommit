// Ruta: src/compartido/ui/BarraPestanas.tsx
// Barra inferior de 4 pestañas (README, sección 7): de borde a borde en todos los temas (diseño P04,
// decisión 8), la activa con una píldora suave detrás del icono y el texto en negrita.
import { ESPACIO, MAX_ESCALA_FUENTE, RADIO, TACTIL_MIN, useTema } from "@/compartido/tema";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icono, type NombreIcono } from "./Icono";

export type PestanaConfig = { titulo: string; icono: NombreIcono };

type Props = BottomTabBarProps & {
  /** Título e icono por nombre de ruta. Las rutas que no estén aquí no se muestran. */
  pestanas: Record<string, PestanaConfig>;
};

export function BarraPestanas({ state, emitter, navigateToTab, pestanas }: Props) {
  const { colores, oscuro } = useTema();
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.barra,
        {
          backgroundColor: colores.superficie,
          borderTopColor: colores.borde,
          paddingBottom: Math.max(insets.bottom, ESPACIO.s),
        },
      ]}
    >
      {state.routes.map((ruta, indice) => {
        const config = pestanas[ruta.name];
        if (!config) return null;
        const activa = state.index === indice;

        const alPresionar = () => {
          const evento = emitter.emit({ type: "tabPress", target: ruta.key, canPreventDefault: true });
          if (!activa && !evento.defaultPrevented) navigateToTab(ruta.key);
        };

        return (
          <Pressable
            key={ruta.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: activa }}
            accessibilityLabel={config.titulo}
            onPress={alPresionar}
            style={styles.pestana}
          >
            <View style={[styles.pildora, activa ? { backgroundColor: colores.primarioSuave } : null]}>
              <Icono
                nombre={config.icono}
                color={activa ? (oscuro ? colores.texto : colores.primario) : colores.textoSecundario}
                tamano={24}
              />
            </View>
            <Text
              style={[
                styles.titulo,
                { color: activa ? colores.texto : colores.textoSecundario, fontWeight: activa ? "700" : "400" },
              ]}
              numberOfLines={1}
              maxFontSizeMultiplier={MAX_ESCALA_FUENTE}
            >
              {config.titulo}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: ESPACIO.s,
  },
  pestana: { flex: 1, alignItems: "center", gap: ESPACIO.xs, minHeight: TACTIL_MIN },
  pildora: { borderRadius: RADIO.pildora, paddingHorizontal: ESPACIO.l, paddingVertical: ESPACIO.xs },
  titulo: { fontSize: 13, lineHeight: 18 },
});
