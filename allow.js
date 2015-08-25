
var Px = require("propex");

module.exports = allow;
function allow(definition) {
  if(definition instanceof RegExp)
    return allow.string.apply(null, arguments);

  return validator(definition);
}

function Actions(tester) {
  return {
    test: tester,
    from: function (finder) {
      this.find = finder;
      return this;
    },
    then: function (setter) {
      this.set = setter;
      return this;
    },
    else: function (setter) {
      this.missing = setter;
      return this;
    }
  };
}
allow.string = function (regex, min, max, msg) {
  if(typeof regex === 'number'){
    msg = max;
    max = min;
    min = regex;
    regex = undefined;
  }
  var fmt = formatter(msg, min, max);
  return Actions(function (value) {
    if (typeof value === 'undefined') return fmt(allow.errors.missing);
    if (typeof value !== 'string') return fmt(allow.errors.invalid, value);
    if (min && value.length < min)  return fmt(allow.errors.under, value);
    if (max && value.length > max) return fmt(allow.errors.over, value);
    if (regex && !regex.test(value)) return fmt(allow.errors.invalid, value);
  });
};

allow.number = function (min, max, msg) {
  var fmt = formatter(msg, min, max);
  return Actions(function (value) {
    if (typeof value === 'undefined') return fmt(allow.errors.missing);
    if(typeof value !== 'number') return fmt(allow.errors.invalid, value);
    if (min && value < min)  return fmt(allow.errors.under, value);
    if (max && value > max) return fmt(allow.errors.over, value);
  });
};

allow.integer = function (min, max, msg) {
  var fmt = formatter(msg, min, max);
  return Actions(function (value) {
    if (typeof value === 'undefined') return fmt(allow.errors.missing);
    if(typeof value !== 'number' || !/^[-+]?\d+$/.test(value)) return fmt(allow.errors.invalid, value);
    if (min && value < min)  return fmt(allow.errors.under, value);
    if (max && value > max) return fmt(allow.errors.over, value);
  });
};

//basic iso structure check. time portion (in GMT) optional.
var isodate = /\d{4}-[01]\d-[0-3]\d(T[0-2]\d:[0-5]\d:[0-5]\d\.\d{3}Z)?$/;
function date(iso) {
  function parse(value) {
    if(typeof value === 'date') return value;
    if(iso && !isodate.test(value)) return NaN;
    return new Date(value);
  }
  var actions = function (msg) {
    var fmt = formatter(msg);
    return Actions(function (value) {
      if (typeof value === 'undefined') return fmt(allow.errors.missing);
      if(isNaN(parse(value))) return fmt(allow.errors.invalid, value);
    })
  };
  actions.after = function (date, msg) {
    date = date==='now'? new Date : new Date(date);
    var fmt = formatter(msg, date);
    return Actions(function (value) {
      if (typeof value === 'undefined') return fmt(allow.errors.missing);
      value = parse(value);
      if(isNaN(value)) return fmt(allow.errors.invalid, value);
      if (date && value < date)  return fmt(allow.errors.under, value);
    });
  };
  actions.before = function (date, msg) {
    date = date==='now'? new Date : new Date(date);
    var fmt = formatter(msg, date);
    return Actions(function (value) {
      if (typeof value === 'undefined') return fmt(allow.errors.missing);
      value = parse(value);
      if(isNaN(value)) return fmt(allow.errors.invalid, value);
      if (date && value > date) return fmt(allow.errors.over, value);
    });
  };
  actions.between = function (min, max, msg) {
    min = min==='now'? new Date : new Date(min);
    max = max==='now'? new Date : new Date(max);
    var fmt = formatter(msg, min, max);
    return Actions(function (value) {
      if (typeof value === 'undefined') return fmt(allow.errors.missing);
      value = parse(value);
      if(isNaN(value)) return fmt(allow.errors.invalid, value);
      if (min && value < min)  return fmt(allow.errors.under, value);
      if (max && value > max) return fmt(allow.errors.over, value);
    });
  };
  return actions;
}
allow.date = date(false);
allow.isodate = date(true);

allow.email = function (msg) {
  var fmt = formatter(msg);
  return Actions(function (value) {
    if (typeof value === 'undefined') return fmt(allow.errors.missing);
    if (typeof value !== 'string'|| !allow.isEmail(value)) return fmt(allow.errors.invalid, value);
  })
};

allow.errors = {
  missing: 'missing',
  under: 'under',
  over: 'over',
  invalid: 'invalid'
};
allow.format = function (msg, args) {
  return msg.replace(/{(\d+)}/g, function(match,i) { return args[i]; });
};

function validator(config) {
  var fmt = formatter();

  function fn(propex, value) {
    if (!propex)
      return {valid: value};
    if (typeof propex == "string")
      propex = Px(propex);

    if(arguments.length===1)
      return fn.require(propex);

    if(!exists(value) || (typeMismatch(propex, value)))
      return { errors: fmt(allow.errors.missing, value) };

    function recurser(property, key) {
      if(typeof key === 'number' && (key > this.max))
        return true; //end of array
      var actions = this.config[key];

      var item = actions && actions.find? actions.find(key, this.source) : this.source[key];
      var subs = property.subproperties;

      if(!exists(item)){
        if(!property.isOptional || (subs && typeMismatch(subs,item))) {
          if(typeof key !== 'number' || key < this.min)
            this.errors[key] = (actions && actions.missing && actions.missing()) || fmt(allow.errors.missing, value);
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
  Object.keys(allow).forEach(function (key) {
    fn[key] = allow[key];
  });
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
function noFormat(msg) { return msg; }
function formatter(msg) {
  var format = typeof msg==='function'? msg : typeof allow.format === 'function'? allow.format : noFormat;
  msg = typeof msg==='string'? msg : undefined;
  var args = Array.prototype.slice.apply(arguments);
  return function (type, value) {
    args[0] = value;
    return format(msg||type, args);
  };
}

//middleware for express/restify
allow.require = function require(propex){
  var self = this;
  return function validation_middleware(req, res, next){
    var result = self(propex, req.body);

    if(result.errors) {
      res.statusCode = 400;
      return res.json(result.errors);
    }

    req.model = result.valid;
    next();
  };
};

allow.isEmail = function () {
  throw new Error('override this function with an email tester e.g.: https://www.npmjs.com/package/validator');
};

