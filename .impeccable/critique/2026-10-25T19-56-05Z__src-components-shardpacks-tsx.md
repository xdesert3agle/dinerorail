---
target: tarjeta de paquetes de Esquirlas y Tienda
total_score: 24
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 1
target_identity: "file:C:\\Users\\Desert\\Desktop\\dinerorail\\src\\components\\ShardPacks.tsx"
target_fingerprint: "sha256:5d55ba172ff6b110a1f197a5c5bc11e7244bdecc1ee071868e4975caf777c3c0"
target_path: "C:\\Users\\Desert\\Desktop\\dinerorail\\src\\components\\ShardPacks.tsx"
timestamp: 2026-10-25T19-56-05Z
slug: src-components-shardpacks-tsx
---
# Critique (3.ª pasada): «Paquetes de Esquirlas Oníricas» y «Tienda»

Método: dos agentes (A: revisión de diseño · B: detector + Playwright). Sin overlay en vivo.

## Nielsen (2.ª → 3.ª)
1 Visibilidad 3 · 2 Lenguaje 2→3 · 3 Control 3 · 4 Consistencia 3 · 5 Prevención 3 · 6 Reconocimiento 2 · 7 Eficiencia 2 · 8 Minimalismo 3→2 · 9 n/a · 10 Ayuda 2→3. Total 24/36 (igual), Aceptable 67 %.

## Especificidad
Específica (tienda del juego, seis niveles, ×2, región con cambio). Lo más genérico: la tarjeta «Tienda» para un segmentado de dos opciones. Detector: 0 hallazgos.

## Medido
Cambiar de tienda o apagar: 0 movimiento. «Por compra», precio y Total coherentes en € y ¥. Contrastes ≥ 3:1. Sin desbordamiento a 390/360.

## Lo que funciona
- Estabilidad (precio fijo, .swap, hueco reservado).
- Números honestos (apagado: precio se queda, Resumen a 0).
- Semántica accesible.

## Problemas prioritarios
1. [P1] La ayuda del ×2 dice «el doble» pero dobla la base (6.480 → 12.960, no 2 × 8.080). ShardPacks.tsx:106. Fix: ayuda por fila con la cifra real.
2. [P2] 3 cifras cortadas a 1400 (campo 64px); totales de 7 cifras ensanchan la columna Total 16,5px. Fix: max={99}.
3. [P2] Móvil: títulos de columna sobre la línea equivocada; a 360 el ×2 toca el icono del Total. Fix: cabecera sr-only en ≤720px y «Por compra» como dato secundario en la línea 1.
4. [P2] Ayudas de controles no se abren al tocar. Fix: mostrar también al tocar.
5. [P3] La ayuda de Tienda tapa España | Japón y no dice por qué Japón. Fix: abrir encima; «Japón suele salir más barato…».

## Personas
- Alex: sin cifra de primera compra ni ¥; ×2 uno a uno.
- Sam: «no cuenta» solo por gris; aria-label por precio (cambia con la tienda).
- Casey: títulos mal colocados, ayudas no tocables, 636px.

## Menores
Totales de fila en negrita al apagar; icono del nombre sobra (19 → 13); ×2 poco visible; PRODUCT.md menciona export/import JSON (quitado). Descartado: renombrar interruptor (decidido), CLAUDE.md desactualizado (falso).

## Preguntas
- ¿×2 como estado de la cuenta?
- ¿La tarjeta debería proponer la combinación más barata para lo que falta?
