'use strict';

// Try to require `moduleName` and return the exported object if the module is
// found or null otherwise.
//
const safeRequire = moduleName => {
  try {
    return [null, require(moduleName)];
  } catch (err) {
    return [err, null];
  }
};

module.exports = {
  safeRequire,
};
