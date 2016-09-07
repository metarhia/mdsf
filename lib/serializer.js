'use strict';

var vm = require('vm');
var common = require('./common');

var PARSE_TIMEOUT = 30;

var serializer = {};
module.exports = serializer;

// Parse a string representing an object
// in JSTP Record Serialization format
//   str - a string to parse
//
serializer.parse = function parse(str) {
  var sandbox = vm.createContext({});
  var script = vm.createScript('(' + str + ')');
  return script.runInNewContext(sandbox, {
    timeout: PARSE_TIMEOUT
  });
};

// Parse a string representing an object
// in JSTP Object Serialization format
//   str - a string to parse
//
serializer.interprete = function interprete(str) {
  var sandbox = vm.createContext({});
  var script = vm.createScript('(' + str + ')');
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

// Create a specialized object serialization
// function with custom data types serializers
//   additionalTypes - custom serializers to extend the default one with
//
function createSerializer(additionalTypes) {
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

  serialize.types = common.extend({
    number: function(n) { return n + ''; },
    string: function(s) { return '\'' + s.replace(/'/g, '\\\'') + '\''; },
    boolean: function(b) { return b ? 'true' : 'false'; },
    undefined: function(u, arr) { return arr ? '' : 'undefined'; },
    null: function() { return 'null'; },
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
    }
  }, additionalTypes);

  return serialize;
}

// Serialize a JavaScript object into a string
// in JSTP Record Serialization format
// Signature:
//   jstp.stringify(obj)
// Parameters:
//   obj - an object to serialize
//
serializer.stringify = createSerializer({
  function: function() { return 'undefined'; }
});

// Serialize a JavaScript object into a string
// in JSTP Object Serialization format
// Signature:
//   jstp.stringify(obj)
// Parameters:
//   obj - an object to serialize
//
serializer.dump = createSerializer({
  function: function(fn) {
    return fn.toString();
  }
});
