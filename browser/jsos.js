// JavaScript Transfer Protocol JavaScript Object Serialization
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

  var jsos = {};
  var vm;

  if (typeof(module) !== 'undefined' && module.exports) {
    module.exports = jsos;
  } else {
    if (!window.api) window.api = {};
    if (!window.api.jstp) window.api.jstp = {};
    jsos = window.api.jstp;
  }

  // Serialize a JavaScript value using the JSTP Object Serialization format
  // and return a string representing it.
  //   object - an object to serialize
  //
  jsos.dump = function dump(object) {
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

    var serializer = jsos.dump.types[type];
    if (serializer) {
      return serializer(object);
    }

    return '';
  };

  jsos.dump.types = {
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
      return 'new Date(\'' + date.toISOString() + '\')';
    },

    array: function(array) {
      return '[' + array.map(jsos.dump).join(',') + ']';
    },

    object: function(object) {
      var result = '{';
      var firstKey = true;

      for (var key in object) {
        if (!object.hasOwnProperty(key)) {
          continue;
        }

        var value = jsos.dump(object[key]);
        if (value === '' || value === 'undefined') {
          continue;
        }

        if (!/[a-zA-Z_]\w*/.test(key)) {
          key = jsos.dump.types.string(key);
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

    function: function(fn) {
      return fn.toString();
    }
  };

  // Deserialize a string in the JSTP Object Serialization format into
  // a JavaScript value and return it.
  //   string - a string to parse
  //
  jsos.interprete = function interprete(string) {
    var sandbox = createSandbox();
    var exported = sandbox.eval('"use strict";(' + string + ')');

    sandbox.addProperties(exported);

    return exported;
  };

  // Sandbox factory function
  //
  // Returns an instance of a class implementing the following interface:
  //   {
  //     addProperties(object) { ... }
  //     eval(code) { ... }
  //     destroy() { ... }
  //   }
  //
  function createSandbox() {
    if (!createSandbox.CachedClass) {
      if (isBrowser()) {
        createSandbox.CachedClass = BrowserSandbox;
      } else {
        vm = require('vm');
        createSandbox.CachedClass = NodeSandbox;
      }
    }

    return new createSandbox.CachedClass();
  }

  // Check if the code is running under browser environment
  //
  function isBrowser() {
    return typeof(window) !== 'undefined';
  }

  // Sandbox class used for parsing in browser
  //   context - optional hash of properties to add to sandbox context
  //
  function BrowserSandbox() {
    this.iframe = document.createElement('iframe');
    this.iframe.style.display = 'none';
    this.iframe.sandbox = 'allow-same-origin allow-scripts';

    document.body.appendChild(this.iframe);
  }

  // Add properties of an object to the sandbox context
  //   obj - a hash of properties
  //
  BrowserSandbox.prototype.addProperties = function(object) {
    for (var key in object) {
      if (!object.hasOwnProperty(key)) {
        continue;
      }

      this.iframe.contentWindow[key] = object[key];
    }
  };

  // Remove the sandbox from DOM
  //
  BrowserSandbox.prototype.destroy = function() {
    document.body.removeChild(this.iframe);
  };

  // Evaluate JavaScript code in the sandbox
  //
  BrowserSandbox.prototype.eval = function(code) {
    return this.iframe.contentWindow.eval(code);
  };

  // Sandbox class used for parsing in Node.js
  //   context - optional hash of properties to add to sandbox context
  //
  function NodeSandbox() {
    this.context = vm.createContext({});
  }

  // Add properties of an object to the sandbox context
  //   obj - a hash of properties
  //
  NodeSandbox.prototype.addProperties = function(object) {
    for (var key in object) {
      if (!object.hasOwnProperty(key)) {
        continue;
      }

      this.context[key] = object[key];
    }
  };

  // Destory the sandbox
  //
  NodeSandbox.prototype.destroy = function() {
    delete this.context;
  };

  // Evaluate JavaScript code in the sandbox
  //
  NodeSandbox.prototype.eval = function(code) {
    return vm.runInNewContext(code, this.context, {
      timeout: 30
    });
  };

})();
