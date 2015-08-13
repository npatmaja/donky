var sinon = require('sinon');
var mongoose  = require('mongoose');

sinon.stub(mongoose.Model.prototype, 'save', function(cb) {
  var _this = this;

  this.validate(function(err) {
    if (!err) {
      _this.isNew = false;
    }

    cb(err, _this);
  });
});
