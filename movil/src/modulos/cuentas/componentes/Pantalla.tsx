import { ESPACIO, useTema } from '@/compartido/tema';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  /** Centra el contenido en vertical (pantallas cortas como la bienvenida). */
  centrado?: boolean;
};

/**
 * @description Contenedor de las pantallas de la persona A: fondo del tema, zona segura, scroll y teclado.
 */
export function Pantalla({ children, centrado = false }: Props) {
  const { colores } = useTema();

  return (
    <SafeAreaView edges={['top']} style={[styles.raiz, { backgroundColor: colores.fondo }]}>
      <KeyboardAvoidingView style={styles.raiz} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.contenido, centrado ? styles.centrado : null]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { padding: ESPACIO.l, paddingBottom: ESPACIO.xxl, gap: ESPACIO.l },
  centrado: { flexGrow: 1, justifyContent: 'center' },
});
