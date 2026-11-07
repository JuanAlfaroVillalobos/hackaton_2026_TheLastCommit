import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Accion {
  texto: string;
  onPress: () => void;
  secundaria?: boolean;
}

interface Props {
  titulo: string;
  codigo: string;
  acciones?: Accion[];
  children?: ReactNode;
}

/**
 * @description Pantalla provisional de F0 para los módulos de la persona A; se reemplaza al usar el kit de UI de Jamila.
 */
export default function EsqueletoPantalla({ titulo, codigo, acciones = [], children }: Props) {
  return (
    <SafeAreaView style={estilos.contenedor}>
      <View style={estilos.centro}>
        <Text style={estilos.codigo}>{codigo}</Text>
        <Text style={estilos.titulo}>{titulo}</Text>
        {children}
        <View style={estilos.acciones}>
          {acciones.map((accion) => (
            <Pressable
              key={accion.texto}
              accessibilityRole="button"
              accessibilityLabel={accion.texto}
              onPress={accion.onPress}
              style={({ pressed }) => [
                estilos.boton,
                accion.secundaria && estilos.botonSecundario,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={[estilos.textoBoton, accion.secundaria && estilos.textoSecundario]}>
                {accion.texto}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#FAFAF9' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  codigo: { fontSize: 14, fontWeight: '600', color: '#C2410C' },
  titulo: { fontSize: 24, fontWeight: '700', color: '#1C1917', textAlign: 'center' },
  acciones: { marginTop: 24, gap: 12, alignSelf: 'stretch' },
  boton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#C2410C',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  botonSecundario: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7E5E4' },
  textoBoton: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  textoSecundario: { color: '#1C1917' },
});
