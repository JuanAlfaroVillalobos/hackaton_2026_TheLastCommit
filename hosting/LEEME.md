# Hosting de Vecinos (Persona A · A9)

Sitio en Firebase Hosting: `https://vecinos-thelastcommit.web.app`

| Ruta | Archivo | Para qué |
| --- | --- | --- |
| `/` | `index.html` | Descarga del APK (lee `descarga.json`) |
| `/privacidad` | `privacidad.html` | Política de privacidad (Ley 29733); la enlaza el registro |
| `/s` | `s.html` | Si un enlace de SMS o de correo se abre sin la app instalada |
| `/.well-known/assetlinks.json` | — | Verifica los App Links de Android (RF04, `/s`) |

## Publicar una versión nueva (en cada hito)

1. `cd movil && npm run build:preview` (EAS compila el APK `preview` en la nube).
2. Copia la URL del APK que muestra EAS en `hosting/public/descarga.json` (`url`, `version`, `fecha` en ISO y `tamanoMb`).
3. Desde la raíz: `firebase deploy --only hosting`.

## Huella para assetlinks.json (una sola vez)

`cd movil && npx eas-cli@latest credentials -p android` → perfil `preview` → copia el **SHA-256** del keystore
y reemplaza `REEMPLAZAR:...` en `public/.well-known/assetlinks.json`. Es la misma huella que se registró en la app
Android de Firebase.
