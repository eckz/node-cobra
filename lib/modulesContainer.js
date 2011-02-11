var nodeUtil = require('util');

var HookDispatcher = require('./hookDispatcher').HookDispatcher;

var ModulesContainer = function(){
	ModulesContainer.super_.call(this);
	
	this._modules = [];
	this._unknownModuleCount = 0;
	this._hooks = {
		'preRequest': [],
		'request': [],
		'preRequestFile': [],
		'requestFile': [],
		'requestUndispatched': []
	};
};

nodeUtil.inherits(ModulesContainer, require('events').EventEmitter);

var proto = ModulesContainer.prototype;

proto.addModule = function(module) {
	if(!module.name) {
		module.name = '<unknown' + this._unknownModuleCount++ + '>';
	}
	
	this._modules.push(module);
	
	if(typeof(module.init) === 'function') {
		var oldAddHook = this.addHook;
		this.addHook = oldAddHook.bind(this, module);
		
		module.init.call(module, this);
		console.log('module', module.name,'loaded');
		
		this.addHook = oldAddHook;
	} else {
		throw new Error('Object is not a module');
	}
};

proto.loadModule = function(name, priority) {
	var prefix = './modules/';
	var module = require(prefix + name);
	this.addModule(module, priority);
	return module;
};

proto.getModule = function(name, autoload) {
	var result = null;
	this._modules.forEach(function(m) {
		if(m.name === name) {
			result = m;
			return false;
		}
	});
	if(result === null && autoload === true) {
		result = this.loadModule(name);
	}
	return result;
};

proto.addHook = function(mod, name, priority, f) {
	if(typeof(mod) !== 'object') {
		throw new TypeError('module is not a object');
	}
	if(typeof(name) !== 'string') {
		throw new TypeError('name is not a string');
	}
	if(typeof(priority) !== 'number') {
		throw new TypeError('priority is not a number');
	}
	if(typeof(f) !== 'function') {
		throw 'f is not a function';
	}

	if(this._hooks[name] === undefined) {
		throw 'Unknown hook ' + name;
	}
	
	this._hooks[name].push({module: mod, priority: priority, f: f});
	this._reorderHook(name);
};

proto._reorderHook = function(name) {
	var h = this._hooks[name];
	h.sort(function(a,b) {
		return a.priority - b.priority;
	});
};

proto.triggerHookAsync = function(name, args, callback) {
	if(this._hooks[name] === undefined) {
		throw new Error('Unknown hook ' + name);
	}
	var dispatcher = new HookDispatcher(this._hooks[name]);
	args.push(dispatcher);
	dispatcher.dispatch(args, callback);
};

proto.triggerHook = function(name, args) {
	if(arguments.length > 2) {
		throw new Error('Too many arguments');
	}
	if(this._hooks[name] === undefined) {
		throw new Error('Unknown hook ' + name);
	}
	var dispatcher = new HookDispatcher(this._hooks[name]);
	return dispatcher.dispatchAll(args);
};

exports.ModulesContainer = ModulesContainer;
