/* eslint-env shared-node-browser, commonjs */
'use strict';

var serializerFactory = require('./serializer-factory');

var jsrs = {};
module.exports = jsrs;

// Serialize a JavaScript value using the JSTP Record Serialization format
// and return a string representing it.
//
jsrs.stringify = serializerFactory.createSerializer();

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

// Check if a given character can be the first character in a number
//   character - a character to check
//
JsrsParser.prototype.isInitialDigit = function(character) {
  return this.isDecimalDigit(character) ||
    character === '+' || character === '-' ||
    character === '.';
};

// Check if a given character is one of that are allowed in numbers
//   character - a character to check
//
JsrsParser.prototype.isDigit = function(character) {
  return this.isInitialDigit(character) ||
    character === 'e' || character === 'E';
};

// Check if a given character is a binary digit
//   character - a character to check
//
JsrsParser.prototype.isBinaryDigit = function(character) {
  return character === '0' || character === '1';
};

// Check if a given character is an octal digit
//   character - a character to check
//
JsrsParser.prototype.isOctalDigit = function(character) {
  return character >= '0' && character <= '7';
};

// Check if a given character is a decimal digit
//   character - a character to check
//
JsrsParser.prototype.isDecimalDigit = function(character) {
  return character >= '0' && character <= '9';
};

// Check if a given character is a hexadecimal digit
//   character - a character to check
//
JsrsParser.prototype.isHexadecimalDigit = function(character) {
  return (character >= '0' && character <= '9') ||
    (character >= 'a' && character <= 'f') ||
    (character >= 'A' && character <= 'F');
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
  if (this.isInitialDigit(look)) {
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
//
JsrsParser.prototype.parseNumber = function() {
  this.skipClutter();

  var negateResult = false;
  var look = this.lookahead();

  if (look === '+' || look === '-') {
    negateResult = look === '-';
    this.advance();
  }

  var base = 10;

  if (this.lookahead() === '0') {
    this.advance();
    look = this.lookahead();

    if (this.isDecimalDigit(look)) {
      this.throwError('Use new octal literals syntax');
    } else if (look === 'b') {
      base = 2;
      this.advance();
    } else if (look === 'o') {
      base = 8;
      this.advance();
    } else if (look === 'x') {
      base = 16;
      this.advance();
    } else {
      this.retreat();
    }
  }

  var value = base === 10 ?
    this.parseDecimal() :
    this.parseMachineInteger(base);

  if (isNaN(value)) {
    this.throwError('Invalid number format');
  }

  return negateResult ?
    -value :
      value;
};

// Parse a decimal number, either integer or float.
// May return NaN when the number is incorrect.
//
JsrsParser.prototype.parseDecimal = function() {
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

  return parseFloat(number);
};

// Check whether a part of a decimal number that can be used only once
// has been encountered before and throw SyntaxError if it indeed has.
//   encounterContext - an object with boolean flags
//   name - name of the key of the object which value represents the
//          entitity being checked
//   character - a character to match against the lookahead character
//   altCharacter - optional alternative character related to the
//                  same enitity
//
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

// Parse an integer number in binary, octal or hexadecimal representation.
// The prefix is not included and must be parsed before invocation.
// The function may return NaN when the number is incorrect.
//   base - 2, 8 or 16
//
JsrsParser.prototype.parseMachineInteger = function(base) {
  var self = this;
  var checkers = {
    2:  self.isBinaryDigit,
    8:  self.isOctalDigit,
    16: self.isHexadecimalDigit
  };
  var checkDigit = checkers[base];

  var number = '';
  while (checkDigit(this.lookahead())) {
    number += this.advance();
  }

  return parseInt(number, base);
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
        string += this.parseUnicodeCharacter();
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
  return String.fromCharCode(code);
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
  return String.fromCharCode(code);
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

// Parse a Unicode escape sequence after backslash and return the
// corresponding character
//
JsrsParser.prototype.parseUnicodeCharacter = function() {
  this.match('u');

  if (this.lookahead() === '{') {
    return this.parseEs6UnicodeLiteral();
  } else {
    this.retreat();
    return this.parseTwoByteHexEncodedCharacter();
  }
};

// Parse an ES2015 multibyte Unicode escape sequence after backslash and `u`
// character
//
JsrsParser.prototype.parseEs6UnicodeLiteral = function() {
  this.match('{');

  var hexDigits = '';

  while (this.lookahead() !== '}') {
    var digit = this.advance();
    if (!this.isHexadecimalDigit(digit)) {
      this.throwExpected('Hexadecimal digit');
    }

    hexDigits += digit;
  }

  if (hexDigits.length === 0 || hexDigits.length > 8) {
    this.throwError('Invalid code point');
  }

  this.match('}');

  var code = parseInt(hexDigits, 16);
  return String.fromCodePoint(code);
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
