import { ESPACIO } from '@/compartido/tema';
import { Boton } from '@/compartido/ui';
import { useSesion } from '@/nucleo/sesion';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { CajaAviso } from '../componentes/CajaAviso';
import { CampoTexto } from '../componentes/CampoTexto';
import { MedidorClave } from '../componentes/MedidorClave';
import { Pantalla } from '../componentes/Pantalla';
import { Titular } from '../componentes/Titular';
import { errorClave, errorCorreo } from '../validaciones';

/**
 * @description Recuperar clave (RF07) en dos pasos: correo → código de 6 dígitos y clave nueva. Al terminar deja la sesión abierta.
 */
export default function RecuperarClavePantalla() {
  const { pedirCodigoClave, restablecerClave } = useSesion();
  const params = useLocalSearchParams<{ correo?: string }>();
  const [paso, setPaso] = useState<'correo' | 'codigo'>('correo');
  const [correo, setCorreo] = useState(params.correo ?? '');
  const [codigo, setCodigo] = useState('');
  const [clave, setClave] = useState('');
  const [codigoDemo, setCodigoDemo] = useState<string | undefined>();
  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const errorDeCorreo = intentado && paso === 'correo' ? errorCorreo(correo) : undefined;
  const errorDeCodigo = intentado && paso === 'codigo' && !/^\d{6}$/.test(codigo) ? 'El código tiene 6 dígitos.' : undefined;
  const errorDeClave = intentado && paso === 'codigo' ? errorClave(clave, { correo }) : undefined;

  const pedirCodigo = async () => {
    setIntentado(true);
    if (errorCorreo(correo)) return;
    setEnviando(true);
    try {
      setCodigoDemo(await pedirCodigoClave(correo));
      setIntentado(false);
      setPaso('codigo');
    } catch (error) {
      Alert.alert('No pudimos enviar el código', error instanceof Error ? error.message : 'Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const cambiarClave = async () => {
    setIntentado(true);
    if (!/^\d{6}$/.test(codigo) || errorClave(clave, { correo })) return;
    setEnviando(true);
    try {
      await restablecerClave(correo, codigo, clave);
      // Con la sesión abierta, la navegación pasa sola a la app.
    } catch (error) {
      Alert.alert('No pudimos cambiar tu clave', error instanceof Error ? error.message : 'Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  if (paso === 'correo') {
    return (
      <Pantalla>
        <Titular
          conVolver
          etiqueta="Recuperar clave"
          titulo="¿Olvidaste tu clave?"
          subtitulo="Escribe tu correo y te enviaremos un código para crear una nueva."
        />
        <CampoTexto
          etiqueta="Correo"
          icono="mail"
          valor={correo}
          onCambiar={setCorreo}
          placeholder="tucorreo@ejemplo.com"
          keyboardType="email-address"
          autoComplete="email"
          autoCapitalize="none"
          error={errorDeCorreo}
        />
        <Boton
          texto={enviando ? 'Enviando…' : 'Enviar código'}
          icono="send"
          deshabilitado={enviando}
          onPress={() => void pedirCodigo()}
        />
      </Pantalla>
    );
  }

  return (
    <Pantalla>
      <Titular
        conVolver
        etiqueta="Recuperar clave"
        titulo="Revisa tu correo."
        subtitulo={`Si ${correo.trim()} tiene una cuenta, te enviamos un código de 6 dígitos. Vence en 15 minutos.`}
      />

      {codigoDemo ? (
        <CajaAviso tono="neutro" icono="code" titulo="Demo sin correo" texto={`Tu código es ${codigoDemo}. En la versión final llega a tu correo.`} />
      ) : null}

      <View style={styles.formulario}>
        <CampoTexto
          etiqueta="Código"
          icono="pin"
          valor={codigo}
          onCambiar={(t) => setCodigo(t.replace(/\D/g, ''))}
          placeholder="123456"
          keyboardType="number-pad"
          autoComplete="one-time-code"
          maxLength={6}
          error={errorDeCodigo}
        />
        <CampoTexto
          etiqueta="Clave nueva"
          icono="lock"
          clave
          valor={clave}
          onCambiar={setClave}
          placeholder="Crea una clave nueva"
          autoComplete="new-password"
          autoCapitalize="none"
          maxLength={64}
          error={errorDeClave}
        >
          <MedidorClave clave={clave} contexto={{ correo }} />
        </CampoTexto>
      </View>

      <Boton
        texto={enviando ? 'Guardando…' : 'Cambiar clave y entrar'}
        icono="lock_reset"
        deshabilitado={enviando}
        onPress={() => void cambiarClave()}
      />
      <Boton texto="Enviar otro código" variante="enlace" deshabilitado={enviando} onPress={() => void pedirCodigo()} />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  formulario: { gap: ESPACIO.l },
});
