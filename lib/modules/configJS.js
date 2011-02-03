var nodeFs = require('fs');
var nodeVm = require('vm');

exports.name = 'ConfigJS';

var _configs = [];

var runMethod = function(method, args) {
	_configs.forEach(function(c) {
		if(typeof(c.sandbox[method]) === 'function') {
			c.sandbox[method].apply(c.sandbox, args);
		}
	});
};

var runMethodProxy = function(method) {
	return function() {
		runMethod(method, arguments);
	};
};

var _server;

exports.init = function(server) {
	_server = server;
	server.configurationHandlers['.js'] = this;
	
	server.addHook('request', -1000, runMethodProxy('request'));
	server.addHook('requestFile', -1000, runMethodProxy('requestFile'));
};

exports.loadConfig = function(filename) {
	var fileContents = nodeFs.readFileSync(filename, 'utf-8');
	
	var script = nodeVm.createScript(fileContents, filename);
	var sandbox = {};
	
	script.runInNewContext(sandbox);
	
	var configObject = {
		sandbox: sandbox,
		script: script
	};
	
	_configs.push(configObject);
	
	if(typeof(sandbox.init) == 'function') {
		sandbox.init.call(sandbox, _server);
	}
};
