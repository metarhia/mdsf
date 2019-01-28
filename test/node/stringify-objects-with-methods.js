'use strict';

const test = require('tap').test;

const mdsf = require('../..');

test('must stringify objects with toMDSF() method', test => {
  const obj = {
    a: 10,
    b: 20,
    toMDSF() {
      return 'string';
    },
  };
  test.strictSame(mdsf.stringify(obj), `'string'`);
  test.end();
});

test('must stringify objects with toJSON() method', test => {
  const obj = {
    a: 10,
    b: 20,
    toJSON() {
      return 30;
    },
  };
  test.strictSame(mdsf.stringify(obj), '30');
  test.end();
});

test(
  'must stringify objects with both toJSON() and toMDSF() methods' +
    ' using toMDSF()',
  test => {
    const obj = {
      a: 10,
      b: 20,
      toJSON() {
        return 30;
      },
      toMDSF() {
        return [];
      },
    };
    test.strictSame(mdsf.stringify(obj), '[]');
    test.end();
  }
);

test('must stringify arrays with toJSON() method', test => {
  const arr = [1, 2, 3];
  arr.toJSON = () => null;
  test.strictSame(mdsf.stringify(arr), 'null');
  test.end();
});

test('must stringify arrays with toMDSF() method', test => {
  const arr = [1, 2, 3];
  arr.toJSON = () => undefined;
  test.strictSame(mdsf.stringify(arr), 'undefined');
  test.end();
});
