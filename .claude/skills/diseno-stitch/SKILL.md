---
name: diseno-stitch
description: Flujo iterativo para diseñar las pantallas de Vecinos (P01–P23, app Android de ayuda vecinal en Expo) con Stitch u otra herramienta de diseño por IA, y llevar el registro en diseno/Pnn-Nombre/. Usar cuando el usuario pida un diseño o un prompt para una pantalla, empezar o rediseñar una pantalla, revisar o dar feedback sobre una captura generada (vN.M.png), diseñar la variante de un tema (lluvia, calor, emergencia) o aprobar una pantalla para implementarla.
---

# Diseño de pantallas de Vecinos con Stitch

Cada pantalla se diseña por frames (vista principal, variantes, hojas inferiores y temas): prompt → captura → feedback → siguiente prompt, hasta aprobarla. Todo queda en `diseno/Pnn-Nombre/`, para que el historial se pueda auditar y la implementación en React Native tenga una referencia única.

## Fuentes de verdad (leer antes de actuar)

- `README.md` (raíz) manda sobre cualquier diseño, frame o captura. **Si el diseño lo contradice, se corrige el diseño.** Secciones que se usan:
  - 3.1 Incluye, 3.2 Fuera del alcance y 3.3 Supuestos (solo Android, sin pagos, sin chat).
  - 4 RF (con su fase: lo de **Fase 2** o **Futuro** no se diseña), 4.7 Criterios de aceptación (mensajes literales), 5 Reglas de negocio (RN).
  - 5.1 y 5.2 Estados; 5.3 **Etiquetas exactas en pantalla** («Esperando a un vecino», «{nombre} va en camino», «Venció sin respuesta»…).
  - 7 Pantallas: qué RF cubre cada una y la **navegación** (4 pestañas, accesos rápidos de Inicio y botón «SOS»).
  - 8 Temas visuales: tokens de los 4 temas, prioridad emergencia > calor > lluvia > normal, contrastes.
  - 10.4 Protocolo SMS: qué acciones de la pantalla tienen camino sin internet.
  - 12 Decisiones y preguntas abiertas.
- `diseno/P04-Inicio/muro.png`: referencia visual del equipo. **Solo manda en las posiciones** del encabezado (casa + nombre + barrio a la izquierda, «SOS» a la derecha), los accesos rápidos 2 × 2 + «Crear publicación» y la barra inferior de 4 pestañas (decisión del 2026-11-07, sección 12.1). El nombre («Entrevecinos»), el contenido del muro («Encuentro vecinal», «Vida de barrio») y el texto oscuro sobre el botón naranja **no** se siguen: el nombre es «Vecinos», el contenido sale de los RF y el texto sobre el primario es blanco (`sobrePrimario`, RNF03).
- `PLAN.md`, sección 1: módulo y dueño (Persona A–E) de cada pantalla. Se anota en la ficha para saber a quién consultar.
- [templates/contexto-comun.md](templates/contexto-comun.md): bloque de sistema visual y reglas que se pega en cada pasada de Stitch, con las líneas de cada tema.
- Las capturas aprobadas de otras pantallas, como referencia de estilo. `diseno/P04-Inicio/prompt.md` (aprobada el 2026-11-07) es el ejemplo canónico del formato: contexto común completo, variantes por duplicación, bitácora y «Decisión». Sus capturas son la referencia de estilo del encabezado, los accesos, las tarjetas del muro, la barra inferior y el tema lluvia.

## Pantallas y carpetas

P04 está aprobada (2026-11-07); las demás se diseñan desde cero con el modo A, tomando P04 como referencia de estilo. Nombres de carpeta (no inventar otros):

