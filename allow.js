
var Px = require("propex");
var test = require('validator');

module.exports = allow;
function allow(definition) {
  if(definition instanceof RegExp)
    return allow.string.apply(null, arguments);

  return validator(definition);
}

function Actions(tester) {
  this.test = tester;
}
Actions.prototype.from = function (parser) {
  this.parse = parser;
  return this;
};
Actions.prototype.then = function (setter) {
  this.set = setter;
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
      date = new Date(date);
      return {
        test: function (value) {
          value = parse(value);
          if(isNaN(value)) return allow.errors.invalid;
          if (date && value < date)  return allow.errors.under;
        }
      };
    },
    before: function (date) {
      date = new Date(date);
      return {
        test: function (value) {
          value = parse(value);
          if(isNaN(value)) return allow.errors.invalid;
          if (date && value > date) return allow.errors.over;
        }
      };
    },
    between: function (min, max) {
      min = new Date(min);
      max = new Date(max);
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

  function fn(propex, value, augmentors) {
    if (!propex)
      return {valid: value};
    if (typeof propex == "string")
      propex = Px(propex);

    return propex.recurse(value, {
      found: function (property, key, item, context) {
        var isValidator = context.config && context.config.constructor === fn.constructor;
        var config = isValidator? context.config.validators : context.config;

        var actions = config && config[key];
        var valid = context.valid;
        var errors = context.errors;

        if (!actions) {
          valid[key] = item;
          return;
        }
        if (actions.hasOwnProperty('parse')) {
          item = actions.parse(property.subproperties, item);
          if(isValidator) {
            if (item.errors)
              errors[key] = item.errors;

            item = item.valid;
            return;
          }
        }

        var errorMessage;
        if (actions.hasOwnProperty('test') && (errorMessage = actions.test(item, valid))) {
          errors[key] = errorMessage;
        }
        else {
          if (actions.hasOwnProperty('set')) actions.set.call(property, valid, item);
          else valid[key] = item;
        }
      },
      objectStart: function (property, name, item, context) {
        var isArray = Array.isArray(item);
        var isRoot = name == null;

        return {
          min: property.subproperties.min,
          max: property.subproperties.max,
          valid: isArray ? [] : {},
          errors: isArray ? [] : {},
          config: isRoot ? config :
            //arrays use the same actions over and over and
            //cause objectStart to fire once for the array,
            //and then once for every object in it.
            (typeof name == "number" ?
              (context.config || {}) :       //array
              (context.config || {})[name])  //object
        };
      },
      objectEnd: function (property, name, sub_result, context) {
        //return the root result object
        if (name === null)
          return (Object.keys(sub_result.errors).length) ?
          {valid: sub_result.valid, errors: sub_result.errors} :
          {valid: sub_result.valid};

        if(property.subproperties.isArray && sub_result.valid.length < property.subproperties.min)
          return context.errors[name] = allow.errors.under;

        context.valid[name] = sub_result.valid;

        if (Object.keys(sub_result.errors).length)
          context.errors[name] = sub_result.errors;

        return context;
      },
      missing: function (property, key, context) {
        if (key == null) //root object was missing or a missmatch
          return {errors: allow.errors.missing};

        if(typeof key !== 'number' || key < context.min)
          context.errors[key] = allow.errors.missing;
      },
      marker: function (property, key, item, context) {
        var marker = property.subproperties.marker;
        if (marker && augmentors) {
          var aug = augmentors[marker];
          aug && aug(property, key, item, context);
        }
      }
    });
  }

  fn.constructor = validator;
  fn.__proto__ = validator.prototype;
  fn.validators = config;

  return fn;
}

//middleware for express/restify
validator.prototype.require = function(propex){
  var self = this;
  return function(req, res, next){
    var result = self(propex, req.body);

    if(result.errors)
      return res.status(400).send(result.errors);

    req.model = result.valid;
    next();
  };
};


