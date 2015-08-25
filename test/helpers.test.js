
var should = require('should');
var allow = require('../');
allow.isEmail = require('validator').isEmail;

describe('Action Helpers', function () {

  describe('Strings', function () {
    it('should check for strings', function () {
      should.not.exist(allow.string().test('3456'));
      allow.string().test(123).should.equal('invalid');
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
      should.exist(allow.string().from);
      should.exist(allow.string().then);
    });
  });

  describe('Numbers', function () {
    it('should check for numbers', function () {
      should.not.exist(allow.number().test(34.56));
      allow.number().test('123').should.equal('invalid');
    });
    it('should check min & max', function () {
      allow.number(200.4).test(123.4).should.equal('under');
      allow.number(1.1,50.1).test(123.4).should.equal('over');
      allow.number(50.1,100.1).test(123.4).should.equal('over');
      allow.number(50.1,100.1).test(12.3).should.equal('under');
      should.not.exist(allow.number(50.1,100.1).test(75));
    });
    it('should have a from & then chain functions', function () {
      should.exist(allow.number().from);
      should.exist(allow.number().then);
    });
  });

  describe('Integers', function () {
    it('should check for integers', function () {
      should.not.exist(allow.integer().test(3456));
      allow.integer().test('123').should.equal('invalid');
      allow.integer().test(34.56).should.equal('invalid');
    });
    it('should check min & max', function () {
      allow.integer(200).test(123).should.equal('under');
      allow.integer(1,50).test(123).should.equal('over');
      allow.integer(50,100).test(123).should.equal('over');
      allow.integer(50,100).test(12).should.equal('under');
      should.not.exist(allow.integer(50,100).test(75));
    });
    it('should have a from & then chain functions', function () {
      should.exist(allow.integer().from);
      should.exist(allow.integer().then);
    });
  });

  describe('Dates', function () {
    it('should check for dates', function () {
      should.not.exist(allow.date().test('3-16-1976'));
      allow.date().test('xxx').should.equal('invalid');
    });
    it('should check for iso dates', function () {
      should.not.exist(allow.date().test('3-16-1976'));
      should.not.exist(allow.date().test('1976'));
      should.not.exist(allow.isodate().test('1976-03-16T00:00:00.000Z'));
      allow.isodate().test('Sun Apr 05 2015 16:19:20 GMT-0700 (PDT)').should.equal('invalid');
    });
    it('should check before,after and between', function () {
      allow.isodate.after('2-13-1975').test('1970-12-31').should.equal('under');
      allow.isodate.before('2-13-1975').test('1980-12-31').should.equal('over');
      allow.isodate.between('1-1-2015','12-31-2015').test('2000-04-11').should.equal('under');
      allow.isodate.between('1-1-2015','12-31-2015').test('3000-04-11').should.equal('over');
      should.not.exist(allow.isodate.between('1-1-2015','12-31-2015').test('2015-04-11'));
    });
    it('should have a from & then chain functions', function () {
      should.exist(allow.date().from);
      should.exist(allow.date().then);
    });
  });

  describe('Emails', function () {
    it('should validate emails', function () {
      should.not.exist(allow.email().test('william.kake@gmail.com'));
      allow.email().test('xxx').should.equal('invalid');
    });

    it('should have a from & then chain functions', function () {
      should.exist(allow.email().from);
      should.exist(allow.email().then);
    });
  });

});

