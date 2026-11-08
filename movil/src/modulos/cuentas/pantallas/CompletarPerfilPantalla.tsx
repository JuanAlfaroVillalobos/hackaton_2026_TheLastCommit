import { OFICIOS, type OficioId } from '@/compartido/constantes/oficios';
import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from '@/compartido/tema';
import { Boton, Chip, ChipFiltro, Icono, Tarjeta, type NombreIcono } from '@/compartido/ui';
import { useSesion } from '@/nucleo/sesion';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../componentes/Avatar';
import { CajaAviso } from '../componentes/CajaAviso';
import { Pantalla } from '../componentes/Pantalla';
import { Titular } from '../componentes/Titular';
import { usePermisos, type EstadoPermisoApp, type IdPermiso } from '../hooks/usePermisos';
import { cambiarFotoPerfil, quitarFotoPerfil } from '../servicios/fotoPerfil';

const MAX_OFICIOS = 5;

const PERMISOS: { id: IdPermiso; icono: NombreIcono; titulo: string; texto: string; importante?: boolean }[] = [
  { id: 'ubicacion', icono: 'location_on', titulo: 'Ubicación', texto: 'Para mostrarte necesidades y servicios cerca de ti.', importante: true },
  { id: 'notificaciones', icono: 'notifications', titulo: 'Notificaciones', texto: 'Para avisarte cuando alguien te ayude o haya una emergencia.', importante: true },
  { id: 'sms', icono: 'sms', titulo: 'SMS', texto: 'Para pedir y recibir ayuda aunque no tengas internet.' },
  { id: 'pantallaCompleta', icono: 'warning', titulo: 'Alertas a pantalla completa', texto: 'Para que una emergencia encienda tu pantalla aunque esté bloqueada.' },
  { id: 'bateria', icono: 'battery_full', titulo: 'Sin ahorro de batería', texto: 'Para que el teléfono no retrase ni bloquee las alertas.' },
];

const TEXTO_ESTADO: Record<EstadoPermisoApp, { chip: string; variante: 'exito' | 'neutro' | 'contorno'; boton: string }> = {
  concedido: { chip: 'Activado', variante: 'exito', boton: '' },
  pendiente: { chip: 'Pendiente', variante: 'neutro', boton: 'Activar' },
  bloqueado: { chip: 'Bloqueado', variante: 'contorno', boton: 'Abrir Ajustes' },
  revisar: { chip: 'Revisar', variante: 'neutro', boton: 'Revisar en Ajustes' },
};

/**
 * @description Completar perfil (P03, RF05, RF06, RF08): foto, oficios de 1 a 5 y permisos explicados con su estado real.
 */
