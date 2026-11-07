// Ruta: src/compartido/ui/Tarjeta.tsx
// Superficie con borde 1 dp, radio 16 y sombra muy suave (diseño P04).
// Si recibe `onPress`, toda la tarjeta es táctil (área ≥ 48 dp).
import { ESPACIO, RADIO, useTema } from "@/compartido/tema";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

type Props = {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  /** Borde izquierdo de color para destacar (p. ej. «Tu publicación»). */
  destacada?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Tarjeta({ children, onPress, accessibilityLabel, destacada = false, style }: Props) {
  const { colores } = useTema();
  const base: StyleProp<ViewStyle> = [
    styles.tarjeta,
    {
      backgroundColor: colores.superficie,
      borderColor: colores.borde,
      shadowColor: colores.texto,
    },
    destacada ? { borderLeftWidth: 4, borderLeftColor: colores.primario } : null,
    style,
  ];

  if (!onPress) return <View style={base}>{children}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [base, pressed ? styles.presionada : null]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    borderWidth: 1,
    borderRadius: RADIO.tarjeta,
    padding: ESPACIO.l,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  presionada: { opacity: 0.85 },
});
