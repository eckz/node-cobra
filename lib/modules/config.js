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
	
	server.addHook('preRequest', 0, function(context) {
		_config.forEach(processRequest.bind(this, 'request', context));
	});
	server.addHook('preRequestFile', 0, function(context) {
		_config.forEach(processRequest.bind(this, 'requestFile', context));
	});
	
	_propertyHandler = {};
	
	_propertyHandler.modules = handleModules;
	_propertyHandler.ports = handlePorts;
	_propertyHandler.virtualhosts = handleVirtualHosts;
	_propertyHandler.locations = handleLocations;
	_propertyHandler.directories = handleDirectories;
	_propertyHandler.files = handleFiles;
};

exports.loadConfig = function(config) {
	_config.push(config);
	
	processRequest('server', _server, config);
};

exports.addPropertyHandler = function(property, f) {
	_propertyHandler[property] = f;
};

exports.addPropertyHandlerAsIs = function(property, scopes) {
	_propertyHandler[property] = handleAsIs(property, scopes);
};

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
		serverOrContext.config[name] = value;
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
	var r = /^([*a-z0-9.-]+)(:(*|[0-9]+))?$/i;
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
		if(h.regexp.test(context.virtualHost)) {
			processRequest(scope, context, h.content);
			return;
		}
	});
};

var _normalizeLocations = function(locations) {
	var result = [];
	
	for(var location in locations) {
		var regexp = new RegExp('^' + location, 'i');
		result.push({regexp: regexp, content: locations[location], location: location});
	}
	
	result.sort(function(a,b) {
		return b.location.length - a.location.length;
	});
	
	return result;
};

var handleLocations = function(scope, context, value) {
	if(scope != 'request') {
		return false;
	}
	
	if(!value._normalized) {
		value._normalized = _normalizeLocations(value);
	}
	
	value._normalized.forEach(function(l) {
		if(l.regexp.test(context.location)) {
			processRequest(scope, context, l.content);
		}
	});
};



var _normalizeDirectories = function(dirs) {
	var result = [];
	
	for(var dir in dirs) {
		var content = dirs[dir];
		dir = nodePath.resolve(dir);
		var regexp = new RegExp(dir[0] == '~' ? dir.slice(1) : ('^' + dir));
		
		result.push({regexp: regexp, content: content});
	}
	
	return result;
};

var handleDirectories = function(scope, context, value) {
	if(scope != 'requestFile') {
		return false;
	}
	
	if(!value._normalized) {
		value._normalized = _normalizeDirectories(value);
	}
	
	value._normalized.forEach(function(d) {
		if(d.regexp.test(context.path)) {
			processRequest(scope, context, d.content);
		}
	});
};

var _normalizeFiles = function(files) {
	var result = [];
	
	for(var file in files) {
		var content = files[file];
		var regexp = new RegExp(file[0] == '~' ? file.slice(1) : ('^' + file + '$'));
		result.push({regexp: regexp, content: content});
	}
	
	return result;
};

var handleFiles = function(scope, context, value) {
	if(scope != 'requestFile') {
		return false;
	}
	if(!context.pathStat.isFile()) {
		return false;
	}
	
	if(!value._normalized) {
		value._normalized = _normalizeFiles(value);
	}
	
	value._normalized.forEach(function(d) {
		var file = nodePath.basename(context.path);
		if(d.regexp.test(file)) {
			processRequest(scope, context, d.content);
		}
	});
};