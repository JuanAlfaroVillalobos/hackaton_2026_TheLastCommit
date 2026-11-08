# Configuración del entorno — Vecinos

> Guía para que cada integrante de **TheLastCommit** levante el proyecto completo en su computadora: el backend local (API + emulador de Firestore) y la app en el celular o el navegador.
> Requisitos del proyecto: [README.md](README.md) · Plan: [PLAN.md](PLAN.md) · API: [api-mock/README.md](api-mock/README.md).

## Cómo encaja todo

```text
celular / navegador ──HTTP──▶ api-mock (:3000) ──firebase-admin──▶ emulador de Firestore (:8080)
        ▲                                                                 ▲
   Metro (:8081)                                          UI del emulador (:4000)
```

- La **app** (`movil/`) solo llama a la API con `fetch`; no habla con Firestore directamente.
- La **API** (`api-mock/`) guarda `usuarios`, `sesiones`, `alertas`, `celdas` y `emergencias` en Firestore; el resto de colecciones sigue en memoria.
- Para desarrollar se usa el **emulador de Firestore**: es local, no toca el proyecto real y no pide credenciales.

Se trabaja con **tres terminales**: emulador, API y app (sección 5).

## 1. Herramientas (una sola vez)

| Herramienta | Versión | Verificar con |
| --- | --- | --- |
| Node.js (con nvm) | 22 LTS o superior | `node -v` |
| Git | La última | `git --version` |
| JDK | 17 (Temurin); también lo usa el emulador de Firestore | `java -version` |
| Android Studio | La última (solo para compilar la app Android) | — |
| EAS CLI y Firebase CLI | La última (`npm install -g eas-cli firebase-tools`) | `eas --version`, `firebase --version` |

> Si solo van a trabajar con la app en el **navegador** o en **Expo Go**, Android Studio no es necesario (sección 6). Node, Git, JDK y Firebase CLI sí.

En **Android Studio → SDK Manager**:

- **SDK Platforms:** Android 16.0 (API 36).
- **SDK Tools:** Android SDK Build-Tools, Android SDK Platform-Tools, Android SDK Command-line Tools (latest). **No** instalen NDK ni CMake a mano: Gradle descarga la versión exacta.

Variables de entorno en Windows (cmd como administrador):

```cmd
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot" /M
setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk" /M
```

Usen el nombre exacto de la carpeta del JDK (`dir "C:\Program Files\Eclipse Adoptium"`). Luego, en `sysdm.cpl` → Opciones avanzadas → Variables de entorno → **Path** del sistema, agreguen:

```text
%ANDROID_HOME%\platform-tools
%JAVA_HOME%\bin
```

Abran una cmd nueva y verifiquen `adb --version`.

En **macOS**, si `java -version` no encuentra el JDK, agreguen a `~/.zshrc`:

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

### Solo Windows: rutas largas

```cmd
reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1 /f
git config --system core.longpaths true
```

Trabajen siempre en una ruta corta, por ejemplo `C:\dev\vecinos`.

## 2. Clonar el proyecto e instalar dependencias

```cmd
cd C:\dev
git clone https://github.com/JuanAlfaroVillalobos/hackaton_2026_TheLastCommit.git vecinos
cd vecinos\api-mock
npm ci
cd ..\movil
npm ci
```

