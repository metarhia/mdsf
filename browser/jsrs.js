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
    var parser = new JsrsParser(string);
    return parser.parse();
  };

  function JsrsParser(string) {
    this.string = string;
    this.lookaheadIndex = 0;
  }

  JsrsParser.prototype.parse = function() {
    var value = this.parseValue();

    this.skipClutter();
    if (this.lookaheadIndex < this.string.length) {
      this.throwUnexpected();
    }

    return value;
  };

  JsrsParser.prototype.lookahead = function() {
    return this.string[this.lookaheadIndex];
  };

  JsrsParser.prototype.advance = function() {
    var character = this.string[this.lookaheadIndex++];
    if (this.lookaheadIndex > this.string.length) {
      throw new SyntaxError('Unexpected end of data');
    }
    return character;
  };

  JsrsParser.prototype.retreat = function() {
    this.lookaheadIndex--;
    if (this.lookaheadIndex < 0) {
      throw new SyntaxError('Parse error');
    }
  };

  JsrsParser.prototype.throwError = function(message) {
    throw new SyntaxError(message + ' at position ' + this.lookaheadIndex);
  };

  JsrsParser.prototype.throwExpected = function(token) {
    this.throwError(token + ' expected');
  };

  JsrsParser.prototype.throwUnexpected = function(token) {
    token = token || this.lookahead();
    if (token === undefined) {
      token = 'end of data';
    }

    this.throwError('Unexpected ' + token);
  };

  JsrsParser.prototype.isWhitespace = function(character) {
    return ' \f\n\r\t\v'.indexOf(character) !== -1;
  };

  JsrsParser.prototype.isNewline = function(character) {
    return character === '\n' || character === '\r';
  };

  JsrsParser.prototype.isLetter = function(character) {
    return character >= 'a' && character <= 'z';
  };

  JsrsParser.prototype.skipClutter = function() {
    this.skipWhitespace();
    this.skipComments();
    this.skipWhitespace();
  };

  JsrsParser.prototype.skipWhitespace = function() {
    while (this.isWhitespace(this.lookahead())) {
      this.advance();
    }
  };

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

  JsrsParser.prototype.skipLineCommentBody = function() {
    while (!this.isNewline(this.lookahead()) &&
            this.lookahead() !== undefined) {
      this.advance();
    }
  };

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

  JsrsParser.prototype.parseNumber = function() {

  };

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

  JsrsParser.prototype.parseString = function() {

  };

  JsrsParser.prototype.parseArray = function() {

  };

  JsrsParser.prototype.parseObject = function() {

  };

})();
