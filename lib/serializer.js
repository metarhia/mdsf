'use strict';

var vm = require('vm');

var PARSE_TIMEOUT = 30;

var serializer = {};
module.exports = serializer;

// Parse a string representing an object
// in JSTP Object Serialization format
//   str - a string to parse
//
serializer.interprete = function interprete(str) {
  var sandbox = vm.createContext({});
  var script = vm.createScript('"use strict";(' + str + ')');
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
//   obj - an object to serialize
//
serializer.dump = function dump(obj) {
  return serialize(obj);
};

// Internal function used by jstp.dump
//
function serialize(object, index, array) {
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

  var fn = serialize.types[type];
  return fn(object, array);
}

serialize.types = {
  number: function(n) { return n + ''; },
  boolean: function(b) { return b ? 'true' : 'false'; },
  undefined: function(u, arr) { return arr ? '' : 'undefined'; },
  null: function() { return 'null'; },
  string: function(s) {
    var serialized = JSON.stringify(s).slice(1, -1);
    return '\'' + serialized.replace(/'/g, '\\\'') + '\'';
  },
  array: function(a) {
    return '[' + a.map(serialize).join(',') + ']';
  },
  date: function(date) {
    var string = date.toISOString();
    return 'new Date(\'' + string + '\')';
  },
  object: function(obj) {
    var array = [];
    for (var key in obj) {
      if (!obj.hasOwnProperty(key)) {
        continue;
      }
      var repr = serialize(obj[key]);
      if (repr !== 'undefined') {
        array.push(key + ':' + repr);
      }
    }
    return '{' + array.join(',') + '}';
  },
  function: function(fn) {
    return fn.toString();
  }
};
