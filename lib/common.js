'use strict';

var common = {};
module.exports = common;

// Tests if a value is null or undefined
//   value - a value to test
//
function isNull(value) {
  return value === null || value === undefined;
}

// Populate a target object with all the properties
// of arbitrary number of other objects
// Signature:
//   common.extend(target, ...sources);
// Parameters:
//   target - object to copy properties into
//   ...sources - source objects
//
common.extend = function extend(target) {
  if (isNull(target)) {
    throw new TypeError('Cannot convert undefined or null to object');
  }

  if (typeof(target) !== 'object') {
    target = new Object(target);
  }

  var sources = Array.prototype.slice
    .call(arguments, 1)
    .filter(function(source) {
      return !isNull(source);
    });

  sources.forEach(function(source) {
    for (var key in source) {
      if (!source.hasOwnProperty(key)) {
        continue;
      }
      target[key] = source[key];
    }
  });

  return target;
};

if (Object.assign) {
  common.extend = Object.assign.bind(Object);
}
