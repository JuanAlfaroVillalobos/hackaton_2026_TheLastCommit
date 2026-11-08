import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from '@/compartido/tema';
import { Boton } from '@/compartido/ui';
import { ErrorApi } from '@/nucleo/api';
import { useSesion } from '@/nucleo/sesion';
import * as Haptics from 'expo-haptics';
import { router, usePreventRemove } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { CajaAviso } from '../componentes/CajaAviso';
import { CampoTexto } from '../componentes/CampoTexto';
import { Pantalla } from '../componentes/Pantalla';
import { Titular } from '../componentes/Titular';
import { consultarDisponibilidad } from '../servicios/disponibilidad';
import { errorNombre, errorTelefono, formatearTelefono, LIMITES, normalizarNombre } from '../validaciones';

type Campo = 'nombre' | 'barrio' | 'telefono';

const sinPrefijo = (telefono: string | null | undefined) => (telefono ?? '').replace(/^\+51/, '');

/**
 * @description Error del barrio o undefined si es válido.
 */
function errorBarrio(valor: string): string | undefined {
  const v = valor.trim().replace(/\s+/g, ' ');
  if (!v) return 'Escribe tu barrio o urbanización.';
  if (v.length < 3) return 'Escribe al menos 3 caracteres.';
  if (v.length > 60) return 'Usa como máximo 60 caracteres.';
  return undefined;
}

/**
 * @description Editar mis datos (P10, RF05): nombre, barrio y celular, con las mismas validaciones del registro. Avisa si sales con cambios sin guardar.
 */
