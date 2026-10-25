interface Props {
  stars: 4 | 5;
}

/**
 * Rareza como en el juego: la cifra y una estrella de cuatro puntas (las de las cartas de personaje) en el
 * color de su rareza, morado para 4★ y dorado para 5★, para distinguirlas de un vistazo. Es el color del juego,
 * como sus iconos, no un aviso. Dibujada en SVG: el ★ es otra forma y en algunos sistemas sale como emoji.
 * Para los lectores de pantalla, «4★».
 */
export function Rarity({ stars }: Props) {
  return (
    <span className={`rarity rarity-${stars}`}>
      {stars}
      <svg className="rarity-star" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 0C8.7 5 11 7.3 16 8 11 8.7 8.7 11 8 16 7.3 11 5 8.7 0 8 5 7.3 7.3 5 8 0Z" />
      </svg>
      <span className="sr-only">★</span>
    </span>
  );
}
