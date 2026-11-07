import { Button } from "react-native";
import { useState } from "react";

export function BotonVistoBueno() {
  const [voto, setVoto] = useState(false);

  return (
    <Button
      title={
        voto
          ? "Quitar Visto Bueno"
          : "Dar Visto Bueno"
      }
      onPress={() => setVoto(!voto)}
    />
  );
}