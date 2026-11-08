import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from '@/compartido/tema';
import { Boton, Chip, Icono, Tarjeta, type NombreIcono } from '@/compartido/ui';
import { ErrorApi } from '@/nucleo/api';
import { obtenerFoto } from '@/nucleo/imagenes';
import { estaEnLinea } from '@/nucleo/red';
import { useSesion } from '@/nucleo/sesion';
import { CajaAviso, CampoTexto, CasillaAceptar, Pantalla, Titular } from '@/modulos/cuentas';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { CapturaFoto } from '../componentes/CapturaFoto';
import { InsigniaVerificada } from '../componentes/InsigniaVerificada';
import { errorDni, errorNombres, normalizarComoDni } from '../reglas';
import { enviarIdentidad, obtenerMiIdentidad } from '../servicios/identidadServicio';
import type { ResumenIdentidad } from '../tipos';

type Campo = 'dni' | 'nombres' | 'apellidos' | 'fotoDni' | 'selfie' | 'consentimiento';
type Foto = { uri: string; dataUri: string } | null;

const formatoFecha = (ms: number | null) =>
  ms ? new Date(ms).toLocaleString('es-PE', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '';

/**
 * @description Paso numerado del proceso de verificación, con marca ✓ cuando está completo.
 */
function Paso({ numero, titulo, texto, listo, children }: { numero: number; titulo: string; texto: string; listo: boolean; children: ReactNode }) {
  const { colores, oscuro } = useTema();

  return (
    <Tarjeta>
      <View style={styles.cabeceraPaso}>
        <View style={[styles.numero, { backgroundColor: listo ? colores.exitoFondo : colores.primarioSuave }]}>
          {listo ? (
            <Icono nombre="check" color={colores.exito} tamano={20} />
          ) : (
            <Text
              style={[TIPO.cuerpoFuerte, { color: oscuro ? colores.texto : colores.primarioOscuro }]}
              maxFontSizeMultiplier={MAX_ESCALA_FUENTE}
            >
              {numero}
            </Text>
          )}
        </View>
        <View style={styles.textos}>
          <Text style={[TIPO.cuerpoFuerte, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            {titulo}
          </Text>
          <Text style={[TIPO.pequeno, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            {texto}
          </Text>
        </View>
      </View>
      <View style={styles.contenidoPaso}>{children}</View>
    </Tarjeta>
  );
}

/**
 * @description Tarjeta grande de estado (en revisión, verificada, rechazada).
 */
function TarjetaEstado({ icono, color, fondo, titulo, texto, children }: { icono: NombreIcono; color: string; fondo: string; titulo: string; texto: string; children?: ReactNode }) {
  const { colores } = useTema();
  return (
    <View style={[styles.estado, { backgroundColor: fondo }]} accessibilityLiveRegion="polite">
      <Icono nombre={icono} color={color} tamano={40} />
      <Text style={[TIPO.seccion, styles.centro, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
        {titulo}
      </Text>
      <Text style={[TIPO.cuerpo, styles.centro, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
        {texto}
      </Text>
      {children}
    </View>
  );
}

/**
 * @description Verificar identidad (P19, RF36): datos del DNI, foto del DNI y selfie con la cámara. Muestra el estado (en revisión, verificada o rechazada) y permite reenviar tras un rechazo.
 */
export default function VerificarIdentidadPantalla() {
  const { colores } = useTema();
  const { recargarPerfil, modoDesarrollo } = useSesion();
  const [resumen, setResumen] = useState<ResumenIdentidad | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [dni, setDni] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [unSoloApellido, setUnSoloApellido] = useState(false);
  const [fotoDni, setFotoDni] = useState<Foto>(null);
  const [selfie, setSelfie] = useState<Foto>(null);
  const [consentimiento, setConsentimiento] = useState(false);
  const [tocados, setTocados] = useState<Partial<Record<Campo, boolean>>>({});
  const [intentado, setIntentado] = useState(false);
  const [errorApi, setErrorApi] = useState<Partial<Record<Campo, string>>>({});
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    setErrorCarga(null);
    try {
      setResumen(await obtenerMiIdentidad());
    } catch (error) {
      setErrorCarga(error instanceof Error ? error.message : 'No pudimos cargar tu verificación.');
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const errores: Partial<Record<Campo, string>> = {
    dni: errorDni(dni),
    nombres: errorNombres(nombres, 'nombres'),
    apellidos: errorNombres(apellidos, 'apellidos', unSoloApellido),
    fotoDni: fotoDni ? undefined : 'Falta la foto de tu DNI.',
    selfie: selfie ? undefined : 'Falta tu selfie.',
    consentimiento: consentimiento ? undefined : 'Debes autorizar el uso de tus datos para verificarte.',
  };
  const visible = (c: Campo) => errorApi[c] ?? (tocados[c] || intentado ? errores[c] : undefined);
  const correcto = (c: Campo) => Boolean(tocados[c] || intentado) && !visible(c);
  const tocar = (c: Campo) => setTocados((t) => ({ ...t, [c]: true }));
  const limpiarApi = (c: Campo) => setErrorApi((e) => ({ ...e, [c]: undefined }));

  const tomar = async (tipo: 'fotoDni' | 'selfie') => {
    const foto = await obtenerFoto({
      origen: 'camara',
      camaraFrontal: tipo === 'selfie',
      ladoMax: 1280,
      calidad: 0.7,
    });
    if (!foto) return;
    (tipo === 'fotoDni' ? setFotoDni : setSelfie)({ uri: foto.uri, dataUri: foto.dataUri });
    tocar(tipo);
    limpiarApi(tipo);
  };

  const enviar = async () => {
    setIntentado(true);
    const pendientes = (Object.keys(errores) as Campo[]).filter((c) => errores[c] || errorApi[c]);
    if (pendientes.length) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      return;
    }
    if (!(await estaEnLinea())) {
      Alert.alert('Sin conexión', 'Necesitas internet para enviar tus fotos. Tus datos siguen aquí; inténtalo cuando vuelva la señal.');
      return;
    }

    setEnviando(true);
    try {
      const nuevo = await enviarIdentidad({
        dni,
        nombres: normalizarComoDni(nombres),
        apellidos: normalizarComoDni(apellidos),
        unSoloApellido,
        fotoDni: fotoDni!.dataUri,
        selfie: selfie!.dataUri,
      });
      setResumen(nuevo);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      await recargarPerfil().catch(() => undefined);
    } catch (error) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      const mensaje = error instanceof Error ? error.message : 'Inténtalo de nuevo.';
      if (error instanceof ErrorApi && error.estado === 409 && /DNI/.test(mensaje)) setErrorApi({ dni: mensaje });
      else if (error instanceof ErrorApi && error.estado === 400) {
        const campo: Campo = /DNI tiene|n[uú]mero de DNI/i.test(mensaje)
          ? 'dni'
          : /apellidos/i.test(mensaje)
            ? 'apellidos'
            : /nombres/i.test(mensaje)
              ? 'nombres'
              : /selfie/i.test(mensaje)
                ? 'selfie'
                : 'fotoDni';
        setErrorApi({ [campo]: mensaje });
      } else Alert.alert('No pudimos enviar tu verificación', mensaje);
    } finally {
      setEnviando(false);
    }
  };

  const encabezado = (
    <Titular conVolver etiqueta="Identidad" titulo="Verifica que eres tú." subtitulo="Así tus vecinos sabrán a quién le abren la puerta." />
  );

  if (cargando) {
    return (
      <Pantalla>
        {encabezado}
        <ActivityIndicator size="large" color={colores.primario} />
      </Pantalla>
    );
  }

  if (errorCarga && !resumen) {
    return (
      <Pantalla>
        {encabezado}
        <CajaAviso
          tono="neutro"
          icono="cloud_off"
          titulo="No pudimos cargar tu verificación"
          texto={modoDesarrollo ? 'Estás en modo desarrollo sin la API. Inicia sesión con una cuenta para verificar tu identidad.' : errorCarga}
        />
        <Boton texto="Reintentar" icono="refresh" variante="secundario" onPress={() => void cargar()} />
      </Pantalla>
    );
  }

  if (resumen?.estado === 'PENDIENTE') {
    return (
      <Pantalla>
        {encabezado}
        <TarjetaEstado
          icono="hourglass_top"
          color={colores.primario}
          fondo={colores.primarioSuave}
          titulo="Tu verificación está en revisión"
          texto={`La enviaste el ${formatoFecha(resumen.enviadaEn)}. Te avisaremos con una notificación cuando el equipo validador la revise.`}
        />
        <Tarjeta>
          <Text style={[TIPO.pequeno, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            Datos enviados
          </Text>
          <Text style={[TIPO.cuerpoFuerte, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            {resumen.nombres} {resumen.apellidos}
          </Text>
          <Text style={[TIPO.cuerpo, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            DNI {resumen.dni}
          </Text>
        </Tarjeta>
        <CajaAviso
          icono="check_circle"
          titulo="Ya puedes ofrecer ayuda"
          texto="Mientras revisamos, puedes aceptar necesidades y publicar en el directorio. La insignia aparece al aprobarse."
        />
        <Boton texto="Actualizar estado" icono="refresh" variante="secundario" onPress={() => void cargar()} />
      </Pantalla>
    );
  }

  if (resumen?.estado === 'VERIFICADA') {
    return (
      <Pantalla>
        {encabezado}
        <TarjetaEstado
          icono="verified"
          color={colores.exito}
          fondo={colores.exitoFondo}
          titulo="¡Tu identidad está verificada!"
          texto="Tus vecinos ven la insignia en tu perfil, tus publicaciones y tus fichas."
        >
          <InsigniaVerificada estado="VERIFICADA" />
        </TarjetaEstado>
        <Boton texto="Volver a mi perfil" icono="arrow_back" onPress={() => router.back()} />
      </Pantalla>
    );
  }

  const listoDatos = !errores.dni && !errores.nombres && !errores.apellidos;
  const cantidadErrores = intentado ? (Object.keys(errores) as Campo[]).filter((c) => visible(c)).length : 0;

  return (
    <Pantalla>
      {encabezado}

      {resumen?.estado === 'RECHAZADA' ? (
        <View style={[styles.rechazo, { backgroundColor: colores.sosFondo }]}>
          <Icono nombre="error" color={colores.sos} tamano={24} />
          <View style={styles.textos}>
            <Text style={[TIPO.cuerpoFuerte, { color: colores.sos }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
              No pudimos verificarte
            </Text>
            <Text style={[TIPO.pequeno, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
              Motivo: {resumen.motivo}. Corrige lo indicado y envíala de nuevo.
            </Text>
          </View>
        </View>
      ) : (
        <Chip texto="Sin verificar" variante="contorno" icono="info" />
      )}

      <Paso numero={1} titulo="Tus datos" texto="Escríbelos tal como aparecen en tu DNI." listo={listoDatos}>
        <CampoTexto
          etiqueta="Número de DNI"
          icono="badge"
          valor={dni}
          onCambiar={(t) => {
            setDni(t.replace(/\D/g, '').slice(0, 8));
            limpiarApi('dni');
          }}
          onSalir={() => tocar('dni')}
          placeholder="8 dígitos"
          keyboardType="number-pad"
          maxLength={8}
          error={visible('dni')}
          exito={correcto('dni')}
        />
        <CampoTexto
          etiqueta="Nombres"
          valor={nombres}
          onCambiar={(t) => {
            setNombres(t);
            limpiarApi('nombres');
          }}
          onSalir={() => {
            tocar('nombres');
            setNombres((n) => normalizarComoDni(n));
          }}
          placeholder="Como en tu DNI"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={60}
          error={visible('nombres')}
          exito={correcto('nombres')}
        />
        <CampoTexto
          etiqueta="Apellidos"
          valor={apellidos}
          onCambiar={(t) => {
            setApellidos(t);
            limpiarApi('apellidos');
          }}
          onSalir={() => {
            tocar('apellidos');
            setApellidos((a) => normalizarComoDni(a));
          }}
          placeholder="Paterno y materno"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={60}
          error={visible('apellidos')}
          exito={correcto('apellidos')}
        />
        <CasillaAceptar marcada={unSoloApellido} onCambiar={setUnSoloApellido}>
          Mi DNI tiene un solo apellido.
        </CasillaAceptar>
      </Paso>

      <Paso numero={2} titulo="Foto de tu DNI" texto="La parte de adelante, completa y legible." listo={Boolean(fotoDni)}>
        <CapturaFoto
          uri={fotoDni?.uri ?? null}
          proporcion={1.58}
          iconoVacio="badge"
          textoBoton="Tomar foto del DNI"
          consejos={['Sobre una mesa, con buena luz', 'Sin reflejos ni dedos encima', 'Que se lean tu nombre y tu número']}
          error={visible('fotoDni')}
          onTomar={() => void tomar('fotoDni')}
        />
      </Paso>

      <Paso numero={3} titulo="Selfie" texto="Una foto de tu rostro, tomada en este momento." listo={Boolean(selfie)}>
        <CapturaFoto
          uri={selfie?.uri ?? null}
          proporcion={0.8}
          iconoVacio="face"
          textoBoton="Tomarme una selfie"
          consejos={['Rostro de frente y descubierto', 'Sin lentes oscuros ni gorra', 'Con luz de frente, no de espaldas']}
          error={visible('selfie')}
          onTomar={() => void tomar('selfie')}
        />
      </Paso>

      <CasillaAceptar
        marcada={consentimiento}
        onCambiar={(v) => {
          setConsentimiento(v);
          tocar('consentimiento');
        }}
        error={visible('consentimiento')}
      >
        Autorizo a Vecinos a usar mi DNI y mis fotos solo para verificar mi identidad (Ley N.° 29733). Se borran al aprobarse.
      </CasillaAceptar>

      <CajaAviso
        icono="lock"
        titulo="¿Quién ve esto?"
        texto="Solo el equipo validador. Tu DNI nunca se muestra en la app: tus vecinos solo ven la insignia «Identidad verificada»."
      />

      {cantidadErrores > 0 ? (
        <View style={[styles.rechazo, { backgroundColor: colores.sosFondo }]} accessibilityLiveRegion="assertive">
          <Icono nombre="error" color={colores.sos} tamano={20} />
          <Text style={[TIPO.pequeno, styles.textos, { color: colores.sos }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            {cantidadErrores === 1 ? 'Falta completar 1 dato marcado en rojo.' : `Faltan completar ${cantidadErrores} datos marcados en rojo.`}
          </Text>
        </View>
      ) : null}

      <Boton
        texto={enviando ? 'Enviando tus fotos…' : resumen?.estado === 'RECHAZADA' ? 'Enviar de nuevo' : 'Enviar para revisión'}
        icono="send"
        deshabilitado={enviando}
        onPress={() => void enviar()}
      />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  cabeceraPaso: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.m },
  numero: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1, gap: 2 },
  contenidoPaso: { gap: ESPACIO.m, marginTop: ESPACIO.l },
  estado: { alignItems: 'center', gap: ESPACIO.m, padding: ESPACIO.xl, borderRadius: 20 },
  centro: { textAlign: 'center' },
  rechazo: { flexDirection: 'row', alignItems: 'flex-start', gap: ESPACIO.m, padding: ESPACIO.m, borderRadius: 12 },
});
