import { describe, expect, it, vi } from 'vitest';
import {
  createNavigation,
  durationOf,
  HOME_PAGE,
  TRANSITIONS
} from '../../html5/src/js/ui/navigation.js';
import { immediate, loadApp } from './helpers/dom.js';

const setup = ({ schedule = immediate } = {}) => {
  const { doc, win } = loadApp();
  const navigation = createNavigation({ doc, win, schedule });
  navigation.init();
  return { doc, win, navigation };
};

const clickLink = (doc, selector) => {
  const link = doc.querySelector(selector);
  const event = new doc.defaultView.MouseEvent('click', { bubbles: true, cancelable: true });
  link.dispatchEvent(event);
  return event;
};

describe('transition timing', () => {
  it('uses the longer of the two animation durations', () => {
    expect(durationOf('pop')).toBe(TRANSITIONS.pop.in);
    expect(durationOf('slideup')).toBe(TRANSITIONS.slideup.in);
    expect(durationOf('whatever')).toBe(0);
  });
});

describe('navigation', () => {
  it('starts on the game page', () => {
    const { navigation } = setup();
    expect(navigation.activePage().id).toBe(HOME_PAGE);
  });

  it('opens and closes the sidebar panel', () => {
    const { doc, navigation } = setup();
    const panel = doc.getElementById('left-panel');
    expect(panel.classList.contains('ui-panel-closed')).toBe(true);
    navigation.openPanel();
    expect(panel.classList.contains('ui-panel-open')).toBe(true);
    expect(doc.querySelector('.ui-panel-dismiss').classList.contains('ui-panel-dismiss-open')).toBe(
      true
    );
    navigation.closePanel();
    expect(panel.classList.contains('ui-panel-closed')).toBe(true);
  });

  it('opens the panel through the hamburger link', () => {
    const { doc } = setup();
    const event = clickLink(doc, '#customMenu');
    expect(event.defaultPrevented).toBe(true);
    expect(doc.getElementById('left-panel').classList.contains('ui-panel-open')).toBe(true);
  });

  it('closes the panel through the back item', () => {
    const { doc, navigation } = setup();
    navigation.openPanel();
    clickLink(doc, '#left-panel a[data-rel="close"]');
    expect(doc.getElementById('left-panel').classList.contains('ui-panel-closed')).toBe(true);
  });

  it('hides the game board when a subpage is shown', () => {
    const { doc, navigation } = setup();
    navigation.openPanel();
    clickLink(doc, 'a[href="#rules-page"]');
    expect(doc.getElementById('rules-page').classList.contains('ui-page-active')).toBe(true);
    expect(doc.getElementById('game-page').classList.contains('ui-page-active')).toBe(false);
    expect(doc.getElementById('left-panel').classList.contains('ui-panel-closed')).toBe(true);
    expect(doc.defaultView.location.hash).toBe('#rules-page');
  });

  it('applies the configured transition classes while animating', () => {
    const pending = [];
    const { doc } = setup({ schedule: (callback) => pending.push(callback) });
    clickLink(doc, 'a[href="#options-menu"]');
    const options = doc.getElementById('options-menu');
    const game = doc.getElementById('game-page');
    expect(options.classList.contains('slideup')).toBe(true);
    expect(options.classList.contains('in')).toBe(true);
    expect(game.classList.contains('out')).toBe(true);
    pending.shift()();
    expect(options.classList.contains('slideup')).toBe(false);
    expect(game.classList.contains('ui-page-active')).toBe(false);
  });

  it('shows the board again when leaving a subpage', () => {
    const { doc, win, navigation } = setup();
    clickLink(doc, 'a[href="#about-page"]');
    expect(doc.getElementById('about-page').classList.contains('ui-page-active')).toBe(true);
    navigation.handlePopState(new win.PopStateEvent('popstate', { state: { page: HOME_PAGE } }));
    expect(doc.getElementById('game-page').classList.contains('ui-page-active')).toBe(true);
    expect(doc.getElementById('about-page').classList.contains('ui-page-active')).toBe(false);
  });

  it('falls back to the game page for an unknown history entry', () => {
    const { doc, win, navigation } = setup();
    clickLink(doc, 'a[href="#rules-page"]');
    navigation.handlePopState(new win.PopStateEvent('popstate'));
    expect(navigation.activePage().id).toBe(HOME_PAGE);
  });

  it('does nothing when the target page is already active', () => {
    const { navigation } = setup();
    expect(navigation.activate(HOME_PAGE)).toBe(false);
    expect(navigation.activate('does-not-exist')).toBe(false);
    expect(navigation.activate('left-panel')).toBe(false);
    expect(navigation.goTo(HOME_PAGE, 'pop')).toBe(false);
  });

  it('opens the page named in the initial location hash', () => {
    const { doc } = loadApp('http://localhost/index.html#about-page');
    createNavigation({ doc, win: doc.defaultView, schedule: immediate }).init();
    expect(doc.getElementById('about-page').classList.contains('ui-page-active')).toBe(true);
    expect(doc.getElementById('game-page').classList.contains('ui-page-active')).toBe(false);
  });

  it('activates a page when none is active yet', () => {
    const { doc, navigation } = setup();
    doc.getElementById('game-page').classList.remove('ui-page-active');
    expect(navigation.activate('rules-page')).toBe(true);
    expect(doc.getElementById('rules-page').classList.contains('ui-page-active')).toBe(true);
  });

  it('sends back links to the browser history', () => {
    const { doc, win } = setup();
    const back = vi.spyOn(win.history, 'back').mockImplementation(() => {});
    clickLink(doc, '#customBackRules');
    expect(back).toHaveBeenCalled();
  });

  it('closes the panel when the dismiss layer is clicked', () => {
    const { doc, navigation } = setup();
    navigation.openPanel();
    doc
      .querySelector('.ui-panel-dismiss')
      .dispatchEvent(new doc.defaultView.MouseEvent('click', { bubbles: true }));
    expect(doc.getElementById('left-panel').classList.contains('ui-panel-closed')).toBe(true);
  });

  it('leaves unrelated clicks alone', () => {
    const { doc, navigation } = setup();
    const plain = doc.createElement('div');
    doc.body.append(plain);
    expect(navigation.handleClick({ target: plain })).toBe(false);
    const external = doc.querySelector('a[rel="license"]');
    expect(navigation.handleClick({ target: external })).toBe(false);
  });
});
