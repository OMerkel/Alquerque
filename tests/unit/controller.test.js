import { describe, expect, it, vi } from 'vitest';
import {
  BLACK,
  createInitialState,
  getActions,
  NONE,
  WHITE
} from '../../html5/src/js/core/board.js';
import { toAlgebraic } from '../../html5/src/js/core/directions.js';
import {
  createController,
  describe as describeBoard,
  MAX_ITERATIONS,
  MAX_TIME
} from '../../html5/src/js/worker/controller.js';
import { stateFrom } from './helpers/state.js';

const HUMANS = {
  class: 'request',
  playerwhite: 'Human',
  playerblack: 'Human',
  invertlast: false
};

const AI_WHITE = { ...HUMANS, playerwhite: 'AI' };

const scope = () => {
  const messages = [];
  return { messages, postMessage: (message) => messages.push(message) };
};

const send = (controller, data) => controller.handleMessage({ data });

describe('board snapshot', () => {
  it('describes square, turn, actions and who plays next', () => {
    const board = describeBoard(createInitialState(), { invertLast: false }, HUMANS);
    expect(board.turn).toBe(WHITE);
    expect(board.square[2][2]).toBe(NONE);
    expect(board.square[0][0]).toBe(WHITE);
    expect(board.square[0][4]).toBe(BLACK);
    expect(board.actions).toHaveLength(4);
    expect(board.reversals).toEqual([]);
    expect(board.outcome).toBeNull();
    expect(board.nextishuman).toBe(true);
    expect(board.previous).toBeNull();
  });

  it('describes reversals forbidden by the active rule', () => {
    const state = stateFrom(['.....', '.....', '.w...', '.....', '.....']);
    state.field[1][2].previous = { x: 2, y: 2 };
    expect(describeBoard(state, { invertLast: false }, HUMANS).reversals).toEqual([
      { from: { x: 1, y: 2 }, to: { x: 2, y: 2 } }
    ]);
    expect(describeBoard(state, { invertLast: true }, HUMANS).reversals).toEqual([]);
  });

  it('marks the next turn as non human for the AI and for a finished game', () => {
    const state = createInitialState();
    expect(describeBoard(state, { invertLast: false }, AI_WHITE).nextishuman).toBe(false);
    const empty = stateFrom(['.....', '.....', '.....', '.....', '.....']);
    expect(describeBoard(empty, { invertLast: false }, HUMANS).nextishuman).toBe(false);
  });

  it('describes the winner and why the game ended', () => {
    const captured = stateFrom(['.....', '.....', '.....', '.....', '....b']);
    expect(describeBoard(captured, { invertLast: false }, HUMANS).outcome).toEqual({
      winner: BLACK,
      reason: 'all-pawns-captured'
    });
    const immobilised = stateFrom(['w....', '.....', '.....', '.....', '....b']);
    expect(describeBoard(immobilised, { invertLast: false }, HUMANS).outcome).toEqual({
      winner: BLACK,
      reason: 'no-legal-move'
    });
  });
});

describe('controller', () => {
  it('answers start with a redraw of the initial position', () => {
    const host = scope();
    const controller = createController(host);
    expect(send(controller, { ...HUMANS, request: 'start' })).toBe(true);
    expect(host.messages).toHaveLength(1);
    expect(host.messages[0]).toMatchObject({
      eventClass: 'request',
      request: 'redraw',
      actioninfo: null
    });
    expect(host.messages[0].board.actions).toHaveLength(4);
  });

  it('applies a human action and redraws', () => {
    const host = scope();
    const controller = createController(host);
    const action = getActions(createInitialState(), { invertLast: false }).find(
      (candidate) => toAlgebraic(candidate.from) === 'c2'
    );
    send(controller, { ...HUMANS, request: 'perform', action });
    expect(controller.getState().active).toBe(BLACK);
    expect(host.messages[0].board.turn).toBe(BLACK);
    expect(host.messages[0].actioninfo.action).toBe(action);
  });

  it('lets the engine choose and apply an action', () => {
    const host = scope();
    const action = getActions(createInitialState(), { invertLast: false })[0];
    const search = vi.fn(() => ({ action, info: 'test' }));
    const controller = createController(host, { search });
    send(controller, { ...AI_WHITE, request: 'actionbyai', invertlast: true });
    expect(search).toHaveBeenCalledWith(expect.anything(), {
      maxIterations: MAX_ITERATIONS,
      maxTime: MAX_TIME,
      rules: { invertLast: true }
    });
    expect(controller.getState().active).toBe(BLACK);
    expect(host.messages[0].actioninfo.info).toBe('test');
  });

  it('only redraws when the engine finds no action', () => {
    const host = scope();
    const search = () => ({ action: null, info: 'none' });
    const controller = createController(host, { search });
    send(controller, { ...AI_WHITE, request: 'actionbyai' });
    expect(host.messages).toHaveLength(1);
    expect(host.messages[0].actioninfo).toBeNull();
    expect(controller.getState().active).toBe(WHITE);
  });

  it('restores the initial position on restart', () => {
    const host = scope();
    const controller = createController(host);
    controller.setState(stateFrom(['.....', '.....', '.....', '.....', 'w....']));
    send(controller, { ...HUMANS, request: 'restart' });
    expect(host.messages.map((message) => message.request)).toEqual(['restore', 'redraw']);
    expect(controller.getState().active).toBe(WHITE);
    expect(host.messages[1].board.actions).toHaveLength(4);
  });

  it('ignores unknown requests and foreign message classes', () => {
    const host = scope();
    const controller = createController(host);
    expect(send(controller, { ...HUMANS, request: 'nonsense' })).toBe(false);
    expect(send(controller, { class: 'response', state: 'message' })).toBe(false);
    expect(host.messages).toHaveLength(0);
  });
});
