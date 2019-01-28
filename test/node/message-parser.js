'use strict';

const test = require('tap').test;
const mdsf = require('../..');
const jsParser = require('../../lib/serde-fallback');

const testCases = require('../fixtures/message-parser');

testCases.forEach(testCase => {
  const runTest = (parserName, parser) => {
    const result = [];
    const remainder = parser.parseJSTPMessages(testCase.message, result);
    test(`must properly parse ${
      testCase.name
    } using ${parserName} parser`, test => {
      test.strictSame(result, testCase.result);
      test.strictSame(remainder, testCase.remainder);
      test.end();
    });
  };
  runTest('native', mdsf);
  runTest('js', jsParser);
});
