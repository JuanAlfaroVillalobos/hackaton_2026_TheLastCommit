import { DetallePublicacionPantalla } from "@/modulos/favores/pantallas/DetallePublicacionPantalla";
import { useLocalSearchParams } from "expo-router";

export default function DetalleFavorRuta() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DetallePublicacionPantalla id={id} />;
}
