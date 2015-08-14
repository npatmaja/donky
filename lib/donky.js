var Chance = require('chance');
var Q = require('q');

function Donky(mongoose) {
  this._mongoose = mongoose;
  this._factories = {};
  this._mongooseInstances = {};
}

Donky.prototype.factory = function() {
  return new Factory(this._factories);
};

Donky.prototype.reset = function() {
  this._factories = {};
  this._mongooseInstances = {};
};

Donky.prototype.create = function(name) {
  var modelName;
  var instance;
  var options;
  var Model;
  var _this = this;

  if (!this._factories[name]) {
    throw new Error(['No factory for', name, 'found'].join(' '));
  }

  function handleReference() {
    var isNotInstanceOfReference;
    var refModelName;
    var reference;
    var referred;
    var path;

    for (var key in options) {
      if (!options.hasOwnProperty(key)) continue;

      isNotInstanceOfReference = !(options[key] instanceof Reference);

      if (isNotInstanceOfReference) continue;

      reference = options[key];
      refModelName = reference.model;
      path = reference.path;
      referred = _this._mongooseInstances[refModelName];

      if (!referred) {
        throw new Error(['No instance of', refModelName, 'instantiated'].join(' '));
      }

      options[key] = referred._id;
    }
  }

  modelName = this._factories[name].model;
  Model = this._mongoose.model(modelName);
  options = this._factories[name]._schema.fields;
  handleReference();
  instance = new Model(options);

  this._mongooseInstances[name] = instance;

  return instance;
};

Donky.prototype.ref = function(model, path) {
  return new Reference(model, path);
};

Donky.prototype.gen = new Chance();

/**
 * Factory object
 * @param {Array} registry [description]
 */
function Factory(registry) {
  this._registry = registry;
  this.model = '';
  this.name = '';
  this._schema;
}

Factory.prototype.schema = function(model, name) {
  this.name = name;
  this.model = model;
  this._schema = new Schema();
  this._registry[name] = this;

  return this._schema;
};

/**
 * Schema object to store the fields
 * of the schema.
 */
function Schema() {
  this.fields = {};
}

Schema.prototype.field = function(field, value) {
  this.fields[field] = value;
  return this;
};

/**
 * Record the reference
 * @param {[type]} name [description]
 * @param {[type]} path [description]
 */
function Reference(model, path) {
  this.path = path || '_id';
  this.model = model;
}

module.exports = Donky;
