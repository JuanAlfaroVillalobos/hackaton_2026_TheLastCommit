import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from '@/compartido/tema';
import { Boton } from '@/compartido/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { CajaAviso } from '../componentes/CajaAviso';
import { CampoTexto } from '../componentes/CampoTexto';
import { Pantalla } from '../componentes/Pantalla';
import { Titular } from '../componentes/Titular';

/**
 * @description Registro (P02, RF01): nombre, correo, teléfono obligatorio y clave. Por ahora es visual; la validación llega en A2.
 */
export default function RegistroPantalla() {
  const { colores } = useTema();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [clave, setClave] = useState('');
  const [confirmacion, setConfirmacion] = useState('');

  const errorConfirmacion = confirmacion.length > 0 && confirmacion !== clave ? 'Las claves no coinciden.' : undefined;

  return (
    <Pantalla>
      <Titular conVolver etiqueta="Crear cuenta" titulo="Únete a tu barrio." subtitulo="Solo te tomará un minuto." />

      <View style={styles.formulario}>
        <CampoTexto
          etiqueta="Nombre"
          icono="person"
          valor={nombre}
          onCambiar={setNombre}
          placeholder="Como te conocen tus vecinos"
          autoComplete="name"
          autoCapitalize="words"
          maxLength={60}
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
        />
        <CampoTexto
          etiqueta="Teléfono"
          icono="call"
          prefijo="+51"
          valor={telefono}
          onCambiar={(t) => setTelefono(t.replace(/\D/g, ''))}
          placeholder="9XX XXX XXX"
          keyboardType="phone-pad"
          autoComplete="tel"
          maxLength={9}
          ayuda="Lo usamos para enviarte alertas por SMS cuando no hay internet."
        />
        <CampoTexto
          etiqueta="Clave"
          icono="lock"
          clave
          valor={clave}
          onCambiar={setClave}
          placeholder="Crea una clave"
          autoComplete="new-password"
          autoCapitalize="none"
          ayuda="Mínimo 8 caracteres, con letras y números."
        />
        <CampoTexto
          etiqueta="Confirma tu clave"
          icono="lock"
          clave
          valor={confirmacion}
          onCambiar={setConfirmacion}
          placeholder="Repite la clave"
          autoComplete="new-password"
          autoCapitalize="none"
          error={errorConfirmacion}
        />
      </View>

      <CajaAviso
        icono="verified_user"
        titulo="Tus datos, con cuidado"
        texto="Tus vecinos solo ven tu nombre y tu foto. Tu teléfono, correo y ubicación exacta no se publican."
      />

      <Boton texto="Crear cuenta" icono="person_add" onPress={() => Alert.alert('Crear cuenta', 'Disponible pronto (tarea A2).')} />

      <Text style={[styles.legal, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
        Al crear tu cuenta aceptas la política de privacidad de Vecinos (Ley 29733).
      </Text>

      <View style={styles.ingreso}>
        <Text style={[TIPO.cuerpo, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
          ¿Ya tienes cuenta?
        </Text>
        <Boton texto="Iniciar sesión" variante="enlace" onPress={() => router.replace('/ingresar')} />
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  formulario: { gap: ESPACIO.l },
  legal: { ...TIPO.pequeno, textAlign: 'center' },
  ingreso: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
});
