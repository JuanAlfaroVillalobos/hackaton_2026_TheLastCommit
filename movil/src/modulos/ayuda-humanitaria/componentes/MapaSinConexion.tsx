// Ruta: src/modulos/ayuda-humanitaria/componentes/MapaSinConexion.tsx
// Cuadro que reemplaza al mapa cuando no hay internet (los mosaicos del mapa necesitan conexión).
import { useTema } from "@/compartido/tema";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Colores } from "../estilos";
import type { Coordenada } from "../tipos";

type Props = {
  /** Ubicación que se usará, si se conoce. */
  ubicacion?: Coordenada | null;
  /** Línea extra bajo el título (por ejemplo, qué se puede hacer sin mapa). */
  detalle?: string;
};

export function MapaSinConexion({ ubicacion, detalle }: Props) {
  const { colores: T } = useTema();
  const styles = useMemo(() => crearEstilos(T), [T]);
  return (
    <View style={styles.caja} accessibilityLabel="Mapa sin conexión">
      <Text style={styles.icono}>🗺️</Text>
      <Text style={styles.titulo}>Mapa sin conexión</Text>
      <Text style={styles.texto}>{detalle ?? "El mapa necesita internet. Mientras tanto la app sigue funcionando."}</Text>
      {ubicacion ? (
        <Text style={styles.coords}>
          📍 {ubicacion.lat.toFixed(4)}, {ubicacion.lng.toFixed(4)}
        </Text>
      ) : null}
    </View>
  );
}

const crearEstilos = (T: Colores) =>
  StyleSheet.create({
    caja: {
      flex: 1,
      minHeight: 140,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      padding: 16,
      backgroundColor: T.superficieAlterna,
    },
    icono: { fontSize: 36 },
    titulo: { color: T.texto, fontSize: 16, fontWeight: "800" },
    texto: { color: T.textoSecundario, fontSize: 13, textAlign: "center" },
    coords: { color: T.texto, fontSize: 13, fontWeight: "700", marginTop: 6 },
  });