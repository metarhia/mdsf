'use strict';

const stringify = require('./stringify');

// Internal parser class
//   string - a string to parse
//
class Parser {
  constructor(string) {
    this.string = string;
    this.lookaheadIndex = 0;
  }

  // Start parsing
  //
  parse() {
    const value = this.parseValue();
    this.ensureEndOfData();
    return value;
  }

  // Check that there's no data left except for comments and whitespace and throw
  // an error otherwise
  //
  ensureEndOfData() {
    this.skipClutter();

    if (this.lookaheadIndex < this.string.length) {
      this.throwUnexpected();
    }
  }

  // Return the current lookahead character
  //
  lookahead() {
    return this.string[this.lookaheadIndex];
  }

  // Advance to the next character and return the character
  // that used to be lookahead
  //
  advance() {
    const character = this.string[this.lookaheadIndex++];

    if (this.lookaheadIndex > this.string.length) {
      throw new SyntaxError('Unexpected end of data');
    }
    return character;
  }

  // Step back to the previous character
  //
  retreat() {
    this.lookaheadIndex--;
    if (this.lookaheadIndex < 0) {
      throw new SyntaxError('Parse error');
    }
  }

  // Advances one character ensuring the equality of the passed
  // one to the given one
  //   token - a character to match
  //
  match(token) {
    if (this.advance() !== token) {
      this.throwExpected(token);
    }
  }

  // Throw a generic parsing error
  //   message - error message
  //
  throwError(message) {
    throw new SyntaxError(message + ' at position ' + this.lookaheadIndex);
  }

  // Throw a 'smth expected' error
  //   token - what has been expected
  //
  throwExpected(token) {
    this.throwError(token + ' expected');
  }

  // Throw a 'smth unexpected' error
  //   token - what has been unexpected
  //
  throwUnexpected(token) {
    token = token || this.lookahead();
    if (token === undefined) {
      token = 'end of data';
    }

    this.throwError('Unexpected ' + token);
  }

  // Check if a given character is a whitespace character
  //   character - a character to check
  //
  isWhitespace(character) {
    return (
      ' \f\t\v\u{202F}\u{205F}\u{3000}\u{00A0}\u{1680}\u{FEFF}'.includes(
        character
      ) || /[\u{2000}-\u{200A}]/u.test(character)
    );
  }

  // Check if a given character is a newline character
  //   character - a character to check
  //
  isNewline(character) {
    return (
      character === '\n' ||
      character === '\r' ||
      character === '\u{2028}' ||
      character === '\u{2029}'
    );
  }

  // Check if a given character is a lowercase letter character
  //   character - a character to check
  //
  isLetter(character) {
    return character >= 'a' && character <= 'z';
  }

  // Check if a given character can be the first character in a number
  //   character - a character to check
  //
  isInitialDigit(character) {
    return (
      this.isDecimalDigit(character) ||
      character === '+' ||
      character === '-' ||
      character === '.'
    );
  }

  // Check if a given character is one of that are allowed in numbers
  //   character - a character to check
  //
  isDigit(character) {
    return (
      this.isInitialDigit(character) || character === 'e' || character === 'E'
    );
  }

  // Check if a given character is a binary digit
  //   character - a character to check
  //
  isBinaryDigit(character) {
    return character === '0' || character === '1';
  }

  // Check if a given character is an octal digit
  //   character - a character to check
  //
  isOctalDigit(character) {
    return character >= '0' && character <= '7';
  }

  // Check if a given character is a decimal digit
  //   character - a character to check
  //
  isDecimalDigit(character) {
    return character >= '0' && character <= '9';
  }

  // Check if a given character is a hexadecimal digit
  //   character - a character to check
  //
  isHexadecimalDigit(character) {
    return (
      (character >= '0' && character <= '9') ||
      (character >= 'a' && character <= 'f') ||
      (character >= 'A' && character <= 'F')
    );
  }

  // Check if a given character is a quote character
  //   character - a character to check
  //
  isQuoteCharacter(character) {
    return character === "'" || character === '"';
  }

