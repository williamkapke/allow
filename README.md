[propex-validation](http://williamwicks.github.com/propex-validation) is a small framework for validating 
javascript objects against a [propex](https://github.com/williamwicks/propex) and a Validator object.


##The Validator object
```javascript
var validator = new Validator({
	name: {
		test: function(value){ if(value.length>30) return "Too long";},
		set: function(model, value){
			model.name = value + " is awesome";
		}
	},
	locations: new Validator({
		storeid: {
			test: function(value){ if(isNaN(value)) return "Numeric Id needed"; }
		},
		position: {
			parse: function(propex, data){ return data.lng+","+data.lat },
			test: function(value){ if(/^\d\d,\d\d$/.test(value)) return "Lng & Lat cannot be over 99"; }
		},
		departments: {
			missing: function() { return "You're going to need to provide these"; },
			parse: new Validator({
				name: { test: length(3,32) },
				phone: { test: function(value) { if(!/^\d\d\d-?\d\d\d-?\d\d\d\d$/.test(value)) return "Bad phone number"; } }
			}),
			test: function(value) { if(value.length<2) return "You're going to need to provide more"; },
			set: function(model, value) { model.departments = value; }
		}
	})
});
```

##Example validation
```javascript
var result = validator("{StoreName,Departments[0{Name,Phone,Hours},1{Name,Phone?,Hours?}]1:5?}",{
	StoreName:"Walmart",
	Departments: [
		{Name:"Main", Phone:"1231231234", Hours: "9-5"},
		{Name:"Pharmacy", Phone:"1235551212"}
	]
})
```

# Installation

    $ npm install propex-validation

## License

The MIT License (MIT)
Copyright (c) 2012 William Wicks

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
