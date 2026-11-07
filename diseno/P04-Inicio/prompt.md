# Prompt de diseño — P04 Inicio (muro cercano)

Prompt para generar el diseño de la pantalla 04 y sus variantes con Stitch. Se genera en varias pasadas: primero el bloque **Contexto común** junto con el frame 04-A, y luego cada frame siguiente pegando de nuevo el contexto común (o duplicando 04-A cuando se indica).

Fuentes: README raíz (RF08, RF09, RF10, RF20, RF22, RF29, RF35, RF37, RF38, RF41; RN-03, RN-04, RN-05, RN-14; secciones 4.7, 5.1, 5.3, 7, 8 y pregunta 12 de la 12.2), [diseno/muro.png](muro.png) (posiciones del encabezado, accesos rápidos y barra inferior) y `templates/contexto-comun.md`. Módulo `modulos/favores`, dueño Persona C (PLAN, sección 1). Es la primera pantalla que se diseña: no hay frames previos de referencia.

Referencia [muro.png](muro.png): se toman el encabezado (casa + nombre + barrio, «SOS» a la derecha), el saludo grande, la cuadrícula 2 × 2 de accesos, el botón ancho «Crear publicación», el título «En el muro» y la barra inferior de 4 pestañas. No se siguen: el nombre «Entrevecinos», el texto oscuro sobre el naranja (RNF03), los posts de comunidad con foto y «comentarios» (no hay chat, sección 3.2; el contenido del muro es RF09 y RF35).

---

## Contexto común (pegar en cada pasada)

```text
Diseña una pantalla de app móvil Android (360 × 800 dp, sin marco de teléfono) para «Vecinos»,
una red de ayuda vecinal en Perú: los vecinos de un barrio piden y ofrecen favores, oficios
y servicios cercanos, y se coordinan en emergencias.
Idioma: español de Perú, lectura fácil (frases cortas, también para personas mayores).
No hay dinero dentro de la app: las horas de ayuda son reputación, no saldo.

Formato (obligatorio): pantalla de teléfono, no web ni escritorio. Ancho total 360 px,
una sola columna, márgenes laterales de 16 px, sin barras laterales ni contenedores centrados
con fondo vacío alrededor. Áreas táctiles de al menos 48 × 48 px.

Tema normal (respetar exactamente):
- Fondo #FAFAF9. Tarjetas #FFFFFF con borde 1px #E7E5E4, radio 16px, sombra muy suave.
- Naranja de marca #C2410C: botón primario sólido con texto BLANCO #FFFFFF, radio 12px,
  alto 52px. Presionado #9A3412. Naranja claro #FB923C solo para fondos suaves, iconos e
  ilustraciones, nunca para texto.
- Texto principal #1C1917, secundario #57534E. Bordes y divisores #E7E5E4.
- Tipografía sans-serif humanista (Inter o similar), títulos grandes en negrita
  (28px, hasta 2 líneas), cuerpo 16px. Iconos de línea redondeados.
- Avatares: círculos con fondo naranja muy suave y las iniciales en texto oscuro (ej. "AM"),
  nunca fotos rotas.

Navegación (posiciones fijas, como la pantalla de referencia del muro):
- Encabezado: a la izquierda, icono de casa en contorno naranja con el nombre "Vecinos"
  en negrita y debajo el barrio en gris ("Barrio Los Olivos"). A la derecha, botón "SOS"
  con icono de escudo con exclamación, texto e icono rojos #C62828 sobre fondo rojo muy
  suave, radio 12px. Nada más en el encabezado.
- Barra de navegación inferior blanca, fija abajo a todo el ancho, con 4 pestañas
  (icono + texto): Inicio, Servicios, Favores, Perfil. La activa lleva una píldora naranja
  suave detrás del icono y texto oscuro en negrita; las demás, icono y texto grises.
  En esta pantalla la activa es "Inicio".
- Debajo del encabezado: título "Hola, Ana. Tu barrio está aquí." y subtítulo
  "Pide o ofrece una mano a tus vecinos." en gris.

Reglas que el diseño debe reflejar:
- Distancias aproximadas, redondeadas a 100 m ("a 300 m"); nunca la dirección exacta de otro
  vecino salvo al prestador que aceptó.
- Estados con chip de color y estas etiquetas exactas: "Esperando a un vecino",
  "{nombre} va en camino", "{nombre} dice que llegó", "Servicio en curso",
  "Esperando confirmación", "Finalizado", "Cancelada", "Venció sin respuesta".
- Horas de ayuda como reputación ("12 h ayudadas · 3 h pedidas"), calificación con
  estrellas ámbar de 1 a 5.
- Insignia "Identidad verificada" solo en los perfiles verificados.
- El muro mezcla necesidades ("Necesito") y ofertas ("Ofrezco") de vecinos cercanos.
  Cada tarjeta: avatar con iniciales, nombre, distancia y tiempo desde que se publicó,
  chip del tipo, chip del oficio, un extracto de la descripción de hasta 80 caracteres y
  el enlace "Ver detalle →". Las que piden un oficio que yo ofrezco van primero y llevan
  el chip "Coincide con tu oficio". No hay comentarios, "me gusta" ni fotos grandes.
- Nada de soles, "S/", Yape, Plin, pagos con tarjeta, saldo de horas, chat o mensajería,
  navegación paso a paso (solo "Abrir en Google Maps"), Iniciar sesión con Apple
  ni botón de emergencia flotante (el SOS va en el encabezado).
- Textos en UTF-8: tildes, ñ, "·" y "→" deben verse correctos (ej. "Gasfitería", "Señal").
- Contenido realista, nada de lorem ipsum.
```

