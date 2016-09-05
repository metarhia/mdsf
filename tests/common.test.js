/* global describe it beforeEach */
'use strict';

var expect = require('expect.js');
var common = require('../lib/common');

describe('Common functions library', function() {
  describe('common.extend', function() {
    var sampleObject;
    var biggerObject;

    beforeEach(function() {
      sampleObject = { key: 'value' };
      biggerObject = { key1: 'value1', key2: 'value2' };
    });

    it('must not change target when there are no sources', function() {
      var emptyObject = {};
      common.extend(emptyObject);
      expect(emptyObject).to.eql({});

      common.extend(sampleObject);
      expect(sampleObject).to.eql({ key: 'value' });
    });

    it('must return the target object', function() {
      var modifiedSampleObject = common.extend(sampleObject, { test: 'value' });
      expect(modifiedSampleObject).to.be(sampleObject);
    });

    it('must copy the properties of a source object', function() {
      common.extend(sampleObject, biggerObject);
      expect(sampleObject).to.only.have.keys('key', 'key1', 'key2');
    });

    it('must copy the properties of multiple sources', function() {
      var obj = common.extend({}, sampleObject, biggerObject);
      expect(obj).to.only.have.keys('key', 'key1', 'key2');
    });

    it('must not modify sources', function() {
      common.extend({}, sampleObject);
      expect(sampleObject).to.be(sampleObject);

      common.extend({}, sampleObject, biggerObject);
      expect(sampleObject).to.be(sampleObject);
      expect(biggerObject).to.be(biggerObject);
    });

    it('must rewrite older keys by newer ones', function() {
      var obj = common.extend({ key: 'old', key2: 'old' },
        sampleObject, biggerObject);
      expect(obj).to.only.have.keys('key', 'key1', 'key2');
      expect(obj.key).to.be('value');
      expect(obj.key2).to.be('value2');
    });

    it('must skip nulls', function() {
      common.extend(sampleObject, null);
      expect(sampleObject).to.only.have.key('key');

      common.extend(sampleObject, null, biggerObject);
      expect(sampleObject).to.only.have.keys('key', 'key1', 'key2');
    });

    it('must skip undefined values', function() {
      common.extend(sampleObject, undefined);
      expect(sampleObject).to.only.have.key('key');

      common.extend(sampleObject, undefined, biggerObject);
      expect(sampleObject).to.only.have.keys('key', 'key1', 'key2');
    });

    it('must work with objects of any type', function() {
      var obj = common.extend({}, 'str');
      expect(obj).to.eql({ 0: 's', 1: 't', 2: 'r' });

      var modifiedString = common.extend('str', sampleObject);
      expect(modifiedString.toString()).to.be('str');
      expect(modifiedString).to.have.key('key');
    });

    it('must work when bound to null', function() {
      var extend = common.extend.bind(null, {}, sampleObject);
      var obj = extend();
      expect(obj).to.eql(sampleObject);
    });

    it('must throw TypeError when called with no arguments', function() {
      var fn = common.extend.bind(null);
      expect(fn).to.throwError(function(error) {
        expect(error).to.be.a(TypeError);
      });
    });
  });
});
