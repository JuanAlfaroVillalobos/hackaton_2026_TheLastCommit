// Ruta: src/app/index.tsx  (TEMPORAL, solo para probar; NO lo subas a Git)
import { Link } from "expo-router";
import { View } from "react-native";

export default function Inicio() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Link href="/emergencia">Probar mapa de emergencia</Link>
    </View>
  );
}