import { ESPACIO } from '@/compartido/tema';
import { Boton } from '@/compartido/ui';
import { ErrorApi } from '@/nucleo/api';
import { useSesion } from '@/nucleo/sesion';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { CajaAviso } from '../componentes/CajaAviso';
import { CampoTexto } from '../componentes/CampoTexto';
import { MedidorClave } from '../componentes/MedidorClave';
import { Pantalla } from '../componentes/Pantalla';
import { Titular } from '../componentes/Titular';
import { cambiarClave } from '../servicios/cuenta';
import { errorClave, LIMITES } from '../validaciones';

type Campo = 'actual' | 'nueva' | 'confirmacion';

/**
 * @description Cambiar clave con la sesión iniciada: pide la actual, la nueva con medidor de fuerza y su confirmación. Cierra las sesiones de otros teléfonos.
 */
export default function CambiarClavePantalla() {
  const { perfil } = useSesion();
  const [datos, setDatos] = useState<Record<Campo, string>>({ actual: '', nueva: '', confirmacion: '' });
  const [intentado, setIntentado] = useState(false);
  const [errorApi, setErrorApi] = useState<Partial<Record<Campo, string>>>({});
  const [enviando, setEnviando] = useState(false);

  const contexto = { nombre: perfil?.nombre, correo: perfil?.correo, telefono: perfil?.telefono?.replace(/^\+51/, '') };
  const errores: Partial<Record<Campo, string>> = {
    actual: datos.actual ? undefined : 'Escribe tu clave actual.',
    nueva:
      errorClave(datos.nueva, contexto) ??
      (datos.nueva && datos.nueva === datos.actual ? 'La clave nueva debe ser distinta de la actual.' : undefined),
    confirmacion: !datos.confirmacion ? 'Repite la clave nueva.' : datos.confirmacion !== datos.nueva ? 'Las claves no coinciden.' : undefined,
  };
  const visible = (c: Campo) => errorApi[c] ?? (intentado ? errores[c] : undefined);
  const cambiar = (c: Campo) => (v: string) => {
    setDatos((d) => ({ ...d, [c]: v }));
    setErrorApi((e) => ({ ...e, [c]: undefined }));
  };

  const guardar = async () => {
    setIntentado(true);
    if (errores.actual || errores.nueva || errores.confirmacion) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      return;
    }
    setEnviando(true);
    try {
      await cambiarClave(datos.actual, datos.nueva);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      Alert.alert('Clave actualizada', 'Cerramos tu sesión en otros teléfonos. En este sigues conectado.', [
        { text: 'Listo', onPress: () => router.back() },
      ]);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Inténtalo de nuevo.';
      if (error instanceof ErrorApi && error.codigo === 'CLAVE_ACTUAL_INCORRECTA') setErrorApi({ actual: mensaje });
      else if (error instanceof ErrorApi && error.estado === 400) setErrorApi({ nueva: mensaje });
      else Alert.alert('No se cambió tu clave', mensaje);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Pantalla>
      <Titular conVolver etiqueta="Seguridad" titulo="Cambia tu clave." subtitulo="Elige una que no uses en otras apps." />

      <View style={styles.formulario}>
        <CampoTexto
          etiqueta="Clave actual"
          icono="lock"
          clave
          valor={datos.actual}
          onCambiar={cambiar('actual')}
          autoComplete="current-password"
          autoCapitalize="none"
          maxLength={LIMITES.claveMax}
          error={visible('actual')}
        />
        <CampoTexto
          etiqueta="Clave nueva"
          icono="lock_reset"
          clave
          valor={datos.nueva}
          onCambiar={cambiar('nueva')}
          autoComplete="new-password"
          autoCapitalize="none"
          maxLength={LIMITES.claveMax}
          error={visible('nueva')}
          exito={Boolean(datos.nueva) && !errores.nueva}
        >
          <MedidorClave clave={datos.nueva} contexto={contexto} />
        </CampoTexto>
        <CampoTexto
          etiqueta="Confirma la clave nueva"
          icono="lock"
          clave
          valor={datos.confirmacion}
          onCambiar={cambiar('confirmacion')}
          autoComplete="new-password"
          autoCapitalize="none"
          maxLength={LIMITES.claveMax}
          error={visible('confirmacion')}
          exito={datos.confirmacion && datos.confirmacion === datos.nueva ? 'Las claves coinciden.' : false}
        />
      </View>

      <CajaAviso icono="devices" titulo="Por tu seguridad" texto="Al cambiarla, se cerrará tu sesión en los demás teléfonos donde hayas entrado." />

      <Boton texto={enviando ? 'Guardando…' : 'Cambiar clave'} icono="check" deshabilitado={enviando} onPress={() => void guardar()} />
      <Boton
        texto="¿Olvidaste tu clave actual?"
        variante="enlace"
        onPress={() =>
          Alert.alert('Recuperar clave', 'Cierra sesión y toca «¿Olvidaste tu clave?» en la pantalla de ingreso para recibir un código.')
        }
      />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  formulario: { gap: ESPACIO.l },
});
