
/*
 * HookDispatcher
 */

var HookDispatcher = function(hooks){
	this._hooks = [];
	this._hooks.push.apply(this._hooks, hooks);
};

var proto = HookDispatcher.prototype;

proto.dispatch = function(args, callback) {
	this._args = args;
	this._callback = callback;
	this._result = 'undispatched';
	
	this.dispatchNext();
};

proto.dispatchNext = function(previousResult, previousError) {
	if(previousResult) {
		if(previousResult !== 'undispatched') {
			this._result = previousResult;
			this._error = previousError;
			this._finishDispatch();
			return;
		}
	}
	if(this._hooks.length == 0) {
		this._finishDispatch();
		return;
	}
	
	var h = this._hooks.shift();
	var result = null;
	var callable = h.f;
	
	var res = 'undispatched';
	
	try {
		res = callable.apply(module, this._args);
	}catch(e) {
		this.exception(e);
		return;
	}
	
	if(res === undefined || res === false) {
		res = 'undispatched';
	}
	if(res === true) {
		res = 'dispatched';
	}
	
	if(res == 'dispatched') {
		this._result = 'dispatched';
		this._finishDispatch();
	} else if(res == 'undispatched'){
		this.dispatchNext();
	}
};

/* alias */
proto.next = proto.dispatchNext;

proto.dispatched = function() {
	this._result = 'dispatched';
	this._finishDispatch();
};

proto._finishDispatch = function() {
	this._callback.call(null, this._result, this._error);
};

proto.exception = function(e) {
	this._result = 'error';
	this._error = e;
	this._finishDispatch();
};

proto.checked = function(f, scope) {
	try {
		f.call(scope);
	} catch(e) {
		this.exception(e);
	}
};

proto.checkedProxy = function(f, scope) {
	var dispatcher = this;
	return function() {
		try {
			f.apply(scope, arguments);
		} catch(e) {
			dispatcher.exception(e);
		}
	};
};

exports.HookDispatcher = HookDispatcher;