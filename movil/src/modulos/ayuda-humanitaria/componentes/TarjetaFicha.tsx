// Ruta: src/modulos/ayuda-humanitaria/componentes/TarjetaFicha.tsx
import type { Colores } from "../estilos";
import { useTema } from "@/compartido/tema";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ETIQUETA_TIPO_FICHA, ICONO_TIPO_FICHA } from "../constantesDirectorio";
import type { FichaDirectorio } from "../tipos";

type Props = {
  ficha: FichaDirectorio;
  onLlamar: (telefono: string) => void;
  onWhatsApp: (numero: string) => void;
};

export function TarjetaFicha({ ficha: f, onLlamar, onWhatsApp }: Props) {
  const { colores: T } = useTema();
  const styles = useMemo(() => crearEstilos(T), [T]);
  return (
    <View style={styles.tarjeta}>
      <View style={styles.cabecera}>
        <Text style={styles.icono}>{ICONO_TIPO_FICHA[f.tipo]}</Text>
        <View style={styles.cabeceraTexto}>
          <Text style={styles.titulo}>{f.nombre}</Text>
          <Text style={styles.detalle}>{ETIQUETA_TIPO_FICHA[f.tipo]}</Text>
        </View>
        {!f.aprobado ? (
          <View style={styles.pendiente}>
            <Text style={styles.pendienteTexto}>Pendiente</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.dato}>📍 {f.direccion}</Text>
      <Text style={styles.dato}>🕒 {f.horario}</Text>
      <Text style={styles.dato}>📞 {f.telefono}</Text>

      <View style={styles.acciones}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Llamar a ${f.nombre}`}
          style={[styles.accion, styles.accionLlamar]}
          onPress={() => onLlamar(f.telefono)}
        >
          <Text style={styles.accionTextoLlamar}>Llamar</Text>
        </Pressable>
        {f.whatsapp ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Abrir WhatsApp de ${f.nombre}`}
            style={[styles.accion, styles.accionWhatsApp]}
            onPress={() => onWhatsApp(f.whatsapp as string)}
          >
            <Text style={styles.accionTextoWhatsApp}>WhatsApp</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const crearEstilos = (T: Colores) =>
  StyleSheet.create({
  tarjeta: {
    backgroundColor: T.superficie,
    borderColor: T.borde,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cabecera: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  icono: { fontSize: 28, marginRight: 10 },
  cabeceraTexto: { flex: 1 },
  titulo: { color: T.texto, fontSize: 15, fontWeight: "700" },
  detalle: { color: T.textoSecundario, fontSize: 12, marginTop: 2 },
  pendiente: { borderColor: T.primario, borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  pendienteTexto: { color: T.primario, fontSize: 11, fontWeight: "800" },
  dato: { color: T.texto, fontSize: 14, marginTop: 4 },
  acciones: { flexDirection: "row", marginTop: 12 },
  accion: { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: "center", marginRight: 8 },
  accionLlamar: { backgroundColor: T.primario },
  accionTextoLlamar: { color: T.sobrePrimario, fontSize: 15, fontWeight: "800" },
  accionWhatsApp: { borderColor: T.exito, borderWidth: 1.5 },
  accionTextoWhatsApp: { color: T.exito, fontSize: 15, fontWeight: "800" },
});
