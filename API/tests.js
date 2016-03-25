'use strict';

global.api = {};
api.vm = require('vm');
api.util = require('util');
require('./api.jstp.js');
require('./api.test.js');

var obj = {
  name: 'Marcus Aurelius',
  passport: 'AE127095',
  birth: new Date('1990-02-15'),
  age: 26,
  smart: true,
  arr: [1,2,3,4,undefined,5,undefined],
  sub: { key: 'val' },
  undefinedField: undefined,
  nullField: null,
  fn: function(n) {
    return n * 2;
  }
};

var data = ['Marcus Aurelius','AE127095','1990-02-15',26];

var metadata = {
  name: 'string',
  passport: 'string(8)',
  birth: 'Date',
  age: 'number',
  smart: 'boolean',
  arr: 'array',
  sub: 'object'
};

console.log(api.jstp.stringify(obj));
console.log(api.jstp.parse(api.jstp.stringify(obj)));

var jsrd = api.jstp.jsrd(data, metadata);
console.log('name: ' + jsrd.name);
console.log(api.jstp.stringify(jsrd));

data = { a:4, b:5, c:[], d: 'qwerty' };
data = [1,2,3,4,5,'a'];
data = ['Marcus Aurelius','AE127095','1990-02-15',26];
data = [,,,,,,,,,];
data = obj;

api.test.speed('JSTP', 10000, function() {
  var s = api.jstp.stringify(data);
});

api.test.speed('JSON', 10000, function() {
  var s = JSON.stringify(data);
});

api.test.speed('JSTP', 10000, function() {
  var s = api.jstp.stringify(data);
});

api.test.speed('JSON', 10000, function() {
  var s = JSON.stringify(data);
});

api.test.speed('JSTP', 10000, function() {
  var s = api.jstp.stringify(data);
});

api.test.speed('JSON', 10000, function() {
  var s = JSON.stringify(data);
});
