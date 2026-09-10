import { describe, expect, it } from 'vitest';
import { createInitialState, getActions } from '../../html5/src/js/core/board.js';
import { toAlgebraic } from '../../html5/src/js/core/directions.js';
import { getActionInfo } from '../../html5/src/js/engine/random.js';
import { stateFrom } from './helpers/state.js';

const RULES = { invertLast: false };

describe('random engine', () => {
  it('picks the action addressed by the random source', () => {
    const state = createInitialState();
    const actions = getActions(state, RULES);
    const result = getActionInfo(state, { rules: RULES, random: () => 0.99 });
    expect(result.action).toStrictEqual(actions[actions.length - 1]);
    expect(result.info).toBe(`Random select out of ${actions.length} available actions.`);
  });

  it('picks the first action for a zero sample', () => {
    const state = createInitialState();
    const result = getActionInfo(state, { rules: RULES, random: () => 0 });
    expect(toAlgebraic(result.action.to)).toBe('c3');
  });

  it('returns no action when the game is over', () => {
    const empty = stateFrom(['.....', '.....', '.....', '.....', '.....']);
    const result = getActionInfo(empty, { rules: RULES });
    expect(result.action).toBeNull();
    expect(result.info).toBe('Random select out of 0 available actions.');
  });

  it('falls back to Math.random and the default rules', () => {
    const result = getActionInfo(createInitialState());
    expect(result.action).not.toBeNull();
  });
});
