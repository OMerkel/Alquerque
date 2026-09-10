import { describe, expect, it } from 'vitest';
import {
  applyAction,
  BLACK,
  createInitialState,
  DEFAULT_RULES,
  getActions,
  getForbiddenReversals,
  getJumps,
  getJumpsFor,
  getMoves,
  getResult,
  hasJumpsFor,
  isGameOver,
  JUMP,
  MOVE,
  NONE,
  pieceAt,
  render,
  WHITE
} from '../../html5/src/js/core/board.js';
import { toAlgebraic } from '../../html5/src/js/core/directions.js';
import { stateFrom } from './helpers/state.js';

const notation = (action) =>
  `${toAlgebraic(action.from)}${action.type === JUMP ? 'x' : '-'}${toAlgebraic(action.to)}`;

const notations = (actions) => actions.map(notation).sort();

describe('initial position', () => {
  const state = createInitialState();

  it('places twelve light and twelve dark checkers with c3 free', () => {
    const pieces = state.field.flat();
    expect(pieces.filter((cell) => cell !== null && cell.piece === WHITE)).toHaveLength(12);
    expect(pieces.filter((cell) => cell !== null && cell.piece === BLACK)).toHaveLength(12);
    expect(pieceAt(state, { x: 2, y: 2 })).toBe(NONE);
    expect(pieceAt(state, { x: 0, y: 0 })).toBe(WHITE);
    expect(pieceAt(state, { x: 4, y: 2 })).toBe(WHITE);
    expect(pieceAt(state, { x: 0, y: 2 })).toBe(BLACK);
    expect(pieceAt(state, { x: 4, y: 4 })).toBe(BLACK);
  });

  it('lets light move first', () => {
    expect(state.active).toBe(WHITE);
    expect(state.previousAction).toBeNull();
  });

  it('offers exactly the four moves into the free centre point', () => {
    expect(notations(getActions(state))).toEqual(['b2-c3', 'c2-c3', 'd2-c3', 'd3-c3']);
    expect(getJumps(state)).toEqual([]);
  });

  it('renders a text diagram', () => {
    expect(render(state)).toContain('5b-b-b-b-b');
    expect(render(state)).toContain('3b-b-+-w-w');
    expect(render(state)).toContain(' a b c d e');
  });
});

describe('non capturing moves', () => {
  it('never moves light backwards or dark forwards', () => {
    const state = stateFrom(['.....', '.....', '..w..', '.....', '.....']);
    expect(notations(getMoves(state))).toEqual(['c3-b3', 'c3-b4', 'c3-c4', 'c3-d3', 'c3-d4']);
    const darkState = stateFrom(['.....', '.....', '..b..', '.....', '.....'], BLACK);
    expect(notations(getMoves(darkState))).toEqual(['c3-b2', 'c3-b3', 'c3-c2', 'c3-d2', 'c3-d3']);
  });

  it('uses diagonals only where they are drawn', () => {
    const state = stateFrom(['.....', '.....', '.w...', '.....', '.....']);
    expect(notations(getMoves(state))).toEqual(['b3-a3', 'b3-b4', 'b3-c3']);
  });

  it('freezes a checker that reached the opponent base row', () => {
    const light = stateFrom(['..w..', '.....', '.....', '.....', '.....']);
    expect(getMoves(light)).toEqual([]);
    const dark = stateFrom(['.....', '.....', '.....', '.....', '..b..'], BLACK);
    expect(getMoves(dark)).toEqual([]);
  });

  it('forbids taking back the pieces own last step unless inverting is allowed', () => {
    const start = stateFrom(['.....', '.....', '..w..', '.....', '.....']);
    const sideways = getMoves(start).find((a) => toAlgebraic(a.to) === 'b3');
    const stepped = { ...applyAction(start, sideways), active: WHITE };
    expect(notations(getMoves(stepped))).not.toContain('b3-c3');
    expect(notations(getMoves(stepped, { invertLast: true }))).toContain('b3-c3');
    expect(notations(getMoves(stepped, DEFAULT_RULES))).not.toContain('b3-c3');
    expect(getForbiddenReversals(stepped)).toEqual([{ from: { x: 1, y: 2 }, to: { x: 2, y: 2 } }]);
    expect(getForbiddenReversals(stepped, { invertLast: true })).toEqual([]);
  });

  it('keeps the restriction bound to a single piece', () => {
    const start = stateFrom(['.....', '.....', '..w..', '.....', 'w....']);
    const sideways = getMoves(start).find((a) => toAlgebraic(a.to) === 'b3');
    const stepped = { ...applyAction(start, sideways), active: WHITE };
    expect(notations(getMoves(stepped))).toContain('a1-a2');
  });
});

