import { describe, expect, it } from 'vitest';
import { BLACK, JUMP, MOVE, NONE, WHITE } from '../../html5/src/js/core/board.js';
import {
  createBoardView,
  FILEBOARD,
  FILEBOARDNOTATION,
  FILEDARK,
  FILELIGHT,
  GROW,
  initialPieceFile,
  pieceFile,
  screenX,
  screenY,
  VIEWBOX
} from '../../html5/src/js/ui/svgBoard.js';
import { immediate, loadApp } from './helpers/dom.js';

const view = () => {
  const { doc, win } = loadApp();
  return {
    doc,
    win,
    board: createBoardView(doc.getElementById('board'), { doc, schedule: immediate })
  };
};

describe('board geometry', () => {
  it('maps model points onto the six by six view box', () => {
    expect(screenX({ x: 0, y: 0 })).toBe(0.5);
    expect(screenY({ x: 0, y: 0 })).toBe(4.5);
    expect(screenY({ x: 0, y: 4 })).toBe(0.5);
    expect(VIEWBOX).toBe(6);
  });

  it('knows the initial checker of every point', () => {
    expect(initialPieceFile(0, 0)).toBe(FILELIGHT);
    expect(initialPieceFile(0, 4)).toBe(FILEDARK);
    expect(initialPieceFile(3, 2)).toBe(FILELIGHT);
    expect(initialPieceFile(1, 2)).toBe(FILEDARK);
    expect(initialPieceFile(2, 2)).toBeNull();
  });

  it('maps piece codes onto image files', () => {
    expect(pieceFile(WHITE)).toBe(FILELIGHT);
    expect(pieceFile(BLACK)).toBe(FILEDARK);
    expect(pieceFile(NONE)).toBeNull();
  });
});

