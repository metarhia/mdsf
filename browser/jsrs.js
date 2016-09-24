'use strict';

(function() {

  var jsrs = {};

  if (module && module.exports) {
    module.exports = jsrs;
  } else {
    if (!window.api) window.api = {};
    if (!window.api.jstp) window.api.jstp = {};
    jsrs = window.api.jstp;
  }

  // Serializes a JavaScript value using the JSTP Record Serialization format
  // and returns a string representing it.
  //   object - an object to serialize
  //
  jsrs.stringify = function stringify(object) {
    var type;
    if (Array.isArray(object)) {
      type = 'array';
    } else if (object instanceof Date) {
      type = 'date';
    } else if (object === null) {
      type = 'null';
    } else {
      type = typeof(object);
    }

    var serializer = jsrs.stringify.types[type];
    if (serializer) {
      return serializer(object);
    }

    return '';
  };

  jsrs.stringify.types = {
    number: function(number) {
      return number + '';
    },

    boolean: function(bool) {
      return bool ? 'true' : 'false';
    },

    undefined: function() {
      return 'undefined';
    },

    null: function() {
      return 'null';
    },

    string: function(string) {
      var content = JSON.stringify(string).slice(1, -1);
      return '\'' + content.replace(/'/g, '\\\'') + '\'';
    },

    date: function(date) {
      return '\'' + date.toISOString() + '\'';
    },

    array: function(array) {
      return '[' + array.map(jsrs.stringify).join(',') + ']';
    },

    object: function(object) {
      var result = '{';
      var firstKey = true;

      for (var key in object) {
        if (!object.hasOwnProperty(key)) {
          continue;
        }

        var value = jsrs.stringify(object[key]);
        if (value === '' || value === 'undefined') {
          continue;
        }

        if (!/[a-zA-Z_]\w*/.test(key)) {
          key = jsrs.stringify.types.string(key);
        }

        if (firstKey) {
          firstKey = false;
        } else {
          result += ',';
        }

        result += key + ':' + value;
      }

      return result + '}';
    }
  };

  // Deserializes a string in the JSTP Record Serialization format into
  // a JavaScript value and returns it.
  //   string - a string to parse
  //
  jsrs.parse = function parse(string) {
    var lookaheadIndex = 0;

    var value = parseValue();

    skipClutter();
    if (lookaheadIndex < string.length) {
      throwUnexpected();
    }

    return value;

    function lookahead() {
      return string[lookaheadIndex];
    }

    function advance() {
      var character = string[lookaheadIndex++];
      if (lookaheadIndex > string.length) {
        throw new SyntaxError('Unexpected end of data');
      }
      return character;
    }

    function retreat() {
      lookaheadIndex--;
      if (lookaheadIndex < 0) {
        throw new SyntaxError('Parse error');
      }
    }

    function throwError(message) {
      throw new SyntaxError(message + ' at position ' + lookaheadIndex);
    }

    function throwExpected(token) {
      throwError(token + ' expected');
    }

    function throwUnexpected(token) {
      token = token || lookahead();
      if (token === undefined) {
        token = 'end of data';
      }

      throwError('Unexpected ' + token);
    }

    function isWhitespace(character) {
      return ' \f\n\r\t\v'.indexOf(character) !== -1;
    }

    function isNewline(character) {
      return character === '\n' || character === '\r';
    }

    function isLetter(character) {
      return character >= 'a' && character <= 'z';
    }

    function skipClutter() {
      skipWhitespace();
      skipComments();
      skipWhitespace();
    }

    function skipWhitespace() {
      while (isWhitespace(lookahead())) {
        advance();
      }
    }

    function skipComments() {
      if (lookahead() !== '/') {
        return;
      }

      advance();

      if (lookahead() === '/') {
        advance();
        skipLineCommentBody();
      } else if (lookahead() === '*') {
        advance();
        skipMultilineCommentBody();
      } else {
        retreat();
      }
    }

    function skipLineCommentBody() {
      while (!isNewline(lookahead()) &&
             lookahead() !== undefined) {
        advance();
      }
    }

    function skipMultilineCommentBody() {
      var done = false;

      while (!done) {
        while (lookahead() !== '*') {
          advance();
        }
        advance();

        if (lookahead() === '/') {
          advance();
          done = true;
        }
      }
    }

    function parseValue() {
      skipClutter();

      var look = lookahead();
      if (/[\d+-.]/.test(look)) {
        return parseNumber();
      } else if (isLetter(look)) {
        return parseIdentifier();
      } else if (look === '\'' || look === '"') {
        return parseString();
      } else if (look === '[') {
        return parseArray();
      } else if (look === '{') {
        return parseObject();
      } else {
        throwUnexpected();
      }
    }

    function parseNumber() {

    }

    function parseIdentifier() {
      var identifier = '';
      while (isLetter(lookahead())) {
        identifier += advance();
      }

      var matching = {
        undefined: undefined,
        null: null,
        true: true,
        false: false
      };

      if (matching.hasOwnProperty(identifier)) {
        return matching[identifier];
      } else {
        throwUnexpected();
      }
    }

    function parseString() {

    }

    function parseArray() {

    }

    function parseObject() {

    }
};

})();
