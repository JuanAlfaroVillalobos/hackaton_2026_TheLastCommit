// Ruta: src/nucleo/dialogo/index.ts
// En la web, `Alert.alert` de React Native no hace nada (react-native-web lo deja vacío): los avisos no se
// ven y los botones «Cerrar sesión», «Cambiar foto», etc. no responden. Este parche lo reemplaza en la web
// por los diálogos del navegador, así todas las pantallas funcionan sin cambiar su código.
// Se importa una sola vez desde nucleo/sesion (raíz de la app). En Android e iOS no cambia nada.
import { Alert, Platform, type AlertButton } from 'react-native';

type FuncionAlerta = typeof Alert.alert;

/**
 * @description Muestra el aviso con window.alert/confirm y llama al botón que corresponde a la respuesta.
 */
const alertaWeb: FuncionAlerta = (titulo, mensaje, botones) => {
  const texto = [titulo, mensaje].filter(Boolean).join('\n\n');
  const lista: AlertButton[] = botones?.length ? botones : [{ text: 'OK' }];
  const cancelar = lista.find((b) => b.style === 'cancel');
  const acciones = lista.filter((b) => b !== cancelar);

  // Solo informativo (un botón): aviso y listo.
  if (acciones.length <= 1 && !cancelar) {
    window.alert(texto);
    acciones[0]?.onPress?.();
    return;
  }
  // Una acción con cancelar: Aceptar = la acción.
  if (acciones.length === 1) {
    if (window.confirm(`${texto}\n\n¿${acciones[0].text}?`)) acciones[0].onPress?.();
    else cancelar?.onPress?.();
    return;
  }
  // Varias acciones (p. ej. Galería / Cámara): se ofrecen una por una.
  for (const accion of acciones) {
    if (window.confirm(`${texto}\n\n¿${accion.text}?`)) {
      accion.onPress?.();
      return;
    }
  }
  cancelar?.onPress?.();
};

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  Alert.alert = alertaWeb;
}

export const esWeb = Platform.OS === 'web';
