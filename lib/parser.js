'use strict';

var vm = require('vm');

var PARSE_TIMEOUT = 30;

var parser = {};
module.exports = parser;

parser.parse = function parse(str) {
  var sandbox = vm.createContext({});
  var script = vm.createScript('(' + str + ')');
  return script.runInNewContext(sandbox, {
    timeout: PARSE_TIMEOUT
  });
};

parser.interprete = function interprete(str) {
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

function createSerializer(additionalTypes) {
  function serialize(object, index, array) {
    var type = null;
    if (Array.isArray(object)) {
      type = 'array';
    } else if (object instanceof Date) {
      type = 'date';
    } else if (object === null) {
      type = 'undefined';
    } else {
      type = typeof(object);
    }

    var fn = serialize.types[type];
    return fn(object, array);
  }

  serialize.types = Object.assign({
    number: function(n) { return n + ''; },
    string: function(s) { return '\'' + s.replace(/'/g, '\\\'') + '\''; },
    boolean: function(b) { return b ? 'true' : 'false'; },
    undefined: function(u, arr) { return arr ? '' : 'undefined'; },
    array: function(a) {
      return '[' + a.map(serialize).join(',') + ']';
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
}

parser.stringify = createSerializer({
  function: function() { return 'undefined'; },
  date: function(date) {
    return '\'' + date.toISOString() + '\'';
  }
});

parser.dump = createSerializer({
  function: function(fn) {
    return fn.toString();
  },
  date: function(date) {
    var string = date.toISOString();
    return 'new Date(\'' + string + '\')';
  }
});
