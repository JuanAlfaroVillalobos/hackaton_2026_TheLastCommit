import { ESPACIO, MAX_ESCALA_FUENTE, RADIO, TIPO, useTema } from '@/compartido/tema';
import { Boton, Chip, Icono, Tarjeta, type NombreIcono } from '@/compartido/ui';
import { OFICIOS } from '@/compartido/constantes/oficios';
import { api } from '@/nucleo/api';
import { usePendientesBandeja } from '@/nucleo/bandeja-salida';
import {
  abrirAjustesNotificaciones,
  mostrarNotificacion,
  sondearAhora,
  usePermisoNotificaciones,
} from '@/nucleo/notificaciones';
import { useSesion } from '@/nucleo/sesion';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../componentes/Avatar';
import { CajaAviso } from '../componentes/CajaAviso';
import { Pantalla } from '../componentes/Pantalla';
import { Titular } from '../componentes/Titular';
import { cambiarFotoPerfil } from '../servicios/fotoPerfil';

/** Chip de la fila «Verificar identidad» según el estado (RF36). */
const CHIP_IDENTIDAD = {
  NO_ENVIADA: { texto: 'Sin verificar', variante: 'contorno', detalle: 'Así tus vecinos sabrán a quién le abren la puerta.' },
  PENDIENTE: { texto: 'En revisión', variante: 'neutro', detalle: 'Te avisaremos cuando el equipo la revise.' },
  VERIFICADA: { texto: 'Verificada', variante: 'exito', detalle: 'Tus vecinos ven la insignia en tu perfil.' },
  RECHAZADA: { texto: 'Rechazada', variante: 'contorno', detalle: 'Revisa el motivo y envíala de nuevo.' },
} as const;

type Opcion = {
  icono: NombreIcono;
  titulo: string;
  detalle: string;
  onPress: () => void;
  chip?: string;
  varianteChip?: 'contorno' | 'exito' | 'neutro' | 'marca';
};

/**
 * @description Fila de la sección «Mi cuenta», con ícono, texto y flecha.
 */
function FilaOpcion({ icono, titulo, detalle, onPress, chip, varianteChip = 'contorno' }: Opcion) {
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
          {chip ? <Chip texto={chip} variante={varianteChip} /> : null}
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
  const { perfil, modoDesarrollo, salir, recargarPerfil } = useSesion();

  const nombre = perfil?.nombre ?? 'Vecino';
  const detalle = [perfil?.barrio, perfil?.telefono].filter(Boolean).join(' · ') || perfil?.correo || '';
  const oficios = perfil?.oficios ?? [];

  const permiso = usePermisoNotificaciones();
  const pendientes = usePendientesBandeja();
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const identidad = CHIP_IDENTIDAD[perfil?.estadoIdentidad ?? 'NO_ENVIADA'];

  const cambiarFoto = async () => {
    if (modoDesarrollo) {
      Alert.alert('Foto de perfil', 'En modo desarrollo sin la API no se puede subir la foto.');
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
    const hacerlo = () => salir().catch(() => Alert.alert('Cerrar sesión', 'No se pudo cerrar la sesión. Inténtalo de nuevo.'));
    if (modoDesarrollo) return void hacerlo();
    Alert.alert(
      '¿Cerrar sesión?',
      pendientes > 0
        ? `Tienes ${pendientes} ${pendientes === 1 ? 'acción pendiente' : 'acciones pendientes'} sin enviar. Se enviarán cuando vuelvas a entrar con esta cuenta.`
        : 'Dejarás de recibir avisos de ayuda y emergencias en este teléfono.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => void hacerlo() },
      ],
    );
  };

  return (
    <Pantalla>
      <Titular etiqueta="Mi perfil" titulo="Tu lugar en la comunidad." />

      <View style={[styles.tarjetaPerfil, { backgroundColor: colores.primarioSuave }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={perfil?.fotoUrl ? 'Cambiar foto de perfil' : 'Agregar foto de perfil'}
          onPress={() => void cambiarFoto()}
          disabled={subiendoFoto}
        >
          <Avatar nombre={nombre} fotoUrl={perfil?.fotoUrl} tamano={64} solido />
          <View style={[styles.camara, { backgroundColor: colores.primario, borderColor: colores.primarioSuave }]}>
            {subiendoFoto ? (
              <ActivityIndicator size="small" color={colores.sobrePrimario} />
            ) : (
              <Icono nombre="photo_camera" color={colores.sobrePrimario} tamano={14} />
            )}
          </View>
        </Pressable>
        <View style={styles.textosPerfil}>
          <View style={styles.filaNombre}>
            <Text style={[TIPO.seccion, styles.nombre, { color: colores.texto }]} numberOfLines={1} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
              {nombre}
            </Text>
            {perfil?.estadoIdentidad === 'VERIFICADA' ? (
              <View accessible accessibilityLabel="Identidad verificada">
                <Icono nombre="verified" color={colores.exito} tamano={20} />
              </View>
            ) : null}
          </View>
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
          icono="badge"
          titulo="Mis datos"
          detalle="Nombre, barrio y celular."
          onPress={() => router.push('/editar-perfil')}
        />
        <FilaOpcion
          icono="edit"
          titulo="Completar perfil"
          detalle="Tus oficios, tu foto y los permisos de la app."
          onPress={() => router.push('/completar-perfil')}
        />
        <FilaOpcion
          icono="verified_user"
          titulo="Verificar identidad"
          detalle={identidad.detalle}
          chip={identidad.texto}
          varianteChip={identidad.variante}
          onPress={() => router.push('/verificar-identidad')}
        />
        {perfil?.validador ? (
          <FilaOpcion
            icono="fact_check"
            titulo="Validar identidades"
            detalle="Equipo validador: revisa las solicitudes pendientes."
            onPress={() => router.push('/validar-identidades')}
          />
        ) : null}
        <FilaOpcion
          icono="notifications"
          titulo="Notificaciones"
          detalle={permiso === 'concedido' ? 'Activadas. Toca para enviarte una de prueba.' : 'Desactivadas. Toca para activarlas.'}
          chip={permiso === 'concedido' ? undefined : 'Desactivadas'}
          onPress={() => void probarNotificaciones()}
        />
        {pendientes > 0 ? (
          <FilaOpcion
            icono="schedule_send"
            titulo="Acciones pendientes"
            detalle="Lo que hiciste sin internet y aún no se envía."
            chip={`${pendientes} sin enviar`}
            varianteChip="contorno"
            onPress={() => router.push('/pendientes')}
          />
        ) : null}
        <FilaOpcion
          icono="lock"
          titulo="Cambiar clave"
          detalle="Cierra tu sesión en otros teléfonos."
          onPress={() => router.push('/cambiar-clave')}
        />
        <FilaOpcion
          icono="help"
          titulo="Guía de ayuda"
          detalle="Aprende a pedir y ofrecer ayuda, paso a paso."
          onPress={() => router.push('/guia')}
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

      {!modoDesarrollo ? (
        <Boton texto="Eliminar mi cuenta" variante="enlace" onPress={() => router.push('/eliminar-cuenta')} />
      ) : null}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  tarjetaPerfil: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.l, padding: ESPACIO.l, borderRadius: RADIO.tarjeta },
  textosPerfil: { flex: 1, gap: ESPACIO.xs },
  filaNombre: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.xs },
  nombre: { flexShrink: 1 },
  camara: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
