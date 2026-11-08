import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from '@/compartido/tema';
import { Boton, Icono } from '@/compartido/ui';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PASOS_TUTORIAL, type PasoTutorial } from '../contenido';
import { marcarTutorialVisto } from '../servicios/tutorial';

/** Posiciones de los íconos pequeños alrededor del principal (ilustración). */
const ORBITA = [
  { top: 0, left: 8 },
  { top: 24, right: 0 },
  { bottom: 4, left: 28 },
] as const;

/**
 * @description Ilustración del paso: un ícono grande en un círculo con tres íconos pequeños alrededor.
 */
function Ilustracion({ paso }: { paso: PasoTutorial }) {
  const { colores } = useTema();
  return (
    <View style={styles.ilustracion} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.halo, { backgroundColor: colores.primarioSuave }]} />
      <View style={[styles.circuloGrande, { backgroundColor: colores.primario }]}>
        <Icono nombre={paso.icono} color={colores.sobrePrimario} tamano={72} />
      </View>
      {paso.acompanantes.map((icono, i) => (
        <View key={icono} style={[styles.circuloChico, ORBITA[i], { backgroundColor: colores.superficie, borderColor: colores.borde }]}>
          <Icono nombre={icono} color={colores.primario} tamano={26} />
        </View>
      ))}
    </View>
  );
}

/**
 * @description Tutorial de 4 pasos al instalar (P20, RF37), con «Saltar». Al terminar no vuelve a mostrarse; en modo repaso (desde la guía) solo vuelve atrás.
 */
export default function TutorialPantalla({ repaso = false }: { repaso?: boolean }) {
  const { colores } = useTema();
  const { width } = useWindowDimensions();
  const lista = useRef<FlatList<PasoTutorial>>(null);
  const [indice, setIndice] = useState(0);
  const ultimo = indice === PASOS_TUTORIAL.length - 1;

  const terminar = async () => {
    if (repaso) return router.back();
    await marcarTutorialVisto();
    router.replace('/bienvenida');
  };

  const siguiente = () => {
    if (ultimo) return void terminar();
    lista.current?.scrollToIndex({ index: indice + 1, animated: true });
  };

  const alDeslizar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndice(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <SafeAreaView style={[styles.raiz, { backgroundColor: colores.fondo }]}>
      <View style={styles.barra}>
        <Text style={[TIPO.chip, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          {indice + 1} de {PASOS_TUTORIAL.length}
        </Text>
        {!ultimo ? <Boton texto="Saltar" variante="enlace" onPress={() => void terminar()} /> : <View />}
      </View>

      <FlatList
        ref={lista}
        data={PASOS_TUTORIAL}
        keyExtractor={(p) => p.titulo}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={alDeslizar}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={[styles.pagina, { width }]} accessible accessibilityLabel={`${item.titulo}. ${item.texto}`}>
            <Ilustracion paso={item} />
            <Text style={[TIPO.titulo, styles.centro, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
              {item.titulo}
            </Text>
            <Text style={[TIPO.cuerpo, styles.centro, styles.texto, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
              {item.texto}
            </Text>
          </View>
        )}
      />

      <View style={styles.pie}>
        <View style={styles.puntos} accessibilityLabel={`Paso ${indice + 1} de ${PASOS_TUTORIAL.length}`}>
          {PASOS_TUTORIAL.map((p, i) => (
            <View
              key={p.titulo}
              style={[styles.punto, { width: i === indice ? 24 : 8, backgroundColor: i === indice ? colores.primario : colores.borde }]}
            />
          ))}
        </View>
        <Boton texto={ultimo ? 'Empezar' : 'Siguiente'} icono={ultimo ? 'check' : 'arrow_forward'} onPress={siguiente} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  barra: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ESPACIO.l,
    minHeight: 48,
  },
  pagina: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: ESPACIO.xl, gap: ESPACIO.l },
  ilustracion: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center', marginBottom: ESPACIO.l },
  halo: { position: 'absolute', width: 200, height: 200, borderRadius: 100 },
  circuloGrande: { width: 132, height: 132, borderRadius: 66, alignItems: 'center', justifyContent: 'center' },
  circuloChico: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centro: { textAlign: 'center' },
  texto: { maxWidth: 420 },
  pie: { padding: ESPACIO.l, gap: ESPACIO.l },
  puntos: { flexDirection: 'row', justifyContent: 'center', gap: ESPACIO.s },
  punto: { height: 8, borderRadius: 4 },
});

/**
 * @description El mismo tutorial abierto desde la guía de ayuda, con sesión iniciada.
 */
export function TutorialRepasoPantalla() {
  return <TutorialPantalla repaso />;
}