  // Check if a given character can be the first character of an identifier
  //   character - a character to check
  //
  isInitialIdentifierCharacter(character) {
    return (
      (character >= 'a' && character <= 'z') ||
      (character >= 'A' && character <= 'Z') ||
      (character === '_' || character === '$')
    );
  }

  // Check if a given character can be a part of an identifier
  //   character - a character to check
  //
  isIdentifierCharacter(character) {
    return (
      this.isInitialIdentifierCharacter(character) ||
      this.isDecimalDigit(character)
    );
  }

  // Skip whitespace and comments
  //
  skipClutter() {
    while (
      this.isWhitespace(this.lookahead()) ||
      this.isNewline(this.lookahead())
    ) {
      this.skipWhitespaceNewline();
      if (this.lookahead() === '/') {
        this.skipComments();
      } else return;
    }
    this.skipComments();
    this.skipWhitespaceNewline();
  }

  // Skip whitespace and newline
  //
  skipWhitespaceNewline() {
    while (
      this.isWhitespace(this.lookahead()) ||
      this.isNewline(this.lookahead())
    ) {
      this.advance();
    }
  }

  // Skip comments
  //
  skipComments() {
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
  }

  // Skip the body of a single-line comment (i.e. the part after //)
  //
  skipLineCommentBody() {
    let ahead = this.lookahead();
    while (!this.isNewline(ahead) && ahead !== undefined) {
      this.advance();
      ahead = this.lookahead();
    }
  }

  // Skip the body of a multiline comment (i.e. the part after /*)
  //
  skipMultilineCommentBody() {
    let done = false;

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
  }

  // Parse a JavaScript value
  //
  parseValue() {
    this.skipClutter();

    const look = this.lookahead();
    if (this.isLetter(look)) {
      return this.parseIdentifier();
    } else if (this.isQuoteCharacter(look)) {
      return this.parseString();
    } else if (look === '[') {
      return this.parseArray();
    } else if (look === '{') {
      return this.parseObject();
    } else if (this.isInitialDigit(look)) {
      return this.parseNumber();
    } else if (this.isValue('NaN')) {
      return NaN;
    } else if (this.isValue('Infinity')) {
      return Infinity;
    } else {
      return this.throwUnexpected();
    }
  }

  // Parse a number
  //
  parseNumber() {
    this.skipClutter();

    let negateResult = false;
    let look = this.lookahead();

    if (look === '+' || look === '-') {
      negateResult = look === '-';
      this.advance();
    }

    if (this.isValue('Infinity')) {
      return negateResult ? -Infinity : Infinity;
    }

    if (this.isValue('NaN')) {
      return NaN;
    }

    let base = 10;

    if (this.lookahead() === '0') {
      this.advance();
      look = this.lookahead();

      if (this.isDecimalDigit(look)) {
        this.throwError('Use new octal literals syntax');
      } else if (look === 'b' || look === 'B') {
        base = 2;
        this.advance();
      } else if (look === 'o' || look === 'O') {
        base = 8;
        this.advance();
      } else if (look === 'x' || look === 'X') {
        base = 16;
        this.advance();
      } else {
        this.retreat();
      }
    }

    const value =
      base === 10 ? this.parseDecimal() : this.parseMachineInteger(base);

    if (isNaN(value)) {
      this.throwError('Invalid number format');
    }

    return negateResult ? -value : value;
  }

  isValue(value) {
    return value
      .split('')
      .every(letter => (this.lookahead() === letter ? this.advance() : null));
  }

  // Parse a decimal number, either integer or float.
  // May return NaN when the number is incorrect.
  //
  parseDecimal() {
    let number = '';
    let isFloatExponent = false;

    const encountered = {
      // parseFloat ignores unparsed part of
      dot: false, // the string so we must handle it manually
      sign: false,
      exponent: false,
    };

    while (this.isDigit(this.lookahead())) {
      this.checkNumberPartEncountered(encountered, 'dot', '.');
      this.checkNumberPartEncountered(encountered, 'sign', '+', '-');
      this.checkNumberPartEncountered(encountered, 'exponent', 'e', 'E');

      if (!encountered.dot && encountered.exponent) {
        isFloatExponent = true;
      } else if (encountered.dot && isFloatExponent) {
        this.throwError('Invalid format');
      }
      number += this.advance();
    }

    return parseFloat(number);
  }

