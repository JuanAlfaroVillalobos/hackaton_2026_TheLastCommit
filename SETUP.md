# Configuración del entorno — Vecinos

> Guía para que cada integrante de **TheLastCommit** compile y ejecute la app en su celular Android.
> Requisitos del proyecto: [README.md](README.md) · Plan: [PLAN.md](PLAN.md).

## 1. Herramientas (una sola vez)

| Herramienta            | Versión                                               | Verificar con                             |
| ---------------------- | ------------------------------------------------------ | ----------------------------------------- |
| Node.js (con nvm)      | 22 LTS                                                 | `node -v`                               |
| Git                    | La última                                             | `git --version`                         |
| JDK                    | 17 (Temurin)                                           | `java -version`                         |
| Android Studio         | La última                                             | —                                        |
| EAS CLI y Firebase CLI | La última (`npm install -g eas-cli firebase-tools`) | `eas --version`, `firebase --version` |

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

### Solo Windows: rutas largas

```cmd
reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1 /f
git config --system core.longpaths true
```

Trabajen siempre en una ruta corta, por ejemplo `C:\dev\vecinos`.

## 2. Clonar el proyecto

```cmd
cd C:\dev
git clone https://github.com/JuanAlfaroVillalobos/hackaton_2026_TheLastCommit.git vecinos
cd vecinos\movil
npm ci
```

Copien `google-services.json` (lo comparte la persona A por el grupo, **nunca** por GitHub) dentro de `movil\`.

## 3. Primera compilación

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

## 4. Conectar el celular a Metro

Cuando termine la compilación, la app abre el lanzador de la *development build*. En **otra** cmd:

```cmd
adb reverse tcp:8081 tcp:8081
```

En el celular, escriban `http://localhost:8081` en el campo **http://** y pulsen **Connect**.

Si desconectan el cable o reinician el celular, repitan `adb reverse`.

## 5. Trabajo diario

Después de la primera compilación **no hace falta recompilar** para cambios de código:

```cmd
git pull
cd C:\dev\vecinos\movil
npm ci
npx expo start
```

Con el cable conectado, `adb reverse tcp:8081 tcp:8081` y abran la app en el celular. Los cambios de código se ven al guardar.

Solo hay que volver a `npx expo prebuild --clean` + `npx expo run:android` cuando cambian **dependencias nativas, permisos o plugins** (`app.config.ts`). La persona A avisa en el grupo cuando eso pase.

### Pruebas del módulo Favores (Expo Web)

El mock se inicia en un terminal separado y la app en otro:

```powershell
Set-Location .\api-mock
npm install
npm run dev
```

```powershell
Set-Location .\movil
$env:EXPO_PUBLIC_FAVORES_BACKEND = "mock"
$env:EXPO_PUBLIC_API_URL = "http://localhost:3000/api/v1"
npx expo start --web
```

Usa `ana@vecinos.pe` y `rosa@vecinos.pe` (clave `vecinos123`) para el flujo entre dos cuentas. Si pruebas en un celular, reemplaza `localhost` por la IPv4 de la computadora. La guía para integrar Firebase está en [api-mock/README.md](api-mock/README.md#cambio-futuro-a-firebase); Firebase aún requiere coordinar la autenticación con la persona A y no se activa con solo cambiar una variable.

## 6. Huellas SHA para el inicio de sesión con Google

Cada computadora tiene su propia firma de depuración. Sin registrarla, el login con Google falla en ese celular.

Requisito: haber ejecutado antes `npx expo prebuild --clean` (sección 3), porque la carpeta `android/` se genera ahí.

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

Si en macOS aparece `permission denied: ./gradlew`, ejecuten `chmod +x gradlew` y repitan. Si aparece `Unable to locate a Java Runtime`, configuren el JDK 17 en la sesión:

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

(Para dejarlo permanente, agreguen esa línea a `~/.zshrc` y abran una Terminal nueva).

**Alternativa en macOS sin Gradle** (lee el keystore de depuración que usa el proyecto):

```bash
cd ~/dev/vecinos/movil/android
keytool -list -v -keystore app/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

En la salida de `signingReport`, busquen el bloque `Variant: debug` / `Config: debug`. Copien **SHA1** y **SHA-256** y envíenselos a la persona A, que los registra en Firebase.

## 7. Reglas del equipo

- `app.config.ts` y las dependencias nativas solo las modifica la persona A (PLAN, sección 1).
- Cada uno trabaja en su rama (`a/…`, `b/…`, `c/…`, `d/…`, `e/…`) y hace PR pequeños a `main`.
- Nunca suban `google-services.json`, `.env`, `android/` ni `ios/` (ya están en `.gitignore`).
- Instalen con `npm ci`, no con `npm install`, para respetar las versiones de `package-lock.json`.

## 8. Errores comunes

| Error                                                          | Solución                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Module was compiled with an incompatible version of Kotlin` | Hagan `git pull` (incluye `movil/plugins/withFirebaseBom.js`) y repitan `npx expo prebuild --clean`                                                                                                                                                                 |
| `Filename longer than 260 characters` (ninja)                | Descarguen `ninja-win.zip` de github.com/ninja-build/ninja/releases. En `%LOCALAPPDATA%\Android\Sdk\cmake\3.22.1\bin`, renombren `ninja.exe` a `ninja-old.exe` y copien el nuevo. Borren `movil\android\app\.cxx` y vuelvan a ejecutar `npx expo run:android` |
| `File google-services.json is missing`                       | Cópienlo en `movil\`                                                                                                                                                                                                                                                   |
| `SDK location not found`                                     | Revisen `echo %ANDROID_HOME%` en una cmd nueva                                                                                                                                                                                                                          |
| `adb devices` vacío                                         | Activen Depuración USB, cambien el modo USB a **Transferencia de archivos** y prueben otro cable                                                                                                                                                                   |
| `INSTALL_FAILED_USER_RESTRICTED` (Xiaomi, Redmi, POCO)       | En Opciones de desarrollador, activen **Instalar vía USB**                                                                                                                                                                                                         |
| El celular muestra el lanzador y no conecta                    | `adb reverse tcp:8081 tcp:8081` y `http://localhost:8081` → Connect                                                                                                                                                                                                  |
| Alternativa si no logran compilar en local                     | `eas build --platform android --profile development` compila en la nube (puede haber cola)                                                                                                                                                                              |
