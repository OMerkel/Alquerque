//
// Copyright (c) 2016-2026 Oliver Merkel
// All rights reserved.
//
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
//

import { enhanceCollapsibles, enhanceRadios } from './controls.js';
import { createHmi } from './hmi.js';
import { createNavigation } from './navigation.js';
import { createBoardView } from './svgBoard.js';

export const WORKER_URL = 'js/worker/entry.js';

export const bootstrap = ({
  doc = document,
  win = globalThis,
  createWorker = () => new win.Worker(WORKER_URL, { type: 'module' })
} = {}) => {
  const view = createBoardView(doc.getElementById('board'), { doc });
  const engine = createWorker();
  const hmi = createHmi({ doc, view, engine, win });
  const navigation = createNavigation({ doc, win });

  navigation.init();
  enhanceRadios(doc);
  enhanceCollapsibles(doc);
  engine.addEventListener('message', hmi.handleEngineMessage, false);
  win.addEventListener('resize', hmi.resize);
  doc.getElementById('new').addEventListener('click', (event) => {
    event.preventDefault();
    hmi.restart();
    navigation.closePanel();
  });

  hmi.resize();
  hmi.start();
  return { view, engine, hmi, navigation };
};

if (typeof document !== 'undefined' && document.getElementById('board') !== null) {
  bootstrap();
}
