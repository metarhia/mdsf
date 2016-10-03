'use strict';

var vm = require('vm');
var jsrs = require('./record-serialization');

var PARSE_TIMEOUT = 30;

var serializer = {};
module.exports = serializer;

// Parse a string representing an object
// in JSTP Object Serialization format
//   str - a string to parse
//
serializer.interprete = function interprete(string) {
  var sandbox = vm.createContext({});
  var script = vm.createScript('"use strict";(' + string + ')');
  var exported = script.runInNewContext(sandbox, {
    timeout: PARSE_TIMEOUT
  });

  for (var key in exported) {
    if (exported.hasOwnProperty(key)) {
      sandbox[key] = exported[key];
    }
  }

  return exported;
};

// Serialize a JavaScript object into a string
// in JSTP Object Serialization format
//   object - an object to serialize
//
serializer.dump = function dump(object) {
  var type = null;
  if (Array.isArray(object)) {
    type = 'array';
  } else if (object instanceof Date) {
    type = 'date';
  } else if (object === null) {
    type = 'null';
  } else {
    type = typeof(object);
  }

  var fn = serializer.dump.types[type];
  return fn ? fn(object) : jsrs.stringify(object);
};

serializer.dump.types = {
  array: function(array) {
    return '[' + array.map(serializer.dump).join(',') + ']';
  },

  date: function(date) {
    var string = date.toISOString();
    return 'new Date(\'' + string + '\')';
  },

  object: function(object) {
    var array = [];
    for (var key in object) {
      if (!object.hasOwnProperty(key)) {
        continue;
      }

      var serializedKey = /[a-zA-Z_]\w*/.test(key) ?
        key : jsrs.stringify(key);
      var serializedValue = serializer.dump(object[key]);

      if (serializedValue !== 'undefined') {
        array.push(serializedKey + ':' + serializedValue);
      }
    }
    return '{' + array.join(',') + '}';
  },

  function: function(fn) {
    return fn.toString();
  }
};
