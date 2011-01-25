var nodeHttp = require('http');
var nodePath = require('path');
var nodeUtil = require('util');

var _server;
var _config;

var _propertyHandler;

exports.name = 'config';

exports.init = function(server){
	_config = [];
	_server = server;
	
	server.addHook('request', -990, function(context) {
		_config.forEach(processRequest.bind(this, 'request', context));
	});
	server.addHook('requestFile', -990, function(context) {
		_config.forEach(processRequest.bind(this, 'requestFile', context));
	});
	
	_propertyHandler = {};
	
	_propertyHandler.modules = handleModules;
	_propertyHandler.ports = handlePorts;
	_propertyHandler.virtualhosts = handleVirtualHosts;
	//_propertyHandler.locations = handleLocations;
};

exports.loadConfig = function(config) {
	_config.push(config);
	
	processRequest('server', _server, config);
};

exports.addPropertyHandler = function(property, f) {
	_propertyHandler[property] = f;
}

exports.addPropertyHandlerAsIs = function(property, scopes) {
	_propertyHandler[property] = handleAsIs(property, scopes);
}

var processRequest = function(scope, context, config) {
	for(var property in config) {
		var handler = _propertyHandler[property];
		if(handler === undefined) {
			throw new Error('property \'' + property + '\' is not supported');
		}
		
		handler.call(null, scope, context, config[property]);
	}
};

/* default handlers */

var handleAsIs = function(name, scopes) {
	return function(scope, serverOrContext, value) {
		if(!scope in scopes) {
			return false;
		}
		var c = {};
		c[name] = value;
		serverOrContext.addConfig(c);
	};
};

var handleModules = function(scope, server, value) {
	if(scope == 'server') {
		value.forEach(function(m) {
			server.loadModule(m);
		});
	}
};

var handlePorts = function(scope, server, value) {
	if(scope == 'server') {
		value.forEach(function(p) {
			server.listenOn(p);
		});
	}
};

var _normalizeVirtualHosts = function(hosts) {
	var result = [];
	var r = /^([*a-z0-9.-]+)(:(*|[0-9]+))?$/i
	for(var host in hosts) {
		var m = r.exec(host);
		
		if(m == null) {
			throw new TypeError('virtualHost \'' + host + '\' is not a valid virtualHost');
		}
		
		var hostname = m[1];
		var port = m[3];
		if(port === undefined || port === '*') {
			port = "[0-9]+";
		}
		
		hostname = hostname.replace('*', '[^:]+');
		
		var regexp = new RegExp('^' + hostname + ':' + port + '$', 'i');
		
		result.push({regexp: regexp, content: hosts[host]});
	}
	
	return result;
};

var handleVirtualHosts = function(scope, context, value) {
	if(scope != 'request' && scope != 'requestFile') {
		return false;
	}
	
	if(!value._normalized) {
		value._normalized = _normalizeVirtualHosts(value);
	}
	
	value._normalized.forEach(function(h) {
		var regexp = h.regexp;
		var content = h.content;
		
		if(regexp.test(context.virtualHost)) {
			processRequest(scope, context, content);
			return false;
		}
	});
};

var _normalizeLocations = function(hosts) {
	var result = [];
	var r = /^\/[a-z0-9.-]$/i;
	for(var host in hosts) {
		var m = r.exec(host);
		
		var hostname = m[1];
		var port = m[3];
		if(port === undefined || port === '*') {
			port = "[0-9]+";
		}
		
		if(hostname == '*') {
			hostname = '[^:]+';
		}
		
		var regexp = new RegExp('^' + hostname + ':' + port + '$', 'i');
		
		result.push({regexp: regexp, content: hosts[host]});
	}
	
	return result;
};

var handleLocations = function(scope, context, value) {
	if(scope != 'request') {
		return false;
	}
	
	if(!value._normalized) {
		value._normalized = _normalizeLocations(value);
		console.log('locations',value._normalized);
	}
	
	for(var h in value._normalized) {
		var regex = h.regex;
		var content = h.content;
		
		if(regex.test(context.virtualHost)) {
			processRequest(scope, context, content);
			break;
		}
	}
};