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
  this._mongooseInstances = {};
};

Donky.prototype.resetFactory = function() {
  this._factories = {};
};

Donky.prototype.resetAll = function() {
  this.resetFactory();
  this.reset();
};

Donky.prototype.create = function(name, number, callback) {
  var isMultiple = isNumber(number);
  var deferred = Q.defer();
  var _this = this;
  var instance;
  var tasks;

  if (isFunction(number)) callback = number;

  // TODO multiple creation
  if (isMultiple) {
    tasks = Array.apply(null, Array(number)).map(function(task, i) {
      var _deferred = Q.defer();
      var _instance;
      var instanceName = [name, '#', i].join();

      _this._build(name, instanceName);

      _instance = _this._mongooseInstances[instanceName];
      _instance.save(function(err, doc) {
        if (err) {
          _deferred.reject(err);
        } else {
          _deferred.resolve(doc);
        }
      });

      return _deferred.promise;
    });

    return Q.all(tasks).nodeify(callback);
  } else {
    this._build(name);

    instance = this._mongooseInstances[name];
    instance.save(function(err, doc) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(doc);
      }
    });

    deferred.promise.nodeify(callback);
    return deferred.promise;
  }
};

Donky.prototype._build = function(name, instanceName) {
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

      isNotInstanceOfReference = !instanceOf(options[key], Reference);

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

  instanceName = instanceName || name;
  modelName = this._factories[name].model;
  Model = this._mongoose.model(modelName);
  options = this._factories[name]._schema.fields;
  handleReference();
  instance = new Model(options);
  this._mongooseInstances[instanceName] = instance;
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

function isFunction(value) {
  var fnTag = '[object Function]';
  return isObject(value) && Object.prototype.toString.call(value) == fnTag;
}

function isNumber(value) {
  var fnTag = '[object Number]';
  return Object.prototype.toString.call(value) == fnTag;
}

function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

function instanceOf(value, obj) {
  return value instanceof obj;
}

module.exports = Donky;
