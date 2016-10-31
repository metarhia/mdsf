'use strict';

var events = require('events');

var chai = require('chai');
var chaiSpies = require('chai-spies');

var common = require('../../lib/common');

chai.use(chaiSpies);
var expect = chai.expect;

describe('Common functions library', function() {
  describe('extend', function() {
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
      expect(modifiedSampleObject).to.equal(sampleObject);
    });

    it('must copy the properties of a source object', function() {
      common.extend(sampleObject, biggerObject);
      expect(sampleObject).to.have.keys('key', 'key1', 'key2');
    });

    it('must copy the properties of multiple sources', function() {
      var obj = common.extend({}, sampleObject, biggerObject);
      expect(obj).to.have.keys('key', 'key1', 'key2');
    });

    it('must not modify sources', function() {
      common.extend({}, sampleObject);
      expect(sampleObject).to.equal(sampleObject);

      common.extend({}, sampleObject, biggerObject);
      expect(sampleObject).to.equal(sampleObject);
      expect(biggerObject).to.equal(biggerObject);
    });

    it('must rewrite older keys with newer ones', function() {
      var obj = common.extend({ key: 'old', key2: 'old' },
        sampleObject, biggerObject);
      expect(obj).to.have.keys('key', 'key1', 'key2');
      expect(obj.key).to.equal('value');
      expect(obj.key2).to.equal('value2');
    });

    it('must skip nulls', function() {
      common.extend(sampleObject, null);
      expect(sampleObject).to.have.keys('key');

      common.extend(sampleObject, null, biggerObject);
      expect(sampleObject).to.have.keys('key', 'key1', 'key2');
    });

    it('must skip undefined values', function() {
      common.extend(sampleObject, undefined);
      expect(sampleObject).to.have.keys('key');

      common.extend(sampleObject, undefined, biggerObject);
      expect(sampleObject).to.have.keys('key', 'key1', 'key2');
    });

    it('must work with objects of any type', function() {
      var obj = common.extend({}, 'str');
      expect(obj).to.eql({ 0: 's', 1: 't', 2: 'r' });

      var modifiedString = common.extend('str', sampleObject);
      expect(modifiedString.toString()).to.equal('str');
      expect(modifiedString).to.contain.key('key');
    });

    it('must throw TypeError when called with no arguments', function() {
      expect(function() {
        common.extend();
      }).to.throw(TypeError);
    });
  });
});