| Pantalla | Carpeta | Módulo (dueño) | Barra inferior |
| --- | --- | --- | --- |
| P01 Inicio de sesión | `P01-IniciarSesion` | cuentas (A) | No |
| P02 Registro | `P02-Registro` | cuentas (A) | No |
| P03 Completar perfil y permisos | `P03-CompletarPerfil` | cuentas (A) | No |
| P04 Inicio (muro cercano) | `P04-Inicio` | favores (C) | Inicio |
| P05 Publicar necesidad u oferta | `P05-PublicarNecesidad` | favores (C) | No (asistente) |
| P06 Detalle de necesidad | `P06-DetalleNecesidad` | favores (C) | Favores |
| P07 Servicio — prestador | `P07-ServicioPrestador` | favores (C) | Favores |
| P08 Servicio — solicitante | `P08-ServicioSolicitante` | favores (C) | Favores |
| P09 Calificación | `P09-Calificacion` | favores (C) | No |
| P10 Perfil | `P10-Perfil` | cuentas (A) | Perfil |
| P11 Mapa de emergencia | `P11-MapaEmergencia` | ayuda-humanitaria (E) | Sin pestaña activa |
| P12 Alerta «Estoy bien» | `P12-AlertaEstoyBien` | emergencia (D) | No (pantalla completa) |
| P13 Sin conexión / SMS | `P13-SinConexion` | contingencia-sms (D) | Según la pantalla de origen |
| P14 Publicar en el directorio | `P14-PublicarDirectorio` | directorio (B) | No (asistente) |
| P15 Directorio | `P15-Directorio` | directorio (B) | Servicios |
| P16 Ficha del directorio | `P16-FichaDirectorio` | directorio (B) | Servicios |
| P17 Bolsa de trabajos | `P17-BolsaTrabajos` | trabajos (B) | Servicios |
| P18 Publicar trabajo e interesados | `P18-PublicarTrabajo` | trabajos (B) | No (asistente) |
| P19 Verificar identidad | `P19-VerificarIdentidad` | identidad (A) | No |
| P20 Tutorial y guía de ayuda | `P20-TutorialAyuda` | bienvenida (A) | No |
| P21 Reportar vulnerabilidad | `P21-ReportarVulnerabilidad` | ayuda-humanitaria (E) | No |
| P22 Tablero humanitario | `P22-TableroHumanitario` | ayuda-humanitaria (E) | Sin pestaña activa |
| P23 Directorio de emergencia | `P23-DirectorioEmergencia` | ayuda-humanitaria (E) | Sin pestaña activa |

P04 y la pestaña Favores dependen de la pregunta abierta 12 (sección 12.2): hasta que el equipo la cierre, usar la propuesta (Inicio = saludo + accesos rápidos + resumen del muro; Favores = muro completo con filtro por tipo y «Mis favores») y anotarla como supuesto.

## Convenciones de archivos

```
diseno/Pnn-Nombre/
├── README.md        ← ficha: Módulo · Dueño · RF · Frame de referencia, Contenido, Estados, Ajustes (plantilla: templates/README.md)
├── prompt.md        ← prompts y bitácora (plantilla: templates/prompt.md)
├── referencia-*.png ← referencias visuales que pegó el usuario (opcional)
└── v1.1.png, v1.2.png, v2.1.png… ← capturas de Stitch
```

- **Frames** se identifican como `nn-Letra`: `04-A` (vista principal), `04-B` (otro actor, estado o tema), `04-C`… (hojas inferiores, estado vacío, sin conexión). Cada uno tiene su bloque en `prompt.md`.
- **Capturas:** `vN.M.png`, sin espacios. **Una corrección sobre una captura existente abre una ronda nueva** (`v2.1` → `v3.1`), y **un frame nuevo que parte de la última iteración suma en la ronda actual** (`v3.1` → `v3.2`). Una captura por frame o por corrección; la bitácora anota qué frame y qué prompt produjo cada una.
- Si el usuario guarda una captura con otro nombre (`Screenshot….png`, `04a.png`), se mueve a `vN.M.png` y se le avisa. Si numera distinto de lo planeado, se adopta su numeración en la bitácora (anotando «planeada como …») y en los prompts siguientes.
- **Una corrección nunca sobrescribe la captura anterior.** Si el usuario sobrescribe una, se renombra al siguiente número de la ronda en curso y se anota que la original se perdió.
- Las imágenes que el usuario pega en el chat como referencia se copian como `referencia-*.png`. La referencia global del equipo es `diseno/P04-Inicio/muro.png` (el usuario la movió ahí el 2026-11-07); no moverla ni renombrarla sin preguntar.
- **Exportar solo el frame:** en Stitch, exportar el frame seleccionado a 2×, no una captura del lienzo. Una captura del lienzo (≈ 1500 px de ancho, con el teléfono centrado y espacio en blanco a los lados, como P04 v1.1) sirve para revisar, pero no como referencia final.

