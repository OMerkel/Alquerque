import { describe, expect, it } from 'vitest';
import { MOVE } from '../../html5/src/js/core/board.js';
import {
  activePlayerBadge,
  boardSize,
  createHmi,
  iconSize,
  MAX_ICON,
  MIN_ICON,
  OFFSET_HEIGHT
} from '../../html5/src/js/ui/hmi.js';
import { createBoardView } from '../../html5/src/js/ui/svgBoard.js';
import { createController } from '../../html5/src/js/worker/controller.js';
import { createFakeWorker, immediate, loadApp } from './helpers/dom.js';

const setup = () => {
  const { doc, win } = loadApp();
  const view = createBoardView(doc.getElementById('board'), { doc, schedule: immediate });
  const engine = createFakeWorker();
  const hmi = createHmi({ doc, view, engine, win });
  return { doc, win, view, engine, hmi };
};

/** Wires the real controller to the HMI so that a whole turn can be played. */
const connected = () => {
  const context = setup();
  const controller = createController({
    postMessage: (message) => context.engine.emit(message)
  });
  context.engine.postMessage = (message) => {
    context.engine.posted.push(message);
    controller.handleMessage({ data: message });
  };
  context.engine.addEventListener('message', context.hmi.handleEngineMessage);
  return { ...context, controller };
};

const click = (win, node) => node.dispatchEvent(new win.Event('click'));

describe('layout arithmetic', () => {
  it('fits the board into the free area', () => {
    expect(boardSize(832, 600)).toBe(600 - OFFSET_HEIGHT);
    expect(boardSize(400, 900)).toBe(368);
  });

  it('clamps the icon size', () => {
    expect(iconSize(100)).toBe(MIN_ICON);
    expect(iconSize(2000)).toBe(MAX_ICON);
    expect(iconSize(600)).toBe(60);
  });

  it('describes the active player type and side', () => {
    expect(activePlayerBadge(0, { playerwhite: 'Human', playerblack: 'AI' })).toEqual({
      label: 'Human player south',
      symbol: '🧑▼'
    });
    expect(activePlayerBadge(1, { playerwhite: 'Human', playerblack: 'AI' })).toEqual({
      label: 'AI player north',
      symbol: '🤖▲'
    });
  });
});

