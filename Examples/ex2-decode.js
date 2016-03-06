var fs = require('fs'),
    vm = require('vm');

// JSRS utilities

var JSRS = {};

JSRS.decode = function(data, metadata) {
  var obj = {}, i = 0;
  for (var key in metadata) {
    obj[key] = data[i++];
  }
  return obj;
};

// JSRD and JSRM usage example

var data = ['Marcus Aurelius','AE127095'];
var metadata = { name: 'string', passport: '[string(8)]' };
var person = JSRS.decode(data, metadata);
console.dir(person);