---

## Frame 04-A — Inicio con el muro (tema normal)

```text
Pantalla "Inicio" de Ana Morales (iniciales "AM"), que ofrece los oficios
"Tecnología" y "Clases y tutorías". De arriba hacia abajo:

1. Encabezado según el contexto común.
2. Fila del saludo: título "Hola, Ana. Tu barrio está aquí." (28px, negrita, hasta 2 líneas)
   y a su derecha un botón circular de 40px con borde #E7E5E4 y el signo "?"
   (abre la guía de ayuda). Debajo, el subtítulo "Pide o ofrece una mano a tus vecinos."
3. Accesos rápidos: cuadrícula de 2 × 2 tarjetas blancas iguales (alto 64px, radio 16px,
   borde #E7E5E4), cada una con icono de línea naranja #C2410C a la izquierda y el texto
   en negrita: "Servicios" (llave inglesa), "Emergencias" (escudo con exclamación),
   "Favores" (mano con corazón), "Mi perfil" (persona).
4. Botón primario a todo el ancho "+ Crear publicación": fondo #C2410C, texto e icono BLANCOS.
5. Debajo, un enlace de texto con icono de alerta en #57534E: "Reportar vulnerabilidad".
6. Título de sección "En el muro" (20px, negrita) y a la derecha, en gris, "Cerca de ti · 3 km".
7. Fila de chips de filtro con desplazamiento horizontal: "Todo" (activo: fondo naranja
   suave, texto #9A3412), "Favores y oficios", "Préstamos", "Donaciones", "Intercambios",
   "Movilidad" (inactivos: borde #E7E5E4, texto #57534E).
8. Tres tarjetas del muro, en este orden:
   a) Avatar "RV", "Rosa Vega", debajo "Sector B · a 300 m · hace 10 min".
      Chips: "Necesito" (naranja suave), "Tecnología" (gris) y "Coincide con tu oficio"
      (verde suave #E8F5E9 con texto #1B5E20 y un check).
      Texto: "Necesito ayuda para configurar el WhatsApp del celular de mi mamá."
      Abajo a la derecha: "Ver detalle →" en #C2410C negrita.
   b) Avatar "JQ", "Jorge Quispe", "a 600 m · hace 25 min".
      Chips: "Necesito", "Gasfitería".
      Texto: "Se rompió la llave del lavadero y gotea toda la noche. ¿Alguien me ayuda?"
      "Ver detalle →".
   c) Avatar "CH", "Carmen Huamán", "a 1,2 km · hace 1 h".
      Chips: "Ofrezco" (fondo #FFF7ED con borde #FB923C y texto #9A3412), "Préstamo de herramienta".
      Texto: "Presto una escalera de 6 peldaños para trabajos en casa."
      Línea pequeña gris con icono de calendario: "Devolución: dom 8 nov".
      "Ver detalle →".
9. Barra inferior con "Inicio" activa.

No incluyas: "Entrevecinos", comentarios, "me gusta", fotos grandes en las tarjetas,
campana de notificaciones, menú hamburguesa, botón flotante, precios ni soles.
```

## Frame 04-B — Con una publicación activa propia (RN-04)

