import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const HTML = readFileSync(
  fileURLToPath(new URL('../../../html5/src/index.html', import.meta.url)),
  'utf8'
);

export const loadApp = (url = 'http://localhost/index.html') => {
  const dom = new JSDOM(HTML, { url });
  const win = dom.window;
  win.innerWidth = 800;
  win.innerHeight = 600;
  return { dom, win, doc: win.document };
};

export const createFakeWorker = () => {
  const posted = [];
  const listeners = [];
  return {
    posted,
    postMessage: (message) => posted.push(message),
    addEventListener: (type, listener) => listeners.push([type, listener]),
    emit: (data) => {
      for (const [type, listener] of listeners) if (type === 'message') listener({ data });
    }
  };
};

export const immediate = (callback) => callback();
