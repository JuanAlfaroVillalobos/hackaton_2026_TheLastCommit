import { ESPACIO, MAX_ESCALA_FUENTE, RADIO, TIPO, useTema } from '@/compartido/tema';
import { Icono, type NombreIcono } from '@/compartido/ui';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  titulo: string;
  texto: string;
  icono?: NombreIcono;
  /** `exito` (verde, privacidad), `marca` (naranja suave) o `neutro` (gris). */
  tono?: 'exito' | 'marca' | 'neutro';
};

/**
 * @description Caja informativa con ícono, como «Tu información, con cuidado» del diseño de Mi perfil.
 */
export function CajaAviso({ titulo, texto, icono = 'info', tono = 'exito' }: Props) {
  const { colores, oscuro } = useTema();

  const paleta = {
    exito: { fondo: colores.exitoFondo, acento: colores.exito },
    marca: { fondo: colores.primarioSuave, acento: oscuro ? colores.texto : colores.primarioOscuro },
    neutro: { fondo: colores.superficieAlterna, acento: colores.textoSecundario },
  }[tono];

  return (
    <View accessible style={[styles.caja, { backgroundColor: paleta.fondo }]}>
      <Icono nombre={icono} color={paleta.acento} tamano={22} />
      <View style={styles.textos}>
        <Text style={[styles.titulo, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          {titulo}
        </Text>
        <Text style={[styles.texto, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          {texto}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { flexDirection: 'row', gap: ESPACIO.m, padding: ESPACIO.l, borderRadius: RADIO.boton },
  textos: { flex: 1, gap: 2 },
  titulo: TIPO.cuerpoFuerte,
  texto: TIPO.pequeno,
});
