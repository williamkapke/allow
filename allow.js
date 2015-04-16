
var Px = require("propex");
var test = require('validator');

module.exports = allow;
function allow(definition) {
  if(definition instanceof RegExp)
    return allow.string.apply(null, arguments);

  return validator(definition);
}
allow.prototype = validator.prototype;

function Actions(tester) {
  this.test = tester;
}
Actions.prototype.from = function (finder) {
  this.find = finder;
  return this;
};
Actions.prototype.then = function (setter) {
  this.set = setter;
  return this;
};
Actions.prototype.else = function (setter) {
  this.missing = setter;
  return this;
};

allow.string = function (regex, min, max) {
  if(typeof regex === 'number'){
    max = min;
    min = regex;
    regex = undefined;
  }
  return new Actions(function (value) {
    if(typeof value !== 'string') return allow.errors.invalid;
    if (min && value.length < min)  return allow.errors.under;
    if (max && value.length > max) return allow.errors.over;
    if (regex && !regex.test(value)) return allow.errors.invalid;
  });
};
allow.string.__proto__ = Actions.prototype;
allow.string.test = allow.string().test;

allow.number = function (min, max) {
  return {
    test: function (value) {
      if(typeof value !== 'number') return allow.errors.invalid;
      if (min && value < min)  return allow.errors.under;
      if (max && value > max) return allow.errors.over;
    }
  };
};
allow.number.__proto__ = Actions.prototype;
allow.number.test = allow.number().test;

allow.integer = function (min, max) {
  return {
    test: function (value) {
      if(typeof value !== 'number' || !test.isInt(value)) return allow.errors.invalid;
      if (min && value < min)  return allow.errors.under;
      if (max && value > max) return allow.errors.over;
    }
  };
};
allow.integer.__proto__ = Actions.prototype;
allow.integer.test = allow.integer().test;

//basic iso structure check. time portion (in GMT) optional.
var isodate = /\d{4}-[01]\d-[0-3]\d(T[0-2]\d:[0-5]\d:[0-5]\d\.\d{3}Z)?$/;
function date(iso) {
  function parse(value) {
    if(typeof value === 'date') return value;
    if(iso && !isodate.test(value)) return NaN;
    return new Date(value);
  }
  return {
    __proto__: Actions.prototype,
    test: function (value) {
      if(isNaN(parse(value))) return allow.errors.invalid;
    },
    after: function (date) {
      date = date==='now'? new Date : new Date(date);
      return {
        test: function (value) {
          value = parse(value);
          if(isNaN(value)) return allow.errors.invalid;
          if (date && value < date)  return allow.errors.under;
        }
      };
    },
    before: function (date) {
      date = date==='now'? new Date : new Date(date);
      return {
        test: function (value) {
          value = parse(value);
          if(isNaN(value)) return allow.errors.invalid;
          if (date && value > date) return allow.errors.over;
        }
      };
    },
    between: function (min, max) {
      min = min==='now'? new Date : new Date(min);
      max = max==='now'? new Date : new Date(max);
      return {
        test: function (value) {
          value = parse(value);
          if(isNaN(value)) return allow.errors.invalid;
          if (min && value < min)  return allow.errors.under;
          if (max && value > max) return allow.errors.over;
        }
      };
    }
  }
}
allow.date = date();
allow.isodate = date(true);

allow.email = {
  __proto__: Actions.prototype,
  test: function (value) {
    if(typeof value !== 'string') return allow.errors.invalid;
    if(!test.isEmail(value)) return allow.errors.invalid;
  }
};

allow.errors = {
  missing: 'missing',
  under: 'under',
  over: 'over',
  invalid: 'invalid'
};

function validator(config) {

  function fn(propex, value) {
    if (!propex)
      return {valid: value};
    if (typeof propex == "string")
      propex = Px(propex);

    if(!exists(value) || (typeMismatch(propex, value)))
      return { errors: allow.errors.missing };

    function recurser(property, key) {
      if(typeof key === 'number' && (key > this.max))
        return true; //end of array
      var actions = this.config[key];

      var item = actions && actions.find? actions.find(key, this.source) : this.source[key];
      var subs = property.subproperties;

      if(!exists(item)){
        if(!property.isOptional || (subs && typeMismatch(subs,item))) {
          if(typeof key !== 'number' || key < this.min)
            this.errors[key] = (actions && actions.missing && actions.missing()) || allow.errors.missing;
        }
        return;
      }

      if(subs) {
        var result = subs.recurse(recurser, new_context(property, item, actions || this.config));
        item = result.valid;
        if(Object.keys(result.errors).length)
          this.errors[key] = result.errors;
      }
      else {
        var error = actions && actions.test && actions.test(item);
        if (error)
          this.errors[key] = error;
      }

      if(!error) {
        if (actions && actions.set)
          actions.set(key, item, this.valid);
        else this.valid[key] = item;
      }
    }

    var property = { name:null, isOptional:false, subproperties:propex };
    var context = new_context(property, value, fn);
    var result = propex.recurse(recurser, context);
    return Object.keys(result.errors).length ?
            {valid: result.valid, errors: result.errors} :
            {valid: result.valid};
  }

  fn.constructor = validator;
  fn.__proto__ = validator.prototype;
  fn.validators = config;

  return fn;
}
function new_context(property, source, config) {
  var isArray = property.subproperties.isArray;
  if(config.validators) config = config.validators;

  return {
    source: source,
    min: property.subproperties.min || 0,
    max: property.subproperties.max || source.length,
    valid: isArray ? [] : {},
    errors: isArray ? [] : {},
    config: config
  };
}
function exists(val) { return typeof val !== 'undefined'}
function typeMismatch(propex, data){
  var dataIsArray = Array.isArray(data);
  return (propex.isArray && !dataIsArray) || (!propex.isArray && dataIsArray)
}

//middleware for express/restify
validator.prototype.require = function(propex){
  var self = this;
  return function(req, res, next){
    var result = self(propex, req.body);

    if(result.errors) {
      res.statusCode = 400;
      return res.json(result.errors);
    }

    req.model = result.valid;
    next();
  };
};


