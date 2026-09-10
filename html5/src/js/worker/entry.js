//
// Copyright (c) 2016-2026 Oliver Merkel
// All rights reserved.
//
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
//

import { createController } from './controller.js';

const controller = createController(self);
self.addEventListener('message', controller.handleMessage, false);
