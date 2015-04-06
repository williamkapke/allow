
var should = require('should');
var allow = require('../');


describe('Action Helpers', function () {

  describe('Strings', function () {
    it('should have a string.test function', function () {
      should.exist(allow.string.test)
    });
    it('should check for strings', function () {
      should.not.exist(allow.string.test('3456'));
      allow.string.test(123).should.equal('invalid');
    });
    it('should check string length', function () {
      allow.string(1,3).test('').should.equal('under');
      allow.string(1,3).test('xxxx').should.equal('over');
    });
    it('should check string against regex', function () {
      allow.string(/^\d$/).test('x').should.equal('invalid');
    });
    it('should check string against regex and length', function () {
      allow.string(/^\d+$/, 2,4).test('x').should.equal('under');
      allow.string(/^\d+$/, 2,4).test('xxx').should.equal('invalid');
      allow.string(/^\d+$/, 2,4).test('3').should.equal('under');
      should.not.exist(allow.string(/^\d+$/, 2,4).test('3456'));
    });
    it('should have a from & then chain functions', function () {
      should.exist(allow.string.from);
      should.exist(allow.string.then);
    });
  });

  describe('Numbers', function () {
    it('should check for numbers', function () {
      should.not.exist(allow.number.test(34.56));
      allow.number.test('123').should.equal('invalid');
    });
    it('should check min & max', function () {
      allow.number(200.4).test(123.4).should.equal('under');
      allow.number(1.1,50.1).test(123.4).should.equal('over');
      allow.number(50.1,100.1).test(123.4).should.equal('over');
      allow.number(50.1,100.1).test(12.3).should.equal('under');
      should.not.exist(allow.number(50.1,100.1).test(75));
    });
    it('should have a from & then chain functions', function () {
      should.exist(allow.number.from);
      should.exist(allow.number.then);
    });
  });

  describe('Integers', function () {
    it('should check for integers', function () {
      should.not.exist(allow.integer.test(3456));
      allow.integer.test('123').should.equal('invalid');
      allow.integer.test(34.56).should.equal('invalid');
    });
    it('should check min & max', function () {
      allow.integer(200).test(123).should.equal('under');
      allow.integer(1,50).test(123).should.equal('over');
      allow.integer(50,100).test(123).should.equal('over');
      allow.integer(50,100).test(12).should.equal('under');
      should.not.exist(allow.integer(50,100).test(75));
    });
    it('should have a from & then chain functions', function () {
      should.exist(allow.integer.from);
      should.exist(allow.integer.then);
    });
  });

  describe('Dates', function () {
    it('should check for dates', function () {
      should.not.exist(allow.date.test('3-16-1976'));
      allow.date.test('xxx').should.equal('invalid');
    });
    it('should check for iso dates', function () {
      should.not.exist(allow.date.test('3-16-1976'));
      should.not.exist(allow.date.test('1976'));
      should.not.exist(allow.isodate.test('1976-03-16T00:00:00.000Z'));
      allow.isodate.test('Sun Apr 05 2015 16:19:20 GMT-0700 (PDT)').should.equal('invalid');
    });
    it('should check before,after and between', function () {
      allow.isodate.after('2-13-1975').test('1970-12-31').should.equal('under');
      allow.isodate.before('2-13-1975').test('1980-12-31').should.equal('over');
      allow.isodate.between('1-1-2015','12-31-2015').test('2000-04-11').should.equal('under');
      allow.isodate.between('1-1-2015','12-31-2015').test('3000-04-11').should.equal('over');
      should.not.exist(allow.isodate.between('1-1-2015','12-31-2015').test('2015-04-11'));
    });
    it('should have a from & then chain functions', function () {
      should.exist(allow.date.from);
      should.exist(allow.date.then);
    });
  });

  describe('Emails', function () {
    it('should validate emails', function () {
      should.not.exist(allow.email.test('william.kake@gmail.com'));
      allow.email.test('xxx').should.equal('invalid');
    });

    it('should have a from & then chain functions', function () {
      should.exist(allow.email.from);
      should.exist(allow.email.then);
    });
  });

});
