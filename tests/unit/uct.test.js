import { describe, expect, it } from 'vitest';
import { BLACK, createInitialState, getActions, WHITE } from '../../html5/src/js/core/board.js';
import { toAlgebraic } from '../../html5/src/js/core/directions.js';
import {
  addChild,
  BLOCK_SIZE,
  backpropagate,
  createNode,
  getActionInfo,
  mostVisitedChild,
  playout,
  selectChild,
  ucb1,
  update
} from '../../html5/src/js/engine/uct.js';
import { stateFrom } from './helpers/state.js';

const RULES = { invertLast: false };

const forcedCapture = () => stateFrom(['.....', '.....', '..b..', '..w..', '.....']);

const finished = () => stateFrom(['.....', '.....', '.....', '.....', '.....']);

const sequence = (values) => {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
};

describe('uct nodes', () => {
  it('collects the untried actions and the player to move', () => {
    const state = createInitialState();
    const node = createNode(null, state, null, RULES);
    expect(node.unexamined).toHaveLength(getActions(state, RULES).length);
    expect(node.activePlayer).toBe(WHITE);
    expect(node.children).toEqual([]);
    expect(node.parentNode).toBeNull();
  });

  it('computes the UCB1 value', () => {
    const child = { wins: 3, visits: 4 };
    expect(ucb1(child, 10)).toBeCloseTo(3 / 4 + Math.sqrt((2 * Math.log(10)) / 4), 12);
  });

  it('selects the child with the greatest UCB1 value and none without children', () => {
    const node = { visits: 10, children: [] };
    expect(selectChild(node)).toBeNull();
    const weak = { wins: 0, visits: 5 };
    const strong = { wins: 5, visits: 5 };
    expect(selectChild({ visits: 10, children: [weak, strong] })).toBe(strong);
    expect(selectChild({ visits: 10, children: [strong, weak] })).toBe(strong);
  });

  it('moves an action from unexamined into a child node', () => {
    const state = createInitialState();
    const node = createNode(null, state, null, RULES);
    const before = node.unexamined.length;
    const child = addChild(node, state, 0, RULES);
    expect(node.unexamined).toHaveLength(before - 1);
    expect(node.children).toEqual([child]);
    expect(child.parentNode).toBe(node);
  });

  it('accumulates the loss of the player to move', () => {
    const node = { wins: 0, visits: 0, activePlayer: BLACK };
    update(node, [0, 1]);
    expect(node).toMatchObject({ wins: 1, visits: 1 });
    update(node, [1, 0]);
    expect(node).toMatchObject({ wins: 1, visits: 2 });
  });

  it('reports the most visited child', () => {
    expect(mostVisitedChild({ children: [] })).toBeNull();
    const rare = { visits: 1 };
    const common = { visits: 7 };
    expect(mostVisitedChild({ children: [rare, common] })).toBe(common);
    expect(mostVisitedChild({ children: [common, rare] })).toBe(common);
  });

  it('backpropagates up to the root', () => {
    const root = { wins: 0, visits: 0, activePlayer: WHITE, parentNode: null };
    const leaf = { wins: 0, visits: 0, activePlayer: BLACK, parentNode: root };
    backpropagate(leaf, [0, 1]);
    expect(leaf.visits).toBe(1);
    expect(leaf.wins).toBe(1);
    expect(root.visits).toBe(1);
    expect(root.wins).toBe(0);
  });
});

describe('playout', () => {
  it('expands one node and simulates to a terminal position', () => {
    const state = forcedCapture();
    const root = createNode(null, state, null, RULES);
    const simulated = playout(root, state, RULES, sequence([0]));
    expect(root.children).toHaveLength(1);
    expect(root.visits).toBe(1);
    expect(simulated).toBe(0);
  });

  it('counts the simulated actions of a rollout', () => {
    const state = createInitialState();
    const root = createNode(null, state, null, RULES);
    expect(playout(root, state, RULES, Math.random)).toBeGreaterThan(0);
  });

  it('descends through fully expanded nodes', () => {
    const state = forcedCapture();
    const root = createNode(null, state, null, RULES);
    playout(root, state, RULES, sequence([0]));
    expect(root.unexamined).toHaveLength(0);
    playout(root, state, RULES, sequence([0]));
    expect(root.visits).toBe(2);
    expect(root.children).toHaveLength(1);
    expect(root.children[0].visits).toBe(2);
  });
});

describe('getActionInfo', () => {
  it('returns the compulsory capture', () => {
    const state = forcedCapture();
    const clock = sequence([0, 1, 2, 3, 4, 5]);
    const result = getActionInfo(state, {
      maxIterations: 2,
      maxTime: 100,
      rules: RULES,
      blockSize: 1,
      random: () => 0,
      now: clock
    });
    expect(toAlgebraic(result.action.from)).toBe('c2');
    expect(toAlgebraic(result.action.to)).toBe('c4');
    expect(result.info).toMatch(/nodes\/sec examined\.$/);
  });

  it('returns no action for a finished game', () => {
    const result = getActionInfo(finished(), {
      maxIterations: 1,
      maxTime: 0,
      rules: RULES,
      blockSize: 1,
      now: () => 0
    });
    expect(result.action).toBeNull();
    expect(result.info).toBe('0 nodes/sec examined.');
  });

  it('stops as soon as the time budget is spent', () => {
    let calls = 0;
    const now = () => (calls++ === 0 ? 0 : 10_000);
    const result = getActionInfo(createInitialState(), {
      maxIterations: 10_000,
      maxTime: 5,
      rules: RULES,
      blockSize: 1,
      now
    });
    expect(result.action).toBeNull();
  });

  it('defaults to a block size of fifty', () => {
    expect(BLOCK_SIZE).toBe(50);
  });

  it('uses Math.random and Date.now by default', () => {
    const result = getActionInfo(forcedCapture(), {
      maxIterations: 1,
      maxTime: 1000,
      rules: RULES,
      blockSize: 2
    });
    expect(result.action).not.toBeNull();
  });
});
