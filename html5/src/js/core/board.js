//
// Copyright (c) 2016-2026 Oliver Merkel
// All rights reserved.
//
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
//

import {
  BLACK,
  JUMP_DIRECTIONS,
  MOVE_DIRECTIONS,
  NONE,
  opponent,
  SIZE,
  translate,
  WHITE
} from './directions.js';

export { BLACK, NONE, SIZE, WHITE };

export const MOVE = 'move';
export const JUMP = 'jump';

export const DEFAULT_RULES = Object.freeze({ invertLast: false });

const cell = (piece, previous = null) => ({ piece, previous });

const initialPiece = (x, y) => {
  if (y < 2) return cell(WHITE);
  if (y > 2) return cell(BLACK);
  if (x > 2) return cell(WHITE);
  if (x < 2) return cell(BLACK);
  return null;
};

/** Light fills rows 1 and 2 plus d3/e3, dark fills rows 4 and 5 plus a3/b3, c3 stays empty. */
export const createInitialState = () => ({
  field: Array.from({ length: SIZE }, (_, x) =>
    Array.from({ length: SIZE }, (_, y) => initialPiece(x, y))
  ),
  active: WHITE,
  previousAction: null
});

export const pieceAt = (state, point) => {
  const found = state.field[point.x][point.y];
  return found === null ? NONE : found.piece;
};

const samePoint = (a, b) => a.x === b.x && a.y === b.y;

const isBlocked = (occupant, target, rules) =>
  !rules.invertLast && occupant.previous !== null && samePoint(occupant.previous, target);

export const getMoves = (state, rules = DEFAULT_RULES) => {
  const actions = [];
  for (let y = 0; y < SIZE; ++y) {
    for (let x = 0; x < SIZE; ++x) {
      const occupant = state.field[x][y];
      if (occupant === null || occupant.piece !== state.active) continue;
      for (const direction of MOVE_DIRECTIONS[state.active][x][y]) {
        const to = translate({ x, y }, direction);
        if (state.field[to.x][to.y] !== null) continue;
        if (isBlocked(occupant, to, rules)) continue;
        actions.push({
          type: MOVE,
          by: state.active,
          from: { x, y },
          direction,
          to
        });
      }
    }
  }
  return actions;
};

export const getJumpsFor = (state, from) => {
  const occupant = state.field[from.x][from.y];
  if (occupant === null || occupant.piece !== state.active) return [];
  const foe = opponent(state.active);
  const actions = [];
  for (const direction of JUMP_DIRECTIONS[from.x][from.y]) {
    const over = translate(from, direction);
    const to = translate(from, direction, 2);
    if (pieceAt(state, over) !== foe) continue;
    if (state.field[to.x][to.y] !== null) continue;
    actions.push({
      type: JUMP,
      by: state.active,
      from: { x: from.x, y: from.y },
      direction,
      to,
      over
    });
  }
  return actions;
};

export const hasJumpsFor = (state, from) => getJumpsFor(state, from).length > 0;

export const getJumps = (state) => {
  const previous = state.previousAction;
  if (previous !== null && previous.by === state.active) {
    return getJumpsFor(state, previous.to);
  }
  const actions = [];
  for (let y = 0; y < SIZE; ++y) {
    for (let x = 0; x < SIZE; ++x) {
      actions.push(...getJumpsFor(state, { x, y }));
    }
  }
  return actions;
};

/** Captures are compulsory: normal moves are offered only when no jump exists. */
export const getActions = (state, rules = DEFAULT_RULES) => {
  const jumps = getJumps(state);
  return jumps.length > 0 ? jumps : getMoves(state, rules);
};

const withCells = (field, changes) => {
  const next = field.map((column) => column.slice());
  for (const [point, value] of changes) next[point.x][point.y] = value;
  return next;
};

export const applyAction = (state, action) => {
  if (action.type === JUMP) {
    const field = withCells(state.field, [
      [action.from, null],
      [action.over, null],
      [action.to, cell(state.active)]
    ]);
    const moved = { field, active: state.active, previousAction: action };
    const chains = hasJumpsFor(moved, action.to);
    return {
      field,
      active: chains ? state.active : opponent(state.active),
      previousAction: action
    };
  }
  const field = withCells(state.field, [
    [action.from, null],
    [action.to, cell(state.active, action.from)]
  ]);
  return { field, active: opponent(state.active), previousAction: action };
};

/** At a terminal position the side to move has lost, and is marked with 1. */
export const getResult = (state) => (state.active === WHITE ? [1, 0] : [0, 1]);

export const isGameOver = (state, rules = DEFAULT_RULES) => getActions(state, rules).length === 0;

export const render = (state) => {
  const symbol = (x, y) => {
    const piece = pieceAt(state, { x, y });
    return piece === WHITE ? 'w' : piece === BLACK ? 'b' : '+';
  };
  const lines = [];
  for (let y = SIZE - 1; y >= 0; --y) {
    const row = Array.from({ length: SIZE }, (_, x) => symbol(x, y)).join('-');
    lines.push(`${y + 1}${row}`);
    lines.push(y === 0 ? ' a b c d e' : y % 2 === 1 ? ' |/|\\|/|\\|' : ' |\\|/|\\|/|');
  }
  return lines.join('\n');
};
