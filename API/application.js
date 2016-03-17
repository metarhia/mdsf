'use strict';

var api = {};
global.api = api;

api.vm = require('vm');
require('./api.jstp.js');

var obj = {
  name: 'Marcus Aurelius',
  passport: 'AE127095',
  birth: new Date('1990-02-15'),
  age: 26
};

var data = [
  'Marcus Aurelius','AE127095',
  ['1990-02-15','Rome'],,
  ['Ukraine','Kiev','03056','Pobedy','37','158']
];

var metadata = {
  name: 'string',
  passport: 'string(8)',
  birth: 'Date',
  age: 'number'
};

api.jstp.jsrd(data, metadata);

console.log('name: ' + data.get('name'));
