import { ESPACIO, MAX_ESCALA_FUENTE, RADIO, TIPO, useTema } from '@/compartido/tema';
import { Boton, Chip, Icono, Tarjeta, type NombreIcono } from '@/compartido/ui';
import { OFICIOS } from '@/compartido/constantes/oficios';
import { api } from '@/nucleo/api';
import {
  abrirAjustesNotificaciones,
  mostrarNotificacion,
  sondearAhora,
  usePermisoNotificaciones,
} from '@/nucleo/notificaciones';
import { useSesion } from '@/nucleo/sesion';
import { router } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../componentes/Avatar';
import { CajaAviso } from '../componentes/CajaAviso';
import { Pantalla } from '../componentes/Pantalla';
import { Titular } from '../componentes/Titular';

type Opcion = { icono: NombreIcono; titulo: string; detalle: string; onPress: () => void; chip?: string };

/**
 * @description Fila de la sección «Mi cuenta», con ícono, texto y flecha.
 */
function FilaOpcion({ icono, titulo, detalle, onPress, chip }: Opcion) {
  const { colores } = useTema();

  return (
    <Tarjeta onPress={onPress} accessibilityLabel={`${titulo}. ${detalle}`}>
      <View style={styles.fila}>
        <View style={[styles.iconoFila, { backgroundColor: colores.primarioSuave }]}>
          <Icono nombre={icono} color={colores.primario} tamano={22} />
        </View>
        <View style={styles.textosFila}>
          <Text style={[TIPO.cuerpoFuerte, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            {titulo}
          </Text>
          <Text style={[TIPO.pequeno, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            {detalle}
          </Text>
          {chip ? <Chip texto={chip} variante="contorno" /> : null}
        </View>
        <Icono nombre="chevron_right" color={colores.textoSecundario} tamano={24} />
      </View>
    </Tarjeta>
  );
}

/**
 * @description Contador de «Mi participación» (RN-08: horas como reputación, no saldo).
 */
function Contador({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  const { colores } = useTema();

  return (
    <View
      accessible
      accessibilityLabel={`${valor} ${etiqueta}`}
      style={[styles.contador, { backgroundColor: colores.superficie, borderColor: colores.borde }]}
    >
      <Text style={[TIPO.seccion, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
        {valor}
      </Text>
      <Text style={[TIPO.pequeno, styles.centrado, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
        {etiqueta}
      </Text>
    </View>
  );
}

/**
 * @description Mi perfil (P10, RF05, RF06, RF17), según el diseño del equipo. Lee el perfil real de la sesión (GET /vecinos/yo).
 */
export default function PerfilPantalla() {
  const { colores } = useTema();
  const { perfil, modoDesarrollo, salir } = useSesion();

  const nombre = perfil?.nombre ?? 'Vecino';
  const detalle = [perfil?.barrio, perfil?.telefono].filter(Boolean).join(' · ') || perfil?.correo || '';
  const oficios = perfil?.oficios ?? [];

  const permiso = usePermisoNotificaciones();

  /** Con permiso: pide a la API una notificación de prueba (o la muestra local en modo desarrollo). */
  const probarNotificaciones = async () => {
    if (permiso === 'denegado') {
      Alert.alert(
        'Notificaciones desactivadas',
        'Actívalas para enterarte cuando un vecino responda tu pedido o haya una emergencia en tu zona.',
        [
          { text: 'Ahora no', style: 'cancel' },
          { text: 'Ir a Ajustes', onPress: () => void abrirAjustesNotificaciones() },
        ],
      );
      return;
    }
    try {
      await api('/vecinos/yo/notificaciones/prueba', { metodo: 'POST', cuerpo: { canal: 'general' } });
      sondearAhora();
    } catch {
      await mostrarNotificacion({
        titulo: 'Notificación de prueba',
        cuerpo: 'Si ves esto, las notificaciones de Vecinos funcionan.',
      });
    }
  };

  const cerrarSesion = () => {
    salir().catch(() => Alert.alert('Cerrar sesión', 'No se pudo cerrar la sesión. Inténtalo de nuevo.'));
  };

  return (
    <Pantalla>
      <Titular etiqueta="Mi perfil" titulo="Tu lugar en la comunidad." />

      <View style={[styles.tarjetaPerfil, { backgroundColor: colores.primarioSuave }]}>
        <Avatar nombre={nombre} tamano={64} solido />
        <View style={styles.textosPerfil}>
          <Text style={[TIPO.seccion, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            {nombre}
          </Text>
          <Text style={[TIPO.pequeno, { color: colores.textoSecundario }]} numberOfLines={1} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            {detalle}
          </Text>
          {modoDesarrollo ? <Chip texto="Perfil de demostración" variante="neutro" /> : null}
        </View>
      </View>

      <View style={styles.seccion}>
        <Text style={[TIPO.seccion, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          Mis oficios
        </Text>
        {oficios.length > 0 ? (
          <View style={styles.chips}>
            {oficios.map((o) => (
              <Chip key={o} texto={OFICIOS[o]} variante="marca" />
            ))}
          </View>
        ) : (
          <Text style={[TIPO.pequeno, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            Aún no elegiste oficios. Agrégalos en «Completar perfil» para ver primero lo que sabes hacer.
          </Text>
        )}
      </View>

      <View style={styles.seccion}>
        <Text style={[TIPO.seccion, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          Mi participación
        </Text>
        <View style={styles.contadores}>
          <Contador valor="0 h" etiqueta="Ayudadas" />
          <Contador valor="0 h" etiqueta="Solicitadas" />
          <Contador valor="—" etiqueta="Calificación" />
        </View>
      </View>

      <View style={styles.seccion}>
        <Text style={[TIPO.seccion, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          Mi cuenta
        </Text>
        <FilaOpcion
          icono="edit"
          titulo="Completar perfil"
          detalle="Tus oficios, tu foto y los permisos de la app."
          onPress={() => router.push('/completar-perfil')}
        />
        <FilaOpcion
          icono="verified_user"
          titulo="Verificar identidad"
          detalle="Así tus vecinos sabrán a quién le abren la puerta."
          chip="Sin verificar"
          onPress={() => router.push('/verificar-identidad')}
        />
        <FilaOpcion
          icono="notifications"
          titulo="Notificaciones"
          detalle={permiso === 'concedido' ? 'Activadas. Toca para enviarte una de prueba.' : 'Desactivadas. Toca para activarlas.'}
          chip={permiso === 'concedido' ? undefined : 'Desactivadas'}
          onPress={() => void probarNotificaciones()}
        />
        <FilaOpcion
          icono="help"
          titulo="Guía de ayuda"
          detalle="Aprende a pedir y ofrecer ayuda, paso a paso."
          onPress={() => Alert.alert('Guía de ayuda', 'Disponible pronto (tarea A8).')}
        />
      </View>

      <CajaAviso
        icono="shield"
        titulo="Tu información, con cuidado"
        texto="Tu DNI y tu teléfono no aparecen en publicaciones. La comunidad solo ve tu nombre y tu foto."
      />

      <Boton
        texto={modoDesarrollo ? 'Salir del modo desarrollo' : 'Cerrar sesión'}
        icono="logout"
        variante="secundario"
        onPress={cerrarSesion}
      />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  tarjetaPerfil: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.l, padding: ESPACIO.l, borderRadius: RADIO.tarjeta },
  textosPerfil: { flex: 1, gap: ESPACIO.xs },
  seccion: { gap: ESPACIO.m },
  contadores: { flexDirection: 'row', gap: ESPACIO.s },
  contador: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: ESPACIO.l,
    paddingHorizontal: ESPACIO.xs,
    borderWidth: 1,
    borderRadius: RADIO.boton,
  },
  centrado: { textAlign: 'center' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.m },
  iconoFila: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  textosFila: { flex: 1, gap: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIO.s },
});
