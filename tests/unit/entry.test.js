import { afterEach, describe, expect, it } from 'vitest';

const original = globalThis.self;

afterEach(() => {
  if (original === undefined) delete globalThis.self;
  else globalThis.self = original;
});

describe('worker entry point', () => {
  it('registers the controller on the worker scope', async () => {
    const messages = [];
    const listeners = [];
    globalThis.self = {
      postMessage: (message) => messages.push(message),
      addEventListener: (type, listener) => listeners.push([type, listener])
    };

    await import('../../html5/src/js/worker/entry.js');

    expect(listeners).toHaveLength(1);
    expect(listeners[0][0]).toBe('message');

    listeners[0][1]({
      data: {
        class: 'request',
        request: 'start',
        playerwhite: 'Human',
        playerblack: 'Human',
        invertlast: false
      }
    });
    expect(messages[0].request).toBe('redraw');
  });
});
