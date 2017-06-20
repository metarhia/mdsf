'use strict';

const common = {};
module.exports = common;

// Try to require `moduleName` and return the exported object if the module is
// found or null otherwise.
//
common.safeRequire = (moduleName) => {
  try {
    return [null, require(moduleName)];
  } catch (err) {
    return [err, null];
  }
};