describe('board view', () => {
  it('draws both board images and twenty five points', () => {
    const { doc, board } = view();
    const svg = doc.querySelector('#board svg');
    expect(svg.getAttribute('viewBox')).toBe('0 0 6 6');
    const images = [...svg.querySelectorAll('image')];
    expect(images[0].getAttribute('href')).toBe(FILEBOARDNOTATION);
    expect(images[1].getAttribute('href')).toBe(FILEBOARD);
    expect(images).toHaveLength(2 + 24);
    expect(svg.querySelectorAll('rect')).toHaveLength(1);
    expect(board.at({ x: 2, y: 2 }).tagName).toBe('rect');
  });

  it('positions the checkers', () => {
    const { board } = view();
    const a1 = board.at({ x: 0, y: 0 });
    expect(a1.getAttribute('x')).toBe('0.5');
    expect(a1.getAttribute('y')).toBe('4.5');
    expect(a1.getAttribute('href')).toBe(FILELIGHT);
  });

  it('resizes the paper', () => {
    const { board, doc } = view();
    board.setSize(320);
    expect(doc.querySelector('#board svg').getAttribute('width')).toBe('320');
  });

  it('shows and hides the algebraic notation board', () => {
    const { board, doc } = view();
    const svg = doc.querySelector('#board svg');
    board.showNotation(true);
    expect(svg.querySelector('image').getAttribute('href')).toBe(FILEBOARD);
    board.showNotation(false);
    expect(svg.querySelector('image').getAttribute('href')).toBe(FILEBOARDNOTATION);
    expect(svg.querySelector('image').style.display).toBe('none');
  });

  it('toggles the visibility of a target point', () => {
    const { board } = view();
    board.setTargetVisible({ x: 2, y: 2 }, true);
    expect(board.at({ x: 2, y: 2 }).getAttribute('opacity')).toBe('0.4');
    board.setTargetVisible({ x: 2, y: 2 }, false);
    expect(board.at({ x: 2, y: 2 }).getAttribute('opacity')).toBe('0');
  });

  it('marks a selectable source checker', () => {
    const { board } = view();
    const source = board.at({ x: 2, y: 1 });
    board.setSourceSelectable({ x: 2, y: 1 }, true);
    expect(source.classList.contains('selectable-source')).toBe(true);
    const marker = board.svg.querySelector('.selectable-source-ring');
    expect(marker.getAttribute('cx')).toBe('3');
    expect(marker.getAttribute('cy')).toBe('4');
    expect(marker.getAttribute('r')).toBe('0.5');
    board.setSourceSelected({ x: 2, y: 1 }, true);
    expect(marker.classList.contains('selected-source-ring')).toBe(true);
    expect(board.svg.lastElementChild).toBe(marker);
    board.setSourceSelected({ x: 2, y: 1 }, false);
    expect(marker.classList.contains('selected-source-ring')).toBe(false);
    expect(marker.nextElementSibling).toBe(source);
    board.setSourceSelectable({ x: 2, y: 1 }, true);
    expect(board.svg.querySelectorAll('.selectable-source-ring')).toHaveLength(1);
    board.setSourceSelectable({ x: 2, y: 1 }, false);
    expect(source.classList.contains('selectable-source')).toBe(false);
    expect(board.svg.querySelector('.selectable-source-ring')).toBeNull();
  });

  it('marks the last move with dashed source and solid target rings', () => {
    const { board } = view();
    board.setLastMove({ from: { x: 2, y: 1 }, to: { x: 2, y: 2 } });
    const source = board.svg.querySelector('.last-move-source');
    const target = board.svg.querySelector('.last-move-target');
    expect(source.getAttribute('cx')).toBe('3');
    expect(source.getAttribute('cy')).toBe('4');
    expect(target.getAttribute('cx')).toBe('3');
    expect(target.getAttribute('cy')).toBe('3');
    board.setLastMove({ from: { x: 3, y: 1 }, to: { x: 2, y: 2 } });
    expect(board.svg.querySelectorAll('.last-move-ring')).toHaveLength(2);
    expect(board.svg.querySelector('.last-move-source').getAttribute('cx')).toBe('4');
    board.setLastMove(null);
    expect(board.svg.querySelector('.last-move-ring')).toBeNull();
  });

  it('marks a forbidden reversal square with a red X', () => {
    const { board } = view();
    board.setForbiddenReversal({ x: 2, y: 2 });
    const marker = board.svg.querySelector('.forbidden-reversal');
    expect(marker.querySelectorAll('line')).toHaveLength(2);
    expect(marker.firstElementChild.getAttribute('x1')).toBe('2.78');
    expect(marker.firstElementChild.getAttribute('y1')).toBe('2.78');
    board.setForbiddenReversal(null);
    expect(board.svg.querySelector('.forbidden-reversal')).toBeNull();
  });

  it('binds and unbinds click handlers', () => {
    const { board, win } = view();
    let clicks = 0;
    const node = board.at({ x: 0, y: 0 });
    board.bind(node, () => {
      clicks += 1;
    });
    node.dispatchEvent(new win.Event('click'));
    expect(clicks).toBe(1);
    board.unbind(node);
    node.dispatchEvent(new win.Event('click'));
    expect(clicks).toBe(1);
    board.unbind(node);
    board.bind(node, () => {
      clicks += 1;
    });
    board.clearHandlers();
    node.dispatchEvent(new win.Event('click'));
    expect(clicks).toBe(1);
  });

  it('animates a move in two steps and settles both points', () => {
    const { board } = view();
    const moved = board.at({ x: 2, y: 1 });
    let done = false;
    board.animateAction({ type: MOVE, from: { x: 2, y: 1 }, to: { x: 2, y: 2 } }, () => {
      done = true;
    });
    expect(done).toBe(true);
    expect(board.at({ x: 2, y: 2 })).toBe(moved);
    expect(moved.getAttribute('x')).toBe('2.5');
    expect(moved.getAttribute('y')).toBe('2.5');
    expect(moved.style.transform).toBe('');
    expect(board.at({ x: 2, y: 1 }).getAttribute('y')).toBe('3.5');
  });

  it('moves through an enlarged midpoint before settling', () => {
    const { doc } = loadApp();
    const pending = [];
    const board = createBoardView(doc.getElementById('board'), {
      doc,
      schedule: (callback) => pending.push(callback)
    });
    const moved = board.at({ x: 2, y: 1 });
    board.animateAction({ type: MOVE, from: { x: 2, y: 1 }, to: { x: 2, y: 2 } }, () => {});
    expect(moved.style.transform).toBe(`translate(0px, -0.5px) scale(${1 + GROW})`);
    expect(moved.style.transition).toBe('transform 600ms linear');
    pending.shift()();
    expect(moved.style.transform).toBe('translate(0px, -1px) scale(1)');
    expect(moved.style.transition).toBe('transform 300ms linear');
    pending.shift()();
    expect(moved.style.transform).toBe('');
  });

  it('removes the captured checker of a jump', () => {
    const { board } = view();
    board.animateAction(
      {
        type: JUMP,
        from: { x: 2, y: 1 },
        to: { x: 2, y: 3 },
        over: { x: 2, y: 2 }
      },
      () => {}
    );
    expect(board.at({ x: 2, y: 2 }).tagName).toBe('rect');
    expect(board.at({ x: 2, y: 3 }).getAttribute('href')).toBe(FILELIGHT);
  });

  it('restores the initial position', () => {
    const { board } = view();
    board.animateAction({ type: MOVE, from: { x: 2, y: 1 }, to: { x: 2, y: 2 } }, () => {});
    board.restoreInitial();
    expect(board.at({ x: 2, y: 2 }).tagName).toBe('rect');
    expect(board.at({ x: 2, y: 1 }).getAttribute('href')).toBe(FILELIGHT);
  });

  it('synchronises with an arbitrary position', () => {
    const { board } = view();
    const square = Array.from({ length: 5 }, () => new Array(5).fill(NONE));
    square[0][0] = WHITE;
    square[4][4] = BLACK;
    board.synchronise(square);
    expect(board.at({ x: 0, y: 0 }).getAttribute('href')).toBe(FILELIGHT);
    expect(board.at({ x: 4, y: 4 }).getAttribute('href')).toBe(FILEDARK);
    expect(board.at({ x: 2, y: 2 }).tagName).toBe('rect');
  });
});
