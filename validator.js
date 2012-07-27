
var Px = require("propex");

function Validator(config){
	
	function fn(propex, value, augmentors){
		if(typeof propex == "string")
			propex = Px(propex);
		
		var isArray = propex.isArray;
		var result = propex.recurse(value, {
			found: function(property, key, item, context){
//				console.log("found",tabs.substr(0, depth), name, value, property.name);
				var actions = context.actions[key];
				var valid = context.valid;
				var errors = context.errors;

				if(!actions) {
					valid[key] = item;
					return;
				}
				if(actions.parse) {
					item = actions.parse(property.subproperties, item);
					if(item.errors)
						errors[key] = item.errors;

					item = item.valid;
				}

				var errorMessage;
				if(actions.test && (errorMessage = actions.test(item))){
					errors[key] = errorMessage;
				}
				else{
					if(actions.set) actions.set.call(property, valid, item);
					else valid[key] = item;
				}
			},
			objectStart: function(property, name, item, context){
//				console.log("start",tabs.substr(0, depth++), name);
				var isArray = Array.isArray(item);
				var isRoot = name==null;
				var newContext = {
					valid: isArray? [] : {},
					errors: isArray? [] : {},
					actions: isRoot? config : context.actions[name]
				};

				if(!isRoot){
					context.valid[name] = newContext.valid;
					context.errors[name] = newContext.errors;
				}

				return newContext;
			},
			objectEnd: function(property, name, item, context){
				return context;
			},
			missing: function(property, key, context){
				var msg = Validator.errors.required(key);;
				if(key==null) //root object was missing or a missmatch
					return { errors: msg };
				context.errors[key] = msg;
			},
			marker: function(property, key, item, context){
				var marker = property.subproperties.marker;
				if(marker && augmentors){
					var aug = augmentors[marker];
					aug && aug(property, key, item, context);
				}
			}
		}, result);
		
		//string means the top level object was missing or a type mismatch
		if(typeof result.errors !== "string" && !Object.keys(result.errors).length)
			delete result.errors;
			

		return result;
	}
	fn.constructor = Validator;
	fn.__proto__ = Validator.prototype;
	fn.validators = config = (function(temp){
		Object.keys(config || {}).forEach(function(k) {
			var v = config[k];
			if(v.constructor == Validator){
				temp[k] = { parse: v };
			}
			else temp[k] = clone(v);
		});
		return temp;
	})({});

	return fn;
}
Validator.errors = {
	required: function(){ return "This information is required" }
}

function typeMismatch(isArray, data){
	var dataIsArray = Array.isArray(data);
	return (isArray && !dataIsArray) || (!isArray && dataIsArray)
}
function clone(obj){
	var obj2 = {};
	Object.keys(obj).forEach(function(k) {
		obj2[k] = obj[k];
	});
	return obj2;
}


module.exports = Validator;