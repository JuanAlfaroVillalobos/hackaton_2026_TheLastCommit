// Ruta: src/compartido/ui/Icono.tsx
// Icono de línea (Material Symbols vía expo-symbols, sin dependencias nativas nuevas).
// Decorativo por defecto: el texto o el accessibilityLabel del contenedor lleva la información.
import { SymbolView, type AndroidSymbol } from "expo-symbols";
import type { StyleProp, ViewStyle } from "react-native";

export type NombreIcono = AndroidSymbol;

type Props = {
  nombre: NombreIcono;
  color: string;
  tamano?: number;
  style?: StyleProp<ViewStyle>;
};

export function Icono({ nombre, color, tamano = 24, style }: Props) {
  return (
    <SymbolView
      name={{ android: nombre, web: nombre }}
      tintColor={color}
      size={tamano}
      style={style}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    />
  );
}
