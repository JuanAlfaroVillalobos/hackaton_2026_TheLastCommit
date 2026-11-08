// Ruta: src/compartido/ui/Encabezado.tsx
// Encabezado de la app (README, sección 7): casa + «Vecinos» + barrio a la izquierda y, a la derecha,
// lo que pase el layout (el botón «SOS» del módulo emergencia). El icono de clima va junto al nombre,
// no en lugar de la casa (diseño P04, decisión 7), para que el tema no dependa solo del color (RNF03).
// Mantener pulsado el título abre el menú oculto de demo del tema (B6).
import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from "@/compartido/tema";
import { MenuDemoTema } from "@/compartido/tema/MenuDemoTema";
import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icono } from "./Icono";

type Props = {
  barrio: string | null;
  derecha?: ReactNode;
};

const ETIQUETA_CLIMA = { rainy: "Tema de lluvia", thermostat: "Tema de calor", warning: "Modo emergencia" } as const;

export function Encabezado({ barrio, derecha }: Props) {
  const { colores, iconoClima } = useTema();
  const insets = useSafeAreaInsets();
  const [menuDemo, setMenuDemo] = useState(false);

  return (
    <View style={[styles.raiz, { paddingTop: insets.top + ESPACIO.s, backgroundColor: colores.fondo }]}>
      <Pressable
        style={styles.marca}
        onLongPress={() => setMenuDemo(true)}
        delayLongPress={1500}
        accessible
        accessibilityRole="header"
        accessibilityLabel={`Vecinos${barrio ? `, ${barrio}` : ""}`}
      >
        <Icono nombre="home" color={colores.primario} tamano={36} />
        <View style={styles.textos}>
          <View style={styles.fila}>
            <Text style={[styles.nombre, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
              Vecinos
            </Text>
            {iconoClima ? (
              <View accessible accessibilityLabel={ETIQUETA_CLIMA[iconoClima]}>
                <Icono nombre={iconoClima} color={colores.acento} tamano={22} />
              </View>
            ) : null}
          </View>
          {barrio ? (
            <Text
              style={[styles.barrio, { color: colores.textoSecundario }]}
              numberOfLines={1}
              maxFontSizeMultiplier={MAX_ESCALA_FUENTE}
            >
              {barrio}
            </Text>
          ) : null}
        </View>
      </Pressable>
      {derecha}
      <MenuDemoTema visible={menuDemo} onCerrar={() => setMenuDemo(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ESPACIO.l,
    paddingBottom: ESPACIO.s,
    gap: ESPACIO.m,
  },
  marca: { flexDirection: "row", alignItems: "center", gap: ESPACIO.m, flexShrink: 1 },
  textos: { flexShrink: 1 },
  fila: { flexDirection: "row", alignItems: "center", gap: ESPACIO.s },
  nombre: { ...TIPO.seccion, fontSize: 22 },
  barrio: TIPO.pequeno,
});