var nodeFs = require('fs');
var nodeVm = require('vm');

exports.name = 'configJSON';

var _server;

exports.init = function(server) {
	_server = server;
	server.configurationHandlers['.json'] = this;
};

exports.loadConfig = function(filename) {
	var fileContents = nodeFs.readFileSync(filename, 'utf-8');
	
	var json = JSON.parse(fileContents);
	
	var confModule = _server.getModule('config');
	if(!confModule) {
		_server.loadModule('config');
		confModule = _server.getModule('config');
	}
	
	confModule.loadConfig(json);
};
