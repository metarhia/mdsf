/* global describe it */
'use strict';

var expect = require('expect.js');
var jstp = require('..');

function runTestCase(testFunction, testCase) {
  testCase.forEach(function(test) {
    var title = test[0];

    it(title, function() {
      if (Array.isArray(test[1])) {
        test[1].forEach(function(subTest) {
          runTest(subTest[0], subTest[1]);
        });
      } else {
        runTest(test[1], test[2]);
      }
    });
  });

  function runTest(source, target) {
    var serialized = jstp[testFunction](source);
    expect(serialized).to.eql(target);
  }
}

function swapTestCase(serializationTestCase) {
  var deserializationTestCase = [];

  serializationTestCase.forEach(function(serializationTest) {
    var title = serializationTest[0].replace('serialize', 'deserialize');
    var deserializationTest = [title];

    if (Array.isArray(serializationTest[1])) {
      var tests = [];
      deserializationTest.push(tests);
      serializationTest[1].forEach(function(test) {
        tests.push([test[1], test[0]]);
      });
    } else {
      deserializationTest.push(serializationTest[2]);
      deserializationTest.push(serializationTest[1]);
    }

    deserializationTestCase.push(deserializationTest);
  });

  return deserializationTestCase;
}

function skipFunctionTests(testCase) {
  return testCase.filter(function(test) {
    var title = test[0];
    return title.indexOf('function') === -1;
  });
}

var marcusObject = {
  name: 'Marcus Aurelius',
  passport: 'AE127095',
  birth: {
    date: new Date('1990-02-15'),
    place: 'Rome'
  },
  address: {
    country: 'Ukraine',
    city: 'Kiev',
    zip: '03056',
    street: 'Pobedy',
    building: '37',
    floor: '1',
    room: '158'
  }
};

var marcusString = '{name:\'Marcus Aurelius\',passport:\'AE127095\',' +
  'birth:{date:new Date(\'1990-02-15T00:00:00.000Z\'),place:\'Rome\'},' +
  'address:{country:\'Ukraine\',city:\'Kiev\',zip:\'03056\',' +
  'street:\'Pobedy\',building:\'37\',floor:\'1\',room:\'158\'}}';

var recordCommonTestCase = [
  ['must correctly serialize an empty object', {}, '{}'],
  ['must serialize numbers', [
    [0, '0'], [42, '42'], [-3, '-3'], [1e100, '1e+100'], [1e-3, '0.001']
  ]],
  ['must serialize strings', [
    ['str', '\'str\''],
    ['first\nsecond', '\'first\\nsecond\''],
    ['it\'s', '\'it\\\'s\''],
    [Buffer.from([48, 49, 0, 1]).toString(), '\'01\u0000\u0001\'']
  ]],
  ['must serialize booleans', [
    [true, 'true'],
    [false, 'false']
  ]],
  ['must serialize arrays', [
    [[], '[]'],
    [[1, 2, 3], '[1,2,3]'],
    // eslint-disable-next-line no-sparse-arrays
    [[1, , 3], '[1,,3]'],
    [['outer', ['inner']], '[\'outer\',[\'inner\']]']
  ]],
  ['must serialize undefined value', undefined, 'undefined'],
  ['must serialize null value', null, 'null'],
  ['must not omit null fields of an object',
    { field1: 'value', field2: null },
    '{field1:\'value\',field2:null}' ],
  ['must serialize dates',
    new Date(1473249597286), 'new Date(\'2016-09-07T11:59:57.286Z\')'],
  ['must correctly serialize a complex object',
    marcusObject, marcusString]
];

var recordSerializationTestCase = recordCommonTestCase.concat([
  ['must omit undefined fields of an object',
    { field1: 'value', field2: undefined },
    '{field1:\'value\'}' ],
  ['must omit functions',
    { key: 42, fn: function() {} }, '{key:42}']
]);

var recordDeserializationTestCase =
  swapTestCase(recordCommonTestCase).concat([
    ['must skip whitespace',
      '{ key:\n\t42 }', { key: 42 }],
  ]);

var baseObjectSerializationTestCase =
  skipFunctionTests(recordSerializationTestCase);

var baseObjectDeserializationTestCase =
  skipFunctionTests(recordDeserializationTestCase);

function testSyntaxError(parseFunction) {
  it('must throw error on illegal input', function() {
    [ 'asdf',
      'process',
      'module',
      '#+'
    ].map(function(input) {
      return jstp[parseFunction].bind(null, input);
    }).forEach(function(fn) {
      expect(fn).to.throwError();
    });
  });
}

describe('JSTP Serializer and Deserializer', function() {
  describe('JSTP Record Serialization', function() {
    describe('jstp.stringify', function() {
      runTestCase('stringify', recordSerializationTestCase);
    });

    describe('jstp.parse', function() {
      runTestCase('parse', recordDeserializationTestCase);

      it('must not allow functions', function() {
        var test = jstp.parse.bind(null, '{key:42,fn:function(){}}');
        expectTypeError(test);

        [ '{key:42,fn:function(){}}',
          '{get value() { return 42; }, set value(val) {}}'
        ].map(function(input) {
          return jstp.parse.bind(null, input);
        }).forEach(expectTypeError);

        function expectTypeError(fn) {
          expect(fn).to.throwError(function(error) {
            expect(error.name).to.be('TypeError');
          });
        }
      });

      testSyntaxError('parse');

      it('must skip undefined values of an object', function() {
        expect(jstp.parse('{value:undefined}')).to.eql({});
      });
    });
  });

  describe('JSTP Object Serialization', function() {
    describe('jstp.dump', function() {
      runTestCase('dump', baseObjectSerializationTestCase);
    });
    describe('jstp.interprete', function() {
      runTestCase('interprete', baseObjectDeserializationTestCase);
      testSyntaxError('interprete');
    });
  });
});
