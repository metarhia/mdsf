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
    } else if (look === '\'' || look === '"') {
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

  };

  // Parse null, undefined, true or false
  //
  JsrsParser.prototype.parseIdentifier = function() {
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

  };

  // Parse an array
  //
  JsrsParser.prototype.parseArray = function() {

  };

  // Parse an object
  //
  JsrsParser.prototype.parseObject = function() {

  };

})();
