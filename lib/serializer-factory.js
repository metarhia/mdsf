'use strict';

var common = require('./common');

var factory = {};
module.exports = factory;

// Create a serializer function that takes a JavaScript object and returns its
// string representation. By default the behaviour of this function will be
// compliant with the JSTP Record Serialization format but you can override it
// or supply additional types support using the optional argument of this
// factory function.
//   additionalTypes - an object with keys which names specify data types and
//                     values that are functions that serialize values of
//                     the corresponding types
//
factory.createSerializer = function(additionalTypes) {
  function serialize(object) {
    var type;
    if (Array.isArray(object)) {
      type = 'array';
    } else if (object instanceof Date) {
      type = 'date';
    } else if (object === null) {
      type = 'null';
    } else {
      type = typeof(object);
    }

    var serializer = serialize.types[type];
    if (serializer) {
      return serializer(object);
    }

    return '';
  }

  serialize.types = {
    number: function(number) {
      return number + '';
    },

    boolean: function(bool) {
      return bool ? 'true' : 'false';
    },

    undefined: function() {
      return 'undefined';
    },

    null: function() {
      return 'null';
    },

    string: function(string) {
      var content = JSON.stringify(string).slice(1, -1);
      return '\'' + content.replace(/'/g, '\\\'') + '\'';
    },

    date: function(date) {
      return '\'' + date.toISOString() + '\'';
    },

    array: function(array) {
      var result = '[';

      for (var index = 0; index < array.length; index++) {
        var value = array[index];
        if (value !== undefined) {
          result += serialize(value);
        }

        if (index !== array.length - 1) {
          result += ',';
        }
      }

      return result + ']';
    },

    object: function(object) {
      var result = '{';
      var firstKey = true;

      var objectKeys = Object.keys(object);
      var objectKeysCount = objectKeys.length;

      for (var i = 0; i < objectKeysCount; i++) {
        var key = objectKeys[i];
        var value = serialize(object[key]);

        if (value === '' || value === 'undefined') {
          continue;
        }

        if (!/^[a-zA-Z_]\w*$/.test(key)) {
          key = serialize.types.string(key);
        }

        if (firstKey) {
          firstKey = false;
        } else {
          result += ',';
        }

        result += key + ':' + value;
      }

      return result + '}';
    }
  };

  common.extend(serialize.types, additionalTypes);
  return serialize;
};
