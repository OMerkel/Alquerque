//
// Copyright (c) 2016-2026 Oliver Merkel
// All rights reserved.
//
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
//

export const readOptions = (doc) => ({
  playerwhite: doc.getElementById('playerwhiteai').checked ? 'AI' : 'Human',
  playerblack: doc.getElementById('playerblackai').checked ? 'AI' : 'Human',
  invertlast: doc.getElementById('invertAllowed').checked,
  showavailablemove: doc.getElementById('showavailablemove').checked,
  showalgebraicnotation: doc.getElementById('showalgebraicnotation').checked
});

export const request = (doc, name) => ({ class: 'request', request: name, ...readOptions(doc) });
