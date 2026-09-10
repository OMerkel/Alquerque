import { BLACK, SIZE, WHITE } from '../../../html5/src/js/core/board.js';

/** Builds a position from five rows given from row 5 down to row 1, columns a to e. */
export const stateFrom = (rows, active = WHITE, previousAction = null) => ({
  field: Array.from({ length: SIZE }, (_, x) =>
    Array.from({ length: SIZE }, (_, y) => {
      const symbol = rows[SIZE - 1 - y][x];
      if (symbol === 'w') return { piece: WHITE, previous: null };
      if (symbol === 'b') return { piece: BLACK, previous: null };
      return null;
    })
  ),
  active,
  previousAction
});

export const EMPTY_BOARD = ['.....', '.....', '.....', '.....', '.....'];
