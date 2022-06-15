/*!
 * Copyright (c) 2022 Digital Bazaar, Inc. All rights reserved.
 */
import {createRequire} from 'node:module';
import {join} from 'node:path';
import appRoot from 'app-root-path';

const require = createRequire(import.meta.url);
const requireDir = require('require-dir');

const dir = requireDir('./');

// gets local implementations from an optional config file
const getLocalImplementations = () => {
  try {
    const path = join(
      appRoot.toString(), '.vcApiTestImplementationsConfig.cjs');
    return require(path);
  } catch(e) {
    if(e?.code === 'MODULE_NOT_FOUND') {
      return [];
    }
    throw e;
  }
};

export const implementerFiles = Object.values(dir)
  .concat(getLocalImplementations());
