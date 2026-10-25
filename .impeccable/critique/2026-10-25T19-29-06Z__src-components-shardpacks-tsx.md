---
target: tarjeta de paquetes de Esquirlas y Tienda
total_score: 24
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 1
target_identity: "file:C:\\Users\\Desert\\Desktop\\dinerorail\\src\\components\\ShardPacks.tsx"
target_fingerprint: "sha256:d2f3b2ef071febbc31ed656df64a00af0c4570150ac94d5db8fdaa5f83802a4d"
target_path: "C:\\Users\\Desert\\Desktop\\dinerorail\\src\\components\\ShardPacks.tsx"
timestamp: 2026-10-25T19-29-06Z
slug: src-components-shardpacks-tsx
---
# Critique (2.ª pasada): «Paquetes de Esquirlas Oníricas» y «Tienda»

Método: dos agentes (A: revisión de diseño · B: detector + Playwright). Sin overlay en vivo.

## Nielsen (antes → ahora)
1 Visibilidad 2→3 · 2 Lenguaje 3→2 · 3 Control 3 · 4 Consistencia 2→3 · 5 Prevención 3 · 6 Reconocimiento 2 · 7 Eficiencia 3→2 · 8 Minimalismo 3 · 9 n/a · 10 Ayuda 2. Total 24/36 (antes 23/36), Aceptable 67 %.

## Especificidad
Específica (iconos del juego, Card Characters, cifras tabulares, vocabulario de jugador). Genérico: 3 iconos iguales por fila; «España | Japón» reutiliza la píldora de temas. Detector: 0 hallazgos en ShardPacks, StoreSettings y Toggle.

## Medido
Interruptor 214×21 (escritorio), 214×37 (táctil), sin solapes. Pista apagada 5,55:1 / 4,96:1; encendida 4,09:1 / 4,90:1. 16px entre Total e interruptor. Sin saltos en la tarjeta. Burbujas dentro de la ventana.

## Lo que funciona
- Estabilidad: columnas fijas, hueco reservado, apagado en Esquirlas no en precio.
- Accesibilidad: role=table, nombres propios, role=switch con descripción, sr-only.
- Móvil: dos líneas, sin desbordamiento.

## Problemas prioritarios
1. [P1] «Por compra» no cuadra con «Total» (ShardPacks.tsx:76: base×2 con ×2; 2 compras de 980 → 1.960 visto, total 3.050). Fix: mostrar siempre base+bonus.
2. [P2] Las ayudas de Tip control no se abren al tocar (Tip.tsx:160). Fix: en táctil, abrir también al tocar sin quitar el toque al control.
3. [P2] La burbuja del interruptor se abre encima y tapa la fila Total; flecha al centro del texto, no a la pista. Fix: preferir debajo; en Toggle, flecha a la pista.
4. [P2] Tienda no se descubre con España; ayuda mal redactada. Fix: «España»/«Japón» siempre en la fila Total con ayuda de dónde se cambia; reescribir la ayuda. Quita también el +1,1px en móvil.
5. [P3] Cantidad sin máximo: «120» se corta. Fix: max={99}.

## Personas
- Alex: sin €/tirada; ×2 uno a uno; 3 cifras cortadas.
- Sam: apagado de la fila Total solo por color.
- Casey: ayudas no tocables; ×6.480 y 12.960 apilados con el mismo icono.

## Menores
«×» con dos sentidos; columna ×2 sin cabecera visible. Descartado: CLAUDE.md desactualizado (falso), renombrar el interruptor (decidido), borde rojo de burbujas (decidido).

## Preguntas
- ¿€/tirada como dato principal?
- Apagado: ¿cifra atenuada o «+0»?
