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
  en su lugar, el campo se aparta (`--badge-out`).
- **Burbujas quitadas:** el % de cada fila y la pastilla del dupe no tienen burbuja.
- **Foto de la fila 1px más grande al arrastrar con el escalado al 125 %:** se probaron dos arreglos que no
  funcionaron, y se dejó sin trucos.
- **Cosmiluz del 5★ buscado (2026-10-29):** se propuso un selector por fila «nuevo / repetido / E6». Se descartó:
  la copia ya sale del orden del plan y de la cuenta (`planCopies`, lo mismo que los dupes), así que se deduce
  sola. Antes se contaban 40 siempre, también por un personaje nuevo, que en el juego da 0.
- **Fila que no llega (2026-10-29):** el borde del nombre, discontinuo y en rojo pleno (en gris se sigue
  distinguiendo). Se descartaron:
  - «No llega ·» delante del %: chocaba con la probabilidad («No llega · 95 %») y pisaba el tipo;
  - «Sin cubrir» sobre el coste: con las filas en dos líneas, todas crecían 14–16px por el hueco reservado;
  - toda la fila con barra y fondo rojizos: se confundía con la fila arrastrada y teñía el plan;
  - borde de 2px y la cifra del coste en rojo: sin color apenas se notaba;
  - la cifra del coste en rojo junto al discontinuo: el «Faltan» del pie dejaba de destacar y el coste parecía
    erróneo.
- **Espaciado vertical de las tarjetas:** no aumentarlo. Se planteó hacer más alto el botón de añadir, pero
  obligaba a subir el alto de la fila, y el usuario ve el espaciado actual justo como debe ser.

## Glosario e interruptores

- **Subrayados del glosario** (2026-10-28): se planteó marcar «Cosmiluz» en todas las etiquetas y casillas; se
  quedó en una vez por tarjeta, donde se decide algo (con demasiados subrayados dejan de avisar). Por lo mismo,
  «garantizado» se marca solo en el del personaje.
- **Definición de la Cosmiluz:** una sola, la del plan, con sus tablas; Recursos actuales usa la misma.
- **Definición del pity (2026-10-30):** en «Pity de personaje», con los máximos de los dos banners; el de cono de
  luz, sin burbuja (como «garantizado»). Remite a «Configuración › Pity» en texto. Se descartó un enlace dentro de
  la burbuja: con el teclado no se llega a él y para los lectores es solo una descripción.
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
  - Con el toast y «Deshacer», el acento fuera de problemas, selección y foco; ver la regla en CLAUDE.md.
- **Tablas en las burbujas (2026-10-30):** no parten filas; la burbuja crece lo justo para ellas, sin pasar del
  ancho de la pantalla, y el texto corrido sigue cortado a 20rem. Se descartó ensanchar solo la burbuja de la
  Cosmiluz.
- **Probabilidades de la Cosmiluz:** agrupadas por banner, su 5★ y debajo, sangrado, su 4★. Se descartaron una
  nota por fila, «(banner de personaje)» (ensanchaba la columna y alejaba las cifras) o abreviada, «(b.
  personaje)», y una columna por banner, que perdía la probabilidad base.
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

## Auditoría del 2026-10-28

- **Pity:** el valor de «tiradas por 5★» de Configuración es el pity máximo, y el actual va de 0 a ese valor − 1. Se
  descartó separar el pity real del juego (hasta 89) del máximo del peor caso.
- **Regla del acento:** se escribió como es («problemas, selección y foco; nunca datos neutros ni controles en
  reposo»). Se descartó quitar el acento de la pestaña, el foco, la fecha elegida, etc.
- **«Deshacer»:** cualquier otro cambio cierra el aviso. Se descartó que deshacer devolviera solo lo borrado: más
  código por cada tipo de borrado.
- **Botones en Sparxie:** con los colores de Aha («Eliminar» en rojo; las ✕, el asa y «Ver N más» en gris), en
  vez de todos en tinta.

## Auditoría técnica del 2026-10-29

- **Migraciones de datos guardados:** borradas todas. Los amigos ya tienen el formato nuevo, y lo guardado se
  reescribe con el formato actual en cada visita.
- **Campo numérico:** se queda `type="number"`, con la capa que pinta el punto de miles. Se descartó pasarlo a texto
  con teclado numérico, que quitaba la capa pero también las flechas ▲▼ y subir o bajar con el teclado, que el
  usuario usa en los paquetes.
- **Fechas por defecto (versión 4.6 y sus eventos):** las mantiene el usuario a mano por ahora; no se derivan de
  `KEY_DATES`.
