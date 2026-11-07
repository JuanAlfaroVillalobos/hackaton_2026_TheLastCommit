// Ruta: src/compartido/ui/MapaBase.web.tsx
// Versión web de MapaBase. react-native-maps no funciona en web y Expo Router carga todas las rutas
// al arrancar, así que sin este archivo la app web se cae aunque no se abra ningún mapa.
// Metro elige este archivo solo en web; Android sigue usando MapaBase.tsx. Mismas props y tipos.
import type { ReactNode } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

export type MarcadorMapa = {
  id: string;
  lat: number;
  lng: number;
  titulo: string;
  descripcion?: string;
  color?: string;
  icono?: string;
  etiqueta?: string;
};

type Props = {
  centro: { lat: number; lng: number };
  delta?: number;
  marcadores?: MarcadorMapa[];
  onMarcadorPress?: (id: string) => void;
  onMapaPress?: (coordenada: { lat: number; lng: number }) => void;
  oscuro?: boolean;
  estilo?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export function MapaBase({ marcadores = [], estilo, children }: Props) {
  return (
    <View style={[styles.raiz, estilo]}>
      <Text style={styles.texto}>El mapa solo está disponible en la app Android.</Text>
      {marcadores.length > 0 ? <Text style={styles.texto}>{marcadores.length} marcadores</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, minHeight: 200, alignItems: "center", justifyContent: "center", backgroundColor: "#E7E5E4", gap: 4 },
  texto: { color: "#57534E", fontSize: 14 },
});
