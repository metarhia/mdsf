'use strict';

class StringDerivative extends String {
  [Symbol.toPrimitive]() {
    return '42';
  }
  toString() {
    return '24';
  }
}

module.exports = [
  {
    name: 'string containing inline comment',
    value: '// inline comment',
    serialized: "'// inline comment'",
  },
  {
    name: 'string containing block comment',
    value: '/* block comment */',
    serialized: "'/* block comment */'",
  },
  {
    name: 'string with number inside',
    value: '0.5',
    serialized: "'0.5'",
  },
  {
    name: 'buffer serialization',
    value: Buffer.from('some binary data'),
    serialized: "'c29tZSBiaW5hcnkgZGF0YQ=='",
  },
  {
    name: 'String object',
    value: new String('test data'),
    serialized: `'test data'`,
  },
  {
    name: 'string derivative with Symbol.toPrimitive',
    value: new StringDerivative('23'),
    serialized: `'42'`,
  },
];
