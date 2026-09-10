//
// Copyright (c) 2016-2026 Oliver Merkel
// All rights reserved.
//
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
//

import { BLACK, JUMP, NONE, SIZE, WHITE } from '../core/board.js';

export const SVG_NS = 'http://www.w3.org/2000/svg';
export const XLINK_NS = 'http://www.w3.org/1999/xlink';

export const FILEBOARD = 'img/board.jpg';
export const FILEBOARDNOTATION = 'img/algebraic_notation.jpg';
export const FILEDARK = 'img/dark_normal.png';
export const FILELIGHT = 'img/light_normal.png';

export const VIEWBOX = 6;
export const GROW_DURATION = 600;
export const SHRINK_DURATION = 300;
export const GROW = 0.3;

/** Model row 1 is at the bottom, the SVG y axis points down. */
export const screenX = (point) => point.x + 0.5;
export const screenY = (point) => VIEWBOX - 1.5 - point.y;

export const initialPieceFile = (x, y) =>
  y < 2 ? FILELIGHT : y > 2 ? FILEDARK : x > 2 ? FILELIGHT : x < 2 ? FILEDARK : null;

export const pieceFile = (piece) =>
  piece === WHITE ? FILELIGHT : piece === BLACK ? FILEDARK : null;

const setAttributes = (element, attributes) => {
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, String(value));
  }
  return element;
};

