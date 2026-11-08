import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from '@/compartido/tema';
import { Boton, Icono } from '@/compartido/ui';
import { ErrorApi } from '@/nucleo/api';
import { useSesion } from '@/nucleo/sesion';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, type TextInputInstance } from 'react-native';
import { CajaAviso } from '../componentes/CajaAviso';
import { CampoTexto } from '../componentes/CampoTexto';
import { CasillaAceptar } from '../componentes/CasillaAceptar';
import { MedidorClave } from '../componentes/MedidorClave';
import { Pantalla } from '../componentes/Pantalla';
import { Titular } from '../componentes/Titular';
import { consultarDisponibilidad, type Disponibilidad } from '../servicios/disponibilidad';
import {
  errorCorreo,
  errorTelefono,
  formatearTelefono,
  LIMITES,
  normalizarCorreo,
  normalizarNombre,
  sugerirCorreo,
  validarRegistro,
  type CampoRegistro,
  type DatosFormularioRegistro,
  type ErroresFormulario,
} from '../validaciones';

type CampoEditable = Exclude<CampoRegistro, 'terminos'>;
const ORDEN: CampoRegistro[] = ['nombre', 'correo', 'telefono', 'clave', 'confirmacion', 'terminos'];

const MENSAJE_OCUPADO = {
  correo: 'Ya existe una cuenta con este correo.',
  telefono: 'Este celular ya está registrado en otra cuenta.',
} as const;

/**
 * @description Registro (P02, RF01). Valida cada campo al salir de él y en vivo después; revisa en la API si el correo y el celular están libres. Al terminar abre «Completar perfil».
 */
