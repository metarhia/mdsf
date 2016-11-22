'use strict';

var expect = require('chai').expect;

var jstp = require('../..');

describe('jsrs.parseNetworkPackets', function() {
  it('must parse a half-packet', function() {
    var array = [];
    var rest = jstp.parseNetworkPackets('{a:', array);
    expect(array).to.eql([]);
    expect(rest).to.equal('{a:');
  });

  it('must parse a whole packet', function() {
    var array = [];
    var rest = jstp.parseNetworkPackets('{a:1}\0', array);
    expect(array).to.eql([{ a: 1 }]);
    expect(rest).to.equal('');
  });

  it('must parse a whole packet followed by a half-packet', function() {
    var array = [];
    var rest = jstp.parseNetworkPackets('{a:1}\0{b:', array);
    expect(array).to.eql([{ a: 1 }]);
    expect(rest).to.equal('{b:');
  });

  it('must parse a whole packet followed by a whole packet', function() {
    var array = [];
    var rest = jstp.parseNetworkPackets('{a:1}\0{b:2}\0', array);
    expect(array).to.eql([{ a: 1 }, { b: 2 }]);
    expect(rest).to.equal('');
  });
});
