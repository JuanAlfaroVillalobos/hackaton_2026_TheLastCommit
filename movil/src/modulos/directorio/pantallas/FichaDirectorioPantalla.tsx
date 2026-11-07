import {
  View,
  Text,
  Linking,
  Button
} from "react-native";

export default function FichaDirectorioPantalla() {
  const telefono = "999999999";

  return (
    <View style={{ padding: 20 }}>
      <Text>Gasfitero Juan</Text>

      <Button
        title="Llamar"
        onPress={() =>
          Linking.openURL(
            `tel:${telefono}`
          )
        }
      />

      <Button
        title="WhatsApp"
        onPress={() =>
          Linking.openURL(
            `https://wa.me/51${telefono}`
          )
        }
      />
    </View>
  );
}