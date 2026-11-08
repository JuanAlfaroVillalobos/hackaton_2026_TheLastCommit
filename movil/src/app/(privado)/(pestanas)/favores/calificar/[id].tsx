import { CalificarPantalla } from "@/modulos/favores/pantallas/CalificarPantalla";
import { useLocalSearchParams } from "expo-router";

export default function CalificarFavorRuta() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CalificarPantalla id={id} />;
}
