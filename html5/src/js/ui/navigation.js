//
// Copyright (c) 2016-2026 Oliver Merkel
// All rights reserved.
//
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
//

export const HOME_PAGE = 'game-page';
export const PANEL_ID = 'left-panel';

export const TRANSITIONS = Object.freeze({
  pop: Object.freeze({ in: 350, out: 100 }),
  slideup: Object.freeze({ in: 250, out: 100 }),
  none: Object.freeze({ in: 0, out: 0 })
});

export const durationOf = (transition) => {
  const timing = TRANSITIONS[transition] ?? TRANSITIONS.none;
  return Math.max(timing.in, timing.out);
};

export const createNavigation = ({
  doc,
  win = globalThis,
  schedule = (callback, delay) => win.setTimeout(callback, delay)
}) => {
  let previousTransition = 'none';

  const page = (id) => doc.getElementById(id);
  const panel = () => page(PANEL_ID);
  const dismiss = () => doc.querySelector('.ui-panel-dismiss');

  const activePage = () => doc.querySelector('.ui-page-active');

  const applyTransition = (from, to, transition, reverse) => {
    const classes = reverse ? [transition, 'reverse'] : [transition];
    to.classList.add(...classes, 'in');
    from.classList.add(...classes, 'out');
    to.classList.add('ui-page-active');
    schedule(() => {
      from.classList.remove(...classes, 'out');
      to.classList.remove(...classes, 'in');
      from.classList.remove('ui-page-active');
    }, durationOf(transition));
  };

  const activate = (id, transition = 'none', reverse = false) => {
    const to = page(id);
    const from = activePage();
    if (to === null || !to.classList.contains('ui-page') || from === to) return false;
    if (from === null) {
      to.classList.add('ui-page-active');
      return true;
    }
    applyTransition(from, to, transition, reverse);
    return true;
  };

  const openPanel = () => {
    panel().classList.remove('ui-panel-closed');
    panel().classList.add('ui-panel-open');
    dismiss().classList.add('ui-panel-dismiss-open');
  };

  const closePanel = () => {
    panel().classList.remove('ui-panel-open');
    panel().classList.add('ui-panel-closed');
    dismiss().classList.remove('ui-panel-dismiss-open');
  };

  const goTo = (id, transition) => {
    closePanel();
    if (!activate(id, transition)) return false;
    win.history.pushState({ page: id, transition }, '', `#${id}`);
    return true;
  };

  const back = () => win.history.back();

  const handlePopState = (event) => {
    const id = event.state?.page ?? HOME_PAGE;
    activate(id, previousTransition, id === HOME_PAGE);
  };

  const handleClick = (event) => {
    const link = event.target.closest('a');
    if (link === null) return false;
    if (link.getAttribute('href') === `#${PANEL_ID}`) {
      event.preventDefault();
      openPanel();
      return true;
    }
    const rel = link.dataset.rel;
    if (rel === 'close') {
      event.preventDefault();
      closePanel();
      return true;
    }
    if (rel === 'back') {
      event.preventDefault();
      back();
      return true;
    }
    if (rel === 'page') {
      event.preventDefault();
      const id = link.getAttribute('href').slice(1);
      previousTransition = link.dataset.transition ?? 'none';
      goTo(id, previousTransition);
      return true;
    }
    return false;
  };

  const init = () => {
    doc.addEventListener('click', handleClick);
    win.addEventListener('popstate', handlePopState);
    dismiss().addEventListener('click', closePanel);
    win.history.replaceState({ page: HOME_PAGE, transition: 'none' }, '', win.location.hash || '#');
    goTo(win.location.hash.slice(1), 'none');
  };

  return {
    init,
    activate,
    goTo,
    back,
    openPanel,
    closePanel,
    activePage,
    handleClick,
    handlePopState
  };
};
