var nodePath = require('path');
var nodeQuerystring = require('querystring');

exports.createEnviroment = function (context) {
	var config = context.config,
	    request = context.request,
	    headers = request.headers;

	var env = {
		'DOCUMENT_ROOT' : nodePath.resolve(config.documentRoot),
		'HTTP_COOKIE' : headers.cookie,
		'HTTP_HOST' : headers.host,
		'HTTP_REFERER' : headers.referer,
		'HTTP_USER_AGENT' : headers['user-agent'],
		'HTTP_ACCEPT' : headers.accept,
		'HTTP_ACCEPT_CHARSET' : headers['accept-charset'],
		'HTTP_ACCEPT_ENCODING' : headers['accept-encoding'],
		'HTTP_ACCEPT_LANGUAGE' : headers['accept-language'],
		'HTTPS' : 'Off',
		//'PATH' : context.location,
		'QUERY_STRING' : nodeQuerystring.stringify(context.query),
		'REMOTE_ADDR' : context.remoteAddress,
		'REMOTE_PORT' : context.remotePort,
		'REQUEST_METHOD' : request.method,
		'REQUEST_URI' : context.url,
		'SCRIPT_FILENAME' : context.path,
		'SCRIPT_NAME' : context.path,
		// 'SERVER_ADMIN': '',
		'SERVER_NAME' : context.virtualHostName,
		'SERVER_PORT' : context.virtualHostPort
		// 'SERVER_SOFTWARE': context.serverSignature,
		// 'SERVER_SIGNATURE': context.serverSignature
	};
	
	for(var v in env) {
		if(env[v] == undefined) {
			delete env[v];
		}
	}

	return env;
};