export default function RegistroPantalla() {
  const { colores } = useTema();
  const { registrar } = useSesion();
  const [datos, setDatos] = useState<DatosFormularioRegistro>({
    nombre: '',
    correo: '',
    telefono: '',
    clave: '',
    confirmacion: '',
    terminos: false,
  });
  const [tocados, setTocados] = useState<Partial<Record<CampoRegistro, boolean>>>({});
  const [intentado, setIntentado] = useState(false);
  const [erroresApi, setErroresApi] = useState<ErroresFormulario<CampoRegistro>>({});
  const [disponible, setDisponible] = useState<Record<'correo' | 'telefono', Disponibilidad | 'revisando'>>({
    correo: 'desconocido',
    telefono: 'desconocido',
  });
  const [enviando, setEnviando] = useState(false);
  const datosActuales = useRef(datos);
  datosActuales.current = datos;

  const refs = {
    nombre: useRef<TextInputInstance>(null),
    correo: useRef<TextInputInstance>(null),
    telefono: useRef<TextInputInstance>(null),
    clave: useRef<TextInputInstance>(null),
    confirmacion: useRef<TextInputInstance>(null),
  } satisfies Record<CampoEditable, unknown>;

  const errores = validarRegistro(datos);
  const contextoClave = { nombre: datos.nombre, correo: datos.correo, telefono: datos.telefono };

  /** Error que se ve: tras salir del campo o intentar enviar; los de la API y «ya registrado» siempre. */
  const errorVisible = (campo: CampoRegistro): string | undefined => {
    if (erroresApi[campo]) return erroresApi[campo];
    if ((campo === 'correo' || campo === 'telefono') && !errores[campo] && disponible[campo] === 'ocupado') {
      return MENSAJE_OCUPADO[campo];
    }
    return tocados[campo] || intentado ? errores[campo] : undefined;
  };
  const correcto = (campo: CampoRegistro) => Boolean(tocados[campo] || intentado) && !errorVisible(campo);

  const cambiar = (campo: CampoEditable) => (valor: string) => {
    const limpio = campo === 'telefono' ? valor.replace(/\D/g, '').slice(0, 9) : valor;
    setDatos((d) => ({ ...d, [campo]: limpio }));
    setErroresApi((e) => ({ ...e, [campo]: undefined }));
    if (campo === 'correo' || campo === 'telefono') setDisponible((d) => ({ ...d, [campo]: 'desconocido' }));
  };

  const revisarDisponible = async (campo: 'correo' | 'telefono', valor: string) => {
    const invalido = campo === 'correo' ? errorCorreo(valor) : errorTelefono(valor);
    if (invalido) return;
    setDisponible((d) => ({ ...d, [campo]: 'revisando' }));
    const resultado = await consultarDisponibilidad(campo, valor);
    // Solo aplica si el vecino no cambió el valor mientras se consultaba.
    if (datosActuales.current[campo] === valor) setDisponible((d) => ({ ...d, [campo]: resultado }));
  };

  const salir = (campo: CampoEditable) => () => {
    setTocados((t) => ({ ...t, [campo]: true }));
    if (campo === 'nombre' && datos.nombre.trim()) setDatos((d) => ({ ...d, nombre: normalizarNombre(d.nombre) }));
    if (campo === 'correo') {
      const correo = normalizarCorreo(datos.correo);
      setDatos((d) => ({ ...d, correo }));
      void revisarDisponible('correo', correo);
    }
    if (campo === 'telefono') void revisarDisponible('telefono', datos.telefono);
  };

  const usarSugerencia = (correo: string) => {
    setDatos((d) => ({ ...d, correo }));
    setTocados((t) => ({ ...t, correo: true }));
    void revisarDisponible('correo', correo);
  };

  const crearCuenta = async () => {
    setIntentado(true);
    const conError = ORDEN.find((c) => errorVisible(c) ?? errores[c]);
    if (conError) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      if (conError !== 'terminos') refs[conError].current?.focus();
      return;
    }

    setEnviando(true);
    try {
      await registrar({
        nombre: normalizarNombre(datos.nombre),
        correo: normalizarCorreo(datos.correo),
        telefono: datos.telefono,
        clave: datos.clave,
        aceptaTerminos: datos.terminos,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      // La navegación pasa sola a la app y abre «Completar perfil».
    } catch (error) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      const mensaje = error instanceof Error ? error.message : 'Inténtalo de nuevo.';
      if (error instanceof ErrorApi && error.estado === 409) {
        const campo = /correo/i.test(mensaje) ? 'correo' : 'telefono';
        setDisponible((d) => ({ ...d, [campo]: 'ocupado' }));
        refs[campo].current?.focus();
      } else if (error instanceof ErrorApi && error.estado === 400) {
        // La API devuelve el primer problema; se muestra en el campo al que se refiere.
        const campo: CampoRegistro = /clave/i.test(mensaje)
          ? 'clave'
          : /pol[ií]tica/i.test(mensaje)
            ? 'terminos'
            : /celular|tel[eé]fono/i.test(mensaje)
              ? 'telefono'
              : /correo/i.test(mensaje)
                ? 'correo'
                : 'nombre';
        setErroresApi({ [campo]: mensaje });
      } else {
        Alert.alert('No pudimos crear tu cuenta', mensaje);
      }
    } finally {
      setEnviando(false);
    }
  };

  const cantidadErrores = intentado ? ORDEN.filter((c) => errorVisible(c)).length : 0;
  const sugerencia = !errores.correo ? sugerirCorreo(datos.correo) : undefined;

  return (
    <Pantalla>
      <Titular conVolver etiqueta="Crear cuenta" titulo="Únete a tu barrio." subtitulo="Solo te tomará un minuto." />

      <View style={styles.formulario}>
        <CampoTexto
          ref={refs.nombre}
          etiqueta="Nombre y apellido"
          icono="person"
          valor={datos.nombre}
          onCambiar={cambiar('nombre')}
          onSalir={salir('nombre')}
          placeholder="Ej.: Ana Morales"
          autoComplete="name"
          textContentType="name"
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={LIMITES.nombre}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => refs.correo.current?.focus()}
          ayuda="Así te verán tus vecinos. Usa tu nombre real."
          error={errorVisible('nombre')}
          exito={correcto('nombre')}
        />

        <CampoTexto
          ref={refs.correo}
          etiqueta="Correo"
          icono="mail"
          valor={datos.correo}
          onCambiar={cambiar('correo')}
          onSalir={salir('correo')}
          placeholder="tucorreo@ejemplo.com"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={LIMITES.correo}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => refs.telefono.current?.focus()}
          error={errorVisible('correo')}
          exito={correcto('correo') && disponible.correo === 'libre' ? 'Correo disponible.' : correcto('correo')}
          ayuda={disponible.correo === 'revisando' ? 'Revisando…' : undefined}
        >
          {sugerencia ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`¿Quisiste decir ${sugerencia}? Toca para corregir.`}
              onPress={() => usarSugerencia(sugerencia)}
              style={[styles.sugerencia, { backgroundColor: colores.primarioSuave }]}
            >
              <Icono nombre="lightbulb" color={colores.primario} tamano={18} />
              <Text style={[TIPO.pequeno, styles.flex, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
                ¿Quisiste decir <Text style={styles.negrita}>{sugerencia}</Text>?
              </Text>
              <Text style={[TIPO.pequeno, styles.negrita, { color: colores.enlace }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
                Corregir
              </Text>
            </Pressable>
          ) : null}
          {disponible.correo === 'ocupado' && !errores.correo ? (
            <Boton
              texto="Iniciar sesión con este correo"
              variante="enlace"
              onPress={() => router.replace({ pathname: '/ingresar', params: { correo: normalizarCorreo(datos.correo) } })}
            />
          ) : null}
        </CampoTexto>

        <CampoTexto
          ref={refs.telefono}
          etiqueta="Celular"
          icono="call"
          prefijo="+51"
          valor={formatearTelefono(datos.telefono)}
          onCambiar={cambiar('telefono')}
          onSalir={salir('telefono')}
          placeholder="987 654 321"
          keyboardType="phone-pad"
          autoComplete="tel-national"
          textContentType="telephoneNumber"
          maxLength={11}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => refs.clave.current?.focus()}
          ayuda={
            disponible.telefono === 'revisando'
              ? 'Revisando…'
              : 'Te enviaremos alertas por SMS cuando no haya internet. No se muestra a nadie.'
          }
          error={errorVisible('telefono')}
          exito={correcto('telefono')}
        />

        <CampoTexto
          ref={refs.clave}
          etiqueta="Clave"
          icono="lock"
          clave
          valor={datos.clave}
          onCambiar={cambiar('clave')}
          onSalir={salir('clave')}
          placeholder="Crea una clave segura"
          autoComplete="new-password"
          textContentType="newPassword"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={LIMITES.claveMax}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => refs.confirmacion.current?.focus()}
          error={errorVisible('clave')}
          exito={correcto('clave')}
        >
          <MedidorClave clave={datos.clave} contexto={contextoClave} />
        </CampoTexto>

        <CampoTexto
          ref={refs.confirmacion}
          etiqueta="Confirma tu clave"
          icono="lock"
          clave
          valor={datos.confirmacion}
          onCambiar={cambiar('confirmacion')}
          onSalir={salir('confirmacion')}
          placeholder="Repite la clave"
          autoComplete="new-password"
          textContentType="newPassword"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={LIMITES.claveMax}
          returnKeyType="done"
          onSubmitEditing={() => void crearCuenta()}
          // Coincidir se avisa en cuanto pasa, sin esperar a salir del campo.
          error={
            errorVisible('confirmacion') ??
            (datos.confirmacion.length >= datos.clave.length && datos.confirmacion && datos.confirmacion !== datos.clave
              ? 'Las claves no coinciden.'
              : undefined)
          }
          exito={datos.confirmacion && datos.confirmacion === datos.clave ? 'Las claves coinciden.' : false}
        />

        <CasillaAceptar
          marcada={datos.terminos}
          onCambiar={(terminos) => {
            setDatos((d) => ({ ...d, terminos }));
            setTocados((t) => ({ ...t, terminos: true }));
            setErroresApi((e) => ({ ...e, terminos: undefined }));
          }}
          error={errorVisible('terminos')}
        >
          Acepto la <Text style={[styles.negrita, { color: colores.enlace }]}>política de privacidad</Text> y el
          tratamiento de mis datos personales según la Ley N.° 29733.
        </CasillaAceptar>
      </View>

      <CajaAviso
        icono="verified_user"
        titulo="Tus datos, con cuidado"
        texto="Tus vecinos solo ven tu nombre y tu foto. Tu celular, correo y ubicación exacta no se publican."
      />

      {cantidadErrores > 0 ? (
        <View style={[styles.resumen, { backgroundColor: colores.sosFondo }]} accessibilityLiveRegion="assertive">
          <Icono nombre="error" color={colores.sos} tamano={20} />
          <Text style={[TIPO.pequeno, styles.flex, { color: colores.sos }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            {cantidadErrores === 1
              ? 'Corrige el campo marcado en rojo para continuar.'
              : `Corrige los ${cantidadErrores} campos marcados en rojo para continuar.`}
          </Text>
        </View>
      ) : null}

      <Boton
        texto={enviando ? 'Creando tu cuenta…' : 'Crear cuenta'}
        icono="person_add"
        deshabilitado={enviando}
        onPress={() => void crearCuenta()}
      />

      <View style={styles.ingreso}>
        <Text style={[TIPO.cuerpo, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          ¿Ya tienes cuenta?
        </Text>
        <Boton texto="Iniciar sesión" variante="enlace" onPress={() => router.replace('/ingresar')} />
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  formulario: { gap: ESPACIO.l },
  flex: { flex: 1 },
  negrita: { fontWeight: '700' },
  sugerencia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIO.s,
    paddingVertical: ESPACIO.s,
    paddingHorizontal: ESPACIO.m,
    borderRadius: 10,
  },
  resumen: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.s, padding: ESPACIO.m, borderRadius: 12 },
  ingreso: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
});
