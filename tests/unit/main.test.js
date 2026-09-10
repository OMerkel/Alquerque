import { describe, expect, it, vi } from 'vitest';
import { bootstrap, WORKER_URL } from '../../html5/src/js/ui/main.js';
import { createFakeWorker, loadApp } from './helpers/dom.js';

describe('bootstrap', () => {
  it('wires view, engine, navigation and controls', () => {
    const { doc, win } = loadApp();
    const engine = createFakeWorker();
    const app = bootstrap({ doc, win, createWorker: () => engine });

    expect(doc.querySelector('#board svg')).not.toBeNull();
    expect(engine.posted[0]).toMatchObject({ class: 'request', request: 'start' });
    expect(app.navigation.activePage().id).toBe('game-page');
    expect(
      doc.querySelector('label[for="playerwhitehuman"]').classList.contains('ui-radio-on')
    ).toBe(true);
  });

  it('redraws through the engine listener', () => {
    const { doc, win } = loadApp();
    const engine = createFakeWorker();
    bootstrap({ doc, win, createWorker: () => engine });
    engine.emit({
      eventClass: 'request',
      request: 'restore',
      board: { actions: [], nextishuman: false }
    });
    expect(doc.querySelectorAll('#board svg image')).toHaveLength(26);
  });

  it('starts a new game from the sidebar', () => {
    const { doc, win } = loadApp();
    const engine = createFakeWorker();
    const app = bootstrap({ doc, win, createWorker: () => engine });
    app.navigation.openPanel();
    doc.getElementById('new').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    expect(engine.posted.some((message) => message.request === 'restart')).toBe(true);
    expect(doc.getElementById('left-panel').classList.contains('ui-panel-closed')).toBe(true);
  });

  it('resizes with the window', () => {
    const { doc, win } = loadApp();
    bootstrap({ doc, win, createWorker: () => createFakeWorker() });
    win.innerWidth = 1200;
    win.innerHeight = 700;
    win.dispatchEvent(new win.Event('resize'));
    expect(doc.querySelector('#board svg').getAttribute('width')).toBe('636');
  });

  it('creates a module worker by default', () => {
    const { doc, win } = loadApp();
    const engine = createFakeWorker();
    win.Worker = vi.fn(() => engine);
    bootstrap({ doc, win });
    expect(win.Worker).toHaveBeenCalledWith(WORKER_URL, { type: 'module' });
  });
});
