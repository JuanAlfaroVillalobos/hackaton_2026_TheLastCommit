import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from '@/compartido/tema';
import { Boton, Icono, Tarjeta } from '@/compartido/ui';
import { CajaAviso, Pantalla, Titular } from '@/modulos/cuentas';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { SECCIONES_GUIA, textoParaLeer, type SeccionGuia } from '../contenido';
import { detenerVoz, leerEnVozAlta, vozDisponible } from '../servicios/voz';

/**
 * @description Una sección de la guía que se abre al tocarla, con sus pasos numerados y el botón «Escuchar».
 */
function Seccion({
  s,
  abierta,
  leyendo,
  onAlternar,
  onEscuchar,
}: {
  s: SeccionGuia;
  abierta: boolean;
  leyendo: boolean;
  onAlternar: () => void;
  onEscuchar: () => void;
}) {
  const { colores } = useTema();

  return (
    <Tarjeta onPress={onAlternar} accessibilityLabel={`${s.titulo}. ${abierta ? 'Toca para cerrar' : 'Toca para abrir'}`}>
      <View style={styles.cabecera}>
        <View style={[styles.icono, { backgroundColor: colores.primarioSuave }]}>
          <Icono nombre={s.icono} color={colores.primario} tamano={24} />
        </View>
        <Text style={[TIPO.cuerpoFuerte, styles.flex, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          {s.titulo}
        </Text>
        <Icono nombre={abierta ? 'expand_less' : 'expand_more'} color={colores.textoSecundario} tamano={24} />
      </View>

      {abierta ? (
        <View style={styles.cuerpo}>
          {s.pasos.map((paso, i) => (
            <View key={paso} style={styles.paso}>
              <View style={[styles.numero, { backgroundColor: colores.primario }]}>
                <Text style={[TIPO.chip, { color: colores.sobrePrimario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
                  {i + 1}
                </Text>
              </View>
              <Text style={[TIPO.cuerpo, styles.flex, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
                {paso}
              </Text>
            </View>
          ))}
          {vozDisponible() ? (
            <Boton
              texto={leyendo ? 'Detener lectura' : 'Escuchar'}
              icono={leyendo ? 'stop_circle' : 'volume_up'}
              variante="secundario"
              onPress={onEscuchar}
            />
          ) : null}
        </View>
      ) : null}
    </Tarjeta>
  );
}

/**
 * @description Guía de ayuda (P20, RF37): pasos de lectura fácil por tema, sin conexión, con lectura en voz alta.
 */
export default function GuiaPantalla() {
  const [abierta, setAbierta] = useState<string | null>(SECCIONES_GUIA[0].id);
  const [leyendo, setLeyendo] = useState<string | null>(null);

  // Al salir de la pantalla, deja de leer.
  useFocusEffect(useCallback(() => () => detenerVoz(), []));

  const alternar = (id: string) => {
    if (leyendo) {
      detenerVoz();
      setLeyendo(null);
    }
    setAbierta((a) => (a === id ? null : id));
  };

  const escuchar = (s: SeccionGuia) => {
    if (leyendo === s.id) {
      detenerVoz();
      setLeyendo(null);
      return;
    }
    setLeyendo(s.id);
    leerEnVozAlta(textoParaLeer(s), () => setLeyendo((actual) => (actual === s.id ? null : actual)));
  };

  return (
    <Pantalla>
      <Titular conVolver etiqueta="Guía de ayuda" titulo="¿Cómo te ayudamos?" subtitulo="Toca un tema para ver los pasos. Funciona sin internet." />

      {SECCIONES_GUIA.map((s) => (
        <Seccion
          key={s.id}
          s={s}
          abierta={abierta === s.id}
          leyendo={leyendo === s.id}
          onAlternar={() => alternar(s.id)}
          onEscuchar={() => escuchar(s)}
        />
      ))}

      {!vozDisponible() ? (
        <CajaAviso
          tono="neutro"
          icono="volume_off"
          titulo="Lectura en voz alta"
          texto="Esta versión de la app aún no puede leer en voz alta. Llegará en la próxima actualización."
        />
      ) : null}

      <View style={styles.acciones}>
        <Boton texto="Ver el tutorial de nuevo" icono="school" variante="secundario" onPress={() => router.push('/tutorial-repaso')} />
        <Boton texto="Llamar a emergencias (105)" icono="call" variante="enlace" onPress={() => void Linking.openURL('tel:105')} />
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.m },
  icono: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  cuerpo: { gap: ESPACIO.m, marginTop: ESPACIO.l },
  paso: { flexDirection: 'row', alignItems: 'flex-start', gap: ESPACIO.m },
  numero: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  acciones: { gap: ESPACIO.s },
});
