const { withProjectBuildGradle } = require('expo/config-plugins');

/**
 * @description Fija la versión de la BoM de Firebase para Android, compatible con el Kotlin de Expo.
 */
module.exports = function withFirebaseBom(config, { bom }) {
  return withProjectBuildGradle(config, (config) => {
    config.modResults.contents += `
project.ext {
  set('react-native', [versions: [firebase: [bom: '${bom}']]])
}
`;
    return config;
  });
};