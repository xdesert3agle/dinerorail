---
target: tarjeta de paquetes de Esquirlas
total_score: 23
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\Desert\\Desktop\\dinerorail\\src\\components\\ShardPacks.tsx"
target_fingerprint: "sha256:322b1300e23ea4fa9bbf6265218ace73ea0263e85824c1ea4d77966adacaa3b5"
target_path: "C:\\Users\\Desert\\Desktop\\dinerorail\\src\\components\\ShardPacks.tsx"
timestamp: 2026-10-25T18-58-55Z
slug: src-components-shardpacks-tsx
---
# Critique: tarjeta «Paquetes de Esquirlas Oníricas»

Método: dos agentes (A: revisión de diseño · B: detector + capturas Playwright) + lectura con taste (app screens). Sin overlay en vivo (no hay herramienta de inyección).

## Veredicto sobre los dos interruptores
No deberían ir juntos: «Sumar los paquetes al total» cambia la previsión y se toca a menudo; «Pagar con precios de Japón (¥)» solo cambia la columna Precio y se fija una vez. Mismo peso visual, lejos de lo que cambian.
- «Sumar» se queda al pie, primero.
- Yen: preferido a Configuración como «Tienda: España | Japón» (segmentado .skin-switch) + `tip-term` en «Precio» cuando está activo. Alternativa: bajo la fila Total, separado con --space-3+. Descartado segmentado €/¥.

## Nielsen
1 Visibilidad 2 · 2 Lenguaje 3 · 3 Control 3 · 4 Consistencia 2 · 5 Prevención 3 · 6 Reconocimiento 2 · 7 Eficiencia 3 · 8 Minimalismo 3 · 9 n/a · 10 Ayuda 2 = 23/36 (Aceptable, 64 %).

## Especificidad
Tarjeta propia del producto (iconos, ×6.480, ×2, cifras tabulares, fila Total). Lo genérico es la pila de ajustes del final. Detector: 0 hallazgos en ShardPacks.tsx y Toggle.tsx.

## Lo que funciona
- Apagar no borra cantidades; total de cabecera reserva sitio.
- Rejilla estable: columnas fijas, tabulares, móvil en dos líneas, role=table.
- Color solo para problemas.

## Problemas prioritarios
1. [P1] Apagar «Sumar» apenas se nota en la tarjeta: la fila Total sigue en negrita. Fix: .is-off también en las Esquirlas de la fila Total.
2. [P1] Explicaciones solo en `title` (ShardPacks.tsx:89, :109, :154, :161). Fix: <Tip control> en los interruptores, tip-term en Precio, quitar title de Toggle.
3. [P2] Los dos interruptores no forman grupo con sentido. Fix: el reparto del veredicto.
4. [P2] Zona clicable de ancho completo (582px; táctil solapa 7,7px). Fix: justify-self: start en .toggle; --space-3 entre apilados.
5. [P3] Pista apagada 1,72:1 claro / 1,36:1 oscuro (< 3:1). Fix: token ≥3:1 o borde. Global.

## Personas
- Alex: ida y vuelta al Resumen para comparar; ¥ solo tras retardo de title.
- Sam: title irregular, precio sin foco, pista 1,7:1, clic accidental.
- Casey: sin efecto visible al cambiar, ayudas no tocables, zonas solapadas.

## Menores
- «Pack» → «Paquete».
- 12px entre fila Total e interruptores: se leen como fila.
- Comentario de .field-group (styles.css:1554) desactualizado.
- «(¥)» sobra si los precios siguen en €.

## Preguntas
- Si el yen se fija una vez, ¿por qué pesa como «¿llego sin pagar?»?
- Con «Sumar» apagado, ¿la cabecera debería decir cuánto falta sin paquetes?
