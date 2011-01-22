var nodeUtil = require('util');

var ModulesContainer = function(){
	ModulesContainer.super_.call(this);
};

nodeUtil.inherits(ModulesContainer, require('events').EventEmitter);

ModulesContainer.prototype._modules = [];
ModulesContainer.prototype._modulesMap = [];
ModulesContainer.prototype._modulesNameMap = [];

ModulesContainer.prototype.unknownModuleCount = 0;

ModulesContainer.prototype.addModule = function(mod, priority) {
	if(priority === undefined) {
		if(mod.priority !== undefined) {
			priority = mod.priority;
		} else {
			priority = 0;
		}
	}
	
	var name = mod.name;
	
	if(!name) {
		name = '<unknown' + this.unknownModuleCount++ + '>';
	}
	
	if(this._modulesNameMap[name] !== undefined) {
		var originalName = name;
		var i = 1;
		while(this._modulesNameMap[name] === undefined) {
			name = originalName + i++;
		}
	}
	
	this._modulesMap.push({module:mod, priority: priority, 'name': name});
	this._modulesNameMap[name] = mod;
	this._reorderModules();
	
	if(typeof(mod.init) === 'function') {
		console.log('initialiting',mod.name,'module');
		mod.init.call(mod, this);
	}
};

ModulesContainer.prototype.loadModule = function(file, priority) {
	var prefix = './modules/';
	var mod = require(prefix + file);
	this.addModule(mod, priority);
};

ModulesContainer.prototype.getModule = function(name) {
	return this. _modulesNameMap[name];
};

ModulesContainer.prototype._reorderModules = function() {
	this._modulesMap.sort(function(a,b) {
		a = a.priority;
		b = b.priority;
		return a - b;
	});
	this._modules = this._modulesMap.map(function(m) { return m.module; });
};

ModulesContainer.prototype.triggerHook = function(hook, args, callback) {
	var dispatcher = new HookDispatcher(this._modules);
	args.push(dispatcher);
	dispatcher.dispatch(hook, args, callback);
};

ModulesContainer.prototype.triggerHookReversed = function(hook, args, callback) {
	var dispatcher = new HookDispatcher(this._modules, true);
	args.push(dispatcher);
	dispatcher.dispatch(hook, args, callback);
};

/*
 * HookDispatcher
 */

var HookDispatcher = function(modules, reversed){
	this.modules = [];
	this.modules.push.apply(this.modules, modules);
	if(reversed === true) {
		this.modules.reverse();
	}
};

HookDispatcher.prototype.dispatch = function(method, args, callback) {
	this.method = method;
	this.args = args;
	this.callback = callback;
	this.result = 'undispatched';
	
	this.dispatchNext();
};

HookDispatcher.prototype.dispatchNext = function() {
	
	if(this.modules.length == 0) {
		this.finishDispatch();
		return;
	}
	
	var module = this.modules.shift();
	var result = null;
	var callable = module[this.method];
	
	var res = 'undispatched';
	
	if(typeof(callable) === 'function') {
		
		//console.log('executing',this.method,'in',module.name,'module');
		
		res = callable.apply(module, this.args);
		
		if(res === undefined || res === false) {
			res = 'undispatched';
		}
		if(res === true) {
			res = 'dispatched';
		}
	}
	
	if(res == 'dispatched') {
		this.result = 'dispatched';
		this.finishDispatch();
	} else if(res == 'undispatched'){
		this.dispatchNext();
	}
	
	
};

HookDispatcher.prototype.dispatched = function() {
	this.result = 'dispatched';
	this.finishDispatch();
};

HookDispatcher.prototype.finishDispatch = function() {
	this.callback.call(null, this.result);
};

exports.ModulesContainer = ModulesContainer;
exports.HookDispatcher = HookDispatcher;