  // Check whether a part of a decimal number that can be used only once
  // has been encountered before and throw SyntaxError if it indeed has.
  //   encounterContext - an object with boolean flags
  //   name - name of the key of the object which value represents the
  //     entity being checked
  //   character - a character to match against the lookahead character
  //   altCharacter - optional alternative character related to the
  //     same enitity
  //
  checkNumberPartEncountered(encounterContext, name, character, altCharacter) {
    const look = this.lookahead();
    if (look === character || (altCharacter && look === altCharacter)) {
      if (encounterContext[name]) {
        this.throwUnexpected();
      }
      encounterContext[name] = true;
    }
  }

  // Parse an integer number in binary, octal or hexadecimal representation.
  // The prefix is not included and must be parsed before invocation.
  // The function may return NaN when the number is incorrect.
  //   base - 2, 8 or 16
  //
  parseMachineInteger(base) {
    const self = this;
    const checkers = {
      2: self.isBinaryDigit,
      8: self.isOctalDigit,
      16: self.isHexadecimalDigit,
    };
    const checkDigit = checkers[base];

    let number = '';
    while (checkDigit(this.lookahead())) {
      number += this.advance();
    }

    return parseInt(number, base);
  }

  // Parse null, undefined, true or false
  //
  parseIdentifier() {
    this.skipClutter();

    let identifier = '';
    while (this.isLetter(this.lookahead())) {
      identifier += this.advance();
    }

    const matching = {
      undefined,
      null: null,
      true: true,
      false: false,
    };

    if (matching.hasOwnProperty(identifier)) {
      return matching[identifier];
    } else {
      return this.throwUnexpected();
    }
  }

  // Parse a single-quoted or double-quoted string
  //
  parseString() {
    this.skipClutter();

    const quoteStyle = this.lookahead();
    if (!this.isQuoteCharacter(quoteStyle)) {
      this.throwExpected('String');
    }

    let string = '';
    let escapeMode = false;

    this.advance();

    while (escapeMode || this.lookahead() !== quoteStyle) {
      const look = this.advance();

      if (escapeMode) {
        const controlCharacters = {
          b: '\b',
          f: '\f',
          n: '\n',
          r: '\r',
          t: '\t',
          v: '\v',
        };

        const controlCharacter = controlCharacters[look];

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
        } else if (controlCharacter === undefined) {
          if (string.slice(-1) !== ' ') {
            if (this.advance() === ' ') {
              string += ' ';
              this.retreat();
            } else {
              this.retreat();
              string += look;
            }
          }
          this.skipWhitespaceNewline();
        } else {
          string += look;
        }

        escapeMode = false;
      } else if (look === '\\') {
        escapeMode = true;
      } else if (this.isNewline(look)) {
        this.throwError('Unescaped multiline string');
      } else {
        string += look;
      }
    }

    this.match(quoteStyle);

