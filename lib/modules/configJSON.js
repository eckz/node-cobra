var nodeFs = require('fs');

exports.name = 'configJSON';

var _server;

exports.init = function(server) {
	_server = server;
	server.configurationHandlers['.json'] = this;
};

exports.loadConfig = function(filename) {
	var fileContents = nodeFs.readFileSync(filename, 'utf-8');
	
	var json = JSON.parse(fileContents);
	
	// get module and autoload
	var confModule = _server.getModule('config', true);
	confModule.loadConfig(json);
};
