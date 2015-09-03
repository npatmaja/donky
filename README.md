# donky
[![Build Status](https://travis-ci.org/npatmaja/donky.svg)](https://travis-ci.org/npatmaja/donky) [![Coverage Status](https://coveralls.io/repos/npatmaja/donky/badge.svg?branch=master&service=github)](https://coveralls.io/github/npatmaja/donky?branch=master) [![npm version](https://badge.fury.io/js/donky.svg)](http://badge.fury.io/js/donky)

A mongoose fixture library to generate documents for testing purpose. It can be used to generate documents that have reference to other documents as well as documents having embedded documents.

## Features
- Multiple documents generation
- Document reference support
- Sub-document support
- Generate mock field values (using [chancejs](chancejs.com))

## Installation

```
$ npm install donky --save-dev
```

## Usage

```js
// mongoose schema
var UserSchema = new mongoose.Schema({
  username: { type: String },
  email: { type: String },
  isActive: {
    type: Boolean,
    default: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
});

var CommentSchema = new mongoose.Schema({
  author: { type: String },
  comment: { type: String }
});

var PostSchemma = new mongoose.Schema({
  post: { type: String },
  author: {
    type:  mongoose.Schema.ObjectId,
    ref: 'User'
  },
  comments: [CommentSchema],
  likes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }]
});

// Usage
var mongoose = require('mongoose');
var Donky = require('donky');
var donky = new Donky(mongoose);

// create a factory for schema User with name admin
donky.factory()
  .schema('User', 'admin')
  .field('email', donky.gen.email())
  .field('password', donky.gen.string());

// create a factory for schema User with name user
donky.factory()
  .schema('User', 'user')
  .field('email', donky.gen.email())
  .field('password', donky.gen.string());

donky.factory()
  .schema('Comment', 'comment-post1')
  .field('author', donky.gen.twitter())
  .field('comment', donky.gen.paragraph());

donky.factory()
  .schema('Post', 'post1')
  .field('post', donky.gen.paragraph())
  .field('author', donky.ref('user'))
  .field('comments', donky.embed('comment-post1#'))
  .field('likes', donky.ref('user#'));

// create a single document based on the value
// supplied by the admin factory. Calling donky.create will
// save the document to mongodb. donky.create returns a promise.
var adminPromise = donky.create('admin');

// create 3 documents based on the user factory.
var userPormise = donky.create('user', 3);
// create 7 documents based on the comment-post1 factory.
var commentsPromise = donky.create('comment-post1', 7);
var postPromise = donky.create('post1');

// doing the test
postPromise.then(function(post) {
  // expectations goes here
  done();
}).fail(function(err) {
  done(err);
});
```

### Reference
The method `donky.ref(name, path)` is used to refer field to other document that has been created, therefore **the creation sequence matters!**. The method takes two arguments: the factory name and the path to be refer to (the default is `_id`). The `.field('author', donky.ref('user'))` tells that that the author field is referring to the document created from `user` factory.

#### Multiple references
To add multiple references, simply use `#` char to indicate that the specified field will be filled by an array of references, e.g.,  `.field('likes', donky.ref('user#'))` says field `likes` will be filled with an array of `_id` of document generated from the `user` factory.

### Sub-document
`donky.embed(name)` embeds a sub-document created from the passed name factory in the similar manner to `donky.ref`. `donky.embed` takes only one parameter: the name of the factory where the document is generated from.

#### Multiple sub-documents
Similar to `donky.ref`, the char `#` is used to mark that multiple sub-documents will be embedded.

## License:
The MIT License (MIT)

Copyright (c) Nauval Atmaja [nauval.atmaja@gmail.com](mailto:nauval.atmaja@gmail.com) (nauvalatmaja.com)

Permission is hereby granted, free of charge, to any person obtaining a copy<br>of this software and associated documentation files (the "Software"), to deal<br>in the Software without restriction, including without limitation the rights<br>to use, copy, modify, merge, publish, distribute, sublicense, and/or sell<br>copies of the Software, and to permit persons to whom the Software is<br>furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in<br>all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR<br>IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,<br>FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE<br>AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER<br>LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,<br>OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN<br>THE SOFTWARE.
