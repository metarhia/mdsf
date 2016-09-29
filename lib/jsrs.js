'use strict';

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
    console.error('JSRS native module is not built, run `npm install`.');
    throw e;
  }
}

jsrs.parse = jsrsNative.parse;

if (USE_NATIVE_SERIALIZER) {
  jsrs.stringify = jsrsNative.stringify;
} else {

  // Serialize a JavaScript value using the JSTP Record Serialization format
  // and return a string representing it.
  //   object - an object to serialize
  //
  jsrs.stringify = function stringify(object) {
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

    var serializer = jsrs.stringify.types[type];
    if (serializer) {
      return serializer(object);
    }

    return '';
  };

  jsrs.stringify.types = {
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
          result += jsrs.stringify(value);
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

      for (var key in object) {
        if (!object.hasOwnProperty(key)) {
          continue;
        }

        var value = jsrs.stringify(object[key]);
        if (value === '' || value === 'undefined') {
          continue;
        }

        if (!/[a-zA-Z_]\w*/.test(key)) {
          key = jsrs.stringify.types.string(key);
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

}
