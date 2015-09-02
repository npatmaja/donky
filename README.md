# A test fixture library to generate mock data on mongoose
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
The MIT License (MIT)

Copyright (c) Nauval Atmaja [nauval.atmaja@gmail.com](mailto:nauval.atmaja@gmail.com) (nauvalatmaja.com)

Permission is hereby granted, free of charge, to any person obtaining a copy<br>of this software and associated documentation files (the "Software"), to deal<br>in the Software without restriction, including without limitation the rights<br>to use, copy, modify, merge, publish, distribute, sublicense, and/or sell<br>copies of the Software, and to permit persons to whom the Software is<br>furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in<br>all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR<br>IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,<br>FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE<br>AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER<br>LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,<br>OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN<br>THE SOFTWARE.
