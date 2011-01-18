var nodeUtil = require('util');

var ModulesContainer = function(){
	ModulesContainer.super_.call(this);
};

nodeUtil.inherits(ModulesContainer, require('events').EventEmitter);

ModulesContainer.prototype._modules = [];
ModulesContainer.prototype._modulesMap = [];

ModulesContainer.prototype.addModule = function(mod, priority) {
	if(priority === undefined) {
		if(mod.priority !== undefined) {
			priority = mod.priority;
		} else {
			priority = 0;
		}
	}
	this._modulesMap.push({module:mod, priority: priority});
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

/*
 * HookDispatcher
 */

var HookDispatcher = function(modules){
	this.modules = [];
	this.modules.push.apply(this.modules, modules);
};

HookDispatcher.prototype.dispatch = function(method, args, callback) {
	this.method = method;
	this.args = args;
	this.callback = callback;
	this.result = 'undispatched';
	
	this.dispatchNext();
};

HookDispatcher.prototype.dispatchNext = function(result) {
	if(result) {
		this.result = result;
		if(result == 'dispatched') {
			this.finishDispatch();
			return;
		}
	}
	if(this.modules.length == 0) {
		this.finishDispatch();
	}
	
	var module = this.modules.shift();
	var result = null;
	var callable = module[this.method];
	
	if(typeof(callable) === 'function') {
		
		console.log('executing',this.method,'in',module.name,'module');
		
		var res = callable.apply(module, this.args);
		if(res === undefined) {
			res = 'undispatched';
		}
		this.result = res;
	}
	
	if(this.result == 'dispatched') {
		this.finishDispatch();
	} else if(this.result == 'undispatched'){
		this.dispatchNext();
	}
};

HookDispatcher.prototype.finishDispatch = function() {
	this.callback.call(null, this.result);
};

exports.ModulesContainer = ModulesContainer;
exports.HookDispatcher = HookDispatcher;
