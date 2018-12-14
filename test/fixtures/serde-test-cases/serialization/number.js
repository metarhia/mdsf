'use strict';

module.exports = [
  {
    name: 'NaN',
    value: NaN,
    serialized: 'NaN',
  },
  {
    name: 'Infinity',
    value: Infinity,
    serialized: 'Infinity',
  },
  {
    name: '-Infinity',
    value: -Infinity,
    serialized: '-Infinity',
  },
  {
    name: 'Number object',
    value: new Number(42),
    serialized: '42',
  },
];