```text
Duplica el frame 04-A y cambia solo lo siguiente:

1. Entre los accesos rápidos y el botón "Crear publicación", agrega una tarjeta
   "Tu publicación" con borde izquierdo de 4px #C2410C:
   - Fila superior: chip "Necesito" y chip "Mascotas"; a la derecha, chip de estado
     "Luis Paredes va en camino" (fondo naranja suave #FFF7ED, texto #9A3412).
   - Texto: "Necesito que alguien pasee a mi perro Toby esta tarde, me torcí el tobillo."
   - Línea gris con icono de reloj: "Llega en unos 10 min".
   - Enlace "Ver mi favor →" en #C2410C negrita.
2. El botón "Crear publicación" queda deshabilitado: fondo #E7E5E4, texto e icono #57534E.
   Debajo, en 14px #57534E con icono de información:
   "Ya tienes una necesidad activa. Termínala o cancélala para publicar otra."
3. Todo lo demás igual (saludo, accesos, filtros y las tres tarjetas del muro).
```

## Frame 04-C — Muro vacío

```text
Duplica el frame 04-A y cambia solo lo siguiente:

1. Quita las tres tarjetas del muro (los chips de filtro se mantienen, "Todo" activo).
2. En su lugar, centrado: ilustración lineal sencilla de dos casas con un corazón en naranja
   claro #FB923C (solo trazos), el texto en 16px #1C1917
   "No hay necesidades cerca. ¿Necesitas algo? Publícalo" y debajo un botón secundario
   con borde #C2410C y texto #C2410C "Crear publicación".
3. Todo lo demás igual.
```

## Frame 04-D — Sin conexión y notificaciones desactivadas

```text
Duplica el frame 04-A y cambia solo lo siguiente:

1. Justo debajo del encabezado, una franja a todo el ancho, fondo #1C1917, texto blanco
   en 14px con icono de nube tachada: "Sin conexión · Mostrando lo último guardado".
   A la derecha de la franja, en #FB923C: "Pendiente de enviar (1)".
2. Debajo del subtítulo del saludo, un aviso en tarjeta con fondo #FFF7ED y borde #FB923C,
   icono de campana tachada en #9A3412 y el texto en #1C1917:
   "No recibirás avisos de ayuda ni de emergencia". A la derecha, el botón de texto
   "Ir a Ajustes" en #C2410C negrita.
3. Las tres tarjetas del muro se mantienen, con la línea de tiempo en gris
   "actualizado hace 8 min" en lugar de "Cerca de ti · 3 km".
4. Todo lo demás igual.
```

## Frame 04-E — Tema lluvia (oscuro)

```text
Duplica el frame 04-A y cambia solo lo siguiente (tema lluvia, azul noche):

1. Fondo #0F1B2D. Tarjetas y accesos #172A45 con borde #2A3F5F.
2. Primario #4F8DF5: el botón "Crear publicación" con fondo #4F8DF5 y texto #0F1B2D;
   iconos de los accesos y "Ver detalle →" en #7FD1F7.
3. Texto principal #E6EEF8 y secundario #9FB3CC. Chips con fondo #2A3F5F y texto #E6EEF8;
   "Coincide con tu oficio" con fondo #1E3A2B y texto #A5D6A7.
4. En el encabezado, junto a "Vecinos", un icono de nube con lluvia en #7FD1F7.
   El botón "SOS" con texto e icono #FF5A5F sobre fondo #2A1A24.
5. Barra inferior #172A45; la píldora activa de "Inicio" en #2A3F5F con texto #E6EEF8.
6. Mismos textos, datos y estructura que 04-A.
```

---

## Supuestos a validar

