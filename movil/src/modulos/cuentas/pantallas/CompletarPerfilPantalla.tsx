import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from '@/compartido/tema';
import { Boton, Chip, ChipFiltro, Icono, Tarjeta, type NombreIcono } from '@/compartido/ui';
import { useSesion } from '@/nucleo/sesion';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../componentes/Avatar';
import { CajaAviso } from '../componentes/CajaAviso';
import { Pantalla } from '../componentes/Pantalla';
import { Titular } from '../componentes/Titular';

// Catálogo de oficios de RN-03. Cuando exista en compartido/constantes, se importa de ahí.
const OFICIOS = [
  'Gasfitería',
  'Electricidad',
  'Carpintería',
  'Limpieza',
  'Cuidado de niños',
  'Cuidado de adultos mayores',
  'Mascotas',
  'Clases y tutorías',
  'Tecnología',
  'Mandados y compras',
  'Primeros auxilios',
  'Otro',
] as const;

const MAX_OFICIOS = 5;

const PERMISOS: { icono: NombreIcono; titulo: string; texto: string }[] = [
  { icono: 'location_on', titulo: 'Ubicación', texto: 'Para mostrarte necesidades y servicios cerca de ti.' },
  { icono: 'notifications', titulo: 'Notificaciones', texto: 'Para avisarte cuando alguien te ayude o haya una emergencia.' },
  { icono: 'sms', titulo: 'SMS', texto: 'Para pedir y recibir ayuda aunque no tengas internet.' },
  { icono: 'warning', titulo: 'Alertas a pantalla completa', texto: 'Para que una emergencia encienda tu pantalla.' },
  { icono: 'battery_full', titulo: 'Sin ahorro de batería', texto: 'Para que el teléfono no bloquee las alertas.' },
];

/**
 * @description Completar perfil (P03, RF05, RF06, RF08): oficios de 1 a 5, foto y permisos explicados. Por ahora es visual; se guarda en A3.
 */
export default function CompletarPerfilPantalla() {
  const { colores } = useTema();
  const { usuario } = useSesion();
  const [elegidos, setElegidos] = useState<string[]>([]);

  const alternar = (oficio: string) => {
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
          <Avatar nombre={usuario?.displayName ?? 'Vecino'} tamano={64} />
          <View style={styles.textos}>
            <Text style={[TIPO.cuerpoFuerte, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
              Foto de perfil
            </Text>
            <Text style={[TIPO.pequeno, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
              Opcional. Ayuda a que tus vecinos te reconozcan.
            </Text>
          </View>
        </View>
        <View style={styles.botonFoto}>
          <Boton
            texto="Agregar foto"
            icono="photo_camera"
            variante="secundario"
            onPress={() => Alert.alert('Foto de perfil', 'Disponible pronto (tarea A3).')}
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
          {OFICIOS.map((oficio) => (
            <ChipFiltro key={oficio} texto={oficio} activo={elegidos.includes(oficio)} onPress={() => alternar(oficio)} />
          ))}
        </View>
      </View>

      <View style={styles.seccion}>
        <Text style={[TIPO.seccion, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          Permisos
        </Text>
        <Text style={[TIPO.pequeno, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          Te explicamos para qué sirve cada uno antes de pedirlo.
        </Text>
        {PERMISOS.map((p) => (
          <Tarjeta key={p.titulo}>
            <View style={styles.permiso}>
              <Icono nombre={p.icono} color={colores.primario} tamano={24} />
              <View style={styles.textos}>
                <Text style={[TIPO.cuerpoFuerte, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
                  {p.titulo}
                </Text>
                <Text style={[TIPO.pequeno, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
                  {p.texto}
                </Text>
              </View>
              <Chip texto="Pendiente" variante="neutro" />
            </View>
          </Tarjeta>
        ))}
      </View>

      <CajaAviso
        icono="lock"
        titulo="Tú decides"
        texto="Puedes cambiar tus oficios y permisos cuando quieras desde Mi perfil."
      />

      <Boton
        texto="Guardar y continuar"
        icono="check_circle"
        deshabilitado={elegidos.length === 0}
        motivoDeshabilitado="Elige al menos un oficio para continuar."
        onPress={() => router.back()}
      />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  foto: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.l },
  botonFoto: { marginTop: ESPACIO.m },
  textos: { flex: 1, gap: 2 },
  seccion: { gap: ESPACIO.m },
  cabecera: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', columnGap: ESPACIO.s },
  permiso: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.m },
});
