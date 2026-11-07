# Contexto común para Stitch

Se pega al inicio de **cada** pasada, porque Stitch no recuerda las sesiones anteriores. Reemplazar lo que está entre `<…>`.

- **Pantallas sin barra inferior** (P01–P03, P12, P20, asistentes de 3 pasos, hojas inferiores): cambiar la línea de la barra por «Sin barra de navegación inferior».
- **Temas:** el bloque usa el tema **normal**. Para una variante en otro tema, reemplazar la línea «Tema» por la del tema que corresponda (al final de este archivo).

Fuentes: README raíz, secciones 5.3 (etiquetas), 7 (navegación) y 8 (tokens de los 4 temas), y `diseno/P04-Inicio/muro.png` (posiciones del encabezado, los accesos rápidos y la barra inferior). Si se cambia algo aquí, actualizar también los `prompt.md` que estén en iteración.

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
  En esta pantalla la activa es "<pestaña>".
- Debajo del encabezado: título "<Título>" <y subtítulo "<…>" en gris, si aplica>.

Reglas que el diseño debe reflejar:
- Distancias aproximadas, redondeadas a 100 m ("a 300 m"); nunca la dirección exacta de otro
  vecino salvo al prestador que aceptó.
- Estados con chip de color y estas etiquetas exactas: "Esperando a un vecino",
  "{nombre} va en camino", "{nombre} dice que llegó", "Servicio en curso",
  "Esperando confirmación", "Finalizado", "Cancelada", "Venció sin respuesta".
- Horas de ayuda como reputación ("12 h ayudadas · 3 h pedidas"), calificación con
  estrellas ámbar de 1 a 5.
- Insignia "Identidad verificada" solo en los perfiles verificados.
- <reglas propias de la pantalla, con su RF/RN>
- Nada de soles, "S/", Yape, Plin, pagos con tarjeta, saldo de horas, chat o mensajería,
  navegación paso a paso (solo "Abrir en Google Maps"), Iniciar sesión con Apple
  ni botón de emergencia flotante (el SOS va en el encabezado).
- Textos en UTF-8: tildes, ñ, "·" y "→" deben verse correctos (ej. "Gasfitería", "Señal").
- Contenido realista, nada de lorem ipsum.
```

## Línea «Tema» para las variantes

Reemplazar el bloque «Tema normal» completo por uno de estos (tokens de la sección 8 del README) y agregar el icono del tema junto al título del encabezado (RNF03: el cambio de tema no depende solo del color).

```text
Tema lluvia (azul noche, oscuro): fondo #0F1B2D, tarjetas #172A45 con borde #2A3F5F,
primario #4F8DF5 con texto #0F1B2D, acento #7FD1F7, texto #E6EEF8, secundario #9FB3CC.
El botón "SOS" usa #FF5A5F. Icono de nube con lluvia junto al nombre de la app.
```

```text
Tema calor (terracota): fondo #FDF0E6, tarjetas #FFFFFF con borde #F1CFB5, primario #9C3D1B
con texto blanco, acento #F59E0B, texto #2A140A, secundario #6B3A22.
Icono de termómetro junto al nombre de la app.
```

```text
Tema emergencia (rojo): fondo #FFF1F1, tarjetas #FFFFFF con borde #F3C1C1, primario #C62828
con texto blanco, acento #FFD54F, texto #2B0B0B, secundario #6B2B2B.
Icono de alerta ⚠ junto al nombre de la app y una franja superior "Modo emergencia en tu zona".
```

P12 (alerta a pantalla completa) usa fondo `#B71C1C` con texto `#FFFFFF`, sin encabezado ni barra inferior.

## Si Stitch genera una pantalla de escritorio

Antes de generar, elegir el modo **App** (móvil) en Stitch, no **Web**. Si igual sale de escritorio, seleccionar el frame generado y pegar:

```text
Convierte esta pantalla a formato de teléfono Android vertical:

- Ancho total de la pantalla: 360 px. Elimina todo el espacio vacío a los lados;
  el contenido ocupa el 100 % del ancho, con márgenes laterales de 16 px.
- No es un diseño web ni de escritorio: una sola columna, sin barras laterales
  ni contenedores centrados con fondo vacío alrededor.
- El encabezado (icono de casa, "Vecinos", barrio y botón "SOS" a la derecha)
  ocupa todo el ancho arriba.
- La barra de navegación inferior (Inicio, Servicios, Favores, Perfil) queda fija abajo,
  a todo el ancho, con "<pestaña>" activa con la píldora naranja suave.
- <botón fijo, si lo hay> va fijo justo encima de la barra inferior,
  a todo el ancho menos los márgenes de 16 px.

Mantén todo lo demás igual: colores, tipografía, textos y datos.
```
