import { View, Text, TextInput, Button } from "react-native";
import { useState } from "react";

export default function PublicarDirectorioPantalla() {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const publicar = () => {
    console.log("Publicado");
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Título</Text>

      <TextInput
        value={titulo}
        onChangeText={setTitulo}
      />

      <Text>Descripción</Text>

      <TextInput
        value={descripcion}
        onChangeText={setDescripcion}
      />

      <Button
        title="Publicar"
        onPress={publicar}
      />
    </View>
  );
}