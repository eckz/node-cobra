
var EventEmitter = require('events').EventEmitter;
var nodeUtils = require('utils');

var Request = function() {
	this.stdout = new EventEmitter();
	this.stderr = new EventEmitter();
};

nodeUtils.inherits(Request, EventEmitter);