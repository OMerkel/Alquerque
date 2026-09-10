//
// Copyright (c) 2016-2026 Oliver Merkel
// All rights reserved.
//
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
//

import { getActions } from '../core/board.js';

export const getActionInfo = (state, { rules, random = Math.random } = {}) => {
  const actions = getActions(state, rules);
  return {
    action: actions.length === 0 ? null : actions[Math.floor(random() * actions.length)],
    info: `Random select out of ${actions.length} available actions.`
  };
};
