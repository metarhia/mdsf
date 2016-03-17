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
api.jstp.stringify = function(obj) {
  
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

// Get field from data using metadata
//   data - JSRD object
//   metadata - JSRM object
//   fieldName - field name or path separated by `.`
//   return - value
//
api.jstp.objectGet = function(data, metadata, fieldName) {

};

// Set field value using metadata
//   data - JSRD object
//   metadata - JSRM object
//   fieldName - field name or path separated by `.`
//   value - value to be assigned
//
api.jstp.objectSet = function(data, metadata, fieldName, value) {
  
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