## Modos

Identificar en qué modo está el pedido.

### A. Iniciar una pantalla

1. Crear la carpeta y la ficha `README.md` desde [templates/README.md](templates/README.md) si no existen. Leer los RF de la pantalla (sección 7), sus criterios de aceptación (4.7), las RN que citan, sus estados (5.1–5.3), sus tipos SMS (10.4) y las decisiones y preguntas de la sección 12 que la afectan.
2. Crear `prompt.md` desde [templates/prompt.md](templates/prompt.md):
   - Cabecera con la línea **Fuentes** (RF, RN, secciones del README, `muro.png`, módulo y dueño).
   - **Contexto común** copiado de [templates/contexto-comun.md](templates/contexto-comun.md), con la pestaña activa, el título y las reglas propias. No resumirlo ni decir «igual que P04»: Stitch empieza sin memoria en cada sesión.
   - Un bloque `## Frame nn-X — …` por vista, variante, hoja inferior o tema. Las hojas inferiores se describen «sobre el frame nn-A atenuado, bottom sheet…».
   - Al final, `## Supuestos a validar` con lo que el README no define.
3. **Frames que casi toda pantalla necesita** (decidir cuáles aplican y anotarlo):
   - Cada **actor** que la ve distinto (solicitante / prestador en P06–P08; vecino que alerta / vecino de la zona en P11).
   - Cada **estado** de la sección 5.1 que cambia la pantalla, con su etiqueta exacta de 5.3.
   - **Vacío** con el texto literal de 4.7 (ej. RF09: «No hay necesidades cerca. ¿Necesitas algo? Publícalo»).
   - **Sin conexión** (RNF09, RF41): franja «Sin conexión»; si la acción tiene tipo SMS (10.4), cómo se ve «Enviado por SMS» / «En la bandeja de salida».
   - **Tema emergencia** si la pantalla sigue visible en ese modo (RF22: P04 se reemplaza por P11). Al menos una pantalla de cada flujo en **lluvia** (tema oscuro), para revisar contraste.
   - **Bloqueos por regla**: RN-04 (ya tiene una necesidad activa), RN-06 (ya tiene un servicio activo), RN-18 (falta enviar la identidad), RF22 (publicar deshabilitado en emergencia, supuesto).
4. **Datos de ejemplo coherentes:** reutilizar los ya usados para que el flujo cuente una sola historia, y revisar antes los `prompt.md` previos. Base (de `muro.png` y del README): barrio «Barrio Los Olivos» (Lima), usuaria «Ana Morales» («AM»), vecina «Rosa Vega» («RV», «Sector B»). Al fijar un dato nuevo (prestador, oficio, horas, calificación, código de 6 caracteres), anotarlo aquí en la lista para las siguientes pantallas:
   - P04: Ana ofrece «Tecnología» y «Clases y tutorías». Muro: Rosa Vega (Sector B, a 300 m, hace 10 min) necesita ayuda con WhatsApp (Tecnología, «Coincide con tu oficio»); «Jorge Quispe» («JQ», a 600 m) necesita gasfitería por la llave del lavadero; «Carmen Huamán» («CH», a 1,2 km) ofrece en préstamo una escalera de 6 peldaños, devolución «dom 8 nov». Necesidad activa de Ana: pasear a su perro Toby (Mascotas), aceptada por «Luis Paredes» («LP»), «Llega en unos 10 min».
