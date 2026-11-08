import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from '@/compartido/tema';
import { Boton, Chip, Icono, ListaVacia, Tarjeta } from '@/compartido/ui';
import { descartarAccion, sincronizarBandeja, useBandeja, type AccionGuardada } from '@/nucleo/bandeja-salida';
import { useConexion } from '@/nucleo/red';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { CajaAviso } from '../componentes/CajaAviso';
import { Pantalla } from '../componentes/Pantalla';
import { Titular } from '../componentes/Titular';

/**
 * @description «hace 5 min», «hace 2 h» o la fecha, para cuándo se guardó la acción.
 */
function hace(ms: number): string {
  const min = Math.round((Date.now() - ms) / 60_000);
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} min`;
  if (min < 24 * 60) return `hace ${Math.round(min / 60)} h`;
  return new Date(ms).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}

/**
 * @description Una acción en espera con su estado y la opción de descartarla.
 */
function FilaAccion({ accion }: { accion: AccionGuardada }) {
  const { colores } = useTema();
  const porSms = accion.estado === 'enviada-sms';

  const descartar = () =>
    Alert.alert('¿Descartar esta acción?', `«${accion.descripcion}» no se enviará.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => void descartarAccion(accion.idAccion) },
    ]);

  return (
    <Tarjeta>
      <View style={styles.fila}>
        <Icono nombre={porSms ? 'sms' : 'schedule_send'} color={porSms ? colores.exito : colores.primario} tamano={24} />
        <View style={styles.textos}>
          <Text style={[TIPO.cuerpoFuerte, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            {accion.descripcion}
          </Text>
          <Text style={[TIPO.pequeno, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            Guardada {hace(accion.creadaEn)}
            {accion.intentos > 0 ? ` · ${accion.intentos} ${accion.intentos === 1 ? 'intento' : 'intentos'}` : ''}
          </Text>
          <Chip texto={porSms ? 'Enviada por SMS' : 'Pendiente de enviar'} variante={porSms ? 'exito' : 'neutro'} />
        </View>
      </View>
      {!porSms ? (
        <View style={styles.accion}>
          <Boton texto="Descartar" icono="delete" variante="enlace" onPress={descartar} />
        </View>
      ) : null}
    </Tarjeta>
  );
}

/**
 * @description Acciones pendientes (RF41): lo que se hizo sin internet y espera enviarse, en orden. Permite enviarlas ahora o descartarlas.
 */
export default function PendientesPantalla() {
  const acciones = useBandeja();
  const { sinConexion } = useConexion();
  const [enviando, setEnviando] = useState(false);

  const enviarAhora = async () => {
    setEnviando(true);
    try {
      await sincronizarBandeja();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Pantalla>
      <Titular
        conVolver
        etiqueta="Sin conexión"
        titulo="Acciones pendientes."
        subtitulo="Lo que hiciste sin internet se envía solo, en orden, cuando vuelve la señal."
      />

      {sinConexion ? (
        <CajaAviso tono="neutro" icono="cloud_off" titulo="Sin internet" texto="Las enviaremos apenas vuelva la señal. No cierres sesión." />
      ) : null}

      {acciones.length === 0 ? <ListaVacia texto="No tienes acciones pendientes. Todo está enviado." /> : null}

      {acciones.map((a) => (
        <FilaAccion key={a.idAccion} accion={a} />
      ))}

      {acciones.length > 0 ? (
        <Boton
          texto={enviando ? 'Enviando…' : 'Intentar enviar ahora'}
          icono="sync"
          deshabilitado={enviando || sinConexion}
          motivoDeshabilitado={sinConexion ? 'Necesitas internet para enviarlas.' : undefined}
          onPress={() => void enviarAhora()}
        />
      ) : null}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'flex-start', gap: ESPACIO.m },
  textos: { flex: 1, gap: ESPACIO.xs },
  accion: { alignItems: 'flex-end', marginTop: ESPACIO.s },
});
