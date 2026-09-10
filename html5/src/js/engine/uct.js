//
// Copyright (c) 2016-2026 Oliver Merkel
// All rights reserved.
//
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
//

import { applyAction, getActions, getResult } from '../core/board.js';

export const createNode = (parentNode, state, action, rules) => ({
  action,
  parentNode,
  children: [],
  unexamined: getActions(state, rules),
  activePlayer: state.active,
  wins: 0,
  visits: 0
});

export const ucb1 = (child, parentVisits) =>
  child.wins / child.visits + Math.sqrt((2 * Math.log(parentVisits)) / child.visits);

export const selectChild = (node) =>
  node.children.reduce(
    (best, child) =>
      best === null || ucb1(child, node.visits) > ucb1(best, node.visits) ? child : best,
    null
  );

export const addChild = (node, state, index, rules) => {
  const child = createNode(node, state, node.unexamined[index], rules);
  node.unexamined.splice(index, 1);
  node.children.push(child);
  return child;
};

export const update = (node, result) => {
  node.visits += 1;
  node.wins += result[node.activePlayer];
};

export const mostVisitedChild = (node) =>
  node.children.reduce(
    (best, child) => (best === null || child.visits > best.visits ? child : best),
    null
  );

export const backpropagate = (leaf, result) => {
  for (let node = leaf; node !== null; node = node.parentNode) update(node, result);
};

const pick = (random, length) => Math.floor(random() * length);

export const playout = (root, rootState, rules, random) => {
  let node = root;
  let state = rootState;
  while (node.unexamined.length === 0 && node.children.length > 0) {
    node = selectChild(node);
    state = applyAction(state, node.action);
  }
  if (node.unexamined.length > 0) {
    const index = pick(random, node.unexamined.length);
    state = applyAction(state, node.unexamined[index]);
    node = addChild(node, state, index, rules);
  }
  let simulated = 0;
  let actions = getActions(state, rules);
  while (actions.length > 0) {
    state = applyAction(state, actions[pick(random, actions.length)]);
    simulated += 1;
    actions = getActions(state, rules);
  }
  backpropagate(node, getResult(state));
  return simulated;
};

export const BLOCK_SIZE = 50;

/**
 * Monte-Carlo tree search with UCB applied to trees.
 * `now` and `random` are injected so that the search stays deterministic under test.
 */
export const getActionInfo = (
  state,
  {
    maxIterations,
    maxTime,
    rules,
    random = Math.random,
    now = Date.now,
    blockSize = BLOCK_SIZE
  } = {}
) => {
  const root = createNode(null, state, null, rules);
  const startTime = now();
  const timeLimit = startTime + maxTime;
  let simulated = 0;
  for (
    let iterations = 0;
    iterations < maxIterations && now() < timeLimit;
    iterations += blockSize
  ) {
    for (let i = 0; i < blockSize; ++i) simulated += playout(root, state, rules, random);
  }
  const duration = now() - startTime;
  const best = mostVisitedChild(root);
  return {
    action: best === null ? null : best.action,
    info: `${duration > 0 ? Math.floor((simulated * 1000) / duration) : simulated} nodes/sec examined.`
  };
};