En macOS es lo mismo con `/` en lugar de `\`.

Copien `google-services.json` (lo comparte la persona A por el grupo, **nunca** por GitHub) dentro de `movil\`. Solo hace falta para compilar la app Android.

## 3. Configurar la API (una sola vez)

En `api-mock\` copien el archivo de ejemplo de variables:

```cmd
cd C:\dev\vecinos\api-mock
copy .env.ejemplo .env
```

(macOS: `cp .env.ejemplo .env`).

`.env.ejemplo` ya viene listo para el emulador (`ALMACEN=firestore` y `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`). `.env` **no se sube** al repo. Variables útiles:

| Variable | Para qué |
| --- | --- |
| `ALMACEN` | `firestore` (recomendado) o `memoria`. Sin `.env`, todo va en memoria y se pierde al reiniciar la API |
| `FIRESTORE_EMULATOR_HOST` | Emulador local. Si se comenta, la API escribe en el **proyecto real** (requiere cuenta de servicio) |
| `FCM_CUENTA_SERVICIO` | Ruta al JSON de la cuenta de servicio para enviar **push reales** (FCM). Lo comparte la persona A por privado; guárdenlo en `api-mock\credenciales\` (git lo ignora). Sin esto, los avisos llegan igual por el buzón mientras la app está abierta |
| `EMERGENCIA_*` | Umbral y tiempos del modo emergencia (sección 7) |

## 4. Compilar la app Android (solo para el celular Android)

1. Conecten el celular por USB con la **Depuración USB** activada y acepten el aviso en el celular. Verifiquen:

   ```cmd
   adb devices
   ```

   Debe aparecer el dispositivo con la palabra `device`.
2. Compilen e instalen:

   ```cmd
   cd C:\dev\vecinos\movil
   npx expo prebuild --clean
   npx expo run:android
   ```

   La primera vez tarda entre 15 y 30 minutos. En el log debe aparecer `firebase.bom using custom value: 34.19.0`.

> **No hagan clic dentro de la ventana de cmd mientras compila.** Si el título cambia a «Select Administrator…», la compilación queda pausada; pulsen **Esc** para continuar.

Cuando termine, la app abre el lanzador de la *development build*. En **otra** cmd:

```cmd
adb reverse tcp:8081 tcp:8081
adb reverse tcp:3000 tcp:3000
```

En el celular, escriban `http://localhost:8081` en el campo **http://** y pulsen **Connect**. Si desconectan el cable o reinician el celular, repitan los dos `adb reverse`.

## 5. Levantar el proyecto (cada día)

Abran **tres terminales** en la raíz del repo, en este orden.

### Terminal 1 — emulador de Firestore

```cmd
cd C:\dev\vecinos
firebase emulators:start --only firestore --import=./.emulador --export-on-exit
```

`--import` / `--export-on-exit` guardan los datos en `.emulador\` al cerrarlo con **Ctrl+C** y los recuperan al abrirlo (la carpeta está en `.gitignore`). Los documentos se ven en <http://localhost:4000/firestore>.

### Terminal 2 — API

```cmd
cd C:\dev\vecinos\api-mock
npm run sembrar
npm run dev
```

- `npm run sembrar` carga las cuentas de prueba en el emulador (solo crea las que faltan; se puede repetir). Con `npm run sembrar -- --activos` además quedan «activas» en la zona de la demo durante 30 min, necesario para probar el modo emergencia (sección 7).
- Al arrancar, la consola debe decir `Firestore (emulador 127.0.0.1:8080): usuarios, alertas, celdas, emergencias, sesiones; el resto en memoria`. Si dice «todo en memoria», no leyó el `.env`.
- También muestra la URL para el celular (`http://<ip-de-tu-compu>:3000/api/v1`).
- Panel de datos: <http://localhost:3000/dev>.

### Terminal 3 — app

```cmd
cd C:\dev\vecinos\movil
npx expo start
```

Desde Metro: **`w`** abre el navegador; en Android, la development build se conecta sola con `adb reverse`; en iPhone, escaneen el QR con la cámara (Expo Go).

### Cuentas de prueba

Todas con la clave **`vecinos123`**:

| Correo | Nombre |
| --- | --- |
| `ana@vecinos.pe` | Ana Morales |
| `rosa@vecinos.pe` | Rosa Vega |
| `jorge@vecinos.pe` | Jorge Quispe |
| `carmen@vecinos.pe` | Carmen Huamán |
| `luis@vecinos.pe` | Luis Paredes |

Para probar con varias cuentas a la vez, usen dispositivos distintos o, en la misma computadora, una ventana normal y otra de incógnito (cada una guarda su propia sesión).

### Después de `git pull`

```cmd
cd C:\dev\vecinos\api-mock
npm ci
cd ..\movil
npm ci
```

Si alguien agregó una dependencia y no corren `npm ci`, aparecen errores como `Cannot find module 'expo-speech'`.

