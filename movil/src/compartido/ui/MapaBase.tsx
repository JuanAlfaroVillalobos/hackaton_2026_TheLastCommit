// Ruta: src/compartido/ui/MapaBase.tsx
// Mapa reutilizable (react-native-maps + Google Maps). Sin lógica de negocio.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from "react-native-maps";

export type MarcadorMapa = {
  id: string;
  lat: number;
  lng: number;
  titulo: string;
  descripcion?: string;
  /** Color del pin (hex). Por defecto, rojo de emergencia. */
  color?: string;
  /** Si se indica, el pin se dibuja como un círculo con este icono (emoji o texto corto). */
  icono?: string;
  /** Texto corto bajo el pin (p. ej. el nombre). Solo con `icono`. */
  etiqueta?: string;
};

type Props = {
  centro: { lat: number; lng: number };
  /** Zoom: tamaño del área visible en grados (0.01 ≈ 1 km). */
  delta?: number;
  marcadores?: MarcadorMapa[];
  onMarcadorPress?: (id: string) => void;
  /** Se llama con la coordenada donde el vecino toca el mapa (p. ej. para mover un pin). */
  onMapaPress?: (coordenada: { lat: number; lng: number }) => void;
  /** Estilo oscuro del mapa (tema lluvia). Lo decide el tema, no este componente. */
  oscuro?: boolean;
  estilo?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

const ESTILO_OSCURO = [
  { elementType: "geometry", stylers: [{ color: "#172A45" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9FB3CC" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0F1B2D" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2A3F5F" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0F1B2D" }] },
];

function PinMarcador({ m, onPress }: { m: MarcadorMapa; onPress?: (id: string) => void }) {
  const color = m.color ?? "#C62828";
  // El mapa convierte la vista en imagen: se deja «rastrear» un instante y luego se apaga (rinde mejor).
  const [rastrear, setRastrear] = useState(true);
  useEffect(() => {
    setRastrear(true);
    const t = setTimeout(() => setRastrear(false), 600);
    return () => clearTimeout(t);
  }, [m.icono, m.etiqueta, m.color]);

  if (!m.icono) {
    return (
      <Marker
        coordinate={{ latitude: m.lat, longitude: m.lng }}
        title={m.titulo}
        description={m.descripcion}
        pinColor={color}
        onPress={() => onPress?.(m.id)}
      />
    );
  }

  return (
    <Marker
      coordinate={{ latitude: m.lat, longitude: m.lng }}
      title={m.titulo}
      description={m.descripcion}
      onPress={() => onPress?.(m.id)}
      tracksViewChanges={rastrear}
      anchor={{ x: 0.5, y: 0.33 }}
    >
      <View style={styles.pinContenedor}>
        <View style={[styles.pinCirculo, { backgroundColor: color }]}>
          <Text style={styles.pinIcono}>{m.icono}</Text>
        </View>
        {m.etiqueta ? (
          <View style={styles.pinEtiqueta}>
            <Text style={styles.pinEtiquetaTexto} numberOfLines={1}>
              {m.etiqueta}
            </Text>
          </View>
        ) : null}
      </View>
    </Marker>
  );
}

export function MapaBase({
  centro,
  delta = 0.01,
  marcadores = [],
  onMarcadorPress,
  onMapaPress,
  oscuro = false,
  estilo,
  children,
}: Props) {
  const region: Region = useMemo(
    () => ({
      latitude: centro.lat,
      longitude: centro.lng,
      latitudeDelta: delta,
      longitudeDelta: delta,
    }),
    [centro.lat, centro.lng, delta],
  );

  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={[styles.mapa, estilo]}
      initialRegion={region}
      customMapStyle={oscuro ? ESTILO_OSCURO : undefined}
      showsUserLocation
      toolbarEnabled={false}
      onPress={
        onMapaPress
          ? (e) =>
              onMapaPress({
                lat: e.nativeEvent.coordinate.latitude,
                lng: e.nativeEvent.coordinate.longitude,
              })
          : undefined
      }
    >
      {marcadores.map((m) => (
        <PinMarcador key={m.id} m={m} onPress={onMarcadorPress} />
      ))}
      {children}
    </MapView>
  );
}

const styles = StyleSheet.create({
  mapa: { flex: 1 },
  pinContenedor: { alignItems: "center", minWidth: 64 },
  pinCirculo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  pinIcono: { fontSize: 20 },
  pinEtiqueta: {
    marginTop: 3,
    maxWidth: 90,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: "rgba(20,11,11,0.85)",
  },
  pinEtiquetaTexto: { color: "#FFF1F1", fontSize: 11, fontWeight: "700" },
});