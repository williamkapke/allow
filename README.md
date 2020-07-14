allow [![Circle CI](https://circleci.com/gh/williamkapke/allow.svg?style=svg)](https://circleci.com/gh/williamkapke/allow)
=====

[allow](http://williamkapke.github.com/allow) is a small, yet powerful, framework for validating
javascript objects against a [propex](https://propex.org) and a `Validator` object.


##Example validation
```javascript
var allow = require('allow');

var validate = {
  user: allow({
    first: allow.string(/^[a-zA-Z]+$/,1,50),
    last: allow.string(/^[a-z]+$/,1,50),
    gender: allow.string(/^m|f$/),
    dob: allow.isodate.before('2000-01-01'),
    email: allow.email,
    password: allow.string(/^[!-~]+$/,6,32),
    photos: allow({
      url: allow.string(10,255),
      caption: allow.string(1,140),
      taken: allow.isodate.before('now'),
      location: allow.string(/^\d\d(\.\d+)?,\d\d(\.\d+)?$/).from(function (propex, data) {
        if(typeof data.lng === 'number' && typeof data.lat === 'number')
          return data.lng + "," + data.lat;
      })
    })
  })
};

var posted_data = {
  first: 'William',
  dob: 'March 16th',
  email: 'william.kapke@gmail.com',
  password: 'password',
  photos: [
    {
      url: 'https://secure.gravatar.com/avatar/913d54c9cbbeeb8907786a18e6fbf844',
      caption: 'Here I am!',
      lat: 58.99502034,
      lng: 18.068842
    },
    {},
    {},
    {},//this will be ignored
    {}//this will be ignored
  ]
};

//create a propex that defines *what* you want validated
var px = "{first,last,gender?,dob,email,password,photos[{url,caption?,taken?,location?}]2:3?}";

//apply the propex and the data to the Validator
var result = validate.user(px, posted_data);

//checkout the results
console.log(JSON.stringify(result, null, 2));
```

This will output:
```json
{
  "valid": {
    "first": "William",
    "email": "william.kapke@gmail.com",
    "password": "password",
    "photos": [
      {
        "url": "https://secure.gravatar.com/avatar/913d54c9cbbeeb8907786a18e6fbf844",
        "caption": "Here I am!",
        "location": "18.068842,58.99502034"
      },
      {},
      {}
    ]
  },
  "errors": {
    "last": "missing",
    "dob": "invalid",
    "photos": [
      null,
      {
        "url": "missing"
      },
      {
        "url": "missing"
      }
    ]
  }
}
```

## Middleware
You can use [allow](https://github.com/williamkapke/allow) as middleware with
[Express](https://github.com/strongloop/express)/[Restify](https://github.com/mcavage/node-restify).

```javascript
  app.post("/authenticate", validate.user('{email,password}'), function(req, res){
    //if it reaches this point, the input passed validation
    //`req` will now have a `model` property with the valid results of the validator.
    //`req.body` will still contain the original input if you need it.
    db.user.find({email:req.model.email}, function(err, user){
      if(err) return res.send(500);
      if(!user) return res.send(404);
      if(!passwords_match(user.password, req.model.password))
        return res.send(403);

      return res.json({api_token:user.api_token});
    })
  });

  //use the same validator, but allow/validate different properties
  //adding `?` after each makes them optional!
  app.post("/me", validate.user('{first?,last?,gender?,dob?,email?}'), function(req, res){
    //update the user
  });
```

Passing only a Propex to the validator will return a middleware compatible function. If there are any errors, it
responds with a `400` status code and the `errors` (as JSON) in the body.


# Installation

    $ npm install allow

## License

The MIT License (MIT)
Copyright (c) 2015 William Kapke

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
