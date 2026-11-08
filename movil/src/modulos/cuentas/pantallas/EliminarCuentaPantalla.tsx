import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from '@/compartido/tema';
import { Boton, Icono, Tarjeta, type NombreIcono } from '@/compartido/ui';
import { ErrorApi } from '@/nucleo/api';
import { useSesion } from '@/nucleo/sesion';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { CampoTexto } from '../componentes/CampoTexto';
import { Pantalla } from '../componentes/Pantalla';
import { Titular } from '../componentes/Titular';
import { eliminarCuenta } from '../servicios/cuenta';

const SE_BORRA: { icono: NombreIcono; texto: string }[] = [
  { icono: 'person_off', texto: 'Tu perfil, tu foto y tus oficios.' },
  { icono: 'badge', texto: 'Tu DNI, tu selfie y la insignia de identidad.' },
  { icono: 'notifications_off', texto: 'Los avisos en todos tus teléfonos.' },
  { icono: 'history', texto: 'Tus horas de ayuda y calificaciones.' },
];

/**
 * @description Eliminar cuenta (derecho de cancelación, Ley 29733): explica qué se borra y pide la clave y escribir ELIMINAR. No se puede deshacer.
 */
export default function EliminarCuentaPantalla() {
  const { colores } = useTema();
  const { salir, modoDesarrollo } = useSesion();
  const [clave, setClave] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [errorClave, setErrorClave] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);

  const listo = clave.length > 0 && confirmacion.trim().toUpperCase() === 'ELIMINAR';

  const eliminar = () => {
    if (modoDesarrollo) {
      Alert.alert('Eliminar cuenta', 'En modo desarrollo no hay una cuenta real que eliminar.');
      return;
    }
    Alert.alert('¿Eliminar tu cuenta?', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setEnviando(true);
          try {
            await eliminarCuenta(clave);
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
            await salir();
            Alert.alert('Cuenta eliminada', 'Borramos tus datos. Gracias por haber sido parte de tu barrio.');
          } catch (error) {
            setEnviando(false);
            const mensaje = error instanceof Error ? error.message : 'Inténtalo de nuevo.';
            if (error instanceof ErrorApi && error.codigo === 'CLAVE_INCORRECTA') setErrorClave(mensaje);
            else Alert.alert('No se eliminó tu cuenta', mensaje);
          }
        },
      },
    ]);
  };

  return (
    <Pantalla>
      <Titular conVolver etiqueta="Mi cuenta" titulo="Eliminar mi cuenta." subtitulo="Lamentamos que te vayas. Antes, revisa qué pasará." />

      <Tarjeta>
        <Text style={[TIPO.cuerpoFuerte, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          Se borrará para siempre:
        </Text>
        <View style={styles.lista}>
          {SE_BORRA.map((i) => (
            <View key={i.texto} style={styles.fila}>
              <Icono nombre={i.icono} color={colores.sos} tamano={22} />
              <Text style={[TIPO.cuerpo, styles.flex, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
                {i.texto}
              </Text>
            </View>
          ))}
        </View>
      </Tarjeta>

      <Text style={[TIPO.pequeno, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
        Si tienes un pedido de ayuda activo, ciérralo antes. Podrás crear una cuenta nueva cuando quieras.
      </Text>

      <View style={styles.formulario}>
        <CampoTexto
          etiqueta="Tu clave"
          icono="lock"
          clave
          valor={clave}
          onCambiar={(v) => {
            setClave(v);
            setErrorClave(undefined);
          }}
          autoComplete="current-password"
          autoCapitalize="none"
          error={errorClave}
        />
        <CampoTexto
          etiqueta="Escribe ELIMINAR para confirmar"
          icono="warning"
          valor={confirmacion}
          onCambiar={setConfirmacion}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          exito={confirmacion.trim().toUpperCase() === 'ELIMINAR'}
        />
      </View>

      <Boton
        texto={enviando ? 'Eliminando…' : 'Eliminar mi cuenta'}
        icono="delete_forever"
        deshabilitado={!listo || enviando}
        motivoDeshabilitado="Escribe tu clave y la palabra ELIMINAR."
        onPress={eliminar}
      />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  lista: { gap: ESPACIO.m, marginTop: ESPACIO.m },
  fila: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.m },
  flex: { flex: 1 },
  formulario: { gap: ESPACIO.l },
});
