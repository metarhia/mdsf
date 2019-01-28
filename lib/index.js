'use strict';

const safeRequire = require('./common').safeRequire;
const stringify = require('./stringify');

let [error, mdsfNative] = safeRequire('../build/Release/mdsf');

if (error) {
  console.warn(error.toString());
  [error, mdsfNative] = safeRequire('../build/Debug/mdsf');
}

if (mdsfNative) {
  module.exports = Object.assign(Object.create(null), mdsfNative, {
    stringify,
  });
} else {
  console.warn(
    error +
      '\n' +
      'mdsf native addon is not built or is not functional. ' +
      'Run `npm install` in order to build it, otherwise you will get ' +
      'poor performance.'
  );
  module.exports = require('./serde-fallback');
}
