'use strict';

var serializerFactory = require('./serializer-factory');

var jsrs = {};
module.exports = jsrs;

// Change to true if you want to use the native C++ version of JSRS serializer.
// Currently the JavaScript version is quite faster (contrary to the parser,
// C++ version of which is a lot faster than the JavaScript one) though it is
// one of our priorities to optimize it.
var USE_NATIVE_SERIALIZER = false;

var jsrsNative;

try {
  jsrsNative = require('../build/Release/jsrs');
} catch (e) {
  try {
    jsrsNative = require('../build/Debug/jsrs');
  } catch (e) {
    console.warn('JSTP Record Serialization native module is not built. ' +
      'Run `npm install` in order to build it, otherwise you will get ' +
      'poor server performance under load.');
    module.exports = require('./browser/record-serialization');
  }
}

if (jsrsNative) {
  jsrs.parse = jsrsNative.parse;

  if (USE_NATIVE_SERIALIZER) {
    jsrs.stringify = jsrsNative.stringify;
  } else {
    jsrs.stringify = serializerFactory.createSerializer();
  }
}
