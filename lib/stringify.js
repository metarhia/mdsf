'use strict';

const STRINGIFIERS = {
  number:    number  => number + '',
  boolean:   boolean => (boolean ? 'true' : 'false'),
  date:      date    => `'${date.toISOString()}'`,
  undefined: ()      => 'undefined',
  null:      ()      => 'null',
  buffer:    buf     => `'${buf.toString('base64')}'`,

  string(string) {
    const content = JSON.stringify(string).slice(1, -1);
    return `'${content.replace(/'/g, '\\\'')}'`;
  },

  array(array) {
    let result = '[';

    const len = array.length;
    for (let index = 0; index < len; index++) {
      const value = array[index];
      if (value !== undefined) {
        result += stringify(value);
      }

      if (index !== len - 1) {
        result += ',';
      }
    }

    return result + ']';
  },

  object(object) {
    let result = '{';
    let firstKey = true;

    const objectKeys = Object.keys(object);
    const objectKeysCount = objectKeys.length;

    for (let i = 0; i < objectKeysCount; i++) {
      let key = objectKeys[i];
      const value = stringify(object[key]);

      if (value === '' || value === 'undefined') {
        continue;
      }

      if (!/^[a-zA-Z_]\w*$/.test(key)) {
        key = STRINGIFIERS.string(key);
      }

      if (firstKey) {
        firstKey = false;
      } else {
        result += ',';
      }

      result += key + ':' + value;
    }

    return result + '}';
  },
};

function stringify(object) {
  let type;
  if (Array.isArray(object)) {
    type = 'array';
  } else if (object instanceof Date) {
    type = 'date';
  } else if (Buffer.isBuffer(object)) {
    type = 'buffer';
  } else if (object === null) {
    type = 'null';
  } else {
    type = typeof(object);
  }

  const stringifier = STRINGIFIERS[type];
  if (stringifier) return stringifier(object);

  return '';
}

module.exports = stringify;
