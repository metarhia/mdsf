'use strict';

const getObjString = val => Object.prototype.toString.call(val);

const objectToScalarConverters = {
  '[object Number]': x => Number(x),
  '[object String]': x => String(x),
  '[object Boolean]': x => Boolean(x),
};

const STRINGIFIERS = {
  number: number => number + '',
  boolean: boolean => (boolean ? 'true' : 'false'),
  undefined: () => 'undefined',
  null: () => 'null',
  buffer: buf => `'${buf.toString('base64')}'`,

  string(string) {
    const content = JSON.stringify(string).slice(1, -1);
    return `'${content.replace(/'/g, "\\'")}'`;
  },

  array(array, replacer, space, startIndent) {
    let result = '[';

    const indent = startIndent + space;

    const len = array.length;
    let isNotEmpty = false;
    for (let index = 0; index < len; index++) {
      const value = array[index];
      if (value !== undefined) {
        if (space) {
          result += '\n' + indent;
        }
        result += stringifyInternal(
          value,
          replacer,
          space,
          indent,
          index.toString(),
          array
        );
        isNotEmpty = true;
      }

      if (index !== len - 1) {
        result += ',';
        isNotEmpty = true;
      }
    }

    if (space && isNotEmpty) {
      result += '\n' + startIndent;
    }

    return result + ']';
  },

  object(object, replacer, space, startIndent) {
    const converter = objectToScalarConverters[getObjString(object)];
    if (converter) {
      return stringifyInternal(converter(object));
    }
    let result = '{';
    let firstKey = true;

    let objectKeys = Object.keys(object);
    if (Array.isArray(replacer)) {
      objectKeys = objectKeys.filter(key => replacer.includes(key));
    }
    const indent = startIndent + space;

    for (let i = 0; i < objectKeys.length; i++) {
      let key = objectKeys[i];
      const value = stringifyInternal(
        object[key],
        replacer,
        space,
        indent,
        key,
        object
      );

      if (value === '' || value === 'undefined') {
        continue;
      }

      if (!/^[a-zA-Z_$][\w$]*$/.test(key)) {
        key = STRINGIFIERS.string(key);
      }

      if (firstKey) {
        firstKey = false;
      } else {
        result += ',';
      }

      if (space) {
        result += '\n' + indent;
      }

      result += key + ':';
      if (space) {
        result += ' ';
      }
      result += value;
    }

    if (space && !firstKey) {
      result += '\n' + startIndent;
    }

    return result + '}';
  },
};

function stringifyInternal(value, replacer, space, indent, key = '', holder) {
  if (typeof value === 'object' && value !== null) {
    if (typeof value.toMDSF === 'function') {
      value = value.toMDSF(key);
    } else if (typeof value.toJSON === 'function' && !Buffer.isBuffer(value)) {
      value = value.toJSON(key);
    }
  }
  if (typeof replacer === 'function') {
    value = replacer.call(holder ? holder : { '': value }, key, value);
  }
  let type;
  if (Array.isArray(value)) {
    type = 'array';
  } else if (Buffer.isBuffer(value)) {
    type = 'buffer';
  } else if (value === null) {
    type = 'null';
  } else {
    type = typeof value;
  }

  const stringifier = STRINGIFIERS[type];
  if (stringifier) return stringifier(value, replacer, space, indent);

  return '';
}

const filterReplacer = replacer =>
  replacer
    .filter(prop => {
      const type = typeof prop;
      if (type === 'string' || type === 'number') {
        return true;
      }
      if (type === 'object') {
        const objStr = getObjString(prop);
        return objStr === '[object String]' || objStr === '[object Number]';
      }
      return false;
    })
    .map(prop => String(prop));

function stringify(value, replacer, space = '') {
  if (space) {
    if (typeof space === 'object') {
      const objStr = getObjString(space);
      if (objStr === '[object Number]') {
        space = Number(space);
      } else if (objStr === '[object String]') {
        space = String(space);
      }
    }
    if (Number.isInteger(space) && space > 0) {
      space = ' '.repeat(Math.min(space, 10));
    } else if (typeof space === 'string') {
      space = space.slice(0, 10);
    } else {
      space = '';
    }
  }

  if (Array.isArray(replacer)) {
    replacer = filterReplacer(replacer);
  }

  return stringifyInternal(value, replacer, space, '');
}

module.exports = stringify;
