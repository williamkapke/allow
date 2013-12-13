var should=require("should");
var assert = require('assert');
var Validator = require("./validator");

function length(min, max) { return function(value){
	if(value.length<min) return "Too short";
	if(value.length>max) return "Too long";
}}




describe("Constructing a Validator", function() {
	describe("without any params", function() {
		it("should be doable", function(){
			var validate = new Validator();
			validate.should.be.type('function');
		})
	});
	describe("with a nested Validator", function() {
		var validate = new Validator({
			people: new Validator()
		});
		var result = validate("{people{name,phone,role}}", {people:{}});

		it("should populate nested errors", function() {
			result.should.have.property('errors');
			result.errors.should.have.property('people');
			result.errors.people.should.have.property('name');
			result.errors.people.should.have.property('phone');
			result.errors.people.should.have.property('role');
		});
	})
});
describe("Using propex '[]'", function() {
	var validate = new Validator({
		name: { test: function(value) { if(value != "roojoo") return "Booooo. Bad kitty." } }
	});
	var px = '[]';

	describe("and try to validate against an Object", function() {
		it("should return the default 'required' message", function() {
			var result = validate(px, {});
			result.errors.should.equal(Validator.errors.required());
		});
	});
	describe("and try to validate an empty Array", function() {
		it("should not return errors and valid should be empty", function() {
			var result = validate(px, []);
			result.should.not.have.property('errors');
			result.should.have.property('valid');
			result.valid.should.be.instanceof(Array).and.have.lengthOf(0);
		});
	});
	describe("and try to validate a simple Array", function() {
		it("should just copy the values", function() {
			var result = validate(px, [1,2,3]);
			result.valid.should.eql([1,2,3]);
		});
	});
});
describe("Using propex '{}'", function() {
	var validate = new Validator({
		name: { test: function(value) { if(value != "roojoo") return "Booooo. Bad kitty." } }
	});
	var px = '{}';

	describe("and trying to validate against an Object", function() {
		it("should not return errors and valid should be empty", function() {
			var result = validate(px, {});
			result.should.not.have.property('errors');
			result.valid.should.be.instanceof(Object);
			result.valid.should.be.empty;
		});
	});
	describe("and trying to validate against an Array", function() {
		it("should return the default 'required' message", function() {
			var result = validate(px, []);
			result.errors.should.equal(Validator.errors.required());
		});
	});
	describe("validating an object with extra properties", function() {
		it("should ignore properties that are not in the propex", function() {
			var result = validate(px, {x:1});
			result.should.not.have.property('errors');
			result.should.have.property('valid');
			result.valid.should.be.instanceof(Object);
			result.valid.should.be.empty;
		});
	});
});
describe("Using propex '{name,type}'", function() {
	var validate = new Validator({
		name: { test: function(value) { if(value != "roojoo") return "Booooo. Bad kitty." } }
	});
	var px = '{name,type}';

	describe("and trying to validate against 'undefined'", function() {
		it("should return the default 'required' message", function() {
			var result = validate(px, undefined);
			result.errors.should.equal(Validator.errors.required());
		});
	});
	describe("and trying to validate against an empty Object", function() {
		it("should return errors for all required children", function() {
			var result = validate(px, {});
			result.should.have.property('errors');
			result.errors.should.have.property('name');
			result.errors.should.have.property('type');
		});
	});

	describe("and trying to validate against {name:'lace',type:'cat'}", function() {
		it("should have an error because the name does not match 'roojoo'", function() {
			var result = validate('{name,type}', {name:"lace",type:"cat"});
			result.should.have.property('errors');
			result.errors.name.should.eql('Booooo. Bad kitty.');
		});
	});
	describe("and trying to validate against {name:'roojoo',type:'cat',xtra:'ignored'}", function() {
		it("should successfully find all required items and ignore xtra", function() {
			var result = validate(px, {name:'roojoo',type:'cat',xtra:'ignored'});
			result.should.not.have.property('errors');
			result.valid.should.eql({name:'roojoo',type:'cat'});
		});
	});
	describe("and trying to validate against {name:'roojoo'}", function() {
		it("should complain about the missing property", function() {
			var result = validate(px, {name:"roojoo"});
			result.should.have.property('errors');
			result.errors.type.should.eql('This information is required');
		});
	});
});
describe("Optional properites", function() {
	var validate = new Validator({
		name: { test: function(value) { if(value != "roojoo") return "Booooo. Bad kitty." } }
	});
	var px = '{type?}';

	describe("with missing data", function() {
		var result = validate(px, {name:'roojoo'});

		it("should not be in 'result.valid' object", function(){
			result.valid.should.be.empty;
		});
		it("should not be in 'result.error' object", function(){
			result.should.not.have.property('errors');
		});
	});
});
describe("Nested data", function() {
	var validate = new Validator();

	describe("containing arrays and do not have propex info for the array contents", function() {

		it("should only validate existance", function(){
			var result = validate('{whatever{is}}', {whatever:{}});
			result.should.have.property('errors');
			result.errors.should.have.property('whatever');
			result.errors.whatever.should.have.property('is');
			result.errors.whatever.is.should.equal(Validator.errors.required());
		});
		it("should just copy the array", function(){
			var result = validate('{whatever{is}}', {whatever:{is:['here','is','ok']}});
			result.valid.should.eql({whatever:{is:['here','is','ok']}});
		});
	});
	describe("containing arrays with min & max", function() {

		it("should should require the minimum", function(){
			var result = validate('[]2:4', [9]);
			result.should.have.property('errors');
			result.errors.should.not.have.property(0);
			result.errors.should.have.property(1);
			result.errors[1].should.eql(Validator.errors.required());
		});
		it("should ignore anything beyond the maximum", function(){
			var result = validate('[]2:4', [9,8,7,6,5,4,3]);
			result.valid.should.not.have.property('errors');
			result.valid.should.have.length(4);
			result.valid.should.eql([9,8,7,6]);
		});
	});
});

