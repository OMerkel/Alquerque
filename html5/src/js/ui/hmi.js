//
// Copyright (c) 2016-2026 Oliver Merkel
// All rights reserved.
//
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
//

import { WHITE } from '../core/board.js';
import { toAlgebraic } from '../core/directions.js';
import { readOptions, request } from './options.js';

export const OFFSET_HEIGHT = 64;
export const MIN_ICON = 38;
export const MAX_ICON = 100;
export const ICON_IDS = ['customMenu', 'customBackRules', 'customBackOptions', 'customBackAbout'];

export const boardSize = (innerWidth, innerHeight) =>
  Math.min(innerWidth - 32, innerHeight - OFFSET_HEIGHT);

export const iconSize = (size) => Math.min(MAX_ICON, Math.max(MIN_ICON, size / 10));

export const activePlayerBadge = (turn, options) => {
  const south = turn === WHITE;
  const type = (south ? options.playerwhite : options.playerblack) === 'AI' ? 'AI' : 'Human';
  return {
    label: `${type} player ${south ? 'south' : 'north'}`,
    symbol: `${type === 'AI' ? '🤖' : '🧑'}${south ? '▼' : '▲'}`
  };
};

const samePoint = (a, b) => a.x === b.x && a.y === b.y;

const pointOf = (node) => ({
  x: Number(node.getAttribute('data-x')),
  y: Number(node.getAttribute('data-y'))
});

export const createHmi = ({ doc, view, engine, win = globalThis }) => {
  let board = null;
  let selection = null;

  const post = (name, extra = {}) => engine.postMessage({ ...request(doc, name), ...extra });

  const resize = () => {
    const size = boardSize(win.innerWidth, win.innerHeight);
    view.setSize(size);
    const boardElement = doc.getElementById('board');
    boardElement.style.marginTop = `${(win.innerHeight - OFFSET_HEIGHT - size) / 2}px`;
    doc.getElementById('game-page').style.backgroundSize = `auto ${size / 6}px`;
    const icon = iconSize(size);
    for (const id of ICON_IDS) {
      const node = doc.getElementById(id);
      if (node === null) continue;
      node.style.width = `${icon}px`;
      node.style.height = `${icon}px`;
      node.style.backgroundSize = `${icon}px ${icon}px`;
    }
  };

  const deactivateSelection = () => {
    if (selection === null) return;
    view.setSourceSelected(selection.from, false);
    view.setForbiddenReversal(null);
    for (const action of board.actions) {
      if (!samePoint(selection.from, action.from)) continue;
      const target = view.at(action.to);
      view.setTargetVisible(action.to, false);
      view.unbind(target);
    }
  };

  const clickTarget = (event) => {
    const to = pointOf(event.currentTarget);
    const chosen = board.actions.find(
      (action) => samePoint(selection.from, action.from) && samePoint(to, action.to)
    );
    view.clearHandlers();
    clearSourceHighlights();
    view.setForbiddenReversal(null);
    for (const action of board.actions) view.setTargetVisible(action.to, false);
    if (chosen === undefined) return;
    selection = null;
    post('perform', { action: chosen });
  };

  const activateSelection = () => {
    const visible = readOptions(doc).showavailablemove;
    for (const action of board.actions) {
      if (!samePoint(selection.from, action.from)) continue;
      view.setTargetVisible(action.to, visible);
      view.bind(view.at(action.to), clickTarget);
    }
  };

  const clickSelect = (event) => {
    deactivateSelection();
    selection = { from: pointOf(event.currentTarget) };
    view.setSourceSelected(selection.from, true);
    const reversal = board.reversals?.find((candidate) => samePoint(selection.from, candidate.from));
    view.setForbiddenReversal(reversal?.to ?? null);
    activateSelection();
  };

  const prepareHumanMove = () => {
    for (const action of board.actions) {
      view.setSourceSelectable(action.from, true);
      view.bind(view.at(action.from), clickSelect);
    }
  };

  function clearSourceHighlights() {
    if (board === null) return;
    for (const action of board.actions) view.setSourceSelectable(action.from, false);
  }

  const requestAiAction = () => post('actionbyai');

  const continueTurn = () => {
    if (board.nextishuman) prepareHumanMove();
    else if (board.actions.length > 0) requestAiAction();
  };

  const update = (next, actionInfo) => {
    resize();
    clearSourceHighlights();
    view.setForbiddenReversal(null);
    const options = readOptions(doc);
    view.showNotation(options.showalgebraicnotation);
    const badge = activePlayerBadge(next.turn, options);
    const badgeNode = doc.getElementById('active-player');
    badgeNode.querySelector('.active-player-symbol').textContent = badge.symbol;
    badgeNode.setAttribute('aria-label', badge.label);
    badgeNode.setAttribute('title', badge.label);
    board = next;
    if (actionInfo) {
      view.animateAction(actionInfo.action, () => {
        view.setLastMove(actionInfo.action);
        continueTurn();
      });
    } else continueTurn();
  };

  const restart = () => {
    view.clearHandlers();
    clearSourceHighlights();
    view.setForbiddenReversal(null);
    selection = null;
    post('restart');
  };

  const handleEngineMessage = (event) => {
    const data = event.data;
    if (data.eventClass !== 'request') return false;
    if (data.request === 'redraw') {
      update(data.board, data.actioninfo);
      return true;
    }
    if (data.request === 'restore') {
      view.setLastMove(null);
      view.restoreInitial();
      return true;
    }
    return false;
  };

  return {
    resize,
    update,
    restart,
    handleEngineMessage,
    start: () => post('start'),
    getSelection: () => selection,
    describeSelection: () => (selection === null ? null : toAlgebraic(selection.from))
  };
};
