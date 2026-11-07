import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from '@/compartido/tema';
import { Boton } from '@/compartido/ui';
import { useSesion } from '@/nucleo/sesion';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { CajaAviso } from '../componentes/CajaAviso';
import { CampoTexto } from '../componentes/CampoTexto';
import { Pantalla } from '../componentes/Pantalla';
import { Separador } from '../componentes/Separador';
import { Titular } from '../componentes/Titular';

/**
 * @description Avisa que la acción se conecta a Firebase Auth en la tarea A2.
 */
function pendiente(accion: string) {
  Alert.alert(accion, 'Disponible pronto (tarea A2).');
}

/**
 * @description Inicio de sesión (P01, RF02, RF04, RF07). Por ahora es visual; en desarrollo permite entrar sin cuenta.
 */
export default function IngresarPantalla() {
  const { colores } = useTema();
  const { entrarModoDesarrollo } = useSesion();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');

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
          <Boton texto="¿Olvidaste tu clave?" variante="enlace" onPress={() => pendiente('Recuperar clave')} />
        </View>
        <Boton texto="Ingresar" icono="login" onPress={() => pendiente('Ingresar')} />
      </View>

      <Separador />

      <View style={styles.alternativas}>
        <Boton texto="Continuar con Google" icono="account_circle" variante="secundario" onPress={() => pendiente('Google')} />
        <Boton
          texto="Recibir un enlace por correo"
          icono="link"
          variante="secundario"
          onPress={() => pendiente('Enlace mágico')}
        />
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
  alternativas: { gap: ESPACIO.m },
  registro: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  desarrollo: { gap: ESPACIO.m, marginTop: ESPACIO.s },
});
