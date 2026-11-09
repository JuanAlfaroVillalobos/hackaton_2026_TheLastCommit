import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from '@/compartido/tema';
import { Boton } from '@/compartido/ui';
import { useSesion } from '@/nucleo/sesion';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { CajaAviso } from '../componentes/CajaAviso';
import { CampoTexto } from '../componentes/CampoTexto';
import { Pantalla } from '../componentes/Pantalla';
import { Titular } from '../componentes/Titular';

/**
 * @description Inicio de sesión (P01, RF02, RF04, RF07) con Firebase Auth (vía la API); en desarrollo permite entrar sin cuenta.
 */
export default function IngresarPantalla() {
  const { colores } = useTema();
  const { entrarModoDesarrollo, ingresar } = useSesion();
  const params = useLocalSearchParams<{ correo?: string }>();
  const [correo, setCorreo] = useState(params.correo ?? '');
  const [clave, setClave] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Cuenta de prueba de la API simulada: ana@vecinos.pe / vecinos123.
  const enviar = async () => {
    if (!correo.trim() || !clave) {
      Alert.alert('Ingresar', 'Escribe tu correo y tu clave.');
      return;
    }
    setEnviando(true);
    try {
      await ingresar(correo.trim(), clave);
    } catch (error) {
      Alert.alert('No pudimos ingresar', error instanceof Error ? error.message : 'Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Pantalla>
      <Titular conVolver etiqueta="Iniciar sesión" titulo="Hola de nuevo." subtitulo="Entra para ver lo que pasa en tu barrio." />

      <View style={styles.formulario}>
        <CampoTexto
          etiqueta="Correo"
          icono="mail"
          valor={correo}
          onCambiar={setCorreo}
          placeholder="tucorreo@ejemplo.com"
          keyboardType="email-address"
          autoComplete="email"
          autoCapitalize="none"
        />
        <CampoTexto
          etiqueta="Clave"
          icono="lock"
          clave
          valor={clave}
          onCambiar={setClave}
          placeholder="Tu clave"
          autoComplete="password"
          autoCapitalize="none"
        />
        <View style={styles.olvido}>
          <Boton texto="¿Olvidaste tu clave?" variante="enlace" onPress={() => router.push({ pathname: '/recuperar-clave', params: { correo: correo.trim() } })} />
        </View>
        <Boton texto={enviando ? 'Ingresando…' : 'Ingresar'} icono="login" deshabilitado={enviando} onPress={enviar} />
      </View>

      <View style={styles.registro}>
        <Text style={[TIPO.cuerpo, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          ¿Aún no tienes cuenta?
        </Text>
        <Boton texto="Crear cuenta" variante="enlace" onPress={() => router.push('/registro')} />
      </View>

      {__DEV__ ? (
        <View style={styles.desarrollo}>
          <CajaAviso
            tono="neutro"
            icono="code"
            titulo="Modo desarrollo"
            texto="Entra sin cuenta para probar las pantallas mientras se conecta el inicio de sesión."
          />
          <Boton texto="Entrar sin cuenta" variante="secundario" onPress={entrarModoDesarrollo} />
        </View>
      ) : null}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  formulario: { gap: ESPACIO.l },
  olvido: { alignSelf: 'flex-end', marginTop: -ESPACIO.s },
  registro: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  desarrollo: { gap: ESPACIO.m, marginTop: ESPACIO.s },
});