- **Inicio vs. Favores (pregunta 12, sección 12.2):** se adopta la propuesta. P04 tiene saludo, accesos, «Crear publicación» y el muro completo con el filtro por tipo (RF35); la pestaña Favores muestra «Mis favores» en curso (P07/P08). Si el equipo decide otra cosa, cambia la sección 8 del frame 04-A.
- **«Crear publicación» en lugar de «Publicar necesidad» (RF09):** la sección 7 y muro.png usan «Crear publicación», que cubre necesidades y ofertas (RF35). Proponer actualizar el texto de RF09 en la sección 4.7.
- **Botón «?» (RF37)** junto al saludo, no en el encabezado, para no romper las posiciones de muro.png.
- **«Reportar vulnerabilidad» (RF38)** como enlace de texto bajo «Crear publicación», para que no compita con la acción principal.
- **Etiquetas de los filtros (RF35):** «Favores y oficios», «Préstamos», «Donaciones», «Intercambios», «Movilidad». El README da los tipos, no las etiquetas cortas.
- **Tarjeta «Tu publicación» (04-B):** RF09 excluye las propias del muro; se muestra arriba como resumen para explicar por qué «Crear publicación» está deshabilitado (RN-04).
- **Nombre del autor en la tarjeta:** RF09 no lo lista, pero `perfiles` es legible por los vecinos autenticados (sección 5.4) y RF11 lo muestra en el detalle.
- **Hoja «¿Necesitas ayuda?» del SOS (RF20)** no se diseña aquí: es del módulo emergencia (Persona D) y aparece en todas las pantallas.

---

## Bitácora

| Captura | Frame | Prompt | Resultado |
| --- | --- | --- | --- |
| v1.1 | 04-A | Contexto común + 04-A | ✅ Aceptada; exportada como captura del lienzo (1535 × 1600, teléfono de ~430 px centrado) |
| v1.2 | 04-B | Duplicar 04-A (v1.1) + 04-B | ✅ Aceptada (frame exportado a 1×, 408 × 1600) |
| v1.3 | 04-C | Duplicar 04-A (v1.1) + 04-C | ✅ Aceptada (651 × 1600) |
| v1.4 | 04-D | Duplicar 04-A (v1.1) + 04-D | ⚠️ Errata «óltimo» y franja en 3 líneas. La primera versión de v1.4 era una copia de v1.2 (mismo `md5`); el usuario la reemplazó |
| v2.1 | 04-D | Corrección sobre v1.4 | ✅ Aceptada (390 × 1491) |
| v2.2 | 04-E | Duplicar 04-A (v1.1) + 04-E | ✅ Aceptada (471 × 1600) |

### Decisiones de flujo

| Elemento | Lleva a | Estado |
| --- | --- | --- |
| Acceso «Servicios» | Pestaña Servicios (P15) | Propuesta |
| Acceso «Emergencias» | P22 (o P11 si la zona está en emergencia) | Propuesta |
| Acceso «Favores» | Pestaña Favores («Mis favores») | Propuesta |
| Acceso «Mi perfil» | Pestaña Perfil (P10) | Propuesta |
| «Crear publicación» | P05, paso 1 (elegir necesito u ofrezco y el oficio) | Propuesta |
| «Reportar vulnerabilidad» | P21 | Según RF38 |
| «?» | P20, guía de ayuda | Según RF37 |
| Tarjeta / «Ver detalle →» | P06 | Según el flujo de la sección 7 |
| «Ver mi favor →» (04-B) | P08 (solicitante) | Propuesta |
| «Ir a Ajustes» (04-D) | Ajustes de notificaciones de Android | Según RF08 |
| Zona entra en emergencia | P04 se reemplaza por P11 | Según RF22 |

### Revisión de v1.1 (2026-11-07)

**Archivo:** 1535 × 1600 px. Es una captura del lienzo de Stitch a 1×, con el teléfono de unos 430 px centrado y espacio en blanco a los lados. El diseño sí es móvil (una columna, sin layout de escritorio). Para la referencia final conviene exportar solo el frame a 2×.

**Lo que funciona:**

- Encabezado según muro.png: casa, «Vecinos» y «Barrio Los Olivos» a la izquierda; «SOS» rojo a la derecha. Sin campana, sin menú hamburguesa y sin botón flotante.
- Saludo en 2 líneas con el botón «?» a la derecha; subtítulo literal.
- Cuadrícula de 2 × 2 de accesos con iconos naranjas; «Crear publicación» con texto e icono blancos (RNF03).
- «Reportar vulnerabilidad» como enlace secundario; «En el muro» con «Cerca de ti · 3 km».
- Filtros con desplazamiento horizontal y «Todo» activo.
- Las 3 tarjetas con los datos, chips y textos fijados; «Coincide con tu oficio» solo en Rosa; «Ofrezco» en contorno; «Devolución: dom 8 nov».
- Barra inferior de 4 pestañas con «Inicio» activa en píldora.
- Tildes y símbolos correctos («Gasfitería», «·», «→»). Nada fuera del alcance.

