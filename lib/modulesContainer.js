var nodeUtil = require('util');

var HookDispatcher = require('./hookDispatcher').HookDispatcher;

var ModulesContainer = function(){
	ModulesContainer.super_.call(this);
	
	this._modules = [];
	this._unknownModuleCount = 0;
	this._hooks = {
		'request': [],
		'requestFile': [],
		'requestUndispatched': []
	}
};

nodeUtil.inherits(ModulesContainer, require('events').EventEmitter);

var proto = ModulesContainer.prototype;

proto.addModule = function(module) {
	if(!module.name) {
		module.name = '<unknown' + this._unknownModuleCount++ + '>';
	}
	
	this._modules.push(module);
	
	if(typeof(module.init) === 'function') {
		module.init.call(module, this);
		console.log('module', module.name,'loaded');
	} else {
		throw 'Object is not a module';
	}
};

proto.loadModule = function(file, priority) {
	var prefix = './modules/';
	var module = require(prefix + file);
	this.addModule(module, priority);
};

proto.getModule = function(name) {
	var result = null;
	this._modules.forEach(function(m) {
		if(m.name === name) {
			result = m;
			return false;
		}
	});
	return result;
};

proto.addHook = function(name, priority, f) {
	if(typeof(name) !== 'string') {
		throw 'name is not a string';
	}
	if(typeof(priority) !== 'number') {
		throw 'priority is not a number';
	}
	if(typeof(f) !== 'function') {
		throw 'f is not a function';
	}

	if(this._hooks[name] === undefined) {
		throw 'Unknown hook ' + name;
	}
	
	this._hooks[name].push({priority: priority, f: f});
	this._reorderHook(name);
}

proto._reorderHook = function(name) {
	var h = this._hooks[name];
	h.sort(function(a,b) {
		return a.priority - b.priority;
	});
};

proto.triggerHook = function(name, args, callback) {
	if(this._hooks[name] === undefined) {
		throw 'Unknown hook ' + name;
	}
	var dispatcher = new HookDispatcher(this._hooks[name]);
	args.push(dispatcher);
	dispatcher.dispatch(args, callback);
};

exports.ModulesContainer = ModulesContainer;
