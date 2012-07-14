

var vows = require('vows'),
	assert = require('assert'),
	Validator = require("./validator");

function length(min, max) { return function(value){
	if(value.length<min) return "Too short";
	if(value.length>max) return "Too long";
}}





vows.describe("Validation tests")
	.addBatch({
		"Constructing a Validator without any params": {
			topic: function(){
				return new Validator()
			},
			"is pointless- but doable": function(v){
				assert.isNotNull(v);
				assert.isFunction(v);
			}
		}
	})
	.addBatch({
		'Validator for {name:"ACME"}': {
			topic: function(){
				return new Validator({
					name: { test: function(value) { if(value != "roojoo") return "Booooo. Bad kitty." } }
				});
			},
			"Propex:[]": {
				"Data:{}": {
					topic: function(validate){
						return validate("[]", {});
					},
					"errors should equal the default 'required' message": function(result){
						assert.equal(result.errors, Validator.errors.required());
					}
				},
				"Data:[]": {
					topic: function(validate){
						return validate("[]", []);
					},
					"should not return errors and valid should be empty": function(result){
						assert.isUndefined(result.error);
						assert.isArray(result.valid);
						assert.isEmpty(result.valid);
					}
				},
				"Data:[1,2,3]": {
					topic: function(validate){
						return validate("[]", [1,2,3]);
					},
					"throws error: needs to have subitems specified in propex": function(result){
						assert.instanceOf(result, Error);
					}
				},
				"noop": {}
			},
			"Propex:{}": {
				"Data:{}": {
					topic: function(validate){
						return validate("{}", {});
					},
					"should not return errors and valid should be empty": function(result){
						assert.isUndefined(result.error);
						assert.isObject(result.valid);
						assert.isEmpty(result.valid);
					}
				},
				"Data:[]": {
					topic: function(validate){
						return validate("{}", []);
					},
					"errors should equal the default 'required' message": function(result){
						assert.equal(result.errors, Validator.errors.required());
					}
				},
				'Data:{x:1,name:"roojoo"}': {
					topic: function(validate){
						return validate("{}", {x:1});
					},
					"should ignore properties that are not in the propex": function(result){
						assert.isEmpty(result.valid);
						assert.isUndefined(result.errors);
					}
				},
				"bookend": {}
			},
			'Propex:{name,type}': {
				'Data:{name:"lace",type:"cat"}': {
					topic: function(validate){
						return validate('{name,type}', {name:"lace",type:"cat",xtra:"ignored"});
					},
					"should have an error because the name does not match 'roojoo'": function(result){
						assert.isObject(result.errors);
						assert.includes(result.errors, 'name');
					}
				},
				'Data:{name:"roojoo",type:"cat",xtra:"ignored"}': {
					topic: function(validate){
						return validate('{name,type}', {name:"roojoo",type:"cat",xtra:"ignored"});
					},
					"should successfully find all required items and ignore xtra": function(result){
						assert.isUndefined(result.errors);
						assert.isObject(result.valid);
						assert.equal(result.valid.name, 'roojoo');
						assert.equal(result.valid.type, 'cat');
						assert.isUndefined(result.valid.xtra);
					}
				},
				"bookend": {}
			}
		}
	})
	.run();



/*
 AssertionError
 fail
 ok
 equal
 notEqual
 deepEqual
 notDeepEqual
 strictEqual
 notStrictEqual
 throws
 doesNotThrow
 ifError
 match
 matches
 isTrue
 isFalse
 isZero
 isNotZero
 greater
 lesser
 inDelta
 include
 includes
 deepInclude
 deepIncludes
 isEmpty
 isNotEmpty
 lengthOf
 isArray
 isObject
 isNumber
 isBoolean
 isNaN
 isNull
 isNotNull
 isUndefined
 isDefined
 isString
 isFunction
 typeOf
 instanceOf
*/