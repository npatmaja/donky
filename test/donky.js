var mongoose = require('mongoose');
var expect = require('chai').expect;
var Donky = require('../');
var donky = new Donky(mongoose);

describe('Donky', function() {
  var factory;

  function createSchema(done) {
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
      comments: [CommentSchema]
    });

    mongoose.model('User', UserSchema);
    mongoose.model('Post', PostSchemma);
    mongoose.model('Comment', CommentSchema);

    done();
  }

  before(function(done) {
    createSchema(done);
  });

  afterEach(function(done) {
    donky.reset();
    done();
  });

  describe('#factory', function() {
    factory = donky.factory();

    it('returns factory as an object', function(done) {
      expect(factory).to.be.ok;
      expect(factory).to.be.a('object');
      done();
    });

    it('is chainable ', function(done) {
      expect(factory.schema()).to.be.ok;
      expect(factory.schema('User', 'admin')).to.be.ok;
      expect(factory.schema().field('a', 'a')).to.be.ok;
      expect(factory.schema().field('a', 'a').field('b', 'b')).to.be.ok;
      done();
    });

    it('registers the schema template', function(done) {
      donky.factory()
        .schema('User', 'user1')
        .field('username', 'dummyuser1')
        .field('email', 'dummyemail1');

      expect(donky._factories).to.not.empty;
      expect(donky._factories).to.have.property('user1');
      expect(donky._factories).to.have.deep.property('user1');
      expect(donky._factories).to.have.deep.property('user1.model', 'User');
      expect(donky._factories).to.have.deep.property('user1.name', 'user1');
      expect(donky._factories).to.have.deep.property('user1._schema');
      expect(donky._factories).to.have.deep
        .property('user1._schema.fields.username', 'dummyuser1');
      expect(donky._factories).to.have.deep
        .property('user1._schema.fields.email', 'dummyemail1');
      done();
    });
  });

  describe('#create', function() {
    beforeEach(function(done) {
      donky.factory()
        .schema('User', 'user2')
        .field('username', 'dummyuser2')
        .field('email', 'dummyemail2@email.com')
        .field('isActive', true)
        .field('isAdmin', false);

      donky.create('user2');
      done();
    });

    it('constructs the mongoose schema', function(done) {
      expect(donky._factories).to.have.deep
        .property('user2._schema.fields.username', 'dummyuser2');
      expect(donky._factories).to.have.deep
        .property('user2._schema.fields.email', 'dummyemail2@email.com');
      expect(donky._factories).to.have.deep
        .property('user2._schema.fields.isActive', true);
      expect(donky._factories).to.have.deep
        .property('user2._schema.fields.isAdmin', false);
      done();
    });

    it('creates mongoose instance', function(done) {
      expect(donky._mongooseInstances).to.have.any.keys(['user2']);
      expect(donky._mongooseInstances).to.have.deep.property('user2.save');
      expect(donky._mongooseInstances).to.have.deep
        .property('user2.username', 'dummyuser2');
      expect(donky._mongooseInstances).to.have.deep
        .property('user2.email', 'dummyemail2@email.com');
      expect(donky._mongooseInstances).to.have.deep
        .property('user2.isActive', true);
      expect(donky._mongooseInstances).to.have.deep
        .property('user2.isAdmin', false);
      done();
    });
  });
});
