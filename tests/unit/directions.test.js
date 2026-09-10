import { describe, expect, it } from 'vitest';
import {
  ALL_DIRECTIONS,
  BLACK,
  hasLine,
  isDiagonal,
  isOnBoard,
  JUMP_DIRECTIONS,
  jumpDirections,
  MOVE_DIRECTIONS,
  moveDirections,
  opponent,
  opponentBaseRow,
  SIZE,
  toAlgebraic,
  translate,
  WHITE
} from '../../html5/src/js/core/directions.js';

const NAMES = new Map(ALL_DIRECTIONS.map((direction) => [direction, null]));
const nameOf = (direction) => {
  const vertical = direction.y > 0 ? 'N' : direction.y < 0 ? 'S' : '';
  const horizontal = direction.x > 0 ? 'E' : direction.x < 0 ? 'W' : '';
  return `${vertical}${horizontal}`;
};
for (const direction of ALL_DIRECTIONS) NAMES.set(direction, nameOf(direction));

const asNames = (directions) => [...directions.map((d) => NAMES.get(d))].sort();
const expected = (names) => [...names].sort();

/*
 * Reference tables copied from the pre-refactoring implementation
 * (html5/src/js/board.js, DIRECTION.move and DIRECTION.jump).
 * They guarantee that the refactoring did not change a single legal action.
 */
const LEGACY_MOVE_WHITE = [
  [['N', 'NE', 'E'], ['N', 'E'], ['N', 'NE', 'E'], ['N', 'E'], []],
  [['W', 'N', 'E'], ['W', 'NW', 'N', 'NE', 'E'], ['W', 'N', 'E'], ['W', 'NW', 'N', 'NE', 'E'], []],
  [['W', 'NW', 'N', 'NE', 'E'], ['W', 'N', 'E'], ['W', 'NW', 'N', 'NE', 'E'], ['W', 'N', 'E'], []],
  [['W', 'N', 'E'], ['W', 'NW', 'N', 'NE', 'E'], ['W', 'N', 'E'], ['W', 'NW', 'N', 'NE', 'E'], []],
  [['W', 'NW', 'N'], ['W', 'N'], ['W', 'NW', 'N'], ['W', 'N'], []]
];

const LEGACY_MOVE_BLACK = [
  [[], ['E', 'S'], ['E', 'SE', 'S'], ['E', 'S'], ['E', 'SE', 'S']],
  [[], ['E', 'SE', 'S', 'SW', 'W'], ['E', 'S', 'W'], ['E', 'SE', 'S', 'SW', 'W'], ['E', 'S', 'W']],
  [[], ['E', 'S', 'W'], ['E', 'SE', 'S', 'SW', 'W'], ['E', 'S', 'W'], ['E', 'SE', 'S', 'SW', 'W']],
  [[], ['E', 'SE', 'S', 'SW', 'W'], ['E', 'S', 'W'], ['E', 'SE', 'S', 'SW', 'W'], ['E', 'S', 'W']],
  [[], ['S', 'W'], ['S', 'SW', 'W'], ['S', 'W'], ['S', 'SW', 'W']]
];

const ALL = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];

const LEGACY_JUMP = [
  [
    ['N', 'NE', 'E'],
    ['N', 'E'],
    ['N', 'NE', 'E', 'SE', 'S'],
    ['S', 'E'],
    ['E', 'SE', 'S']
  ],
  [
    ['N', 'E'],
    ['N', 'NE', 'E'],
    ['N', 'E', 'S'],
    ['E', 'SE', 'S'],
    ['E', 'S']
  ],
  [['W', 'NW', 'N', 'NE', 'E'], ['W', 'N', 'E'], ALL, ['E', 'S', 'W'], ['E', 'SE', 'S', 'SW', 'W']],
  [
    ['W', 'N'],
    ['W', 'NW', 'N'],
    ['S', 'W', 'N'],
    ['S', 'SW', 'W'],
    ['S', 'W']
  ],
  [
    ['W', 'NW', 'N'],
    ['W', 'N'],
    ['S', 'SW', 'W', 'NW', 'N'],
    ['S', 'W'],
    ['S', 'SW', 'W']
  ]
];

describe('geometry helpers', () => {
  it('names the two players and their base rows', () => {
    expect(opponent(WHITE)).toBe(BLACK);
    expect(opponent(BLACK)).toBe(WHITE);
    expect(opponentBaseRow(WHITE)).toBe(4);
    expect(opponentBaseRow(BLACK)).toBe(0);
  });

  it('detects points on and off the board', () => {
    expect(isOnBoard({ x: 0, y: 0 })).toBe(true);
    expect(isOnBoard({ x: 4, y: 4 })).toBe(true);
    expect(isOnBoard({ x: -1, y: 0 })).toBe(false);
    expect(isOnBoard({ x: 0, y: -1 })).toBe(false);
    expect(isOnBoard({ x: SIZE, y: 0 })).toBe(false);
    expect(isOnBoard({ x: 0, y: SIZE })).toBe(false);
  });

  it('translates by one and by two steps', () => {
    const east = ALL_DIRECTIONS[0];
    expect(translate({ x: 1, y: 1 }, east)).toEqual({ x: 2, y: 1 });
    expect(translate({ x: 1, y: 1 }, east, 2)).toEqual({ x: 3, y: 1 });
  });

  it('knows where diagonals are drawn', () => {
    const [east, southEast] = ALL_DIRECTIONS;
    expect(isDiagonal(east)).toBe(false);
    expect(isDiagonal(southEast)).toBe(true);
    expect(hasLine({ x: 1, y: 0 }, east)).toBe(true);
    expect(hasLine({ x: 1, y: 0 }, southEast)).toBe(false);
    expect(hasLine({ x: 2, y: 2 }, southEast)).toBe(true);
  });

  it('renders algebraic coordinates', () => {
    expect(toAlgebraic({ x: 0, y: 0 })).toBe('a1');
    expect(toAlgebraic({ x: 4, y: 4 })).toBe('e5');
    expect(toAlgebraic({ x: 2, y: 2 })).toBe('c3');
  });
});

describe('direction tables match the legacy implementation', () => {
  for (let x = 0; x < SIZE; ++x) {
    for (let y = 0; y < SIZE; ++y) {
      it(`light moves at ${toAlgebraic({ x, y })}`, () => {
        expect(asNames(MOVE_DIRECTIONS[WHITE][x][y])).toEqual(expected(LEGACY_MOVE_WHITE[x][y]));
        expect(asNames(moveDirections(WHITE, { x, y }))).toEqual(expected(LEGACY_MOVE_WHITE[x][y]));
      });
      it(`dark moves at ${toAlgebraic({ x, y })}`, () => {
        expect(asNames(MOVE_DIRECTIONS[BLACK][x][y])).toEqual(expected(LEGACY_MOVE_BLACK[x][y]));
      });
      it(`jumps at ${toAlgebraic({ x, y })}`, () => {
        expect(asNames(JUMP_DIRECTIONS[x][y])).toEqual(expected(LEGACY_JUMP[x][y]));
        expect(asNames(jumpDirections({ x, y }))).toEqual(expected(LEGACY_JUMP[x][y]));
      });
    }
  }
});
