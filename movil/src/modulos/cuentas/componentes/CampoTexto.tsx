import { ESPACIO, MAX_ESCALA_FUENTE, RADIO, TACTIL_MIN, TIPO, useTema } from '@/compartido/tema';
import { Icono, type NombreIcono } from '@/compartido/ui';
import { useState, type ReactNode, type Ref } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';

type Props = {
  etiqueta: string;
  valor: string;
  onCambiar: (texto: string) => void;
  icono?: NombreIcono;
  /** Texto fijo antes del valor, p. ej. «+51». */
  prefijo?: string;
  ayuda?: string;
  error?: string;
  /** Campo revisado y correcto: borde verde y ✓. Con texto, lo muestra debajo. */
  exito?: boolean | string;
  clave?: boolean;
  /** Al salir del campo (para validar y normalizar). */
  onSalir?: () => void;
  /** Contenido extra debajo del campo (sugerencias, medidor de clave). */
  children?: ReactNode;
  ref?: Ref<TextInputInstance>;
} & Pick<
  TextInputProps,
  | 'placeholder'
  | 'keyboardType'
  | 'autoComplete'
  | 'autoCapitalize'
  | 'autoCorrect'
  | 'maxLength'
  | 'textContentType'
  | 'returnKeyType'
  | 'onSubmitEditing'
  | 'submitBehavior'
  | 'importantForAutofill'
>;

/**
 * @description Campo de texto con etiqueta, ícono, ayuda, error y estado correcto, siguiendo los formularios del diseño del equipo.
 */
export function CampoTexto({
  etiqueta,
  valor,
  onCambiar,
  icono,
  prefijo,
  ayuda,
  error,
  exito,
  clave = false,
  onSalir,
  children,
  ref,
  ...resto
}: Props) {
  const { colores } = useTema();
  const [enfocado, setEnfocado] = useState(false);
  const [visible, setVisible] = useState(false);

  const correcto = !error && Boolean(exito);
  const colorBorde = error ? colores.sos : enfocado ? colores.primario : correcto ? colores.exito : colores.borde;
  const mensajeExito = typeof exito === 'string' ? exito : undefined;

  return (
    <View style={styles.raiz}>
      <Text style={[styles.etiqueta, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
        {etiqueta}
      </Text>
      <View
        style={[
          styles.caja,
          { backgroundColor: error ? colores.sosFondo : colores.superficie, borderColor: colorBorde },
          enfocado || error ? styles.cajaResaltada : null,
        ]}
      >
        {icono ? <Icono nombre={icono} color={error ? colores.sos : colores.textoSecundario} tamano={22} /> : null}
        {prefijo ? (
          <Text style={[styles.prefijo, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            {prefijo}
          </Text>
        ) : null}
        <TextInput
          ref={ref}
          accessibilityLabel={etiqueta}
          accessibilityHint={error ?? mensajeExito ?? ayuda}
          accessibilityState={{ selected: enfocado }}
          aria-invalid={Boolean(error)}
          value={valor}
          onChangeText={onCambiar}
          onFocus={() => setEnfocado(true)}
          onBlur={() => {
            setEnfocado(false);
            onSalir?.();
          }}
          secureTextEntry={clave && !visible}
          placeholderTextColor={colores.textoSecundario}
          selectionColor={colores.primario}
          style={[styles.entrada, { color: colores.texto }]}
          maxFontSizeMultiplier={MAX_ESCALA_FUENTE}
          {...resto}
        />
        {correcto && !clave ? <Icono nombre="check_circle" color={colores.exito} tamano={22} /> : null}
        {error && !clave ? <Icono nombre="error" color={colores.sos} tamano={22} /> : null}
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

      {error ? (
        <View style={styles.mensaje} accessibilityLiveRegion="polite">
          <Icono nombre="error" color={colores.sos} tamano={16} />
          <Text style={[styles.textoMensaje, { color: colores.sos }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            {error}
          </Text>
        </View>
      ) : mensajeExito ? (
        <View style={styles.mensaje}>
          <Icono nombre="check_circle" color={colores.exito} tamano={16} />
          <Text style={[styles.textoMensaje, { color: colores.exito }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            {mensajeExito}
          </Text>
        </View>
      ) : ayuda ? (
        <Text style={[styles.textoMensaje, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          {ayuda}
        </Text>
      ) : null}

      {children}
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
  cajaResaltada: { borderWidth: 2 },
  prefijo: TIPO.cuerpoFuerte,
  entrada: { ...TIPO.cuerpo, flex: 1, paddingVertical: ESPACIO.m },
  mensaje: { flexDirection: 'row', alignItems: 'flex-start', gap: ESPACIO.xs },
  textoMensaje: { ...TIPO.pequeno, flex: 1 },
});
