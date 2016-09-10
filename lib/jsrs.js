'use strict';

try {
  module.exports = require('../build/Release/jsrs');
} catch (e) {
  try {
    module.exports = require('../build/default/jsrs');
  } catch (e) {
    console.error('JSRS native module is not built, run `npm install`.');
  }
}
