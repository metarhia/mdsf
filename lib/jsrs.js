'use strict';

try {
  module.exports = require('../build/Release/jsrs');
} catch (e) {
  try {
    module.exports = require('../build/Debug/jsrs');
  } catch (e) {
    console.error('JSRS native module is not built, run `npm install`.');
    throw e;
  }
}