export default function CompletarPerfilPantalla() {
  const { colores } = useTema();
  const { perfil, actualizarPerfil, recargarPerfil, modoDesarrollo } = useSesion();
  const { estados, pedir } = usePermisos();
  const [elegidos, setElegidos] = useState<OficioId[]>(() => perfil?.oficios ?? []);
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [intentado, setIntentado] = useState(false);

  const nombre = perfil?.nombre ?? 'Vecino';
  const errorOficios = intentado && elegidos.length === 0 ? 'Elige al menos un oficio para continuar.' : undefined;

  const cambiarFoto = async () => {
    if (modoDesarrollo) {
      Alert.alert('Foto de perfil', 'En modo desarrollo sin la API no se puede subir la foto. Inicia sesión con una cuenta.');
      return;
    }
    setSubiendoFoto(true);
    try {
      if (await cambiarFotoPerfil()) await recargarPerfil();
    } catch (error) {
      Alert.alert('No se subió tu foto', error instanceof Error ? error.message : 'Inténtalo de nuevo.');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const opcionesFoto = () => {
    if (!perfil?.fotoUrl) return void cambiarFoto();
    Alert.alert('Foto de perfil', undefined, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar foto',
        style: 'destructive',
        onPress: () => void quitarFotoPerfil().then(() => recargarPerfil()).catch(() => undefined),
      },
      { text: 'Cambiar foto', onPress: () => void cambiarFoto() },
    ]);
  };

  const guardar = async () => {
    setIntentado(true);
    if (elegidos.length === 0) return;
    setGuardando(true);
    try {
      await actualizarPerfil({ oficios: elegidos });
      const faltan = PERMISOS.filter((p) => p.importante && estados?.[p.id] !== 'concedido');
      if (faltan.length) {
        Alert.alert(
          'Te faltan permisos importantes',
          `Sin ${faltan.map((p) => p.titulo.toLowerCase()).join(' ni ')} no podremos avisarte de ayuda ni de emergencias cerca de ti.`,
          [
            {
              text: 'Activarlos ahora',
              style: 'cancel',
              // Pide uno por uno los permisos importantes que faltan (ubicación y notificaciones).
              onPress: () => {
                void (async () => {
                  for (const permiso of faltan) await pedir(permiso.id);
                })();
              },
            },
            { text: 'Continuar igual', onPress: () => router.back() },
          ],
        );
        return;
      }
      router.back();
    } catch (error) {
      Alert.alert('No se guardaron tus oficios', error instanceof Error ? error.message : 'Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const alternar = (oficio: OficioId) => {
    setElegidos((actual) => {
      if (actual.includes(oficio)) return actual.filter((o) => o !== oficio);
      if (actual.length >= MAX_OFICIOS) {
        Alert.alert('Máximo 5 oficios', 'Quita uno para elegir otro.');
        return actual;
      }
      return [...actual, oficio];
    });
  };

  return (
    <Pantalla>
      <Titular
        conVolver
        etiqueta="Último paso"
        titulo="Cuéntanos qué sabes hacer."
        subtitulo="Te mostraremos primero lo que coincide con tus oficios."
      />

      <Tarjeta>
        <View style={styles.foto}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={perfil?.fotoUrl ? 'Cambiar foto de perfil' : 'Agregar foto de perfil'}
            onPress={opcionesFoto}
            disabled={subiendoFoto}
          >
            <Avatar nombre={nombre} fotoUrl={perfil?.fotoUrl} tamano={72} />
            <View style={[styles.lapiz, { backgroundColor: colores.primario, borderColor: colores.superficie }]}>
              {subiendoFoto ? (
                <ActivityIndicator size="small" color={colores.sobrePrimario} />
              ) : (
                <Icono nombre="photo_camera" color={colores.sobrePrimario} tamano={16} />
              )}
            </View>
          </Pressable>
          <View style={styles.textos}>
            <Text style={[TIPO.cuerpoFuerte, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
              Foto de perfil
            </Text>
            <Text style={[TIPO.pequeno, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
              Opcional. Una foto de tu rostro ayuda a que tus vecinos te reconozcan.
            </Text>
          </View>
        </View>
        <View style={styles.botonFoto}>
          <Boton
            texto={subiendoFoto ? 'Subiendo…' : perfil?.fotoUrl ? 'Cambiar foto' : 'Agregar foto'}
            icono="photo_camera"
            variante="secundario"
            deshabilitado={subiendoFoto}
            onPress={opcionesFoto}
          />
        </View>
      </Tarjeta>

      <View style={styles.seccion}>
        <View style={styles.cabecera}>
          <Text style={[TIPO.seccion, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            Mis oficios
          </Text>
          <Text style={[TIPO.pequeno, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            {elegidos.length} de {MAX_OFICIOS}
          </Text>
        </View>
        <View style={styles.chips}>
          {(Object.keys(OFICIOS) as OficioId[]).map((oficio) => (
            <ChipFiltro key={oficio} texto={OFICIOS[oficio]} activo={elegidos.includes(oficio)} onPress={() => alternar(oficio)} />
          ))}
        </View>
        {errorOficios ? (
          <View style={styles.error} accessibilityLiveRegion="polite">
            <Icono nombre="error" color={colores.sos} tamano={16} />
            <Text style={[TIPO.pequeno, { color: colores.sos }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
              {errorOficios}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.seccion}>
        <Text style={[TIPO.seccion, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          Permisos
        </Text>
        <Text style={[TIPO.pequeno, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          Te explicamos para qué sirve cada uno antes de pedirlo.
        </Text>
        {PERMISOS.map((p) => {
          const estado = estados?.[p.id];
          const t = estado ? TEXTO_ESTADO[estado] : null;
          return (
            <Tarjeta key={p.id}>
              <View style={styles.permiso}>
                <Icono nombre={p.icono} color={estado === 'concedido' ? colores.exito : colores.primario} tamano={24} />
                <View style={styles.textos}>
                  <Text style={[TIPO.cuerpoFuerte, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
                    {p.titulo}
                  </Text>
                  <Text style={[TIPO.pequeno, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
                    {p.texto}
                  </Text>
                </View>
                {t ? <Chip texto={t.chip} variante={t.variante} icono={estado === 'concedido' ? 'check' : undefined} /> : null}
              </View>
              {t && estado !== 'concedido' ? (
                <View style={styles.botonPermiso}>
                  <Boton texto={t.boton} variante={p.importante ? 'primario' : 'secundario'} onPress={() => void pedir(p.id)} />
                </View>
              ) : null}
            </Tarjeta>
          );
        })}
      </View>

      {perfil && perfil.estadoIdentidad === 'NO_ENVIADA' ? (
        <Tarjeta onPress={() => router.push('/verificar-identidad')} accessibilityLabel="Verificar identidad, opcional">
          <View style={styles.permiso}>
            <Icono nombre="verified_user" color={colores.primario} tamano={24} />
            <View style={styles.textos}>
              <Text style={[TIPO.cuerpoFuerte, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
                Verifica tu identidad
              </Text>
              <Text style={[TIPO.pequeno, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
                Necesaria para ofrecer ayuda y publicar en el directorio. Pedir ayuda nunca la requiere.
              </Text>
            </View>
            <Icono nombre="chevron_right" color={colores.textoSecundario} tamano={24} />
          </View>
        </Tarjeta>
      ) : null}

      <CajaAviso icono="lock" titulo="Tú decides" texto="Puedes cambiar tu foto, tus oficios y tus permisos cuando quieras desde Mi perfil." />

      <Boton
        texto={guardando ? 'Guardando…' : 'Guardar y continuar'}
        icono="check_circle"
        deshabilitado={guardando}
        onPress={() => void guardar()}
      />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  foto: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.l },
  lapiz: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonFoto: { marginTop: ESPACIO.m },
  textos: { flex: 1, gap: 2 },
  seccion: { gap: ESPACIO.m },
  cabecera: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', columnGap: ESPACIO.s },
  permiso: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.m },
  botonPermiso: { marginTop: ESPACIO.m },
  error: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.xs },
});