Solo hay que volver a compilar la app Android (`npx expo prebuild --clean` + `npx expo run:android`) cuando cambian **dependencias nativas, permisos o plugins** de `app.config.ts`. La persona A avisa en el grupo. **Último cambio nativo:** el plugin `withPantallaBloqueo` (alerta de emergencia sobre la pantalla de bloqueo).

## 6. Dónde correr la app

| Dónde | Cómo | Qué funciona |
| --- | --- | --- |
| **Android con development build** | Sección 4 | Todo: mapas, push con la app cerrada, alerta a pantalla completa sobre el bloqueo, SMS, ubicación en segundo plano |
| **iPhone o Android con Expo Go** | Instalen Expo Go y escaneen el QR de Metro (misma red Wi-Fi) | Flujo dentro de la app (cuentas, favores, emergencia, P11/P12). Sin push con la app cerrada, sin SMS ni pantalla completa |
| **Navegador** | `w` en Metro, o `npx expo start --web` | Igual que Expo Go; el mapa es simplificado. **Recargar la página cierra la sesión** (en web el token solo vive en memoria) |

Sin push nativo, los avisos llegan por el **buzón** de la API, que la app consulta cada 15 s mientras está abierta.

Si el celular no llega a la API («No se pudo conectar con la API»), fijen la URL al levantar Metro con la IP que muestra la terminal 2:

```cmd
set EXPO_PUBLIC_API_URL=http://192.168.1.20:3000/api/v1
npx expo start
```

(PowerShell: `$env:EXPO_PUBLIC_API_URL = "http://192.168.1.20:3000/api/v1"`; macOS: `EXPO_PUBLIC_API_URL=http://192.168.1.20:3000/api/v1 npx expo start`). El celular y la computadora deben estar en la misma red Wi-Fi.

## 7. Probar el modo emergencia (RF20–RF25)

La zona entra en emergencia cuando, en 10 min, **al menos 3** vecinos activos de la misma celda (~1 km) pulsan SOS **y** son **más del 50 %** de los activos (RN-11).

1. `npm run sembrar -- --activos` (los 5 vecinos de prueba quedan activos 30 min; repítanlo en cada ronda).
2. **No den permiso de ubicación** en los clientes de prueba: así todos quedan en la celda de la demo. Si uno usa su GPS real, queda en otra celda y no suma.
3. Para ver los reenvíos rápido, agreguen `EMERGENCIA_INTERVALO_S=15` al `.env` y reinicien la API.
4. Entren con 5 cuentas en 5 clientes. Tres pulsan **SOS** (mantener 2 s y confirmar): la zona pasa a rojo y todos ven el mapa (P11). Los otros dos ven **«¿Estás bien?»** (P12).
5. Cuando los cinco pulsan **«Estoy bien»**, la emergencia termina y la app vuelve a Inicio.

Atajos de desarrollo (solo fuera de producción):

| Comando | Qué hace |
| --- | --- |
| `curl localhost:3000/dev/emergencia` | Emergencias activas y quién está dentro |
| `curl -X POST localhost:3000/dev/emergencia/finalizar` | Cierra todas las emergencias activas |
| `curl -X POST localhost:3000/dev/emergencia/tarea` | Reenvía ya «¿Estás bien?» (sin esperar el intervalo) |

