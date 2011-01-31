var nodePath = require('path');
var nodeUrl = require('fs');

exports.name = 'core';

exports.init = function(server) {
	server.addHook('request', -500, request);
	
	var confModule = server.getModule('config');
	if(confModule) {
		confModule.addPropertyHandlerAsIs('redirect', ['request']);
		confModule.addPropertyHandlerAsIs('redirectCode', ['request']);
	}
};

var request = function(context, dispatcher) {
	var redirect = context.config.redirect;
	
	if(redirect) {
		var newLocation = redirect + context.location;
		context.addHeaders({'Location': newLocation + '/'});
		
		var code = context.config.redirectCode || 302;
		
		context.writeHeaders(code);
		context.end();
		return true;
	}
	
	return false;
};