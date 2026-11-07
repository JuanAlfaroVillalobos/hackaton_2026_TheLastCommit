import { useEffect, useState } from "react";
import { FlatList, View, Text } from "react-native";

import { listarDirectorio } from "../servicios/directorioServicio";
import type { ServicioDirectorio } from "../tipos";

export default function DirectorioPantalla() {
  const [datos, setDatos] = useState<ServicioDirectorio[]>([]);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    const respuesta = await listarDirectorio();
    setDatos(respuesta);
  }

  return (
    <FlatList
      data={datos}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View>
          <Text>{item.titulo}</Text>
          <Text>👍 {item.vistosBuenos}</Text>
        </View>
      )}
    />
  );
}