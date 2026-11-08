// Ruta: src/modulos/ayuda-humanitaria/componentes/FotoReporte.tsx
// Foto de un reporte: se pide al servidor cuando la tarjeta aparece en pantalla.
import { useEffect, useState } from "react";
import { Image, StyleSheet } from "react-native";
import { obtenerFotoReporte } from "../servicios/fotoServicio";

export function FotoReporte({ reporteId }: { reporteId: string }) {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    obtenerFotoReporte(reporteId).then((u) => {
      if (activo) setUri(u);
    });
    return () => {
      activo = false;
    };
  }, [reporteId]);

  if (!uri) return null;
  return <Image source={{ uri }} style={estilos.foto} accessibilityLabel="Foto del reporte" resizeMode="cover" />;
}

const estilos = StyleSheet.create({
  foto: { width: "100%", height: 160, borderRadius: 10, marginTop: 8 },
});