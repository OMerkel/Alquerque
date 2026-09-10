//
// Copyright (c) 2016-2026 Oliver Merkel
// All rights reserved.
//
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
//

const RADIO_ON = 'ui-radio-on';
const RADIO_OFF = 'ui-radio-off';

export const labelOf = (input) => input.ownerDocument.querySelector(`label[for="${input.id}"]`);

export const refreshRadio = (input) => {
  const label = labelOf(input);
  if (label === null) return;
  label.classList.toggle(RADIO_ON, input.checked);
  label.classList.toggle(RADIO_OFF, !input.checked);
};

export const refreshGroup = (doc, name) => {
  for (const input of doc.querySelectorAll(`input[type="radio"][name="${name}"]`)) {
    refreshRadio(input);
  }
};

export const enhanceRadios = (doc) => {
  const inputs = [...doc.querySelectorAll('input[type="radio"]')];
  for (const input of inputs) refreshRadio(input);
  doc.addEventListener('change', (event) => {
    const input = event.target;
    if (input.type !== 'radio') return;
    refreshGroup(doc, input.name);
  });
  return inputs;
};

export const enhanceCollapsibles = (doc) => {
  const headings = [...doc.querySelectorAll('.ui-collapsible-heading > .ui-btn')];
  for (const heading of headings) {
    heading.addEventListener('click', (event) => {
      event.preventDefault();
      const collapsible = heading.closest('.ui-collapsible');
      const collapsed = collapsible.classList.toggle('ui-collapsible-collapsed');
      collapsible
        .querySelector('.ui-collapsible-content')
        .classList.toggle('ui-collapsible-content-collapsed', collapsed);
      heading.classList.toggle('ui-icon-arrow-d', !collapsed);
      heading.classList.toggle('ui-icon-arrow-l', collapsed);
    });
  }
  return headings;
};
