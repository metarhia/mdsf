// JavaScript Transfer Protocol JavaScript Record Serialization
//
// Copyright (c) 2016 Alexey Orlenko and other JSTP contributors
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

'use strict';

(function() {

  var jsrs = {};

  if (typeof(module) !== 'undefined' && module.exports) {
    module.exports = jsrs;
  } else {
    if (!window.api) window.api = {};
    if (!window.api.jstp) window.api.jstp = {};
    jsrs = window.api.jstp;
  }

  // Serialize a JavaScript value using the JSTP Record Serialization format
  // and return a string representing it.
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

  // Deserialize a string in the JSTP Record Serialization format into
  // a JavaScript value and return it.
  //   string - a string to parse
  //
  jsrs.parse = function parse(string) {
    var parser = new JsrsParser(string);
    return parser.parse();
  };

  // Internal JSRS parser class
  //   string - a string to parse
  //
  function JsrsParser(string) {
    this.string = string;
    this.lookaheadIndex = 0;
  }

  // Start parsing
  //
  JsrsParser.prototype.parse = function() {
    var value = this.parseValue();

    this.skipClutter();
    if (this.lookaheadIndex < this.string.length) {
      this.throwUnexpected();
    }

    return value;
  };

  // Return the current lookahead character
  //
  JsrsParser.prototype.lookahead = function() {
    return this.string[this.lookaheadIndex];
  };

  // Advance to the next character and return the character
  // that used to be lookahead
  //
  JsrsParser.prototype.advance = function() {
    var character = this.string[this.lookaheadIndex++];
    if (this.lookaheadIndex > this.string.length) {
      throw new SyntaxError('Unexpected end of data');
    }
    return character;
  };

  // Step back to the previous character
  //
  JsrsParser.prototype.retreat = function() {
    this.lookaheadIndex--;
    if (this.lookaheadIndex < 0) {
      throw new SyntaxError('Parse error');
    }
  };

  // Advances one character ensuring the equality of the passed
  // one to the given one
  //   token - a character to match
  //
  JsrsParser.prototype.match = function(token) {
    if (this.advance() !== token) {
      this.throwExpected(token);
    }
  };

  // Throw a generic parsing error
  //   message - error message
  //
  JsrsParser.prototype.throwError = function(message) {
    throw new SyntaxError(message + ' at position ' + this.lookaheadIndex);
  };

  // Throw a 'smth expected' error
  //   token - what has been expected
  //
  JsrsParser.prototype.throwExpected = function(token) {
    this.throwError(token + ' expected');
  };

  // Throw a 'smth unexpected' error
  //   token - what has been unexpected
  //
  JsrsParser.prototype.throwUnexpected = function(token) {
    token = token || this.lookahead();
    if (token === undefined) {
      token = 'end of data';
    }

    this.throwError('Unexpected ' + token);
  };

  // Check if a given character is a whitespace character
  //   character - a character to check
  //
  JsrsParser.prototype.isWhitespace = function(character) {
    return ' \f\n\r\t\v'.indexOf(character) !== -1;
  };

  // Check if a given character is a newline character
  //   character - a character to check
  //
  JsrsParser.prototype.isNewline = function(character) {
    return character === '\n' || character === '\r';
  };

  // Check if a given character is a lowercase letter character
  //   character - a character to check
  //
  JsrsParser.prototype.isLetter = function(character) {
    return character >= 'a' && character <= 'z';
  };

  // Check if a given character is one of that are allowed
  // in numbers
  //   character - a character to check
  //
  JsrsParser.prototype.isDigit = function(character) {
    return (character >= '0' && character <= '9') ||
      (character === '+' || character === '-') ||
      (character === 'e' || character === 'E') ||
      character === '.';
  };

  // Check if a given character is an octal digit
  //   character - a character to check
  //
  JsrsParser.prototype.isOctalDigit = function(character) {
    return character >= '0' && character <= '7';
  };

  // Check if a given character is a hexadecimal digit
  //   character - a character to check
  //
  JsrsParser.prototype.isHexadecimalDigit = function(character) {
    return (character >= '0' && character <= '9') ||
      (character >= 'a' && character <= 'f') ||
      (character >= 'A' && character <= 'F');
  };

  // Check if a given character is a decimal digit
  //   character - a character to check
  //
  JsrsParser.prototype.isDecimalDigit = function(character) {
    return character >= '0' && character <= '9';
  };

  // Check if a given character is a quote character
  //   character - a character to check
  //
  JsrsParser.prototype.isQuoteCharacter = function(character) {
    return character === '\'' || character === '"';
  };

  // Check if a given character can be the first character of an identifier
  //   character - a character to check
  //
  JsrsParser.prototype.isInititalIdentifierCharacter = function(character) {
    return (character >= 'a' && character <= 'z') ||
      (character >= 'A' && character <= 'Z') ||
      (character === '_' || character === '$');
  };

  // Check if a given character can be a part of an identifier
  //   character - a character to check
  //
  JsrsParser.prototype.isIdentifierCharacter = function(character) {
    return this.isInititalIdentifierCharacter(character) ||
      this.isDecimalDigit(character);
  };

  // Skip whitespace and comments
  //
  JsrsParser.prototype.skipClutter = function() {
    this.skipWhitespace();
    this.skipComments();
    this.skipWhitespace();
  };

  // Skip whitespace
  //
  JsrsParser.prototype.skipWhitespace = function() {
    while (this.isWhitespace(this.lookahead())) {
      this.advance();
    }
  };

  // Skip comments
  //
  JsrsParser.prototype.skipComments = function() {
    if (this.lookahead() !== '/') {
      return;
    }

    this.advance();

    if (this.lookahead() === '/') {
      this.advance();
      this.skipLineCommentBody();
    } else if (this.lookahead() === '*') {
      this.advance();
      this.skipMultilineCommentBody();
    } else {
      this.retreat();
    }
  };

  // Skip the body of a single-line comment (i.e. the part after //)
  //
  JsrsParser.prototype.skipLineCommentBody = function() {
    while (!this.isNewline(this.lookahead()) &&
            this.lookahead() !== undefined) {
      this.advance();
    }
  };

  // Skip the body of a multiline comment (i.e. the part after /*)
  //
  JsrsParser.prototype.skipMultilineCommentBody = function() {
    var done = false;

    while (!done) {
      while (this.lookahead() !== '*') {
        this.advance();
      }
      this.advance();

      if (this.lookahead() === '/') {
        this.advance();
        done = true;
      }
    }
  };

  // Parse a JavaScript value
  //
  JsrsParser.prototype.parseValue = function() {
    this.skipClutter();

    var look = this.lookahead();
    if (/[\d+-.]/.test(look)) {
      return this.parseNumber();
    } else if (this.isLetter(look)) {
      return this.parseIdentifier();
    } else if (this.isQuoteCharacter(look)) {
      return this.parseString();
    } else if (look === '[') {
      return this.parseArray();
    } else if (look === '{') {
      return this.parseObject();
    } else {
      this.throwUnexpected();
    }
  };

  // Parse a number
  // TODO: binary, octal and hexadecimal numbers
  //
  JsrsParser.prototype.parseNumber = function() {
    this.skipClutter();

    var number = '';

    var encountered = {  // parseFloat ignores unparsed part of
      dot: false,        // the string so we must handle it manually
      sign: false,
      exponent: false
    };

    while (this.isDigit(this.lookahead())) {
      this.checkNumberPartEncountered(encountered, 'dot', '.');
      this.checkNumberPartEncountered(encountered, 'sign', '+', '-');
      this.checkNumberPartEncountered(encountered, 'exponent', 'e', 'E');

      number += this.advance();
    }

    var value = parseFloat(number);
    if (isNaN(value)) {
      this.throwError('Invalid number format');
    }

    return value;
  };

  JsrsParser.prototype.checkNumberPartEncountered =
    function(encounterContext, name, character, altCharacter) {
      var look = this.lookahead();
      if (look === character || (altCharacter && look === altCharacter)) {
        if (encounterContext[name]) {
          this.throwUnexpected();
        }
        encounterContext[name] = true;
      }
    };

  // Parse null, undefined, true or false
  //
  JsrsParser.prototype.parseIdentifier = function() {
    this.skipClutter();

    var identifier = '';
    while (this.isLetter(this.lookahead())) {
      identifier += this.advance();
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
      this.throwUnexpected();
    }
  };

  // Parse a single-quoted or double-quoted string
  //
  JsrsParser.prototype.parseString = function() {
    this.skipClutter();

    var quoteStyle = this.lookahead();
    if (!this.isQuoteCharacter(quoteStyle)) {
      this.throwExpected('String');
    }

    var string = '';
    var escapeMode = false;

    this.advance();

    while (escapeMode || this.lookahead() !== quoteStyle) {
      var look = this.advance();

      if (escapeMode) {
        var controlCharacters = {
          b: '\b', f: '\f', n: '\n',
          r: '\r', t: '\t', v: '\v'
        };

        var controlCharacter = controlCharacters[look];

        if (controlCharacter) {
          string += controlCharacter;
        } else if (this.isOctalDigit(look)) {
          this.retreat();
          string += this.parseOctalEncodedStringCharacter();
        } else if (look === 'x') {
          this.retreat();
          string += this.parseOneByteHexEncodedCharacter();
        } else if (look === 'u') {
          this.retreat();
          string += this.parseTwoByteHexEncodedCharacter();
        } else {
          string += look;
        }

        escapeMode = false;
      } else if (look === '\\') {
        escapeMode = true;
      } else {
        string += look;
      }
    }

    this.match(quoteStyle);

    return string;
  };

  // Parse the part of an octal escape sequence after backslash and
  // return the corresponding character
  //
  JsrsParser.prototype.parseOctalEncodedStringCharacter = function() {
    var digits = '';

    for (var count = 0; count < 3; count++) {
      var look = this.advance();
      if (!this.isOctalDigit(look)) {
        this.retreat();
        break;
      }

      digits += look;
    }

    if (digits.length === 0) {
      this.throwExpected('Octal number');
    }

    var code = parseInt(digits, 8);
    return String.fromCodePoint(code);
  };

  // Parse the part of a hexadecimal escape sequence after backslash and `x` or
  // `u` character and return the character corresponding to that code
  //   nibblesCount - count of half-bytes in the escape sequence
  //
  JsrsParser.prototype.parseHexEncodedStringCharacter = function(nibblesCount) {
    var digits = '';

    for (var i = 0; i < nibblesCount; i++) {
      var look = this.advance();
      if (!this.isHexadecimalDigit(look)) {
        this.throwExpected('Hexadecimal digit');
      }

      digits += look;
    }

    var code = parseInt(digits, 16);
    return String.fromCodePoint(code);
  };

  // Parse the part of a one-byte hexadecimal escape sequence after backslash
  // and return the corresponding character
  //
  JsrsParser.prototype.parseOneByteHexEncodedCharacter = function() {
    this.match('x');
    return this.parseHexEncodedStringCharacter(2);
  };

  // Parse the part of a two-byte hexadecimal escape sequence after backslash
  // and return the corresponding character
  //
  JsrsParser.prototype.parseTwoByteHexEncodedCharacter = function() {
    this.match('u');
    return this.parseHexEncodedStringCharacter(4);
  };

  // Parse an array
  //
  JsrsParser.prototype.parseArray = function() {
    this.skipClutter();
    this.match('[');

    var array = [];

    while (this.lookahead() !== ']') {
      this.skipClutter();

      if (this.lookahead() === ',') {
        array.push(undefined);
      } else if (this.lookahead() === ']') {
        break;
      } else {
        var value = this.parseValue();
        array.push(value);
      }

      this.skipClutter();
      if (this.lookahead() !== ']') {
        this.match(',');
      }
    }

    this.match(']');

    return array;
  };

  // Parse an object
  //
  JsrsParser.prototype.parseObject = function() {
    this.skipClutter();

    var object = {};

    this.match('{');

    while (this.lookahead() !== '}') {
      var key = this.parseObjectKey();
      this.match(':');
      var value = this.parseValue();

      if (value !== undefined) {
        object[key] = value;
      }

      this.skipClutter();
      if (this.lookahead() !== '}') {
        this.match(',');
        this.skipClutter();
      }
    }

    this.skipClutter();
    this.match('}');

    return object;
  };

  // Parse a key of an object
  //
  JsrsParser.prototype.parseObjectKey = function() {
    this.skipClutter();

    if (this.isQuoteCharacter(this.lookahead())) {
      return this.parseString();
    }

    if (!this.isInititalIdentifierCharacter(this.lookahead())) {
      this.throwExpected('String or identifier');
    }

    var key = '';
    while (this.isIdentifierCharacter(this.lookahead())) {
      key += this.advance();
    }

    return key;
  };

})();
