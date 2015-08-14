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
    describe('when creating unregistered factory', function(done) {
      it('throws an Error', function(done) {
        expect(donky.create.bind(donky, 'dummy'))
          .to.throw(Error);
        expect(donky.create.bind(donky, 'dummy'))
          .to.throw('No factory for dummy found');
        done();
      });
    });

    describe('when creating registered factory', function(done) {
      var instance;

      beforeEach(function(done) {
        donky.factory()
          .schema('User', 'user2')
          .field('username', 'dummyuser2')
          .field('email', 'dummyemail2@email.com')
          .field('isActive', true)
          .field('isAdmin', false);

        instance = donky.create('user2');
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
          .property('user2._id');
        expect(donky._mongooseInstances.user2._id).to.be.a('object');
        expect(donky._mongooseInstances.user2._id.toString()).to.have
          .length.of.at.least(24);
        expect(donky._mongooseInstances.user2._id.toString()).to.have
          .length.of.at.most(24);
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

      it('returns mongoose instance', function(done) {
        expect(instance).to.be.ok;
        expect(instance).to.have.property('save');
        expect(instance).to.have.property('_id');
        expect(instance._id).to.be.a('object');
        expect(instance._id.toString()).to.have
          .length.of.at.least(24);
        expect(instance._id.toString()).to.have
          .length.of.at.most(24);
        expect(instance).to.have
          .property('username', 'dummyuser2');
        expect(instance).to.have
          .property('email', 'dummyemail2@email.com');
        expect(instance).to.have
          .property('isActive', true);
        expect(instance).to.have
          .property('isAdmin', false);
        done();
      });
    });
  });

  describe('#gen', function(done) {
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

    it('returns chance generator', function(done) {
      expect(donky.gen).to.be.ok;
      expect(donky.gen.name()).to.be.a('string');
      expect(donky.gen.email()).match(/@/);
      expect(donky.gen.bool()).to.be.a('boolean');
      done();
    });
  });

  describe('reference', function(done) {
    var userInstance;
    var postInstance;

    before(function(done) {
      donky.factory()
        .schema('User', 'user1')
        .field('username', donky.gen.name())
        .field('email', donky.gen.email());

      donky.factory()
        .schema('Post', 'post1')
        .field('post', donky.gen.paragraph())
        .field('author', donky.ref('user1'));

      userInstance = donky.create('user1');
      postInstance = donky.create('post1');

      done();
    });

    describe('when the referred model not instantiated', function(done) {
      before(function(done) {
        donky.factory()
          .schema('Post', 'post2')
          .field('post', donky.gen.paragraph())
          .field('author', donky.ref('user2'));

        done();
      });

      it('throws Error', function(done) {
        expect(donky.create.bind(donky, 'post2'))
          .to.throw('No instance of user2 instantiated');
        done();
      });
    });

    describe('when the referred model instantiated', function(done) {
      it('refers to the right model', function(done) {
        expect(postInstance.author).to.be.equal(userInstance._id);
        done();
      });
    });
  });

  describe('multiple fixture creation', function(done) {
    // body
  });
});
