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
      var instanceName = i === 0
        ? name
        : [name, '#', (i - 1)].join('');

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
    var isMultipleReference;
    var reference;
    var referred;

    for (var key in options) {
      if (!options.hasOwnProperty(key)) continue;

      isNotInstanceOfReference = !instanceOf(options[key], Reference);

      if (isNotInstanceOfReference) continue;

      reference = options[key];
      isMultipleReference = reference.model.charAt(reference.model.length - 1) === '#';

      if (isMultipleReference) {
        referred = _this._getMultipleReference(reference);
      } else {
        referred = _this._getReference(reference);
      }

      options[key] = referred;
    }
  }

  function handleEmbedment() {
    var isNotInstanceOfEmbedment;
    var isMultipleEmbedment;
    var reference;
    var referred;

    for (var key in options) {
      if (!options.hasOwnProperty(key)) continue;
      isNotInstanceOfEmbedment = !instanceOf(options[key], Embedment);
      if (isNotInstanceOfEmbedment) continue;

      reference = options[key];
      isMultipleEmbedment = reference.model.charAt(reference.model.length - 1) === '#';

      if (isMultipleEmbedment) {
        referred = _this._getMultipleEmbedment(reference);
      } else {
        referred = _this._getEmbedment(reference);
      }

      options[key] = referred;
    }
  }

  instanceName = instanceName || name;
  modelName = this._factories[name].model;
  Model = this._mongoose.model(modelName);
  options = this._factories[name]._schema.fields;
  handleReference();
  handleEmbedment();
  instance = new Model(options);
  this._mongooseInstances[instanceName] = instance;
};

Donky.prototype.getInstance = function(name) {
  return this._mongooseInstances[name];
};

Donky.prototype._getReference = function(reference) {
  var referred = this._mongooseInstances[reference.model];

  if (!referred) {
    throw new Error(['No instance of', reference.model, 'instantiated'].join(' '));
  }

  return referred[reference.path];
};

Donky.prototype._getMultipleReference = function(reference) {
  var result = [];
  var name = reference.model.substr(0, reference.model.length - 1);
  var pattern = new RegExp([name, '(?=)'].join(''), 'i');

  for (var key in this._mongooseInstances) {
    if (!this._mongooseInstances.hasOwnProperty(key)) continue;
    if (key.search(pattern) !== -1) {
      result.push(this._mongooseInstances[key][reference.path]);
    }
  }

  if (result.length === 0) {
    throw new Error(['No instance of', reference.model, 'instantiated'].join(' '));
  }

  return result;
};

Donky.prototype._getEmbedment = function(reference) {
  var referred = this._mongooseInstances[reference.model];

  if (!referred) {
    throw new Error(['No instance of', reference.model, 'instantiated'].join(' '));
  }

  return referred.toObject();
};

Donky.prototype._getMultipleEmbedment = function(reference) {
  var result = [];
  var name = reference.model.substr(0, reference.model.length - 1);
  var pattern = new RegExp([name, '(?=)'].join(''), 'i');

  for (var key in this._mongooseInstances) {
    if (!this._mongooseInstances.hasOwnProperty(key)) continue;
    if (key.search(pattern) !== -1) {
      result.push(this._mongooseInstances[key].toObject());
    }
  }

  if (result.length === 0) {
    throw new Error(['No instance of', reference.model, 'instantiated'].join(' '));
  }

  return result;
};

Donky.prototype.ref = function(model, path) {
  return new Reference(model, path);
};

Donky.prototype.embed = function(model) {
  return new Embedment(model);
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

function Embedment(model) {
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