describe("Error Messages", function () {
  describe('using the string argument', function () {
    it('should replace the {digit} placeholders', function () {
      allow.string(/^\d+$/, 2,4, 'a string with {1}-{2} digits plz').test('x').should.equal('a string with 2-4 digits plz');
      allow.string(2,4, 'a string with {1}-{2} digits plz').test('x').should.equal('a string with 2-4 digits plz');
      allow.string(2,4, 'a string with {1}-{2} digits plz').test().should.equal('a string with 2-4 digits plz');

      var number = allow.number(2,4, 'pick a number between {1} and {2}');
      number.test(1).should.equal('pick a number between 2 and 4');
      number.test(45.5).should.equal('pick a number between 2 and 4');
      number.test().should.equal('pick a number between 2 and 4');
      number.test('one').should.equal('pick a number between 2 and 4');

      var integer = allow.integer(2,4, 'pick an integer between {1} and {2}');
      integer.test(1).should.equal('pick an integer between 2 and 4');
      integer.test(2.5).should.equal('pick an integer between 2 and 4');
      integer.test().should.equal('pick an integer between 2 and 4');
      integer.test('one').should.equal('pick an integer between 2 and 4');

      allow.date('"{0}" is not a valid date').test('yesterday').should.equal('"yesterday" is not a valid date');
      var date1 = new Date();
      var date2 = new Date();
      allow.date.after(date1, '"{0}" is not a valid date after {1}').test('gopro').should.equal('"Invalid Date" is not a valid date after '+date1);
      allow.date.before(date1, '"{0}" is not a valid date after {1}').test('gopro').should.equal('"Invalid Date" is not a valid date after '+date1);
      allow.date.between(date1, date2, '"{0}" is not a valid date between {1} and {2}').test('gopro').should.equal('"Invalid Date" is not a valid date between '+date1+' and '+date2);

      allow.isodate('"{0}" is not a valid date').test('yesterday').should.equal('"yesterday" is not a valid date');

      allow.email('"{0}" is not a valid email').test('It is a beautiful day').should.equal('"It is a beautiful day" is not a valid email');
    });

    describe('with formatter argument', function () {
      it('should use the formatter function', function () {
        function string_error(msg, args) {
          if(msg==='missing') return 'give me SOMETHING man!';
          if(msg==='invalid') return 'ok i meant a string';
          if(msg==='under') return 'ugh- at least '+args[1]+' characters!';
          if(msg==='over') return 'Oh, I guess I should have told you that you can\'t have over '+args[2]+' characters :/';
          return 'I don\'t know what day it is';
        }
        var age = allow.string(2,4, string_error);
        age.test().should.equal('give me SOMETHING man!');
        age.test(3).should.equal('ok i meant a string');
        age.test('x').should.equal('ugh- at least 2 characters!');
        age.test('xxxxx').should.equal('Oh, I guess I should have told you that you can\'t have over 4 characters :/');

        function number_error(msg, args) {
          if(msg==='missing') return 'give me SOMETHING man!';
          if(msg==='invalid') return 'ok i meant a number';
          if(msg==='under') return 'ugh- something over '+args[1];
          if(msg==='over') return 'Too much- keep it less than '+args[2];
          return 'I don\'t know what day it is';
        }
        var number = allow.number(2,4, number_error);
        number.test().should.equal('give me SOMETHING man!');
        number.test('one').should.equal('ok i meant a number');
        number.test(1).should.equal('ugh- something over 2');
        number.test(99).should.equal('Too much- keep it less than 4');

        var integer = allow.integer(2,4, number_error);
        integer.test().should.equal('give me SOMETHING man!');
        integer.test('one').should.equal('ok i meant a number');
        integer.test(1).should.equal('ugh- something over 2');
        integer.test(99).should.equal('Too much- keep it less than 4');

        function date_error(msg, args) {
          if(msg==='missing') return 'give me SOMETHING man!';
          if(msg==='invalid') return 'ok i meant a date';
          if(msg==='under') return 'ugh- something beyond '+args[1];
          if(msg==='over') return 'far out man! reel it back before '+(args[2]||args[1]);
          return 'I don\'t know what way is up';
        }
        allow.date(date_error).test().should.equal('give me SOMETHING man!');
        allow.date(date_error).test('yesterday').should.equal('ok i meant a date');
        allow.isodate(date_error).test('8/23/1999').should.equal('ok i meant a date');//not an ISO date

        var date1 = new Date();
        var date2 = new Date();
        allow.date.after(date1, date_error).test().should.equal('give me SOMETHING man!');
        allow.date.after(date1, date_error).test('gopro').should.equal('ok i meant a date');
        allow.date.after(date1, date_error).test('2000-1-1').should.equal('ugh- something beyond '+date1);

        allow.date.before(date1, date_error).test().should.equal('give me SOMETHING man!');
        allow.date.before(date1, date_error).test('gopro').should.equal('ok i meant a date');
        allow.date.before(date1, date_error).test('3000-1-1').should.equal('far out man! reel it back before '+date1);

        allow.date.between(date1, date2, date_error).test().should.equal('give me SOMETHING man!');
        allow.date.between(date1, date2, date_error).test('gopro').should.equal('ok i meant a date');
        allow.date.between(date1, date2, date_error).test('2000-1-1').should.equal('ugh- something beyond '+date1);
        allow.date.between(date1, date2, date_error).test('3000-1-1').should.equal('far out man! reel it back before '+date1);

        function email_error(msg) {
          if(msg==='missing') return 'helllo?? email please!?';
          if(msg==='invalid') return "c'mon that's not going to work";
          return 'You broke it';
        }
        allow.email(email_error).test().should.equal('helllo?? email please!?');
        allow.email(email_error).test('It is a beautiful day').should.equal("c'mon that's not going to work");
      });
    });
  });
});

