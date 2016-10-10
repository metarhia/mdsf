/* eslint-env browser */
'use strict';

var jstp = require('.');

if (!window.api) {
  window.api = {};
}

window.api.jstp = jstp;
