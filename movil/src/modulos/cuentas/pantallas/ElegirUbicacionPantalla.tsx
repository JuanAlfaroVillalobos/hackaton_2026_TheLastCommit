import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from '@/compartido/tema';
import { Boton } from '@/compartido/ui';
import { MapaBase } from '@/compartido/ui/MapaBase';
import type { Coordenada } from '@/compartido/utilidades/geo';
import { usePerfil } from '@/nucleo/sesion';
import { leerPinInicial, resolverPinManual } from '@/nucleo/ubicacion';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CajaAviso } from '../componentes/CajaAviso';
import { Titular } from '../componentes/Titular';
import { volver } from '@/nucleo/navegacion';

/** Plaza de Armas de Trujillo: centro por defecto si no hay ninguna referencia. */
const CENTRO_POR_DEFECTO: Coordenada = { lat: -8.1116, lng: -79.0288 };

/**
 * @description Elegir la ubicación a mano en el mapa (RF42, RF08): se abre desde useUbicacionValidada() cuando el GPS falla o no hay permiso.
 */
export default function ElegirUbicacionPantalla() {
  const { colores, oscuro } = useTema();
  const perfil = usePerfil();
  const [inicial] = useState<Coordenada>(() => leerPinInicial() ?? perfil?.ubicacion ?? CENTRO_POR_DEFECTO);
  const [pin, setPin] = useState<Coordenada>(inicial);
  const resuelto = useRef(false);

  // Si el vecino sale con el botón Atrás, quien pidió la ubicación recibe null.
  useEffect(
    () => () => {
      if (!resuelto.current) resolverPinManual(null);
    },
    [],
  );

  const terminar = (coordenada: Coordenada | null) => {
    resuelto.current = true;
    resolverPinManual(coordenada);
    volver();
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.raiz, { backgroundColor: colores.fondo }]}>
      <View style={styles.cabecera}>
        <Titular
          conVolver
          etiqueta="Tu ubicación"
          titulo="Marca dónde estás."
          subtitulo="Toca el mapa para mover el pin a tu casa o a tu zona."
        />
      </View>

      <MapaBase
        centro={inicial}
        delta={0.008}
        oscuro={oscuro}
        onMapaPress={setPin}
        marcadores={[{ id: 'pin', lat: pin.lat, lng: pin.lng, titulo: 'Tu ubicación', color: colores.primario }]}
        estilo={styles.mapa}
      />

      <View style={styles.pie}>
        <Text style={[TIPO.pequeno, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
        </Text>
        <CajaAviso
          tono="neutro"
          icono="info"
          titulo="Solo tus vecinos cercanos"
          texto="Mostramos tu zona aproximada (unos 150 m), nunca tu dirección exacta."
        />
        <Boton texto="Usar esta ubicación" icono="location_on" onPress={() => terminar(pin)} />
        <Boton texto="Cancelar" variante="secundario" onPress={() => terminar(null)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  cabecera: { paddingHorizontal: ESPACIO.l, paddingBottom: ESPACIO.m },
  mapa: { flex: 1 },
  pie: { padding: ESPACIO.l, gap: ESPACIO.m },
});
