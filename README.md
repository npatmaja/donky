# A test fixture library to generate mock data on mongoose
## Under development please do not use yet
## Installation

```
$ npm install donky
```

## Usage

```javascript
var mongoose = require('mongoose');
var Donky = require('donky');
var donky = new Donky(mongoose);

donky.factory()
  .schema('User', 'admin')
  .field('email', donky.gen.email())
  .field('password', donky.gen.string());

donky.factory()
  .schema('User', 'joe')
  .field('email', donky.gen.email())
  .field('password', donky.gen.string());

donky.factory()
  .schema('Post', 'post1')
  .field('author', donky.ref('joe'))
  .field('content', donky.gen.paragraph());

donky.factory()
  .schema('Post')
  .field('author', 'joe')
  .field('content', donky.gen.paragraph());

// create mongoose model
donky.create('admin');

// create multiple mongoose model
donky.create('admin', 3);
```

## License:
MIT license