5. **Valores que respetan las reglas:** oficios del catálogo de RN-03 (1 a 5 por vecino), descripción de 10–280 caracteres (RF10), ETA de 5, 10 o 15 min (RF12), horas en bloques de 0,5 h (RN-09), calificación 1–5 (RN-13), distancia redondeada a 100 m (RN-14), teléfono `+51 9xx xxx xxx` (RF01), vencimiento a las 24 h (RN-05), personas 1–99 y nota ≤ 60 en vulnerabilidad (RF38). Si una regla prohíbe una opción, la opción se oculta o se deshabilita con el motivo visible; decidirlo con el usuario y anotarlo.
6. Si el usuario pega una referencia visual, copiarla como `referencia-*.png` y anotar en la cabecera de `prompt.md` qué se toma y qué no (con la regla del README que lo impide).
7. Actualizar la ficha `README.md`: «Frame de referencia» pasa a «En diseño (prompt.md)».
8. Entregar el prompt de la primera pasada (**Contexto común + Frame nn-A**) en un bloque `text` listo para copiar, con el nombre con que debe guardar la captura (`v1.1.png`).

### B. Rediseñar una pantalla ya aprobada

Igual que el modo A, pero:

- Adjuntar la captura aprobada a Stitch y pedir «conserva el layout y cambia solo lo siguiente».
- En la cabecera de `prompt.md`, anotar **qué se conserva** y una tabla **«Diseño actual | Cambio | Regla»**.
- Si el cambio afecta a una pantalla ya implementada, avisar que hay que volver a pasar por `implementar-pantalla` y a quién (dueño del módulo).

### C. Revisar un resultado (vN.M.png)

0. **Verificar los archivos.** Listar la carpeta con fecha (`ls -lT`) y comparar con la revisión anterior: una captura ya revisada cuya fecha o `md5 -q` cambió fue regenerada aunque el usuario no lo diga, y se vuelve a leer. Confirmar qué frame es cada captura mirándola: el usuario puede generar frames en otro orden. Revisar el tamaño (`sips -g pixelWidth -g pixelHeight`): un ancho mucho mayor que el alto o ≥ 1400 px con la pantalla centrada es escritorio; 720–830 px es móvil a 2× (como `muro.png`, 828 px); ≈ 360–414 px es 1×, que sirve, pero conviene pedir 2× para leer los textos chicos.
1. **Inspeccionar a fondo.** Las capturas son altas. Leer la imagen completa y, si hay textos pequeños, recortar por zonas en el scratchpad:
   ```bash
   # sips -c <alto> <ancho> --cropOffset <y> <x>
   sips -c 900 828 --cropOffset 0 0 diseno/Pnn-X/vN.M.png --out <scratchpad>/recorte.png
   ```
2. **Evaluar** contra el checklist de abajo, los criterios de aceptación de los RF de la pantalla y los pendientes de la ronda anterior. Además:
   - **Coherencia entre pantallas:** encabezado, barra inferior, tarjetas, chips y botones iguales a los de las capturas ya aprobadas y a las posiciones de `muro.png`.
   - **Huecos de flujo:** qué pasa antes y después (éxito, error, sin conexión, a dónde lleva cada botón). Si el README no lo define, preguntarlo y registrar la respuesta en `### Decisiones de flujo`. Si afecta a otra pantalla, anotarlo también en su `prompt.md` o ficha.
   - **Pedidos que chocan con el README:** si el usuario pide algo que contradice una regla, no aplicarlo ni rechazarlo en silencio: preguntar con opciones (AskUserQuestion), explicando qué regla se toca.
   - **Datos de otra entidad o de otro módulo:** si falta un control que pertenece a otra pantalla (los oficios se editan en P10, la identidad en P19), proponer mostrarlo en modo lectura con un enlace a esa pantalla, en vez de duplicarlo.
   - **Propuestas sin respuesta:** si el usuario sigue sin comentar una decisión propuesta, avisar una vez que se adopta; en la siguiente revisión registrarla como «adoptada sin objeción».
   - **Mensajes completos:** si el frame es un formulario (P02, P05, P14, P18, P19, P21), documentar en `prompt.md` la tabla completa de mensajes de validación de sus RF (sección 4.7), aunque el diseño muestre solo algunos.
