'use strict';

const test = require('tap').test;
const mdsf = require('../..');

const testCases = require('../fixtures/message-parser');

testCases.forEach((testCase) => {
  const result = [];
  const remainder = mdsf.parseJSTPMessages(testCase.message, result);
  test(`must properly parse ${testCase.name}`, (test) => {
    test.strictSame(result, testCase.result);
    test.strictSame(remainder, testCase.remainder);
    test.end();
  });
});
