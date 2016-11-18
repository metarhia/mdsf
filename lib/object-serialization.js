'use strict';

var vm = require('vm');
var serializerFactory = require('./serializer-factory');

var PARSE_TIMEOUT = 30;

var serializer = {};
module.exports = serializer;

// Parse a string representing an object in JSTP Object Serialization format
//   string - a string to parse
//
serializer.interprete = function interprete(string) {
  var sandbox = vm.createContext({});
  var script = vm.createScript('"use strict";(' + string + ')');
  var exported = script.runInNewContext(sandbox, {
    timeout: PARSE_TIMEOUT
  });

  var isObject = typeof(exported) === 'object' && exported !== null;
  if (isObject && !Array.isArray(exported)) {
    var keys = Object.keys(exported);
    var keysLength = keys.length;
    for (var i = 0; i < keysLength; i++) {
      var key = keys[i];
      sandbox[key] = exported[key];
    }
  }

  return exported;
};

// Serialize a JavaScript object into a string in JSTP Object Serialization
// format
//
serializer.dump = serializerFactory.createSerializer({
  date: function(date) {
    var string = date.toISOString();
    return 'new Date(\'' + string + '\')';
  },

  function: function(fn) {
    return fn.toString();
  }
});
