'use strict';

const test = require('tap').test;

const mdsf = require('../..');

const OBJECT = {
  a: 42,
  b: 'b',
  c: true,
  d: undefined,
  e: null,
  f: () => {},
  g: { a: 2, b: [1], c: { a: 4 } },
};

test('must call replacer the same way as JSON.stringify', test => {
  const getReplacer = array =>
    function(key, value) {
      array.push([key, value, this]);
      return value;
    };

  const callsByJson = [];
  const callsByMdsf = [];

  JSON.stringify(OBJECT, getReplacer(callsByJson));
  mdsf.stringify(OBJECT, getReplacer(callsByMdsf));

  test.strictSame(callsByMdsf, callsByJson);
  test.end();
});

test('must use replacer as a function', test => {
  const result = mdsf.stringify(OBJECT, (key, value) => {
    const type = typeof value;
    if (type === 'object' && value !== null) {
      return value;
    }
    return key + type;
  });

  const expected =
    `{a:'anumber',b:'bstring',c:'cboolean',d:'dundefined',` +
    `e:'eobject',f:'ffunction',g:{a:'anumber',b:['0number'],c:{a:'anumber'}}}`;

  test.strictSame(result, expected);
  test.end();
});

test('must correctly serialize `replacer` result', test => {
  const result = mdsf.stringify(OBJECT, (key, value) => value);

  const expected = `{a:42,b:'b',c:true,e:null,g:{a:2,b:[1],c:{a:4}}}`;
  test.strictSame(result, expected);
  test.end();
});

test('must use replacer as an array', test => {
  test.strictSame(mdsf.stringify(OBJECT, ['a']), '{a:42}');
  test.end();
});

test('must use replacer as an array with Nuber and String elements', test => {
  const object = { a: 42, b: 24, 0: 21, 1: 12 };
  const allowedFields = [new Number(0), new String('a')];
  test.strictSame(mdsf.stringify(object, allowedFields), `{'0':21,a:42}`);
  test.end();
});

test('must not use replacer for arrays', test => {
  test.strictSame(mdsf.stringify([1, 2], [1]), '[1,2]');
  test.end();
});

test('must ignore replacer elements that are neither strings nor numbers', test => {
  test.strictSame(
    mdsf.stringify({ a: 1, b: 2 }, [{ a: 0, b: 0 }, true, 'a']),
    '{a:1}'
  );
  test.end();
});

test('must ignore replacer that is neither a function nor an array', test => {
  test.strictSame(mdsf.stringify({ a: 1, b: 2 }, { a: 0, b: 0 }), '{a:1,b:2}');
  test.end();
});

test('must support space as a string', test => {
  test.strictSame(mdsf.stringify(OBJECT, ['a'], '  '), '{\n  a: 42\n}');
  test.end();
});

test('must support space as a String', test => {
  test.strictSame(
    mdsf.stringify(OBJECT, ['a'], new String('  ')),
    '{\n  a: 42\n}'
  );
  test.end();
});

test('must support space for nested objects', test => {
  test.strictSame(
    mdsf.stringify(OBJECT, ['g', 'a'], '  '),
    '{\n  a: 42,\n  g: {\n    a: 2\n  }\n}'
  );
  test.end();
});

test('must support space for arrays', test => {
  test.strictSame(mdsf.stringify([1], null, '\t'), '[\n\t1\n]');
  test.end();
});

test('must only use first 10 symbols from space string', test => {
  test.strictSame(
    mdsf.stringify(OBJECT, ['a'], ' '.repeat(10) + '\t'.repeat(10)),
    '{\n          a: 42\n}'
  );
  test.end();
});

test('must support space as a number', test => {
  test.strictSame(mdsf.stringify(OBJECT, ['a'], 2), '{\n  a: 42\n}');
  test.end();
});

test('must support space as a Number', test => {
  test.strictSame(
    mdsf.stringify(OBJECT, ['a'], new Number(2)),
    '{\n  a: 42\n}'
  );
  test.end();
});

test('must only use 10 symbols if space is number bigger than 10', test => {
  test.strictSame(mdsf.stringify(OBJECT, ['a'], 20), '{\n          a: 42\n}');
  test.end();
});

test('must ignore zero space arguments', test => {
  test.strictSame(mdsf.stringify(OBJECT, ['a'], 0), '{a:42}');
  test.end();
});

test('must ignore negative space arguments', test => {
  test.strictSame(mdsf.stringify(OBJECT, ['a'], -2), '{a:42}');
  test.end();
});

test('must not insert space into an empty array', test => {
  test.strictSame(mdsf.stringify([], null, 2), '[]');
  test.end();
});

test('must not insert space into an empty object', test => {
  test.strictSame(mdsf.stringify({}, null, 2), '{}');
  test.end();
});

test('must ignore space which is a scalar that is neither a string nor a number', test => {
  test.strictSame(mdsf.stringify(OBJECT, ['a'], true), '{a:42}');
  test.end();
});

test('must ignore space which is an object that is neither a String nor a Number', test => {
  test.strictSame(mdsf.stringify(OBJECT, ['a'], new Boolean(true)), '{a:42}');
  test.end();
});
