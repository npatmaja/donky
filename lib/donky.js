var Chance = require('chance');
var Q = require('q');

function Donky(mongoose) {
  this._mongoose = mongoose;
  this._factories = {};
  this._documentInstances = {};
}

Donky.prototype.factory = function() {
  return new Factory(this._factories);
};

Donky.prototype.reset = function() {
  this._documentInstances = {};
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
  var promise;

  if (isFunction(number)) callback = number;

  if (isMultiple) {
    promise = this._createMultiple(name, number).nodeify(callback);
  } else {
    promise = this._createSingle(name).nodeify(callback);
  }

  return promise;
};

Donky.prototype._createMultiple = function(name, number) {
  var _this = this;
  var tasks;

  tasks = Array.apply(null, Array(number)).map(function(task, i) {
    var deferred = Q.defer();
    var docName;
    var doc;

    docName = i === 0 ? name : [name, '#', (i - 1)].join('');
    doc = _this._build(name, docName);
    doc.save(function(err, res) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(res);
      }
    });

    return deferred.promise;
  });

  return Q.all(tasks);
};

Donky.prototype._createSingle = function(name) {
  var doc = this._build(name);
  var deferred = Q.defer();

  doc.save(function(err, res) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(res);
    }
  });

  return deferred.promise;
};

Donky.prototype._build = function(name, docName) {
  var modelName;
  var instance;
  var options;
  var Model;
  var _this = this;

  if (!this._factories[name]) {
    throw new Error(['No factory for', name, 'found'].join(' '));
  }

  var handler = {
    handleReference: function() {
      this._getReferred(Reference);
    },

    handleEmbedment: function() {
      this._getReferred(Embedment);
    },

    _getReferred: function(type) {
      var typeName = getFnName(type);
      var isNotInstanceOfType;
      var isMultipleType;
      var reference;
      var fnToCall;
      var referred;

      for (var key in options) {
        if (!options.hasOwnProperty(key)) continue;

        isNotInstanceOfType = !instanceOf(options[key], type);

        if (isNotInstanceOfType) continue;

        reference = options[key];
        isMultipleType = reference.model.charAt(reference.model.length - 1) === '#';
        fnToCall = isMultipleType
          ? ['_getMultiple', typeName].join('')
          : ['_get', typeName].join('');
        referred = _this[fnToCall](reference);

        options[key] = referred;
      }
    }
  };

  docName = docName || name;
  modelName = this._factories[name].model;
  Model = this._mongoose.model(modelName);
  options = this._factories[name]._schema.fields;

  handler.handleReference();
  handler.handleEmbedment();

  instance = new Model(options);
  this._documentInstances[docName] = instance;

  return instance;
};

Donky.prototype.getDocument = function(name) {
  return this._documentInstances[name];
};

Donky.prototype._getReference = function(reference) {
  var referred = this._documentInstances[reference.model];

  if (!referred) {
    throw new Error(['No instance of', reference.model, 'instantiated'].join(' '));
  }

  return referred[reference.path];
};

Donky.prototype._getMultipleReference = function(reference) {
  var result = [];
  var name = reference.model.substr(0, reference.model.length - 1);
  var pattern = new RegExp([name, '(?=)'].join(''), 'i');

  for (var key in this._documentInstances) {
    if (!this._documentInstances.hasOwnProperty(key)) continue;
    if (key.search(pattern) !== -1) {
      result.push(this._documentInstances[key][reference.path]);
    }
  }

  if (result.length === 0) {
    throw new Error(['No instance of', reference.model, 'instantiated'].join(' '));
  }

  return result;
};

Donky.prototype._getEmbedment = function(reference) {
  var referred = this._documentInstances[reference.model];

  if (!referred) {
    throw new Error(['No instance of', reference.model, 'instantiated'].join(' '));
  }

  return referred.toObject();
};

Donky.prototype._getMultipleEmbedment = function(reference) {
  var result = [];
  var name = reference.model.substr(0, reference.model.length - 1);
  var pattern = new RegExp([name, '(?=)'].join(''), 'i');

  for (var key in this._documentInstances) {
    if (!this._documentInstances.hasOwnProperty(key)) continue;
    if (key.search(pattern) !== -1) {
      result.push(this._documentInstances[key].toObject());
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
 * Object to hold the reference to other
 * document.
 * @param {String} name The schema name
 * @param {String} path The referenced path from the schema
 */
function Reference(model, path) {
  this.path = path || '_id';
  this.model = model;
}

/**
 * Object to hold the embedded sub document
 * @param {String} model The schema name of the embedded document
 */
function Embedment(model) {
  this.model = model;
}

/*
  Helper functions
 */
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

function getFnName(fn) {
  var f = typeof fn == 'function';
  var s = f && ((fn.name && ['', fn.name]) || fn.toString().match(/function ([^\(]+)/));
  return (!f && 'not a function') || (s && s[1] || 'anonymous');
}

// Exports the API
module.exports = Donky;
