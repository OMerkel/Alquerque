import { describe, expect, it } from 'vitest';
import {
  enhanceCollapsibles,
  enhanceRadios,
  labelOf,
  refreshGroup,
  refreshRadio
} from '../../html5/src/js/ui/controls.js';
import { loadApp } from './helpers/dom.js';

const change = (doc, input) => {
  input.checked = true;
  input.dispatchEvent(new doc.defaultView.Event('change', { bubbles: true }));
};

describe('radio buttons', () => {
  it('finds the label of an input', () => {
    const { doc } = loadApp();
    expect(labelOf(doc.getElementById('playerwhiteai')).textContent).toBe('AI');
  });

  it('marks the checked option', () => {
    const { doc } = loadApp();
    enhanceRadios(doc);
    expect(labelOf(doc.getElementById('playerwhitehuman')).classList.contains('ui-radio-on')).toBe(
      true
    );
    expect(labelOf(doc.getElementById('playerwhiteai')).classList.contains('ui-radio-off')).toBe(
      true
    );
  });

  it('moves the marker when another option is chosen', () => {
    const { doc } = loadApp();
    enhanceRadios(doc);
    const ai = doc.getElementById('playerwhiteai');
    doc.getElementById('playerwhitehuman').checked = false;
    change(doc, ai);
    expect(labelOf(ai).classList.contains('ui-radio-on')).toBe(true);
    expect(labelOf(doc.getElementById('playerwhitehuman')).classList.contains('ui-radio-off')).toBe(
      true
    );
  });

  it('ignores changes of other controls', () => {
    const { doc } = loadApp();
    enhanceRadios(doc);
    const text = doc.createElement('input');
    text.type = 'text';
    doc.body.append(text);
    text.dispatchEvent(new doc.defaultView.Event('change', { bubbles: true }));
    expect(labelOf(doc.getElementById('playerwhitehuman')).classList.contains('ui-radio-on')).toBe(
      true
    );
  });

  it('tolerates inputs without a label', () => {
    const { doc } = loadApp();
    const orphan = doc.createElement('input');
    orphan.type = 'radio';
    orphan.id = 'orphan';
    orphan.name = 'orphan';
    doc.body.append(orphan);
    expect(() => refreshRadio(orphan)).not.toThrow();
    expect(() => refreshGroup(doc, 'orphan')).not.toThrow();
  });
});

describe('collapsibles', () => {
  it('expands and collapses a section', () => {
    const { doc } = loadApp();
    const headings = enhanceCollapsibles(doc);
    expect(headings).toHaveLength(2);
    const heading = headings[0];
    const collapsible = heading.closest('.ui-collapsible');
    const content = collapsible.querySelector('.ui-collapsible-content');

    heading.dispatchEvent(
      new doc.defaultView.MouseEvent('click', { bubbles: true, cancelable: true })
    );
    expect(collapsible.classList.contains('ui-collapsible-collapsed')).toBe(false);
    expect(content.classList.contains('ui-collapsible-content-collapsed')).toBe(false);
    expect(heading.classList.contains('ui-icon-arrow-d')).toBe(true);

    heading.dispatchEvent(
      new doc.defaultView.MouseEvent('click', { bubbles: true, cancelable: true })
    );
    expect(collapsible.classList.contains('ui-collapsible-collapsed')).toBe(true);
    expect(content.classList.contains('ui-collapsible-content-collapsed')).toBe(true);
    expect(heading.classList.contains('ui-icon-arrow-l')).toBe(true);
  });
});
