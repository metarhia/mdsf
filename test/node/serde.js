'use strict';

const test = require('tap').test;

const mdsf = require('../..');
const jsParser = require('../../lib/serde-fallback');

const testCases = require('../fixtures/serde-test-cases');

testCases.serde.concat(testCases.serialization).forEach(testCase => {
  test(`must serialize ${testCase.name}`, test => {
    test.strictSame(mdsf.stringify(testCase.value), testCase.serialized);
    test.end();
  });
});

testCases.serde.concat(testCases.deserialization).forEach(testCase => {
  const runTest = (parserName, parser) => {
    test(`must deserialize ${
      testCase.name
    } using ${parserName} parser`, test => {
      test.strictSame(parser.parse(testCase.serialized), testCase.value);
      test.end();
    });
  };
  runTest('native', mdsf);
  runTest('js', jsParser);
});

testCases.invalid.forEach(testCase => {
  const runTest = (parserName, parser) => {
    test(`must not allow ${testCase.name} using ${parserName} parser`, test => {
      test.throws(() => parser.parse(testCase.value));
      test.end();
    });
  };
  runTest('native', mdsf);
  runTest('js', jsParser);
});