describe('hmi', () => {
  it('sizes the paper, the board margin and the icons', () => {
    const { doc, hmi } = setup();
    hmi.resize();
    expect(doc.querySelector('#board svg').getAttribute('width')).toBe('536');
    expect(doc.getElementById('board').style.marginTop).toBe('0px');
    expect(doc.getElementById('game-page').style.backgroundSize).toBe(`auto ${536 / 6}px`);
    expect(doc.getElementById('customMenu').style.width).toBe('53.6px');
    expect(doc.getElementById('customBackAbout').style.backgroundSize).toBe('53.6px 53.6px');
  });

  it('skips icons that are missing from the document', () => {
    const { doc, hmi } = setup();
    doc.getElementById('customMenu').remove();
    expect(() => hmi.resize()).not.toThrow();
  });

  it('asks the engine to start and carries the options', () => {
    const { engine, hmi } = setup();
    hmi.start();
    expect(engine.posted[0]).toMatchObject({ class: 'request', request: 'start' });
  });

  it('ignores foreign engine messages', () => {
    const { hmi } = setup();
    expect(hmi.handleEngineMessage({ data: { eventClass: 'response' } })).toBe(false);
    expect(hmi.handleEngineMessage({ data: { eventClass: 'request', request: 'nothing' } })).toBe(
      false
    );
  });

  it('restores the board on request', () => {
    const { hmi, view } = setup();
    view.placeEmpty({ x: 0, y: 0 });
    view.setLastMove({ from: { x: 2, y: 1 }, to: { x: 2, y: 2 } });
    expect(
      hmi.handleEngineMessage({
        data: { eventClass: 'request', request: 'restore' }
      })
    ).toBe(true);
    expect(view.at({ x: 0, y: 0 }).tagName).toBe('image');
    expect(view.svg.querySelector('.last-move-ring')).toBeNull();
  });

  it('lets a human select a checker and play a move', () => {
    const { doc, win, view, engine, hmi } = connected();
    hmi.start();
    expect(engine.posted).toHaveLength(1);

    expect(view.at({ x: 2, y: 1 }).classList.contains('selectable-source')).toBe(true);
    click(win, view.at({ x: 2, y: 1 }));
    expect(hmi.describeSelection()).toBe('c2');
    expect(doc.querySelectorAll('.selected-source-ring')).toHaveLength(1);
    expect(view.at({ x: 2, y: 2 }).getAttribute('opacity')).toBe('0');

    click(win, view.at({ x: 2, y: 2 }));
    const performed = engine.posted.find((message) => message.request === 'perform');
    expect(performed.action.type).toBe(MOVE);
    expect(hmi.getSelection()).toBeNull();
    expect(view.at({ x: 2, y: 2 }).classList.contains('selectable-source')).toBe(false);
    expect(view.at({ x: 2, y: 2 }).getAttribute('href')).toContain('light');
  });

  it('shows the available targets when the option is set', () => {
    const { doc, win, view, hmi } = connected();
    doc.getElementById('showavailablemove').checked = true;
    hmi.start();
    click(win, view.at({ x: 2, y: 1 }));
    expect(view.at({ x: 2, y: 2 }).getAttribute('opacity')).toBe('0.4');
  });

  it('marks a selected checkers forbidden reversal square', () => {
    const { doc, win, view, hmi } = setup();
    hmi.update(
      {
        turn: 0,
        actions: [{ from: { x: 1, y: 2 }, to: { x: 1, y: 3 } }],
        reversals: [{ from: { x: 1, y: 2 }, to: { x: 2, y: 2 } }],
        nextishuman: true
      },
      null
    );
    click(win, view.at({ x: 1, y: 2 }));
    expect(doc.querySelector('.forbidden-reversal')).not.toBeNull();
    hmi.update({ turn: 0, actions: [], reversals: [], nextishuman: false }, null);
    expect(doc.querySelector('.forbidden-reversal')).toBeNull();
  });

  it('hides the targets of a previous selection', () => {
    const { doc, win, view, hmi } = connected();
    doc.getElementById('showavailablemove').checked = true;
    hmi.start();
    click(win, view.at({ x: 2, y: 1 }));
    click(win, view.at({ x: 3, y: 1 }));
    expect(hmi.describeSelection()).toBe('d2');
    expect(doc.querySelectorAll('.selected-source-ring')).toHaveLength(1);
    expect(view.at({ x: 2, y: 2 }).getAttribute('opacity')).toBe('0.4');
  });

  it('ignores a click on a point that is not a legal target', () => {
    const { win, view, engine, hmi } = connected();
    hmi.start();
    click(win, view.at({ x: 2, y: 1 }));
    const target = view.at({ x: 2, y: 2 });
    hmi.update({ actions: [], nextishuman: false }, null);
    target.dispatchEvent(new win.Event('click'));
    expect(engine.posted.filter((message) => message.request === 'perform')).toHaveLength(0);
  });

  it('switches on the algebraic notation board', () => {
    const { doc, hmi } = setup();
    doc.getElementById('showalgebraicnotation').checked = true;
    hmi.update({ actions: [], nextishuman: false }, null);
    expect(doc.querySelector('#board svg image').getAttribute('href')).toContain('board.jpg');
  });

  it('shows the active player and configured player type in the title bar', () => {
    const { doc, hmi } = setup();
    doc.getElementById('playerblackai').checked = true;
    hmi.update({ turn: 1, actions: [], nextishuman: false }, null);
    const badge = doc.getElementById('active-player');
    expect(badge.querySelector('.active-player-symbol').textContent).toBe('🤖▲');
    expect(badge.querySelector('.active-player-spinner').getAttribute('aria-hidden')).toBe('true');
    expect(badge.getAttribute('aria-label')).toBe('AI player north');
    expect(badge.getAttribute('title')).toBe('AI player north');
  });

  it('asks the engine for a move when the AI is on turn', () => {
    const { doc, engine, hmi } = setup();
    doc.getElementById('playerwhiteai').checked = true;
    hmi.update(
      {
        actions: [{ from: { x: 2, y: 1 }, to: { x: 2, y: 2 } }],
        nextishuman: false
      },
      null
    );
    expect(engine.posted[0]).toMatchObject({ request: 'actionbyai', playerwhite: 'AI' });
  });

  it('animates a reported action before continuing the turn', () => {
    const { engine, view, hmi } = setup();
    hmi.update(
      { actions: [], nextishuman: false },
      {
        action: { type: MOVE, from: { x: 2, y: 1 }, to: { x: 2, y: 2 } }
      }
    );
    expect(view.at({ x: 2, y: 2 }).getAttribute('href')).toContain('light');
    expect(view.svg.querySelectorAll('.last-move-ring')).toHaveLength(2);
    expect(engine.posted).toHaveLength(0);
  });

  it('restarts the game and drops the selection', () => {
    const { win, view, engine, hmi } = connected();
    hmi.start();
    click(win, view.at({ x: 2, y: 1 }));
    hmi.restart();
    expect(engine.posted.some((message) => message.request === 'restart')).toBe(true);
    expect(hmi.getSelection()).toBeNull();
    expect(view.at({ x: 2, y: 2 }).tagName).toBe('rect');
  });
});
