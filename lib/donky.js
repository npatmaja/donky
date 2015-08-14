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

  if (!this._factories[name]) {
    throw new Error(['No factory found for ', name].join(''));
  }

  modelName = this._factories[name].model;
  Model = this._mongoose.model(modelName);
  options = this._factories[name]._schema.fields;
  instance = new Model(options);

  this._mongooseInstances[name] = instance;
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

module.exports = Donky;
