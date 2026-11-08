// ESLint de la app (PLAN 0.3). Además de las reglas de Expo, hace cumplir las reglas de dependencia
// entre carpetas del README (sección 9.5):
//   1. Un módulo solo importa el index.ts de otro módulo, nunca sus archivos internos.
//   2. nucleo/ y compartido/ nunca importan desde modulos/.
// Uso: npm run lint
const fs = require('node:fs');
const path = require('node:path');
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const RAIZ_MODULOS = path.join(__dirname, 'src', 'modulos');
const MODULOS = fs
  .readdirSync(RAIZ_MODULOS, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const zonasEntreModulos = MODULOS.map((modulo) => ({
  target: `./src/modulos/${modulo}`,
  from: './src/modulos',
  except: [`./${modulo}`, ...MODULOS.filter((otro) => otro !== modulo).flatMap((otro) => [`./${otro}/index.ts`, `./${otro}/index.tsx`])],
  message: 'Importa el index.ts del otro módulo (p. ej. «@/modulos/cuentas»), no sus archivos internos. README 9.5, regla 2.',
}));

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'android/*', 'ios/*', 'plugins/*', 'node_modules/*'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Reglas nuevas del compilador de React: avisan sin bloquear mientras cada equipo ajusta sus hooks.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'import/no-restricted-paths': [
        'error',
        {
          basePath: __dirname,
          zones: [
            ...zonasEntreModulos,
            {
              target: './src/nucleo',
              from: './src/modulos',
              message: 'nucleo/ es infraestructura y no puede depender de un módulo. README 9.5, regla 3.',
            },
            {
              target: './src/compartido',
              from: './src/modulos',
              message: 'compartido/ no tiene lógica de negocio y no puede depender de un módulo. README 9.5, regla 3.',
            },
          ],
        },
      ],
    },
  },
]);
