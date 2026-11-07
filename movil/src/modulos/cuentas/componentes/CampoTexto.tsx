import { ESPACIO, MAX_ESCALA_FUENTE, RADIO, TACTIL_MIN, TIPO, useTema } from '@/compartido/tema';
import { Icono, type NombreIcono } from '@/compartido/ui';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

type Props = {
  etiqueta: string;
  valor: string;
  onCambiar: (texto: string) => void;
  icono?: NombreIcono;
  /** Texto fijo antes del valor, p. ej. «+51». */
  prefijo?: string;
  ayuda?: string;
  error?: string;
  clave?: boolean;
} & Pick<TextInputProps, 'placeholder' | 'keyboardType' | 'autoComplete' | 'autoCapitalize' | 'maxLength' | 'textContentType'>;

/**
 * @description Campo de texto con etiqueta, ícono, ayuda y error, siguiendo los formularios del diseño del equipo.
 */
export function CampoTexto({ etiqueta, valor, onCambiar, icono, prefijo, ayuda, error, clave = false, ...resto }: Props) {
  const { colores } = useTema();
  const [enfocado, setEnfocado] = useState(false);
  const [visible, setVisible] = useState(false);

  const colorBorde = error ? colores.sos : enfocado ? colores.primario : colores.borde;

  return (
    <View style={styles.raiz}>
      <Text style={[styles.etiqueta, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
        {etiqueta}
      </Text>
      <View style={[styles.caja, { backgroundColor: colores.superficie, borderColor: colorBorde }]}>
        {icono ? <Icono nombre={icono} color={colores.textoSecundario} tamano={22} /> : null}
        {prefijo ? (
          <Text style={[styles.prefijo, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            {prefijo}
          </Text>
        ) : null}
        <TextInput
          accessibilityLabel={etiqueta}
          accessibilityHint={error ?? ayuda}
          value={valor}
          onChangeText={onCambiar}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          secureTextEntry={clave && !visible}
          placeholderTextColor={colores.textoSecundario}
          selectionColor={colores.primario}
          style={[styles.entrada, { color: colores.texto }]}
          maxFontSizeMultiplier={MAX_ESCALA_FUENTE}
          {...resto}
        />
        {clave ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar clave' : 'Mostrar clave'}
            onPress={() => setVisible((v) => !v)}
            hitSlop={12}
          >
            <Icono nombre={visible ? 'visibility_off' : 'visibility'} color={colores.textoSecundario} tamano={22} />
          </Pressable>
        ) : null}
      </View>
      {error || ayuda ? (
        <Text
          style={[styles.ayuda, { color: error ? colores.sos : colores.textoSecundario }]}
          maxFontSizeMultiplier={MAX_ESCALA_FUENTE}
        >
          {error ?? ayuda}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: ESPACIO.s },
  etiqueta: TIPO.cuerpoFuerte,
  caja: {
    minHeight: TACTIL_MIN + 4,
    borderWidth: 1.5,
    borderRadius: RADIO.boton,
    paddingHorizontal: ESPACIO.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIO.s,
  },
  prefijo: TIPO.cuerpoFuerte,
  entrada: { ...TIPO.cuerpo, flex: 1, paddingVertical: ESPACIO.m },
  ayuda: TIPO.pequeno,
});