**Pendiente:**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 1 | Exportada como captura del lienzo, no del frame a 2× | 04-A | Baja | 1.ª |
| 2 | Las tarjetas sin pie (Rosa, Jorge) dejan una fila casi vacía con un divisor solo para «Ver detalle →»; se puede subir el enlace o quitar el divisor | 04-A | Baja | 1.ª |
| 3 | Icono de «Favores»: corazón en lugar de mano con corazón | 04-A | Baja | 1.ª |
| 4 | El teléfono mide ~430 px de ancho, no 360 | 04-A | Baja | 1.ª |

**Decisión:** no hace falta un prompt de corrección. 04-A queda aceptado como base de las variantes. #2 a #4 pasan a «Ajustes en la implementación»: en React Native el ancho lo da el dispositivo (desde 360 dp, RNF02), el pie de la tarjeta se resuelve en el componente y el icono se elige en la implementación. Se sigue con 04-B, duplicando v1.1.

### Revisión de v1.2 (2026-11-07)

**Archivo:** 408 × 1600 px, frame solo a 1× (mejor que v1.1; a 2× se leerían mejor los chips). v1.1 cambió de fecha pero no de contenido (mismo `md5`).

**Lo que funciona:**

- La tarjeta «Tu publicación» con borde izquierdo naranja, chips «Necesito» y «Mascotas», estado «Luis Paredes va en camino» (etiqueta de la sección 5.3), texto literal, «Llega en unos 10 min» y «Ver mi favor →».
- «Crear publicación» deshabilitado en gris con contraste suficiente y el mensaje literal de RF10 debajo, con icono de información.
- «Reportar vulnerabilidad» sigue activo, que es lo correcto: RN-04 no bloquea los reportes.
- El resto es idéntico a v1.1, sin bloques repetidos ni elementos perdidos.

**Pendiente:**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 5 | El chip de estado comparte la fila con los otros dos y queda muy pequeño; con texto al 130 % (RNF03) no cabrá. En la implementación, el estado va en su propia línea | 04-B | Baja | 1.ª |

**Decisión:** aceptada sin corrección; #5 pasa a «Ajustes en la implementación». Se sigue con 04-C.

**Supuesto nuevo:** RN-04 habla de «una necesidad activa como solicitante». Se asume que una oferta activa (RF35) también bloquea «Crear publicación», porque sigue el mismo ciclo; si no, el mensaje de 04-B debería decir cuál de las dos bloquea.

### Revisión de v1.3 (2026-11-07)

**Lo que funciona:** el estado vacío reemplaza las tres tarjetas, dentro de una tarjeta blanca; ilustración lineal de casas con corazón en #FB923C; texto literal de RF09; botón secundario en contorno. Los filtros siguen con «Todo» activo y el resto es idéntico a v1.1.

**Pendiente:**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 6 | «Crear publicación» aparece dos veces (el primario de arriba y el secundario del vacío). Se pidió así; en la implementación se puede dejar solo el texto, porque el primario sigue a la vista | 04-C | Baja | 1.ª |

**Decisión:** aceptada sin corrección; #6 pasa a «Ajustes en la implementación» (propuesta: quitar el botón secundario del vacío). Se sigue con 04-D.

### Revisión de v1.4 (2026-11-07)

**Archivo:** la primera v1.4 era idéntica a v1.2 (`md5` e316d05e…). La reemplazada mide 420 × 1600 (`md5` 0661e081…).

**Lo que funciona:** franja oscura con icono de nube tachada y «Pendiente de enviar (1)» en naranja claro; aviso de notificaciones con campana tachada, texto literal de RF08 e «Ir a Ajustes»; «actualizado hace 8 min» en lugar de «Cerca de ti · 3 km»; las tres tarjetas y el resto igual a v1.1.

**Pendiente:**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 7 | Errata en la franja: «lo óltimo guardado» en vez de «lo último guardado» | 04-D | Media | 1.ª |
| 8 | El texto de la franja se parte en 3 líneas porque comparte la fila con «Pendiente de enviar (1)» | 04-D | Media | 1.ª |
| 9 | La franja no ocupa todo el ancho (tiene márgenes) y queda pegada al saludo, sin espacio debajo | 04-D | Baja | 1.ª |

**Prompt de corrección** (seleccionar el frame de v1.4 en Stitch; guardar como `v2.1.png`):

