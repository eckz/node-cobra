var _handlers;

exports.name = 'handler';

exports.init = function(server){
	_handlers = {};
	
	server.addHook('request', 300, processHook);
	server.addHook('requestFile', 300, processHook);
	
	var confModule = server.getModule('config');
	if(confModule) {
		confModule.addPropertyHandlerAsIs('handler', ['request', 'requestFile']);
	}
};

exports.addHandler = function(module, name) {
	if(typeof module.handle != 'function') {
		throw new Error('module \'' + module.name + ' need a handle function');
	}
	_handlers[name] = module;
};

var processHook = function(context, dispatcher) {
	var handlerName = context.config.handler;
	
	if(handlerName === undefined) {
		return false;
	}
	
	var handler = _handlers[handlerName];
	
	if(handler === undefined) {
		throw new Error('handler \'' + handlerName + '\' is not defined');
	}
	
	return handler.handle.call(handler, context, dispatcher);
};