'use strict';

api.jstp = {};

// Deserialize string to object
//   jsrs - JSRS string
//   return - deserialized JavaScript object
//
api.jstp.parse = function(jsrs) {
  var sandbox = api.vm.createContext({});
  var js = api.vm.createScript('(' + jsrs + ')');
  var exported = js.runInNewContext(sandbox);
  for (var key in exported) {
    sandbox[key] = exported[key];
  }
  return exported;
};

// Serialize object to string
//   obj - JavaScript object to be serialized
//   return - JSRS string
//
api.jstp.stringify = function(obj, i, arr) {
  var type;
  if (obj instanceof Array) type = 'array';
  else if (obj instanceof Date) type = 'date';
  else type = typeof(obj);
  var fn = api.jstp.stringify.types[type];
  return fn(obj, arr);
};

api.jstp.stringify.types = {
  string: function(s) { return '\'' + s + '\''; },
  number: function(s) { return s + ''; },
  boolean: function(b) { return b ? 'true' : 'false'; },
  undefined: function(u, arr) { return !!arr ? '' : 'undefined'; },
  date: function(d) { return '\'' + d.toISOString().split('T')[0] + '\''; },
  array: function(a) {
    return '[' + a.map(api.jstp.stringify).join(',') + ']';
  },
  object: function(obj) {
    var a = [];
    for (var key in obj) {
      a.push(key + ':' + api.jstp.stringify(obj[key]));
    }
    return '{' + a.join(',') + '}';
  }
};

// Convert data into object using metadata
//   data - deserialized JSRD object
//   metadata - JSRM object
//   return - JavaScript object
//
api.jstp.dataToObject = function(data, metadata) {
  
};

// Convert object into data using metadata
//   obj - JavaScript object
//   metadata - JSRM object
//   return - JSRD object
//
api.jstp.objectToData = function(obj, metadata) {
  
};

// Mixin JSRD methods and metadata to data
//   data - data array
//   metadata - JSRM object
//
api.jstp.jsrd = function(data, metadata) {

  var keys = Object.keys(metadata);

  data.get = function(fieldName) {
    var index = keys.indexOf(fieldName);
    var value = index > -1 ? data[index] : null;
    return value;
  };

  data.set = function(fieldName, value) {
    var index = keys.indexOf(fieldName);
    if (index > -1) data[index] = value;
  };

  // We may use defineProperties here in two ways:
  // * Define set/get functions as unvisible for iterators
  // * Define all properties from metadata

};
