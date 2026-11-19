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
- **Burbujas quitadas:** el % de cada fila, la pastilla del dupe y la fecha del Resumen (solo repetía la fecha
  completa) no tienen burbuja.
- **Foto de la fila 1px más grande al arrastrar con el escalado al 125 %:** se probaron dos arreglos que no
  funcionaron, y se dejó sin trucos.
- **Cosmiluz del 5★ buscado (2026-10-29):** se propuso un selector por fila «nuevo / repetido / E6». Se descartó:
  la copia ya sale del orden del plan y de la cuenta (`planCopies`, lo mismo que los dupes), así que se deduce
  sola. Antes se contaban 40 siempre, también por un personaje nuevo, que en el juego da 0.
- **Cosmiluz esperada de cada fila (2026-11-10):** una pastilla gris «🌟 +404», como la del pie, entre el 50/50 y
  el coste, con su cuenta en la burbuja. En una tarjeta de móvil (≤29rem) no cabe junto a «Garantizado» y baja a
  una tercera línea, bajo el coste. Se descartaron meterla en la línea de arriba del nombre, junto al % (dos cifras
  seguidas en letra pequeña), y quitarla en el móvil dejándola solo en la burbuja del coste.
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
  - **Excepción aprobada, el plan (2026-11-06):** 12px arriba y abajo de cada fila, y la primera a 16px de la
    cabecera (no a `--card-gap`), como el pie. Con 8px el plan se veía apretado, y en oscuro sus botones de
    añadir quedaban pegados al campo de la primera fila (dos cajas marcadas a 12px).
  - No se separa más la cabecera de todas las listas: las demás tarjetas con botón en la cabecera (Versiones y
    eventos, Fuentes) tienen debajo etiquetas o una línea, no cajas.
  - A 24px, como si la cabecera fuera una fila más, el título se alejaba demasiado de su lista.

## Versiones y eventos

- **Leer primero y editar en el sitio (2026-11-09; la edición pasó a un diálogo el 2026-11-18, ver «Editar en
  un diálogo»):** como las fuentes de ingresos. Cada versión es un título de
  grupo (el h3 de «Diarias») con su inicio y «Editar», y debajo una tabla de lectura (evento, cobro y
  recompensas, con las de las fuentes, `RewardInline`). «Editar» abre los campos y las filas editables en la caja
  del editor de las fuentes (`.inline-edit`), con «Eliminar versión» al pie, como «Eliminar fuente» (ver «Pie del
  editor»). Sale de un boceto del usuario. Del boceto no se tomaron:
  - «Añadir versión» al pie de la tarjeta: contradice la regla de los botones de añadir (lo de la tarjeta, en su
    cabecera);
  - el subtítulo «Recompensas totales» bajo el título: ninguna tarjeta tiene subtítulo, y el total de cabecera
    lleva su etiqueta solo para lectores de pantalla;
  - el total de la versión sin ticket (el mismo fallo de la frase de antes);
  - un diamante genérico en lugar del icono del Jade;
  - el título de la versión grande y en negrita: se usa el h3 de grupo de la app.
  En el móvil (≤560px), la fecha baja bajo el nombre y las recompensas quedan a la derecha.
- **«+ Evento» (2026-11-09; en el diálogo pasó a un botón normal el 2026-11-18, ver «Editar en un diálogo»):** un
  botón del ancho y el alto de una fila, al pie de cada versión, en el hueco donde
  aparece la nueva: dice qué hace antes de pulsarlo (idea del usuario). Es el `.btn` de siempre, sin borde
  discontinuo: en el plan, el discontinuo es «fila que no llega», y en gris se seguiría leyendo así. Se
  descartaron:
  - el botón pequeño al pie, alineado con las asas: no se veía de qué versión era;
  - en la cabecera de cada versión, tras «Inicio» (lo recomendó la crítica de impeccable, por repetir el
    «añadir en la cabecera» de «+ Versión»);
  - un único «+ Evento» en la cabecera de la tarjeta: obligaría a elegir la versión.
- **Quitar una versión:** «Eliminar versión» al pie de su editor. Se probaron una ✕ junto al total, en la columna de
  las ✕ de los eventos (parecía una fila más), y otra junto a los campos de la versión.
