var fs = require('fs'),
    vm = require('vm');

// JSRS utilities

var JSRS = {};

JSRS.parse = function(jsrs) {
  var context = {};
  var sandbox = vm.createContext(context);
  jsrs = '(' + jsrs + ')';
  var js = vm.createScript(jsrs);
  var exported = js.runInNewContext(sandbox);
  for (var key in exported) {
    sandbox[key] = exported[key];
  }
  return exported;
};

// JSRS usage example

fs.readFile('./person.jsrs', function(err, jsrs) {
  console.log('JavaScript Record Serialization');
  var person = JSRS.parse(jsrs);
  console.dir(person);
  console.log('Age = ' + person.age() + '\n');
});
