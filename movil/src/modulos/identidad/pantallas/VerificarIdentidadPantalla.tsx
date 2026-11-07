import { ESPACIO, MAX_ESCALA_FUENTE, TIPO, useTema } from '@/compartido/tema';
import { Boton, Chip, Tarjeta } from '@/compartido/ui';
import { CajaAviso, CampoTexto, Pantalla, Titular } from '@/modulos/cuentas';
import { useState, type ReactNode } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

/**
 * @description Paso numerado del proceso de verificación.
 */
function Paso({ numero, titulo, texto, children }: { numero: number; titulo: string; texto: string; children: ReactNode }) {
  const { colores, oscuro } = useTema();

  return (
    <Tarjeta>
      <View style={styles.cabeceraPaso}>
        <View style={[styles.numero, { backgroundColor: colores.primarioSuave }]}>
          <Text
            style={[TIPO.cuerpoFuerte, { color: oscuro ? colores.texto : colores.primarioOscuro }]}
            maxFontSizeMultiplier={MAX_ESCALA_FUENTE}
          >
            {numero}
          </Text>
        </View>
        <View style={styles.textos}>
          <Text style={[TIPO.cuerpoFuerte, { color: colores.texto }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            {titulo}
          </Text>
          <Text style={[TIPO.pequeno, { color: colores.textoSecundario }]} maxFontSizeMultiplier={MAX_ESCALA_FUENTE}>
            {texto}
          </Text>
        </View>
      </View>
      <View style={styles.contenidoPaso}>{children}</View>
    </Tarjeta>
  );
}

/**
 * @description Verificar identidad (P19, RF36): datos del DNI, foto del DNI y selfie. Por ahora es visual; el envío llega en A7.
 */
export default function VerificarIdentidadPantalla() {
  const [dni, setDni] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');

  const completo = dni.length === 8 && nombres.trim().length > 1 && apellidos.trim().length > 1;
  const pendiente = (accion: string) => Alert.alert(accion, 'Disponible pronto (tarea A7).');

  return (
    <Pantalla>
      <Titular
        conVolver
        etiqueta="Identidad"
        titulo="Verifica que eres tú."
        subtitulo="Así tus vecinos sabrán a quién le abren la puerta."
      />
      <Chip texto="Sin verificar" variante="contorno" icono="info" />

      <Paso numero={1} titulo="Tus datos" texto="Escríbelos tal como aparecen en tu DNI.">
        <CampoTexto
          etiqueta="Número de DNI"
          icono="badge"
          valor={dni}
          onCambiar={(t) => setDni(t.replace(/\D/g, ''))}
          placeholder="8 dígitos"
          keyboardType="number-pad"
          maxLength={8}
        />
        <CampoTexto etiqueta="Nombres" valor={nombres} onCambiar={setNombres} autoCapitalize="words" />
        <CampoTexto etiqueta="Apellidos" valor={apellidos} onCambiar={setApellidos} autoCapitalize="words" />
      </Paso>

      <Paso numero={2} titulo="Foto de tu DNI" texto="La parte de adelante, con buena luz y sin reflejos.">
        <Boton texto="Tomar foto del DNI" icono="photo_camera" variante="secundario" onPress={() => pendiente('Foto del DNI')} />
      </Paso>

      <Paso numero={3} titulo="Selfie" texto="Una foto de tu rostro, tomada en este momento.">
        <Boton texto="Tomarme una selfie" icono="face" variante="secundario" onPress={() => pendiente('Selfie')} />
      </Paso>

      <CajaAviso
        icono="lock"
        titulo="¿Quién ve esto?"
        texto="Solo el equipo validador. Tu DNI nunca se muestra en la app: tus vecinos solo ven la insignia «Identidad verificada»."
      />

      <Boton
        texto="Enviar para revisión"
        icono="send"
        deshabilitado={!completo}
        motivoDeshabilitado="Completa tu DNI, nombres y apellidos para continuar."
        onPress={() => pendiente('Enviar para revisión')}
      />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  cabeceraPaso: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.m },
  numero: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1, gap: 2 },
  contenidoPaso: { gap: ESPACIO.m, marginTop: ESPACIO.l },
});
