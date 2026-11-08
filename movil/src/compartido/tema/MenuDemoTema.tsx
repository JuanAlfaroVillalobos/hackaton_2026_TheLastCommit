// Ruta: src/compartido/tema/MenuDemoTema.tsx
// Menú oculto de demo (B6, RF29): se abre manteniendo pulsado el título «Vecinos» del encabezado.
// Permite forzar lluvia, calor o normal para mostrarlo en el pitch sin esperar al clima real.
// El modo emergencia siempre tiene prioridad sobre lo que se elija aquí.
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTema, useTemaStore, type TemaSinEmergencia } from "./ProveedorTema";
import { ESPACIO, MAX_ESCALA_FUENTE, RADIO, TACTIL_MIN, TIPO } from "./temas";

type Opcion = { valor: TemaSinEmergencia | null; texto: string };

const OPCIONES: Opcion[] = [
  { valor: null, texto: "Automático (clima real)" },
  { valor: "lluvia", texto: "Lluvia" },
  { valor: "calor", texto: "Calor" },
  { valor: "normal", texto: "Normal" },
];

type Props = { visible: boolean; onCerrar: () => void };

export function MenuDemoTema({ visible, onCerrar }: Props) {
  const { colores } = useTema();
  const forzado = useTemaStore((s) => s.temaForzado);
  const clima = useTemaStore((s) => s.temaClima);
  const setTemaForzado = useTemaStore((s) => s.setTemaForzado);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <Pressable style={styles.fondo} onPress={onCerrar} accessibilityLabel="Cerrar menú de demo">
        <Pressable
          style={[styles.hoja, { backgroundColor: colores.superficie, borderColor: colores.borde }]}
          onPress={() => {}}
        >
          <Text style={[styles.titulo, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            Demo de tema
          </Text>
          <Text style={[styles.detalle, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            Clima real de la zona: {clima ?? "sin datos"}
          </Text>
          {OPCIONES.map((op) => {
            const activa = forzado === op.valor;
            return (
              <Pressable
                key={op.texto}
                accessibilityRole="button"
                accessibilityState={{ selected: activa }}
                onPress={() => {
                  setTemaForzado(op.valor);
                  onCerrar();
                }}
                style={[
                  styles.opcion,
                  { borderColor: activa ? colores.primario : colores.borde, backgroundColor: activa ? colores.primarioSuave : colores.superficie },
                ]}
              >
                <Text style={[styles.textoOpcion, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
                  {activa ? "✓  " : ""}
                  {op.texto}
                </Text>
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: ESPACIO.xl },
  hoja: { borderRadius: RADIO.tarjeta, borderWidth: 1, padding: ESPACIO.l, gap: ESPACIO.s },
  titulo: TIPO.seccion,
  detalle: { ...TIPO.pequeno, marginBottom: ESPACIO.s },
  opcion: {
    minHeight: TACTIL_MIN,
    borderRadius: RADIO.boton,
    borderWidth: 1.5,
    paddingHorizontal: ESPACIO.l,
    justifyContent: "center",
  },
  textoOpcion: TIPO.cuerpo,
});