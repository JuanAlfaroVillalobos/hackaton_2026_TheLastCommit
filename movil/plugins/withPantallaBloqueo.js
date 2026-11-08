const { withAndroidManifest } = require('expo/config-plugins');

/**
 * @description RF23: permite que la alerta «¿Estás bien?» (full-screen intent) abra P12 encima de la
 * pantalla de bloqueo y encienda la pantalla. Marca MainActivity con showWhenLocked y turnScreenOn.
 * Requiere volver a generar el development build (npx expo prebuild / eas build).
 */
module.exports = function withPantallaBloqueo(config) {
  return withAndroidManifest(config, (config) => {
    const app = config.modResults.manifest.application?.[0];
    const principal = app?.activity?.find((a) => a.$['android:name'] === '.MainActivity');
    if (principal) {
      principal.$['android:showWhenLocked'] = 'true';
      principal.$['android:turnScreenOn'] = 'true';
    }
    return config;
  });
};
