var mongoose = require('mongoose');
var expect = require('chai').expect;
var Donky = require('../');
var donky = new Donky(mongoose);

describe('Donky', function() {
  var schema;

  function creteSchema(done) {
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

    var PostSchemma = new mongoose.Schema({
      post: { type: String },
      author: {
        type:  mongoose.Schema.ObjectId,
        ref: 'User'
      },
      comments: [CommentSchema]
    });

    var CommentSchema = new mongoose.Schema({
      author: { type: String },
      comment: { type: String }
    });

    mongoose.model('User', UserSchema);
    mongoose.model('Post', PostSchemma);
    mongoose.model('Comment', CommentSchema);

    done();
  }

  before(function(done) {
    createSchema(done);
  });

  describe('#factory', function() {
    it('returns schema', function(done) {
      schema = donky.factory();

      expect(schema).to.be.ok;
      expect(schema.hasOwnProperty()).to.be.ok;
      expect(schema.field).to.be.ok;
      expect(schema.field).to.be.a('function');
    });
  });
});