export const createBoardView = (
  container,
  {
    doc = container.ownerDocument,
    schedule = (callback, delay) => globalThis.setTimeout(callback, delay)
  } = {}
) => {
  const element = (name, attributes) =>
    setAttributes(doc.createElementNS(SVG_NS, name), attributes);

  const svg = element('svg', {
    xmlns: SVG_NS,
    viewBox: `0 0 ${VIEWBOX} ${VIEWBOX}`,
    width: 400,
    height: 400
  });
  svg.classList.add('alquerque-paper');

  const image = (href, attributes) => {
    const node = element('image', attributes);
    node.setAttributeNS(XLINK_NS, 'xlink:href', href);
    node.setAttribute('href', href);
    return node;
  };

  const notationBoard = image(FILEBOARDNOTATION, { x: 0, y: 0, width: VIEWBOX, height: VIEWBOX });
  const plainBoard = image(FILEBOARD, { x: 0, y: 0, width: VIEWBOX, height: VIEWBOX });
  svg.append(notationBoard, plainBoard);
  container.replaceChildren(svg);

  const field = Array.from({ length: SIZE }, () => new Array(SIZE).fill(null));
  const listeners = new Map();
  const sourceMarkers = new Map();
  let lastMoveMarkers = [];
  let forbiddenReversalMarker = null;

  const pointKey = (point) => `${point.x},${point.y}`;

  const removeSourceMarker = (point) => {
    const key = pointKey(point);
    sourceMarkers.get(key)?.remove();
    sourceMarkers.delete(key);
  };

  const remove = (point) => {
    removeSourceMarker(point);
    const previous = field[point.x][point.y];
    if (previous !== null) {
      unbind(previous);
      previous.remove();
    }
  };

  const placeEmpty = (point) => {
    remove(point);
    const rect = element('rect', {
      x: screenX(point),
      y: screenY(point),
      width: 1,
      height: 1,
      stroke: 'none',
      fill: 'gray',
      opacity: 0,
      'data-x': point.x,
      'data-y': point.y
    });
    svg.append(rect);
    field[point.x][point.y] = rect;
    return rect;
  };

  const placePiece = (href, point) => {
    remove(point);
    const node = image(href, {
      x: screenX(point),
      y: screenY(point),
      width: 1,
      height: 1,
      'data-x': point.x,
      'data-y': point.y
    });
    svg.append(node);
    field[point.x][point.y] = node;
    return node;
  };

  function unbind(node) {
    const bound = listeners.get(node);
    if (bound === undefined) return;
    for (const handler of bound) node.removeEventListener('click', handler);
    listeners.delete(node);
  }

  const bind = (node, handler) => {
    node.addEventListener('click', handler);
    const bound = listeners.get(node) ?? [];
    bound.push(handler);
    listeners.set(node, bound);
  };

  const restoreInitial = () => {
    for (let x = 0; x < SIZE; ++x) {
      for (let y = 0; y < SIZE; ++y) {
        const href = initialPieceFile(x, y);
        if (href === null) placeEmpty({ x, y });
        else placePiece(href, { x, y });
      }
    }
  };

  const synchronise = (square) => {
    for (let x = 0; x < SIZE; ++x) {
      for (let y = 0; y < SIZE; ++y) {
        const href = pieceFile(square[x][y]);
        if (href === null) placeEmpty({ x, y });
        else placePiece(href, { x, y });
      }
    }
  };

  const at = (point) => field[point.x][point.y];

  const swap = (from, to) => {
    const target = field[to.x][to.y];
    field[to.x][to.y] = field[from.x][from.y];
    field[from.x][from.y] = target;
  };

  const settle = (node, point) => {
    node.style.transition = '';
    node.style.transform = '';
    setAttributes(node, {
      x: screenX(point),
      y: screenY(point),
      'data-x': point.x,
      'data-y': point.y
    });
  };

  const transition = (node, transform, duration, done) => {
    node.style.transition = `transform ${duration}ms linear`;
    node.getBoundingClientRect();
    node.style.transform = transform;
    schedule(done, duration);
  };

  const animateAction = (action, done) => {
    swap(action.from, action.to);
    const node = at(action.to);
    svg.append(node);
    const dx = action.to.x - action.from.x;
    const dy = action.from.y - action.to.y;
    transition(
      node,
      `translate(${dx / 2}px, ${dy / 2}px) scale(${1 + GROW})`,
      GROW_DURATION,
      () => {
        transition(node, `translate(${dx}px, ${dy}px) scale(1)`, SHRINK_DURATION, () => {
          settle(node, action.to);
          if (action.type === JUMP) placeEmpty(action.over);
          settle(at(action.from), action.from);
          done();
        });
      }
    );
  };

  const clearHandlers = () => {
    for (const node of [...listeners.keys()]) unbind(node);
  };

  const setSize = (size) => setAttributes(svg, { width: size, height: size });

  const showNotation = (visible) => {
    notationBoard.style.display = visible ? '' : 'none';
    if (visible) svg.insertBefore(plainBoard, notationBoard);
    else svg.insertBefore(notationBoard, svg.firstChild);
  };

  const setTargetVisible = (point, visible) => {
    at(point).setAttribute('opacity', visible ? '0.4' : '0');
  };

  const setSourceSelectable = (point, selectable) => {
    const node = at(point);
    node.classList.toggle('selectable-source', selectable);
    if (!selectable) {
      removeSourceMarker(point);
      return;
    }
    const key = pointKey(point);
    if (sourceMarkers.has(key)) return;
    const marker = element('circle', {
      cx: screenX(point) + 0.5,
      cy: screenY(point) + 0.5,
      r: 0.5,
      class: 'selectable-source-ring'
    });
    svg.insertBefore(marker, node);
    sourceMarkers.set(key, marker);
  };

  const setSourceSelected = (point, selected) => {
    const marker = sourceMarkers.get(pointKey(point));
    if (marker === undefined) return;
    marker.classList.toggle('selected-source-ring', selected);
    if (selected) svg.append(marker);
    else svg.insertBefore(marker, at(point));
  };

  const setLastMove = (action) => {
    for (const marker of lastMoveMarkers) marker.remove();
    lastMoveMarkers = [];
    if (action === null) return;
    for (const [point, className] of [
      [action.from, 'last-move-source'],
      [action.to, 'last-move-target']
    ]) {
      const marker = element('circle', {
        cx: screenX(point) + 0.5,
        cy: screenY(point) + 0.5,
        r: 0.5,
        class: `last-move-ring ${className}`
      });
      svg.append(marker);
      lastMoveMarkers.push(marker);
    }
  };

  const setForbiddenReversal = (point) => {
    forbiddenReversalMarker?.remove();
    forbiddenReversalMarker = null;
    if (point === null) return;
    const centreX = screenX(point) + 0.5;
    const centreY = screenY(point) + 0.5;
    const marker = element('g', { class: 'forbidden-reversal' });
    marker.append(
      element('line', {
        x1: centreX - 0.22,
        y1: centreY - 0.22,
        x2: centreX + 0.22,
        y2: centreY + 0.22
      }),
      element('line', {
        x1: centreX + 0.22,
        y1: centreY - 0.22,
        x2: centreX - 0.22,
        y2: centreY + 0.22
      })
    );
    svg.append(marker);
    forbiddenReversalMarker = marker;
  };

  restoreInitial();

  return {
    svg,
    at,
    bind,
    unbind,
    clearHandlers,
    animateAction,
    restoreInitial,
    synchronise,
    setSize,
    showNotation,
    setTargetVisible,
    setSourceSelectable,
    setSourceSelected,
    setLastMove,
    setForbiddenReversal,
    placeEmpty,
    placePiece
  };
};

export { NONE };
