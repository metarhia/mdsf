'use strict';

const vm = require('vm');
const serializerFactory = require('./serializer-factory');

const PARSE_TIMEOUT = 30;

const serializer = {};
module.exports = serializer;

// Parse a string representing an object in JSTP Object Serialization format
//   string - a string to parse
//
serializer.interprete = (string) => {
  const sandbox = vm.createContext({});
  const script = vm.createScript('"use strict";(' + string + ')');
  const exported = script.runInNewContext(sandbox, {
    timeout: PARSE_TIMEOUT
  });

  const isObject = typeof(exported) === 'object' && exported !== null;
  if (isObject && !Array.isArray(exported)) {
    const keys = Object.keys(exported);
    const keysLength = keys.length;
    for (let i = 0; i < keysLength; i++) {
      const key = keys[i];
      sandbox[key] = exported[key];
    }
  }

  return exported;
};

// Serialize a JavaScript object into a string in JSTP Object Serialization
// format
//
serializer.dump = serializerFactory.createSerializer({
  date(date) {
    const string = date.toISOString();
    return 'new Date(\'' + string + '\')';
  },

  function: fn => fn.toString()
});
