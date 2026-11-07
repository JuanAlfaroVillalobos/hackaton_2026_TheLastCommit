import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from '@/compartido/tema';
import { Boton, Icono, Tarjeta, type NombreIcono } from '@/compartido/ui';
import { Pantalla, Titular } from '@/modulos/cuentas';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

const PILARES: { icono: NombreIcono; titulo: string; texto: string }[] = [
  { icono: 'build', titulo: 'Servicios cerca de ti', texto: 'Oficios y productos con el Visto Bueno de tus vecinos.' },
  { icono: 'handshake', titulo: 'Cadena de favores', texto: 'Presta, dona o da una mano, sin dinero de por medio.' },
  { icono: 'shield', titulo: 'Apoyo en emergencias', texto: 'Coordina ayuda con tu zona, incluso sin internet.' },
];

/**
 * @description Bienvenida (P20, RF37): presenta los tres pilares de la app; el tutorial de 4 pasos llega en A8.
 */
export default function BienvenidaPantalla() {
  const { colores } = useTema();

  return (
    <Pantalla centrado>
      <View style={[styles.logo, { backgroundColor: colores.primarioSuave }]}>
        <Icono nombre="home" color={colores.primario} tamano={56} />
      </View>

      <Titular
        etiqueta="Bienvenido a Vecinos"
        titulo="Tu barrio, más cerca."
        subtitulo="Pide y ofrece ayuda entre vecinos, y mantente a salvo cuando más importa."
      />

      <View style={styles.lista}>
        {PILARES.map((p) => (
          <Tarjeta key={p.titulo}>
            <View style={styles.fila}>
              <View style={[styles.icono, { backgroundColor: colores.primarioSuave }]}>
                <Icono nombre={p.icono} color={colores.primario} tamano={24} />
              </View>
              <View style={styles.textos}>
                <Text style={[TIPO.cuerpoFuerte, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
                  {p.titulo}
                </Text>
                <Text style={[TIPO.pequeno, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
                  {p.texto}
                </Text>
              </View>
            </View>
          </Tarjeta>
        ))}
      </View>

      <View style={styles.acciones}>
        <Boton texto="Crear mi cuenta" icono="arrow_forward" onPress={() => router.push('/registro')} />
        <Boton texto="Ya tengo cuenta" variante="secundario" onPress={() => router.push('/ingresar')} />
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  logo: { width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  lista: { gap: ESPACIO.m },
  fila: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.m },
  icono: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1, gap: 2 },
  acciones: { gap: ESPACIO.m, marginTop: ESPACIO.s },
});
