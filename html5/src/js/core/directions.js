//
// Copyright (c) 2016-2026 Oliver Merkel
// All rights reserved.
//
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
//

export const SIZE = 5;

export const WHITE = 0;
export const BLACK = 1;
export const NONE = 2;

export const EAST = Object.freeze({ x: 1, y: 0 });
export const SOUTHEAST = Object.freeze({ x: 1, y: -1 });
export const SOUTH = Object.freeze({ x: 0, y: -1 });
export const SOUTHWEST = Object.freeze({ x: -1, y: -1 });
export const WEST = Object.freeze({ x: -1, y: 0 });
export const NORTHWEST = Object.freeze({ x: -1, y: 1 });
export const NORTH = Object.freeze({ x: 0, y: 1 });
export const NORTHEAST = Object.freeze({ x: 1, y: 1 });

export const ALL_DIRECTIONS = Object.freeze([
  EAST,
  SOUTHEAST,
  SOUTH,
  SOUTHWEST,
  WEST,
  NORTHWEST,
  NORTH,
  NORTHEAST
]);

export const opponent = (player) => player ^ 1;

/** Row a player's checkers may never leave once reached (the opponent's base row). */
export const opponentBaseRow = (player) => (player === WHITE ? SIZE - 1 : 0);

export const isOnBoard = (point) =>
  point.x >= 0 && point.x < SIZE && point.y >= 0 && point.y < SIZE;

export const translate = (point, direction, steps = 1) => ({
  x: point.x + steps * direction.x,
  y: point.y + steps * direction.y
});

export const isDiagonal = (direction) => direction.x !== 0 && direction.y !== 0;

/** Diagonals are drawn on every second point only. */
export const hasLine = (point, direction) =>
  !isDiagonal(direction) || (point.x + point.y) % 2 === 0;

const isForward = (player, direction) => (player === WHITE ? direction.y >= 0 : direction.y <= 0);

export const moveDirections = (player, point) =>
  point.y === opponentBaseRow(player)
    ? []
    : ALL_DIRECTIONS.filter(
        (direction) =>
          isForward(player, direction) &&
          hasLine(point, direction) &&
          isOnBoard(translate(point, direction))
      );

export const jumpDirections = (point) =>
  ALL_DIRECTIONS.filter(
    (direction) => hasLine(point, direction) && isOnBoard(translate(point, direction, 2))
  );

const buildTable = (build) =>
  Object.freeze(
    Array.from({ length: SIZE }, (_, x) =>
      Object.freeze(Array.from({ length: SIZE }, (_, y) => Object.freeze(build({ x, y }))))
    )
  );

export const MOVE_DIRECTIONS = Object.freeze([
  buildTable((point) => moveDirections(WHITE, point)),
  buildTable((point) => moveDirections(BLACK, point))
]);

export const JUMP_DIRECTIONS = buildTable(jumpDirections);

export const toAlgebraic = (point) => `${String.fromCharCode(97 + point.x)}${point.y + 1}`;