describe("Using sample Validator", function() {
	var validate = new Validator({
		"name": {
			test: function(value){
				if(value.length < 4) return "Dude, "+value+", your name is too short!";
			},
			set: function(model, value) {
				model[this.name] = value+" is a suitable name.";
			}
		},
		"nested": new Validator({
			"something": {
				test: function(value){
					if(value.length < 4) return "no nonono";
				}
			}
		})
	});

	describe("test a short name", function() {
		var result = validate("{name}", {name:"Ed"});

		it("should fail 'test' function", function(){
			result.valid.should.be.empty;
			result.errors.should.have.property('name');
			result.errors.name.should.eql("Dude, Ed, your name is too short!");
		});
	});
	describe("test a valid name", function() {
		var result = validate("{name}", {name:"Nicole"});

		it("should call 'set'", function(){
			result.should.not.have.property('errors');
			result.valid.should.have.property('name');
			result.valid.name.should.eql("Nicole is a suitable name.");
		});
	});
	describe("test nested arrays", function() {
		var result = validate("{nested[{something}]}", {name:"Nicole",nested:[{something:"good"},{something:"bad"}]});

		it("should test array items and fail invalid items", function(){
			result.should.have.property('errors');
			result.errors.nested.should.have.property(1);
			result.errors.nested[1].something.should.eql("no nonono");
		});
	});
	describe("test invalid nested items", function() {
		var result = validate("{nested{something}}", {name:"Nicole",nested:{something:"bad"}});

		it("should have errors for the invalid items", function(){
			result.should.have.property('errors');
			result.errors.should.have.property('nested');
			result.errors.nested.something.should.eql("no nonono");
		});
	});
	describe("test valid nested items", function() {
		var result = validate("{nested{something}}", {name:"Nicole",nested:{something:"gooood"}});

		it("should not yield an error object", function(){
			result.should.not.have.property('errors');
		});
	});
});


