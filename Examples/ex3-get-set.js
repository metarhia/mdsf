var fs = require('fs'),
    vm = require('vm');

// JSRS utilities

var JSRS = {};

JSRS.getField = function(data, metadata, field) {
  var i = 0;
  for (var key in metadata) {
    if (key === field) {
      return data[i];
    }
    i++;
  }
};

JSRS.setField = function(data, metadata, field, value) {
  var i = 0;
  for (var key in metadata) {
    if (key === field) {
      data[i] = value;
    }
    i++;
  }
};

// JSRD and JSRM usage example

var data = ['Marcus Aurelius','AE127095'];
var metadata = { name: 'string', passport: '[string(8)]' };
var name = JSRS.getField(data, metadata, 'name');
console.log('Name = ' + name);
JSRS.setField(data, metadata, 'name', 'Marcus');
console.dir(data);