Para activarla con menos teléfonos: `EMERGENCIA_MINIMO=1` y `EMERGENCIA_PORCENTAJE=0` en `.env`. Detalle completo en [api-mock/README.md](api-mock/README.md#modo-emergencia-rf21rf25).

## 8. Huellas SHA para el inicio de sesión con Google

Cada computadora tiene su propia firma de depuración. Sin registrarla, el login con Google falla en ese celular.

Requisito: haber ejecutado antes `npx expo prebuild --clean` (sección 4), porque la carpeta `android/` se genera ahí.

**Windows (cmd):**

```cmd
cd C:\dev\vecinos\movil\android
gradlew signingReport
```

**macOS (Terminal):**

```bash
cd ~/dev/vecinos/movil/android
./gradlew signingReport
```

Si en macOS aparece `permission denied: ./gradlew`, ejecuten `chmod +x gradlew` y repitan. Si aparece `Unable to locate a Java Runtime`, configuren el JDK 17 (sección 1).

**Alternativa en macOS sin Gradle** (lee el keystore de depuración que usa el proyecto):

```bash
cd ~/dev/vecinos/movil/android
keytool -list -v -keystore app/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

En la salida de `signingReport`, busquen el bloque `Variant: debug` / `Config: debug`. Copien **SHA1** y **SHA-256** y envíenselos a la persona A, que los registra en Firebase.

## 9. Reglas del equipo

- `app.config.ts` y las dependencias nativas solo las modifica la persona A (PLAN, sección 1).
- Cada uno trabaja en su rama (`a/…`, `b/…`, `c/…`, `d/…`, `e/…`) y hace PR pequeños a `main`. Antes de abrir el PR, traigan `main` a su rama y verifiquen `npx tsc --noEmit` en `movil` y `npm run typecheck` en `api-mock`.
- Nunca suban `google-services.json`, `.env`, `credenciales/`, `.emulador/`, `android/` ni `ios/` (ya están en `.gitignore`). Las claves de cuenta de servicio se comparten por privado, **nunca** por el chat del grupo ni por GitHub.
- Instalen con `npm ci`, no con `npm install`, para respetar las versiones de `package-lock.json`.

## 10. Errores comunes

| Error | Solución |
| --- | --- |
| La API dice «todo en memoria» al arrancar | Falta `api-mock\.env` (sección 3) o no tiene `ALMACEN=firestore` |
| La API responde 500 en emergencia o al ingresar con `ALMACEN=firestore` | El emulador no está corriendo: levanten la terminal 1 antes que la API |
| `Could not start Firestore Emulator, port taken` | Ya hay un emulador abierto (otra terminal). Ciérrenlo o usen ese |
| No puedo ingresar con `ana@vecinos.pe` | El emulador está vacío: `npm run sembrar` |
| «Inicia sesión para continuar» | La sesión ya no existe: vuelvan a ingresar. Con `ALMACEN=firestore` las sesiones sobreviven a los reinicios de la API; en memoria, no. En el navegador, recargar la página también cierra la sesión |
| «No se pudo conectar con la API» | La API no está levantada o el celular no llega a la computadora: misma Wi-Fi, `adb reverse tcp:3000 tcp:3000` o `EXPO_PUBLIC_API_URL` (sección 6) |
| La emergencia no se activa | En <http://localhost:3000/dev> revisen que los vecinos tengan la misma `celdaH3` y `ubicacionEn` de menos de 30 min; repitan `npm run sembrar -- --activos` |
| `Native module ... is not registered` / `could not be found` | Están en Expo Go o en web con una función que necesita la development build; si pasa en la development build, recompilen (sección 4) |
| `Cannot find module '...'` | `npm ci` en `movil` y en `api-mock` |
| `Module was compiled with an incompatible version of Kotlin` | Hagan `git pull` (incluye `movil/plugins/withFirebaseBom.js`) y repitan `npx expo prebuild --clean` |
| `Filename longer than 260 characters` (ninja) | Descarguen `ninja-win.zip` de github.com/ninja-build/ninja/releases. En `%LOCALAPPDATA%\Android\Sdk\cmake\3.22.1\bin`, renombren `ninja.exe` a `ninja-old.exe` y copien el nuevo. Borren `movil\android\app\.cxx` y vuelvan a ejecutar `npx expo run:android` |
| `File google-services.json is missing` | Cópienlo en `movil\` |
| `SDK location not found` | Revisen `echo %ANDROID_HOME%` en una cmd nueva |
| `adb devices` vacío | Activen Depuración USB, cambien el modo USB a **Transferencia de archivos** y prueben otro cable |
| `INSTALL_FAILED_USER_RESTRICTED` (Xiaomi, Redmi, POCO) | En Opciones de desarrollador, activen **Instalar vía USB** |
| El celular muestra el lanzador y no conecta | `adb reverse tcp:8081 tcp:8081` y `http://localhost:8081` → Connect |
| Alternativa si no logran compilar en local | `eas build --platform android --profile development` compila en la nube (puede haber cola) |
