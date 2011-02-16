
var cgiLib = require('cgi-lib');
var fastcgiLib = require('fastcgi-lib');

exports.name = 'fastcgi';

exports.init = function(server) {
	var handlerModule = server.getModule('handler', true);
	handlerModule.addHandler(this, 'fastcgi');

	var confModule = server.getModule('config');
	if (confModule) {
		confModule.addPropertyHandlerAsIs('cgiScript', [ 'request',
				'requestFile' ]);
	}
};

exports.handle = function(context, dispatcher) {
	throw new Error('unimplemented');
};