    return string;
  }

  // Parse the part of an octal escape sequence after backslash and
  // return the corresponding character
  //
  parseOctalEncodedStringCharacter() {
    let digits = '';

    for (let count = 0; count < 3; count++) {
      const look = this.advance();
      if (!this.isOctalDigit(look)) {
        this.retreat();
        break;
      }

      digits += look;
    }

    if (digits.length === 0) {
      this.throwExpected('Octal number');
    }

    const code = parseInt(digits, 8);
    return String.fromCharCode(code);
  }

  // Parse the part of a hexadecimal escape sequence after backslash and `x` or
  // `u` character and return the character corresponding to that code
  //   nibblesCount - count of half-bytes in the escape sequence
  //
  parseHexEncodedStringCharacter(nibblesCount) {
    let digits = '';

    for (let i = 0; i < nibblesCount; i++) {
      const look = this.advance();
      if (!this.isHexadecimalDigit(look)) {
        this.throwExpected('Hexadecimal digit');
      }

      digits += look;
    }

    const code = parseInt(digits, 16);
    return String.fromCharCode(code);
  }

  // Parse the part of a one-byte hexadecimal escape sequence after backslash
  // and return the corresponding character
  //
  parseOneByteHexEncodedCharacter() {
    this.match('x');
    return this.parseHexEncodedStringCharacter(2);
  }

  // Parse the part of a two-byte hexadecimal escape sequence after backslash
  // and return the corresponding character
  //
  parseTwoByteHexEncodedCharacter() {
    this.match('u');
    return this.parseHexEncodedStringCharacter(4);
  }

  // Parse a Unicode escape sequence after backslash and return the
  // corresponding character
  //
  parseUnicodeCharacter() {
    this.match('u');

    if (this.lookahead() === '{') {
      return this.parseEs6UnicodeLiteral();
    } else {
      this.retreat();
      return this.parseTwoByteHexEncodedCharacter();
    }
  }

  // Parse an ES2015 multibyte Unicode escape sequence after backslash and `u`
  // character
  //
  parseEs6UnicodeLiteral() {
    this.match('{');

    let hexDigits = '';

    while (this.lookahead() !== '}') {
      const digit = this.advance();
      if (!this.isHexadecimalDigit(digit)) {
        this.throwExpected('Hexadecimal digit');
      }

      hexDigits += digit;
    }

    if (hexDigits.length === 0 || hexDigits.length > 8) {
      this.throwError('Invalid code point');
    }

    this.match('}');

    const code = parseInt(hexDigits, 16);
    return String.fromCodePoint(code);
  }

  // Parse an array
  //
  parseArray() {
    this.skipClutter();
    this.match('[');

    const array = [];

    while (this.lookahead() !== ']') {
      this.skipClutter();

      if (this.lookahead() === ',') {
        array.push(undefined);
      } else if (this.lookahead() === ']') {
        break;
      } else {
        const value = this.parseValue();
        array.push(value);
      }

      this.skipClutter();
      if (this.lookahead() !== ']') {
        this.match(',');
      }
    }

    this.match(']');

    return array;
  }

  // Parse an object
  //
  parseObject() {
    this.skipClutter();

    const object = {};

    this.match('{');
    this.skipClutter();

    while (this.lookahead() !== '}') {
      const key = this.parseObjectKey();
      this.match(':');
      const value = this.parseValue();
      if (value !== undefined) {
        object[key] = value;
      }
      this.skipClutter();
      if (this.lookahead() !== '}') {
        this.match(',');
        this.skipClutter();
      }
      this.skipClutter();
    }

    this.match('}');

    return object;
  }

  // Parse a key of an object
  //
  parseObjectKey() {
    this.skipClutter();

    if (this.isQuoteCharacter(this.lookahead())) {
      return this.parseString();
    }

    if (this.isInitialDigit(this.lookahead())) {
      return this.parseNumber();
    }

    if (!this.isInitialIdentifierCharacter(this.lookahead())) {
      this.throwExpected('String or identifier');
    }

    let key = '';
    while (this.isIdentifierCharacter(this.lookahead())) {
      key += this.advance();
      while (this.lookahead() === '\\') {
        this.advance();
        key += this.parseUnicodeCharacter();
      }
    }

    return key;
  }
}

// Deserialize a string into a JavaScript value and return it.
//   data - a string or Buffer to parse
//
const parse = data => {
  if (Buffer.isBuffer(data)) {
    data = data.toString();
  }

  const parser = new Parser(data);
  return parser.parse();
};

// Parse a buffer of JSTP network messages.
//   data - buffer contents
//   messages - target array
//   Returns the part of the message that has not been received yet
//
const parseJSTPMessages = (data, messages) => {
  const chunks = data.split('\u0000');
  const readyMessagesCount = chunks.length - 1;

  for (let i = 0; i < readyMessagesCount; i++) {
    const parser = new Parser(chunks[i]);
    const message = parser.parseObject();
    parser.ensureEndOfData();
    messages.push(message);
  }

  return chunks[readyMessagesCount];
};

module.exports = {
  stringify,
  parse,
  parseJSTPMessages,
};