describe('capturing', () => {
  const position = stateFrom(['.....', '.....', '..b..', '..w..', '.....']);

  it('makes captures compulsory', () => {
    expect(notations(getActions(position))).toEqual(['c2xc4']);
    expect(getMoves(position).length).toBeGreaterThan(0);
    position.field[2][1].previous = { x: 1, y: 1 };
    expect(getForbiddenReversals(position)).toEqual([]);
  });

  it('captures in every direction, backwards included', () => {
    const behind = stateFrom(['.....', '..w..', '..b..', '.....', '.....']);
    expect(notations(getActions(behind))).toEqual(['c4xc2']);
  });

  it('never jumps own checkers or two checkers at once', () => {
    const own = stateFrom(['.....', '.....', '..w..', '..w..', '.....']);
    expect(getJumpsFor(own, { x: 2, y: 1 })).toEqual([]);
    const stacked = stateFrom(['.....', '..b..', '..b..', '..w..', '.....']);
    expect(getJumps(stacked)).toEqual([]);
  });

  it('ignores empty points and foreign checkers as jump origin', () => {
    expect(getJumpsFor(position, { x: 0, y: 0 })).toEqual([]);
    expect(getJumpsFor(position, { x: 2, y: 2 })).toEqual([]);
  });

  it('removes the captured checker at once', () => {
    const after = applyAction(position, getActions(position)[0]);
    expect(pieceAt(after, { x: 2, y: 2 })).toBe(NONE);
    expect(pieceAt(after, { x: 2, y: 1 })).toBe(NONE);
    expect(pieceAt(after, { x: 2, y: 3 })).toBe(WHITE);
  });

  it('continues a multiple capture with the same checker and keeps the turn', () => {
    const chain = stateFrom(['.....', '.b.b.', '.....', '.b...', 'w....']);
    const first = getActions(chain);
    expect(notations(first)).toEqual(['a1xc3']);
    const afterFirst = applyAction(chain, first[0]);
    expect(afterFirst.active).toBe(WHITE);
    expect(notations(getActions(afterFirst))).toEqual(['c3xa5', 'c3xe5']);
    const afterSecond = applyAction(afterFirst, getActions(afterFirst)[0]);
    expect(afterSecond.active).toBe(BLACK);
  });

  it('clears the invert restriction of a jumping checker', () => {
    const chain = stateFrom(['.....', '.....', '.....', '.b...', 'w....']);
    const after = applyAction(chain, getActions(chain)[0]);
    expect(after.field[2][2].previous).toBeNull();
  });

  it('cannot jump back over the emptied point', () => {
    const chain = stateFrom(['.....', '.b.b.', '.....', '.b...', 'w....']);
    const afterFirst = applyAction(chain, getActions(chain)[0]);
    expect(notations(getActions(afterFirst))).not.toContain('c3xa1');
  });

  it('reports jumps for a single point', () => {
    expect(hasJumpsFor(position, { x: 2, y: 1 })).toBe(true);
    expect(hasJumpsFor(position, { x: 0, y: 0 })).toBe(false);
  });
});

describe('turn handling and result', () => {
  it('switches the player after a normal move', () => {
    const state = createInitialState();
    const after = applyAction(state, getActions(state)[0]);
    expect(after.active).toBe(BLACK);
    expect(after.previousAction.type).toBe(MOVE);
  });

  it('scores the side to move as the loser', () => {
    expect(getResult({ active: WHITE })).toEqual([1, 0]);
    expect(getResult({ active: BLACK })).toEqual([0, 1]);
  });

  it('detects a finished game when no action is left', () => {
    const trapped = stateFrom(['.....', '.....', '.....', '.....', '.....']);
    expect(isGameOver(trapped)).toBe(true);
    expect(isGameOver(createInitialState())).toBe(false);
  });

  it('scans all points when the previous action belongs to the opponent', () => {
    const state = stateFrom(['.....', '.....', '..b..', '..w..', '.....'], WHITE, {
      type: MOVE,
      by: BLACK,
      from: { x: 0, y: 0 },
      to: { x: 0, y: 1 }
    });
    expect(notations(getJumps(state))).toEqual(['c2xc4']);
  });
});
