[propex-validation](http://williamkapke.github.com/propex-validation) is a small framework for validating
javascript objects against a [propex](https://github.com/williamkapke/propex) and a Validator object.


##Example validation
```javascript
var Validator = require("propex-validation");
var validate = {};

validate.department = new Validator({
  name: function(value){
    if(value.length<3)  return "Too Short";
    if(value.length>30) return "Too long";
  },
  phone: { test: function(value) { if(!/^\d\d\d-?\d\d\d-?\d\d\d\d$/.test(value)) return "Bad phone number"; } }
});

validate.location = new Validator({
  storeid: {
    test: function(value){ if(isNaN(value)) return "Numeric Id needed"; }
  },
  position: {
    parse: function(propex, data){ return data.lng+","+data.lat },
    test: function(value){ if(/^\d\d,\d\d$/.test(value)) return "Lng & Lat cannot be over 99"; }
  },
  //something more complicated...
  departments: {
    missing: function() { return "You're going to need to provide these"; },
    //custom parser
    parse: validate.department,
    test: function(value) { if(value.length<2) return "You're going to need to provide more"; },
    set: function(model, value) { model.departments = value; }
  }
});


var posted_data = {
  name:"Walmart of San Francisco",
  departments: [
    {name:"Main", phone:"1231231234", hours:"9-5"},
    {name:"Pharmacy", phone:"1235551212"}
  ]
};

//create a propex that defines *what* you want validated
var px = "{name,storeid?,postition?,departments[0{name,phone,hours},1{name,phone?,hours?}]1:3?}";

//apply the propex and the data to the Validator
var result = validate.location(px,posted_data);

//checkout the results
console.log(JSON.stringify(result, null, 2));
```

This will output:
```json
{
  "valid": {
    "name": "Walmart of San Francisco",
    "departments": [
      {
        "name": "Main",
        "phone": "1231231234",
        "hours": "9-5"
      },
      {
        "name": "Pharmacy",
        "phone": "1235551212"
      }
    ]
  },
  "errors": {
    "departments": [
      null,
      null,
      "This information is required"
    ]
  }
}
```

# Installation

    $ npm install propex-validation

## License

The MIT License (MIT)
Copyright (c) 2012 William Kapke

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
