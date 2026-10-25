---
target: tarjeta de paquetes de Esquirlas y Tienda
total_score: 24
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 1
target_identity: "file:C:\\Users\\Desert\\Desktop\\dinerorail\\src\\components\\ShardPacks.tsx"
target_fingerprint: "sha256:eacd9b8c2e0d7712795f1c16a0df3317021954fee4406f3e27ca5377f4389eb8"
target_path: "C:\\Users\\Desert\\Desktop\\dinerorail\\src\\components\\ShardPacks.tsx"
timestamp: 2026-10-25T20-24-22Z
slug: src-components-shardpacks-tsx
---
# Critique (4.ª pasada): «Paquetes de Esquirlas Oníricas» y «Tienda»

Método: dos agentes (A: revisión de diseño · B: detector + Playwright). Sin overlay en vivo.

## Nielsen (3.ª → 4.ª)
1 Visibilidad 3 · 2 Lenguaje 3 · 3 Control 3 · 4 Consistencia 3 · 5 Prevención 3→2 · 6 Reconocimiento 2 · 7 Eficiencia 2 · 8 Minimalismo 2→3 · 9 n/a · 10 Ayuda 3. Total 24/36 (igual), Aceptable 67 %.

## Especificidad
Específica, propia de la tienda del juego. Plantilla: 19 iconos de Esquirla. Detector: 0 hallazgos en ShardPacks, StoreSettings, Toggle y Tip.

## Medido
Cuentas coinciden con packs.ts en todas las pantallas (también con 99). Cambiar de tienda o apagar: 0 movimiento. Toque cambia el control y abre la ayuda; zonas sin solapes. Contrastes ≥ 3,52:1.

## Lo que funciona
- Estabilidad (precio fijo, .swap, hueco reservado).
- Filas comprobables (Por compra, ayuda del ×2).
- Semántica y móvil.

## Problemas prioritarios
1. [P1] Columna ×2 sin título visible y marcada por defecto (ShardPacks.tsx:68, packs.ts firstBonus: true). Fix: título «1.ª compra»; decidir si por defecto desmarcada.
2. [P2] Apagado a medias: totales por fila siguen en negrita. Fix: atenuarlos como la fila Total.
3. [P2] Burbujas tapan lo que explican (interruptor sobre fila Total / tarjeta siguiente; ×2 sobre la fila de debajo; «España» sobre el interruptor). Fix: acortar; no abrir al tocar un interruptor.
4. [P2] Burbujas no recorribles con el ratón (WCAG 1.4.13): pointer-events none + cierre al salir. Fix: hoverable con margen. Global.
5. [P3] «Total» 400→600 mueve columnas 0,9px en móvil; «108.780» desborda 4,5rem por 0,7px; «sobran 10 Jades» suena a pérdida.

## Personas
- Alex: ×2 uno a uno; 150 → 99 sin aviso; sin ¥.
- Sam: apagado solo por gris; burbujas no recorribles; marcador de tienda 42×19 sin zona ampliada.
- Casey: tocar ×2 lo cambia antes de explicarlo; interruptor al final; su ayuda tapa.

## Menores
Céntimos de Japón con precisión falsa; huecos de 6/8px. Descartado: CLAUDE.md desactualizado (falso).

## Preguntas
- ¿×2 pesimista por defecto?
- ¿«España / Japón» como el propio selector?
