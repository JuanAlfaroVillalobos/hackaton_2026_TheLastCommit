import { ESPACIO, MAX_ESCALA_FUENTE, RADIO, TIPO, useTema } from '@/compartido/tema';
import { Boton, ChipFiltro, ListaVacia, Tarjeta } from '@/compartido/ui';
import { useSesion } from '@/nucleo/sesion';
import { CajaAviso, CampoTexto, Pantalla, Titular } from '@/modulos/cuentas';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { fuenteFotoPrivada, listarPendientes, revisarIdentidad } from '../servicios/identidadServicio';
import type { SolicitudPendiente } from '../tipos';

const MOTIVOS = [
  'La foto del DNI está borrosa o incompleta',
  'La selfie no coincide con la foto del DNI',
  'Los nombres o el número no coinciden con el DNI',
  'La selfie no es una foto tomada en el momento',
];

/**
 * @description Una solicitud pendiente: datos, fotos privadas y acciones de aprobar o rechazar con motivo.
 */
function TarjetaSolicitud({ s, alTerminar }: { s: SolicitudPendiente; alTerminar: () => void }) {
  const { colores } = useTema();
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [otro, setOtro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const motivoFinal = motivo === 'otro' ? otro.trim() : motivo;

  const decidir = async (decision: 'aprobar' | 'rechazar') => {
    setEnviando(true);
    try {
      await revisarIdentidad(s.uid, decision, decision === 'rechazar' ? motivoFinal : undefined);
      alTerminar();
    } catch (error) {
      Alert.alert('No se guardó la revisión', error instanceof Error ? error.message : 'Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const aprobar = () =>
    Alert.alert('Aprobar identidad', `¿Confirmas que la selfie y el DNI son de ${s.nombres} ${s.apellidos}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Aprobar', onPress: () => void decidir('aprobar') },
    ]);

  return (
    <Tarjeta>
      <View style={styles.bloque}>
        <Text style={[TIPO.cuerpoFuerte, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          {s.nombres} {s.apellidos}
        </Text>
        <Text style={[TIPO.pequeno, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          DNI {s.dni} · Perfil «{s.nombrePerfil}» · {s.correo}
        </Text>
        <Text style={[TIPO.pequeno, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          Enviada {new Date(s.enviadaEn).toLocaleString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <View style={styles.fotos}>
        <View style={styles.fotoCol}>
          <Text style={[TIPO.chip, { color: colores.textoSecundario }]}>DNI</Text>
          <Image
            source={fuenteFotoPrivada(s.uid, 'dni')}
            style={[styles.foto, { aspectRatio: 1.58, backgroundColor: colores.superficieAlterna }]}
            contentFit="cover"
            cachePolicy="none"
            accessibilityLabel={`Foto del DNI de ${s.nombres}`}
          />
        </View>
        <View style={[styles.fotoCol, styles.selfieCol]}>
          <Text style={[TIPO.chip, { color: colores.textoSecundario }]}>Selfie</Text>
          <Image
            source={fuenteFotoPrivada(s.uid, 'selfie')}
            style={[styles.foto, { aspectRatio: 0.8, backgroundColor: colores.superficieAlterna }]}
            contentFit="cover"
            cachePolicy="none"
            accessibilityLabel={`Selfie de ${s.nombres}`}
          />
        </View>
      </View>

      {rechazando ? (
        <View style={styles.bloque}>
          <Text style={[TIPO.cuerpoFuerte, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            ¿Por qué la rechazas?
          </Text>
          <View style={styles.chips}>
            {MOTIVOS.map((m) => (
              <ChipFiltro key={m} texto={m} activo={motivo === m} onPress={() => setMotivo(m)} />
            ))}
            <ChipFiltro texto="Otro motivo" activo={motivo === 'otro'} onPress={() => setMotivo('otro')} />
          </View>
          {motivo === 'otro' ? (
            <CampoTexto
              etiqueta="Motivo"
              valor={otro}
              onCambiar={setOtro}
              placeholder="Explícalo en pocas palabras"
              maxLength={120}
              error={otro && otro.trim().length < 5 ? 'Escribe al menos 5 caracteres.' : undefined}
            />
          ) : null}
          <Boton
            texto={enviando ? 'Guardando…' : 'Confirmar rechazo'}
            icono="block"
            deshabilitado={enviando || motivoFinal.length < 5}
            motivoDeshabilitado="Elige o escribe el motivo."
            onPress={() => void decidir('rechazar')}
          />
          <Boton texto="Cancelar" variante="enlace" onPress={() => setRechazando(false)} />
        </View>
      ) : (
        <View style={styles.acciones}>
          <View style={styles.flex}>
            <Boton texto="Rechazar" icono="close" variante="secundario" deshabilitado={enviando} onPress={() => setRechazando(true)} />
          </View>
          <View style={styles.flex}>
            <Boton texto={enviando ? 'Guardando…' : 'Aprobar'} icono="verified" deshabilitado={enviando} onPress={aprobar} />
          </View>
        </View>
      )}
    </Tarjeta>
  );
}

/**
 * @description Pantalla oculta del equipo validador (RF36): revisa las identidades pendientes. Solo la abre un perfil con `validador`.
 */
export default function ValidarIdentidadesPantalla() {
  const { colores } = useTema();
  const { perfil } = useSesion();
  const [pendientes, setPendientes] = useState<SolicitudPendiente[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      setPendientes((await listarPendientes()).pendientes);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la lista.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  if (!perfil?.validador) {
    return (
      <Pantalla>
        <Titular conVolver etiqueta="Validación" titulo="Sin acceso" />
        <CajaAviso tono="neutro" icono="lock" titulo="Solo para el equipo validador" texto="Tu cuenta no puede revisar identidades." />
      </Pantalla>
    );
  }

  return (
    <Pantalla>
      <Titular
        conVolver
        etiqueta="Equipo validador"
        titulo="Identidades por revisar."
        subtitulo="Compara la selfie con la foto del DNI y que los datos coincidan."
      />

      {error ? <CajaAviso tono="neutro" icono="cloud_off" titulo="No se pudo cargar" texto={error} /> : null}

      {pendientes === null && !error ? <ActivityIndicator size="large" color={colores.primario} /> : null}

      {pendientes?.length === 0 ? (
        <ListaVacia texto="Todo al día: no hay identidades pendientes. Te avisaremos cuando llegue una." />
      ) : null}

      {pendientes?.map((s) => (
        <TarjetaSolicitud key={s.uid} s={s} alTerminar={() => void cargar()} />
      ))}

      <Boton texto="Actualizar" icono="refresh" variante="secundario" onPress={() => void cargar()} />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  bloque: { gap: ESPACIO.s },
  fotos: { flexDirection: 'row', gap: ESPACIO.m, marginVertical: ESPACIO.m, alignItems: 'flex-end' },
  fotoCol: { flex: 1.6, gap: ESPACIO.xs },
  selfieCol: { flex: 1 },
  foto: { width: '100%', borderRadius: RADIO.boton },
  chips: { flexDirection: 'row', flexWrap: 'wrap', columnGap: ESPACIO.s },
  acciones: { flexDirection: 'row', gap: ESPACIO.m },
  flex: { flex: 1 },
});