export default function EditarPerfilPantalla() {
  const { colores } = useTema();
  const { perfil, actualizarPerfil } = useSesion();
  // Valores al abrir la pantalla, para saber qué cambió.
  const [original] = useState(() => ({
    nombre: perfil?.nombre ?? '',
    barrio: perfil?.barrio ?? '',
    telefono: sinPrefijo(perfil?.telefono),
  }));
  const [datos, setDatos] = useState(original);
  const [tocados, setTocados] = useState<Partial<Record<Campo, boolean>>>({});
  const [errorApi, setErrorApi] = useState<Partial<Record<Campo, string>>>({});
  const [telefonoOcupado, setTelefonoOcupado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const errores: Partial<Record<Campo, string>> = {
    nombre: errorNombre(datos.nombre),
    barrio: errorBarrio(datos.barrio),
    telefono: errorTelefono(datos.telefono) ?? (telefonoOcupado ? 'Este celular ya está registrado en otra cuenta.' : undefined),
  };
  const visible = (c: Campo) => errorApi[c] ?? (tocados[c] ? errores[c] : undefined);
  const cambiados = (Object.keys(datos) as Campo[]).filter((c) => datos[c].trim() !== original[c].trim());
  const sucio = cambiados.length > 0;

  const descartar = usePreventRemove(sucio && !guardando, ({ repeat }) => {
    Alert.alert('¿Descartar los cambios?', 'Tienes cambios sin guardar en tus datos.', [
      { text: 'Seguir editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: repeat },
    ]);
  });

  const cambiar = (c: Campo, v: string) => {
    setDatos((d) => ({ ...d, [c]: c === 'telefono' ? v.replace(/\D/g, '').slice(0, 9) : v }));
    setErrorApi((e) => ({ ...e, [c]: undefined }));
    if (c === 'telefono') setTelefonoOcupado(false);
  };

  const salir = async (c: Campo) => {
    setTocados((t) => ({ ...t, [c]: true }));
    if (c === 'nombre' && datos.nombre.trim()) setDatos((d) => ({ ...d, nombre: normalizarNombre(d.nombre) }));
    if (c === 'barrio') setDatos((d) => ({ ...d, barrio: d.barrio.trim().replace(/\s+/g, ' ') }));
    if (c === 'telefono' && !errorTelefono(datos.telefono) && datos.telefono !== original.telefono) {
      const valor = datos.telefono;
      if ((await consultarDisponibilidad('telefono', valor)) === 'ocupado') setTelefonoOcupado(true);
    }
  };

  const guardar = async () => {
    setTocados({ nombre: true, barrio: true, telefono: true });
    if (errores.nombre || errores.barrio || errores.telefono) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      return;
    }
    setGuardando(true);
    try {
      await actualizarPerfil({
        ...(cambiados.includes('nombre') && { nombre: normalizarNombre(datos.nombre) }),
        ...(cambiados.includes('barrio') && { barrio: datos.barrio.trim().replace(/\s+/g, ' ') }),
        ...(cambiados.includes('telefono') && { telefono: `+51${datos.telefono}` }),
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      descartar();
      router.back();
    } catch (error) {
      setGuardando(false);
      const mensaje = error instanceof Error ? error.message : 'Inténtalo de nuevo.';
      if (error instanceof ErrorApi && (error.estado === 409 || /celular|tel[eé]fono/i.test(mensaje))) setErrorApi({ telefono: mensaje });
      else if (error instanceof ErrorApi && /barrio/i.test(mensaje)) setErrorApi({ barrio: mensaje });
      else if (error instanceof ErrorApi && /nombre/i.test(mensaje)) setErrorApi({ nombre: mensaje });
      else Alert.alert('No se guardaron tus datos', mensaje);
    }
  };

  return (
    <Pantalla>
      <Titular conVolver etiqueta="Mi cuenta" titulo="Tus datos." subtitulo="Tus vecinos ven tu nombre. Tu celular nunca se publica." />

      <View style={styles.formulario}>
        <CampoTexto
          etiqueta="Nombre y apellido"
          icono="person"
          valor={datos.nombre}
          onCambiar={(v) => cambiar('nombre', v)}
          onSalir={() => void salir('nombre')}
          autoCapitalize="words"
          autoComplete="name"
          autoCorrect={false}
          maxLength={LIMITES.nombre}
          error={visible('nombre')}
          exito={Boolean(tocados.nombre) && !visible('nombre')}
        />
        <CampoTexto
          etiqueta="Barrio o urbanización"
          icono="home_pin"
          valor={datos.barrio}
          onCambiar={(v) => cambiar('barrio', v)}
          onSalir={() => void salir('barrio')}
          placeholder="Ej.: Urb. Los Olivos"
          autoCapitalize="words"
          maxLength={60}
          ayuda="Ayuda a tus vecinos a ubicarte sin mostrar tu dirección exacta."
          error={visible('barrio')}
          exito={Boolean(tocados.barrio) && !visible('barrio')}
        />
        <CampoTexto
          etiqueta="Celular"
          icono="call"
          prefijo="+51"
          valor={formatearTelefono(datos.telefono)}
          onCambiar={(v) => cambiar('telefono', v)}
          onSalir={() => void salir('telefono')}
          keyboardType="phone-pad"
          autoComplete="tel-national"
          maxLength={11}
          ayuda="Lo usamos para las alertas por SMS cuando no hay internet."
          error={visible('telefono')}
          exito={Boolean(tocados.telefono) && !visible('telefono')}
        />
        <View style={styles.correo}>
          <Text style={[TIPO.cuerpoFuerte, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            Correo
          </Text>
          <Text style={[TIPO.cuerpo, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            {perfil?.correo}
          </Text>
        </View>
      </View>

      {cambiados.includes('telefono') ? (
        <CajaAviso
          tono="marca"
          icono="sms"
          titulo="Cambiarás tu número para SMS"
          texto="Las alertas sin internet llegarán al número nuevo y tus mensajes SMS saldrán con él."
        />
      ) : null}

      <Boton
        texto={guardando ? 'Guardando…' : 'Guardar cambios'}
        icono="check"
        deshabilitado={!sucio || guardando}
        motivoDeshabilitado={!sucio ? 'No hay cambios por guardar.' : undefined}
        onPress={() => void guardar()}
      />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  formulario: { gap: ESPACIO.l },
  correo: { gap: ESPACIO.xs },
});