- **Pie del editor (2026-11-13), también en las fuentes de ingresos:** el pie es la barra de acciones, tras una
  raya: «Eliminar …» a la izquierda, fantasma en rojo, y «Terminar edición» a la derecha, con borde (solo
  «Terminar» no decía qué se terminaba). «Editar» se oculta con el editor abierto (deja su hueco), y el interruptor
  «pendiente hoy» de las fuentes sube con los campos. Antes, «Cerrar» era un fantasma fuera de la caja, en la línea
  del título, y «Eliminar versión», con borde, ocupaba la esquina de abajo a la derecha, bajo «+ Evento»: de un
  vistazo no se veía qué hacía cada botón ni cómo salir. Se propusieron y no se eligieron:
  - los mismos sitios con otra jerarquía («Terminar edición» con borde en la línea del título y «Eliminar versión»
    fantasma al pie): la salida seguía fuera de la caja;
  - la caja envolviendo también la cabecera, con los campos en lugar del título y el total dentro: el título
    saltaba al abrir, y las fuentes del juego no tienen nombre editable;
  - «Eliminar versión» en la cabecera, junto a «Terminar edición»: se parece a la ✕ junto a los campos, ya
    descartada, y en las fuentes no cabe en la fila.
- **Editar en un diálogo (2026-11-18), también en las fuentes de ingresos:** «Editar» abre un diálogo modal en
  lugar de la caja en el sitio. Con varias versiones con eventos, editar la del centro dejaba los campos y las filas
  que se arrastran entre dos tablas de lectura que se les parecen, y la tarjeta quedaba cargada. Ahora la tarjeta
  siempre se lee y el diálogo siempre se edita. El diálogo es una tarjeta (`.card`, una ventana en Sparxie) con lo
  editado de título, los campos (y el total de la versión) y el mismo pie. Los cambios se siguen guardando al
  escribir, así que Esc y un clic en el velo también cierran sin perder nada. Las fuentes pasan también, aunque su
  editor es pequeño, para que haya una sola forma de editar.
  - Se quitan la caja del editor (`.inline-edit`) y el tono que solo existía para sus botones (`--surface-3`). Sin
    campos sobre `--surface-2` (salvo la fila que se arrastra), el borde de los campos en Aha oscuro baja a su
    mínimo sobre la tarjeta, #766261 (3,03:1); sobre la caja pedía #836d6c.
  - Lo que se pierde: mientras se edita no se ven el Resumen ni el total de la cabecera de la tarjeta, solo el de
    la versión, dentro del diálogo.
  - Se dejó como alternativa sin probar marcar la caja en el sitio con un borde en vez de un relleno (los campos
    quedaban sobre la tarjeta igual), pero no resolvía lo cargado de la tarjeta.
  - X de cerrar en la cabecera y «Terminar edición» al pie, las dos (elegido por el usuario). La X sola dejaba el
    pie solo con «Eliminar …», pero sin «Guardar» podía leerse como «cancelar». Tampoco se llama «Guardar»: lo
    escrito ya está guardado, y el botón prometería que la X lo descarta. En Sparxie la X es la caja de cierre de
    la ventana, a la izquierda; la de adorno no sale.
  - «+ Evento» deja de ser del ancho de una fila (en el diálogo se veía pegote, una franja que pesaba más que las
    filas): es un `.btn` normal al final de la lista, empezando donde los nombres, y comparte línea con el total
    de la versión, como el pie de una tabla. El botón pequeño se había descartado porque no se veía de qué versión
    era; en el diálogo solo hay una. De paso, el total ya no queda justo encima de «Terminar edición».
  - «Eliminar …» alineado por su caja, como «Editar» y «Deshacer», no por su texto. Se probó sacar el texto con
    un margen negativo (el relleno y el borde de .btn) para alinearlo con los campos: el tinte del hover quedaba a
    3px del borde del diálogo. Solo alinea su texto lo que se lee como enlace bajo una columna («Ver N versiones
    más»).
  - Canal de las asas (elegido por el usuario, 2026-11-19): «Versión», «Inicio», los nombres de los eventos y
    «+ Evento» empiezan en la misma línea, tras el hueco del asa, siempre (sin eventos también: si no, «+ Evento»
    saltaba al añadir el primero). El título y «Eliminar versión» quedan en el borde, como encabezado y pie. Se
    descartaron todo en la columna interior (también título y pie: parecía más margen a la izquierda que a la
    derecha), las asas colgando en el margen del diálogo (pedía ensanchar solo el izquierdo, de 16 a ~44px) y
    dejarlo como estaba con un subtítulo «Eventos».
  - Pie sin raya (elegido por el usuario): lo separa el aire de entre bloques de una tarjeta (20px). En el diálogo
    los botones ya se leen como pie, y la raya del editor en el sitio venía de separarlos de lo de alrededor.
  - Dos anchos: estrecho para una fuente (30rem; con uno solo, el de una fuente quedaba medio vacío) y ancho para
    una versión (48rem; a 40rem se cortaban los nombres de los eventos).
  - El borde de los campos baja hasta 3,3:1 en Aha claro (#8f7c79) y oscuro (#7d6867) y en Sparxie oscuro
    (#756d7b). Se probó el mínimo de WCAG, 3:1 justo (#958380, #766261 y #6e6674), y se descartó por no dejar
    margen: una raya de 1px se ve más débil que su color, y al 125 % de escalado se suaviza y pierde más. Sparxie
    claro conserva la tinta: es el estilo del tema.
- **Totales (2026-11-09):** el de la tarjeta en su cabecera, con el ticket y las tiradas enteras, como Recursos
  actuales y Paquetes; y el de cada versión al pie de su tabla, bajo las recompensas, con el mismo formato más
  pequeño y con decimales (también con el editor abierto). Se descartó la frase «N tiradas en eventos» (la única
  cifra de tiradas sin ticket) y dejar solo el de la cabecera. Cada total responde a una pregunta:
  - la cabecera, cuánto llega a tiempo: solo los eventos que cuentan (`countedEventSingles`), como el cálculo;
  - cada versión, cuánto da: todos sus eventos (`eventsSingles`), también los que aún no llegan a la fecha
    objetivo. Se probó que sumara solo los que cuentan, y una versión futura salía a 0.
- **Evento que no cuenta:** se apaga solo lo que no suma (las recompensas en la tabla; Jades y Pases en el editor);
  el nombre y la fecha (la causa) quedan a contraste normal, y el aviso va bajo el nombre.

## Glosario e interruptores

- **Subrayados del glosario** (2026-10-28): se planteó marcar «Cosmiluz» en todas las etiquetas y casillas; se
  quedó en una vez por tarjeta, donde se decide algo (con demasiados subrayados dejan de avisar). Por lo mismo,
  «garantizado» se marca solo en el del personaje.
- **Definición de la Cosmiluz:** una sola, la del plan, con sus tablas; Recursos actuales usa la misma. Su cambio
  es «20 Cosmiluz = 1 Pase Especial», no «= 1 tirada» (2026-11-01): un tipo de cambio va entre objetos, como
  el de las Esquirlas; «tirada» es la acción y sirve para contar (los totales).
- **Definición del pity (2026-10-30):** en «Pity de personaje», con los máximos de los dos banners; el de cono de
  luz, sin burbuja (como «garantizado»). Subrayada solo la palabra «Pity» (2026-11-01): con la etiqueta entera
  parecía que definía solo el de personaje. Remite a «Configuración › Pity» en texto. Se descartó un enlace dentro de
  la burbuja: con el teclado no se llega a él y para los lectores es solo una descripción.
- **Definición de las Esquirlas (2026-11-01):** en «Convertir Esquirlas en Jades», no en el campo «Esquirlas
  Oníricas» aunque salga antes: lo que explica (1 = 1 Jade) es lo que decide el interruptor.
- **«75/25» en el banner de conos (2026-11-01):** se planteó usar «50/50» como término general para los dos
  banners; se prefirió el nombre exacto de cada uno, también en la casilla de cada fila del plan.
- **Interruptores de Esquirlas:** cada uno manda solo en su tarjeta (2026-10-25). No gustó que uno pisara al otro.
- **Pie de la tarjeta de paquetes:**
  - «Usar paquetes en el plan», alineado a la derecha, bajo el total que decide; a la izquierda parecía pegado
    bajo la tabla;
  - el Resumen se queda limpio.
- **Total de la cabecera de paquetes (2026-11-02):** sin burbuja, como el de Recursos actuales; solo explica por
  qué sale apagado con «Usar paquetes en el plan» desactivado. Se descartaron «Equivalen a X tiradas y Y Jades
  (más)» y la igualdad «29.240 Esquirlas = 182 tiradas + 120 Jades»: repetían el Total y la cabecera, y los
  Jades que sobran no se pierden, se suman al resto en el Resumen.
- **Flechas de los campos numéricos (2026-11-02):** propias, dentro del campo (un bloque a la derecha partido en
  dos), porque las nativas eran pequeñas e incómodas. Se descartaron botones +1/−1 al lado del campo: duplicaban las
  flechas. No en Jades ni Esquirlas, que van por miles: no se ponen solo por homogeneidad. La Cosmiluz sí
  las lleva: va por decenas y sirve para sumar lo que da un 4★ (+8). Solo con ratón: en táctil no llegarían a los 44px.
- **Punto de miles al editar un campo numérico (2026-11-02):** se descartó. Con la capa actual el cursor no
  cuadraría con las cifras, y pasar el campo a texto con formato en vivo no compensa: al escribir, el número sin
  punto se lee bien, como en Excel.
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
- **Capa sobre la tarjeta en Aha oscuro (2026-11-13):** `--surface-2` pasa de #311b1e a #3c2226. Estaba a 1,07:1
  de la tarjeta y la caja del editor apenas se separaba; ahora da el mismo paso que en claro (1,19:1). Es el
  token, no solo la caja: suben igual los botones, los recuadros de cifras, la fila arrastrada y el selector. Con
  él sube el texto apagado (`--text-muted`, de #9c8481 a #a48c89), para seguir a 4,5:1 sobre esa capa. Sparxie
  oscuro ya estaba a 1,18:1 y no se toca.
- **Botones y raya dentro de la caja del editor (2026-11-13; la caja y `--surface-3` se quitaron el 2026-11-18,
  con el diálogo):** «+ Evento» y «Terminar edición» llevan un relleno
  un escalón por encima de la caja (`--surface-3`, por `--btn-bg`), como los botones de la tarjeta sobre ella. Con
  el relleno de siempre (`--surface-2`, el de la propia caja) solo los separaba el borde, a 1,25:1, y se veían
  poco. Se probó también dejarlos sin relleno con el borde de la raya (`--axis`): se veían, pero eran distintos
  de los botones de la tarjeta. La raya del pie y el resto de rayas fuertes suben en Aha oscuro (`--axis`, de
  #4a2a2d a #5c363a), a la misma distancia de la tarjeta y de la caja que en claro (≈1,7:1 y ≈1,4:1).
- **Tablas en las burbujas (2026-10-30):** no parten filas; la burbuja crece lo justo para ellas, sin pasar del
  ancho de la pantalla, y el texto corrido sigue cortado a 20rem. Se descartó ensanchar solo la burbuja de la
  Cosmiluz.
- **Probabilidades de la Cosmiluz:** agrupadas por banner, su 5★ y debajo, sangrado, su 4★. Se descartaron una
  nota por fila, «(banner de personaje)» (ensanchaba la columna y alejaba las cifras) o abreviada, «(b.
  personaje)», y una columna por banner, que perdía la probabilidad base.
- **Rareza:** toda la etiqueta («Personaje 5✦ E6») va en el color de su rareza, no una estrella de color junto a
  palabras en tinta.
- **Letra del cuerpo en Aha:** Figtree. Se descartaron Outfit, DM Sans y Plus Jakarta Sans.
- **Títulos y cifras grandes en Sparxie (2026-11-06):** la Chicago del Mac clásico, en su copia de dominio
  público ChicagoFLF, a 16px en los títulos de ventana (a 18 y 20px se veían grandes). Se descartaron:
  - Instrument Serif, la del diseño original (estrechada al 86 % y con trazo, imitando una Garamond condensada),
    que no gustaba;
  - Micro 5, píxel, que se llegó a aplicar a 28px; se cambió por Chicago;
  - la Chicago de píxeles (Chicago Kare y otras copias): ninguna indica licencia, y la de Apple no es libre;
  - Workbench, Sixtyfour y Silkscreen (cifras grandes ilegibles o muy separadas), Jersey 15, Tiny5, Handjet, Big
    Shoulders Display, DM Serif Display, Gloock y Bungee.

## Otros

- **«Peor caso» en la previsión (quitado el 2026-11-10):** la cifra de tiradas con la peor suerte posible (cada 5★
  en el límite del juego, todas las apuestas perdidas y solo los 4★ garantizados) no era realista. La previsión se
  queda con «Suerte media» y «90 % seguro». El cálculo sigue, sin mostrarse, para decidir cuándo una fila dice
  100 %.
- **Orden de las tarjetas:** «Recursos actuales» antes que la fecha objetivo (2026-10-28). Los recursos se
  actualizan en cada visita; la fecha, pocas veces.
- **Fechas destacadas:** sin título encima de la tabla, que se veía descompensado; solo en la vista estrecha.
  - Al desplegar y plegar (2026-11-19), la lista cambia de alto y lo de debajo la acompaña, con la curva quíntica
    (`cubic-bezier(0.83, 0, 0.17, 1)`, elegida por el usuario). Se probaron una máscara con el resto saltando de
    golpe, `ease-out`, `ease-in-out` y la cúbica.
  - Plegada, llega hasta la versión de la fecha objetivo si es posterior a la próxima; antes, en ese caso, se veían
    todas. No se pliega sola al elegir una fecha: movería lo de debajo justo tras el clic y obligaría a desplegar
    otra vez para probar otra. Por lo mismo, plegada crece sola hasta la fecha objetivo pero no encoge sola (al
    principio encogía al elegir una fecha de más arriba); encoge con «Ver menos», hasta la versión de la fecha.
- **Resumen:** sin la línea de veredicto bajo la cifra.
- **Cuenta atrás:** «en N días» en todas partes (`fmtCountdown`), por homogeneidad. Se probó «quedan N días»: en
  Sparxie partía la segunda línea de cada fecha destacada, y solo en el Resumen rompía la homogeneidad.
- **Fecha del Resumen (2026-11-06):** texto gris junto al título, «11 de noviembre (en 5 días)», con el mes
  entero. Si no cabe (móvil), parte entre la fecha y la cuenta atrás. Se probó la hoja de
  calendario de las fechas destacadas, con el nombre de la fecha destacada y «miércoles (en 42 días)», y se
  descartó:
  - en la cabecera, junto al título, cargaba la esquina de arriba y la tarjeta parecía caerse;
  - a la derecha de la cifra, el texto se montaba sobre la ilustración de Aha con la tarjeta estrecha.
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

## Auditoría con modern-web-guidance (2026-11-18)

- **Aviso de deshacer:** se queda con temporizador, alargado de 5 a 10 s (`TOAST_MS`), y se para con el ratón o el
  foco encima. Se descartó que no se fuera solo hasta cerrarlo, aunque lo recomiendan la guía y Material 3: el
  usuario prefirió el comportamiento de Gmail.
- **Galería de dupes:** flota una sola vez (sube y baja en 4,8 s) y se queda quieta, en vez de un bucle
  infinito. Así no necesita un botón para pararla (WCAG 2.2.2 lo pide para lo que se mueve solo más de 5 s), que
  sí era la otra opción de la guía; se eligió para no añadir controles a una decoración.
- **Reordenar sin arrastrar:** un toque en el asa (sin moverla) abre un menú «Subir / Bajar» bajo la fila. Se
  prefirió a dos botones ▲▼ en cada fila, que cargaban las filas del plan y de los eventos.
- **Sin `font-size-adjust`:** la guía lo pide para que la letra no salte al cargar Figtree. Con `from-font` no
  sirve (mientras carga mide la de reserva), y con el valor de Figtree (0,500) se heredaría a los títulos en la
  letra de naipe y los encogería, salvo anulándolo en cada uno de sus nueve sitios. Las fuentes ya van con la app,
  así que el salto es corto.
- **Sin `popover` para burbujas, aviso y menús:** el atributo aún no es Baseline amplio y pediría cargar un
  polyfill; hoy nada tapa esas capas (`--z-*`).
- **Cortes de pantalla en `px`:** la guía prefiere `em` (y `<meta name="text-scale">`) para seguir el tamaño de
  letra del sistema; cambiarlos es rehacer todos los breakpoints, y se dejó.