```text
Edita solo esta pantalla y mantén todo lo demás igual:
1. La franja oscura de "Sin conexión" ocupa todo el ancho de la pantalla, de borde a borde,
   sin márgenes laterales ni radio, con 12px de relleno vertical y 16px horizontal.
2. Divide la franja en dos líneas, alineadas a la izquierda:
   - Línea 1 (14px, blanco, con el icono de nube tachada a la izquierda):
     "Sin conexión · Mostrando lo último guardado" (con tilde en la u: "último").
   - Línea 2 (14px, #FB923C, negrita): "Pendiente de enviar (1)".
   Cada línea en una sola fila, sin cortes.
3. Deja 16px de espacio entre la franja y el saludo "Hola, Ana. Tu barrio está aquí."
```

### Revisión de v2.1 (2026-11-07)

**Corregido respecto a v1.4:** #7 («Mostrando lo último guardado», con tilde correcta), #8 (franja en dos líneas sin cortes: estado en blanco y «Pendiente de enviar (1)» en naranja claro debajo) y #9 (franja de borde a borde, con espacio antes del saludo).

**Lo que funciona:** el resto se mantiene igual a v1.4, sin bloques repetidos ni elementos perdidos.

**Decisión:** 04-D aceptado con v2.1. Se sigue con 04-E (tema lluvia), duplicando v1.1, y se guarda como `v2.2.png` (frame nuevo en la ronda actual).

### Revisión de v2.2 (2026-11-07)

**Lo que funciona:** tokens del tema lluvia (fondo #0F1B2D, tarjetas #172A45, primario #4F8DF5 con texto oscuro, textos #E6EEF8 / #9FB3CC, enlaces #7FD1F7); «SOS» en #FF5A5F; «Coincide con tu oficio» en verde oscuro legible; icono de lluvia en el encabezado (RNF03: el tema no depende solo del color). Mismos textos y estructura que v1.1.

**Pendiente:**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 10 | El icono de lluvia reemplazó a la casa en lugar de ir junto a «Vecinos» | 04-E | Baja | 1.ª |
| 11 | La barra inferior no llega a los bordes (tiene márgenes laterales) | 04-E | Baja | 1.ª |

**Decisión:** aceptada sin corrección; #10 y #11 pasan a «Ajustes en la implementación».

### Decisión

Se aprueba el 2026-11-07. Capturas finales: 04-A → v1.1, 04-B → v1.2, 04-C → v1.3, 04-D → v2.1, 04-E → v2.2. Ajustes a resolver en la implementación (React Native + tokens de `useTema()`):

1. El ancho lo da el dispositivo, desde 360 dp (RNF02); los frames miden entre 390 y 430 px (#4).
2. Tarjeta del muro: sin fila de pie vacía; «Ver detalle →» en la misma fila que la línea de devolución cuando la haya, o alineado a la derecha sin divisor (#2).
3. Icono de «Favores»: mano con corazón, igual en el acceso rápido y en la pestaña (#3).
4. Tarjeta «Tu publicación»: el chip de estado va en su propia línea, para que quepa con el texto del sistema al 130 % (#5).
5. Estado vacío: quitar el botón secundario «Crear publicación», porque el primario sigue a la vista; queda la ilustración con el texto de RF09 (#6, propuesta).
6. Franja sin conexión de borde a borde, en dos líneas, y «Pendiente de enviar ({n})» solo cuando n > 0 (RF41).
7. Icono del tema: la casa se mantiene y el icono de lluvia, calor o ⚠ va junto a «Vecinos» (#10, sección 8).
8. Barra inferior de borde a borde en todos los temas (#11).
9. «Coincide con tu oficio» en el tema lluvia: fondo #1E3A2B y texto #A5D6A7. No son tokens de la sección 8: pedir a B que los agregue a `compartido/tema` (por ejemplo, `exitoFondo` y `exito` por tema).
10. Supuestos que siguen abiertos (ver «Supuestos a validar»): pregunta 12 (Inicio vs. Favores), «Crear publicación» vs. RF09, una oferta activa también bloquea (RN-04), etiquetas cortas de los filtros.

**Aprendizaje para las siguientes pantallas:**

- Fijar todos los datos y textos en el prompt hizo que 04-A saliera bien a la primera.
- Duplicar 04-A y cambiar solo lo propio funcionó para todas las variantes, incluido el tema lluvia.
- Exportar solo el frame (no el lienzo) y revisar el `md5`: una v1.4 llegó como copia exacta de v1.2.
- Las franjas con dos textos en la misma fila se parten: pedirlas en dos líneas desde el principio.
