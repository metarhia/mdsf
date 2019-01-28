'use strict';

const mdsf = require('../..');
const jsParser = require('../../lib/serde-fallback');

const test = require('tap').test;
const testCases = require('../fixtures/todo/serde');

testCases.deserialization.forEach(testCase => {
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

testCases.serialization.forEach(testCase => {
  test(`must serialize ${testCase.name}`, test => {
    test.strictSame(mdsf.stringify(testCase.value), testCase.serialized);
    test.end();
  });
});
