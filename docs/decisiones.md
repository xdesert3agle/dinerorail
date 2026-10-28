# Decisiones de diseño

Alternativas probadas y descartadas por el usuario. CLAUDE.md dice cómo es la app; esta lista dice qué no
volver a proponer y por qué.

## Plan de tiradas

- **Nombre:** «Plan de tiradas», en vez de «Planificación de tiradas», que era más largo (2026-10-28). Los textos
  dicen «el plan».
- **Balance:**
  - Se probó en la cabecera de la tarjeta, y después como un recibo con una línea «−35» y la raya de la suma.
  - Se eligió el pie actual (2026-10-24): el interruptor a la izquierda, la pastilla «+35» junto a su texto y
    el balance en la columna de costes.
- **Burbuja del balance y del coste de cada fila:** una cuenta escrita (`.tip-table`), no prosa.
- **Pastilla del Eidolón en la miniatura:** sobresale 6px. Se rechazó meterla hacia dentro porque tapaba la cara;
  en su lugar, el campo se aparta (`--badge-room`).
- **Burbujas quitadas:** el % de cada fila y la pastilla del dupe no tienen burbuja.
- **Foto de la fila 1px más grande al arrastrar con el escalado al 125 %:** se probaron dos arreglos que no
  funcionaron, y se dejó sin trucos.
- **Espaciado vertical de las tarjetas:** no aumentarlo.

## Glosario e interruptores

- **Términos de glosario** (2026-10-28): el término va subrayado y abre su definición, con un título como entrada
  de diccionario.
- **Subrayados:**
  - un término se marca una sola vez por tarjeta;
  - «garantizado» se marca solo en el del personaje.
- **Definición de la Cosmiluz:** una sola, la del plan, con sus tablas; Recursos actuales usa la misma.
- **Interruptores de Esquirlas:** cada uno manda solo en su tarjeta (2026-10-25). No gustó que uno pisara al otro.
- **Pie de la tarjeta de paquetes:**
  - «Usar paquetes en el plan», alineado a la derecha, bajo el total que decide; a la izquierda parecía pegado
    bajo la tabla;
  - el Resumen se queda limpio.
- **Interruptor encendido en Aha:** verde musgo (#4f8a5f / #56966a). Se descartaron salvia, pino, jade y
  esmeralda (2026-10-24).

## Cuenta

- **Personajes no obtenidos:** solo en gris. Se descartaron una barra cruzada, una franja de censura sobre los ojos
  y una X encima.
- **Eidolón:** una pastilla «E2» en la esquina del retrato. Se descartaron una pastilla tras el nombre, un texto
  gris y un número tras los cristales; sus proporciones son las del boceto elegido.
- **Selector de Eidolón:** seis cristales rotos. Se descartaron círculos, una barra numerada, estrellas y la flor
  de Eidolones del juego (2026-10-25).
- **Filtro de Vías:** solo iconos, sin `title`. El usuario no quiere burbujas al pasar el ratón ahí.
- **Buscador:** solo, en su propia línea. Compartiendo línea con los filtros encogía a ~165px.
- **Medidas de las filas y los grupos:** las ajustó el usuario (anchos, 28px entre grupos, icono de la Vía).
- **Tabla de Vías (`PATHS`):** validada por el usuario (2026-10-25). Memory es «Reminiscencia».

## Burbujas y colores

- **Borde de las burbujas:** el acento al 90 %, de 2px (2026-10-27).
  - Se descartó un gris (tinta al 50 %, al 35 % y pura) y el acento del 100 al 40 %.
  - Es la única excepción buscada a «el acento solo para problemas».
- **Rareza:** toda la etiqueta («Personaje 5✦ E6») va en el color de su rareza, no una estrella de color junto a
  palabras en tinta.
- **Letra del cuerpo en Aha:** Figtree. Se descartaron Outfit, DM Sans y Plus Jakarta Sans.

## Otros

- **Orden de las tarjetas:** «Recursos actuales» antes que la fecha objetivo (2026-10-28). Los recursos se
  actualizan en cada visita; la fecha, pocas veces.
- **Fechas destacadas:** sin título encima de la tabla, que se veía descompensado; solo en la vista estrecha.
- **Resumen:** sin la línea de veredicto bajo la cifra.
- **Estado completo:** sin exportar ni importar todo el estado (quitado a propósito).
- **Planes antiguos con nombres en inglés:** no se mantienen (se aceptó perderlos).
- **Temas Kafka y Grafito:** borrados (2026-10-28). Aha es la base.