3. **Registrar en la bitácora de `prompt.md`:** fila en la tabla de capturas, y por cada captura revisada: lo que funciona, lo corregido respecto a la anterior (con #n) y la tabla **Pendiente** (#, Problema, Frame, Severidad Alta/Media/Baja, Veces).
4. **Decidir:**
   - Con pendientes de severidad Alta o Media que Stitch puede resolver, redactar el prompt de corrección (ver reglas) y anotarlo en la bitácora con el nombre de la captura que producirá.
   - Si Stitch deja algo igual tras dos intentos, no volver a describirlo: pedir que **duplique un frame ya correcto** y cambie solo lo propio, o **cambiar la estructura** del elemento.
   - Si una variante salió mejor que el frame principal, corregir la variante y **duplicarla para rehacer el principal**.
   - **La base de las variantes siguientes es siempre la última captura correcta**, no el frame A por costumbre. Actualizar los bloques pendientes de `prompt.md` para que coincidan con lo que se entrega.
   - Lo que el usuario declare tolerable se anota una vez y pasa a «Ajustes en la implementación».
   - Si un problema lleva 3 iteraciones o solo quedan ajustes mecánicos (un texto, un color), **aprobar** (modo D).
5. Si el problema es general (tokens, encabezado, barra inferior, formato móvil), corregir también [templates/contexto-comun.md](templates/contexto-comun.md) para que no se repita en las demás pantallas.

### D. Aprobar

1. En `prompt.md`: sección **Decisión** con la captura final de cada frame, los ajustes a resolver en la implementación (React Native + tokens de `useTema()`) y los aprendizajes.
2. En la ficha `README.md`: «Frame de referencia» con las capturas aprobadas, la imagen embebida (`![04-A](v1.2.png)`) y los ajustes respecto al diseño si los hay.
3. En el README raíz, sección 7: agregar (o completar) una columna **Diseño** en la tabla de pantallas con el enlace a la captura aprobada (`[v1.2](<diseno/Pnn-Nombre/v1.2.png>)`). Si un supuesto quedó resuelto, proponer la fila para la sección 12.1 sin escribirla hasta que el usuario la confirme.
4. Avisar al dueño del módulo (PLAN, sección 1) que la pantalla está lista para `implementar-pantalla`, y sugerir la siguiente pendiente del mismo flujo del guion de la demo (PLAN, sección 6).

## Checklist de revisión

- **Formato móvil:** 360 px de ancho (Android), una columna, sin marco de teléfono, sin espacio vacío a los lados. Stitch suele generar escritorio en **cada pasada con contexto común**: recordar el modo **App** antes de esas pasadas. Si pasa, la corrección pide el ancho como primer punto.
- **Marca e idioma:** «Vecinos» (nunca «Entrevecinos»), español de Perú y lectura fácil. Sin dinero: nada de soles, «S/», Yape, Plin ni tarjetas; las horas son reputación, nunca saldo (RN-08).
- **Encabezado:** casa + «Vecinos» + barrio a la izquierda y «SOS» rojo a la derecha, en todas las pantallas con sesión (RF20). Sin campana, menú hamburguesa ni botón flotante de emergencia.
- **Barra inferior:** 4 pestañas (Inicio, Servicios, Favores, Perfil) con la activa correcta (tabla de pantallas). Asistentes, P01–P03, P09, P12, P19–P21: sin barra; decidirlo y anotarlo.
- **Etiquetas de estado** exactamente como en la sección 5.3, con el nombre del vecino donde va `{nombre}`.
- **Contraste y temas (RNF03, sección 8):** texto blanco sobre el naranja `#C2410C`; el naranja claro `#FB923C` nunca como color de texto; el tema se reconoce también por un icono (lluvia, calor, ⚠), no solo por el color.
- **Privacidad (RN-14):** distancia redondeada a 100 m, nunca la dirección exacta de otro vecino salvo para el prestador que aceptó; la ubicación en vivo del prestador solo para el solicitante entre `ACEPTADA` y `EN_SITIO`.
- **Identidad (RN-18):** la insignia «Identidad verificada» solo con `VERIFICADA`; pedir ayuda y usar SOS nunca piden identidad.
- **Fuera del alcance (no debe aparecer):** chat o mensajería (los grupos de apoyo solo enlazan a WhatsApp, RF40), pagos y donaciones de dinero, saldo de horas, navegación paso a paso (solo «Abrir en Google Maps»), Apple (RF30), Facebook (Fase 2), panel de administración, reportes de abuso, llamadas al 105/116 desde la app como si la app las reemplazara, versión web.
- **Contenido realista:** sin lorem ipsum, con los datos de ejemplo compartidos.
- **Fallas típicas de Stitch** (revisarlas siempre):
  - Codificación rota en tildes y símbolos («GasfiterÃ­a», «Â·»). Se corrige pidiendo los textos literales en UTF-8.
  - Bloques repetidos al pedir «duplica y cambia», y elementos que desaparecen al duplicar. Comparar sección por sección con el frame de origen.
  - Textos de botones partidos en dos líneas, y números en fuente monoespaciada.
  - Hojas inferiores con el fondo del último frame generado, no del indicado: si importa, adjuntar la captura correcta.
  - Avatares como imágenes rotas: pedirlos desde el principio como círculos con iniciales.
  - Textos largos truncados hasta perder el dato: pedir el texto completo en hasta dos líneas.
  - Etiquetas de estado inventadas o de otro actor (5.3 tiene una columna para el solicitante y otra para el prestador).
  - Elementos que vuelven de `muro.png` sin pedirlos («Entrevecinos», texto oscuro sobre naranja, posts de «Vida de barrio»).
  - Elementos agregados que no se pidieron: aceptarlos si no chocan con el README y anotarlos.

## Reglas para redactar prompts

- **Primera pasada de cada frame:** Contexto común completo + el bloque del frame. Un frame por pasada.
- **Corrección:** empezar con «Edita solo esta pantalla… mantén todo lo demás igual» y numerar los cambios, uno por punto, con valores concretos (hex, px, radios, textos literales entre comillas).
- **Referencia a lo que ya está bien:** «copia exactamente el estilo de la tarjeta de 04-A» funciona mejor que volver a describir los tokens.
- **Variantes y hojas inferiores aparte:** un frame nuevo se pide en un prompt propio; dentro de un prompt de corrección Stitch lo ignora.
- **Exclusiones explícitas:** terminar con lo que NO debe aparecer cuando hay riesgo (ver checklist).
- **Datos fijados en el prompt:** usuario, avatar, barrio, oficio, distancias, horas, fechas y textos literales. Lo que se deja abierto, Stitch lo inventa distinto en cada frame.
- **Variantes de estado, error o tema a partir del principal:** «Duplica el frame nn-A y cambia solo lo siguiente», con los mensajes exactos de la sección 4.7 o el bloque de tema de `contexto-comun.md`. Revisar luego que no haya bloques repetidos.
- **Hojas inferiores sobre un frame existente:** indicar qué captura seleccionar como fondo y abrir el prompt con una línea de estilo («Usa el mismo sistema visual del frame seleccionado: #C2410C, #FAFAF9, #E7E5E4, radios 12 y 16 px») en lugar del contexto común completo.
- **Mapas (P07, P08, P11, P15, P21, P22):** pedir un mapa estático estilizado con marcadores simples y el botón «Abrir en Google Maps»; en el tema lluvia, el mapa oscuro.
- **Fechas y horas de ejemplo:** comprobar el día de la semana (`date -j -f %Y-%m-%d 2026-11-07 +%a`) antes de escribir «sáb 7 nov»; horas en 24 h, hora de Perú.

## Al responder al usuario

- **Breve:** qué se corrigió, la tabla de pendientes y el prompt siguiente en un bloque `text` listo para copiar (o la decisión de aprobar). Con varios frames, resumir en una tabla frame × resultado (✅ / ⚠️ / ❌).
- Cada prompt va precedido de qué frame seleccionar o adjuntar en Stitch y con qué nombre guardar la captura.
- Enlaces a los archivos actualizados.
- Citar secciones del README como «sección 5.3», nunca con el símbolo de sección.
- **Sin commits** salvo que el usuario lo pida.
