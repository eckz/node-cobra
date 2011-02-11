
var nodeSpawn = require('child_process').spawn;
var nodePath = require('path');
var nodeQuerystring = require('querystring');

exports.name = 'cgi';

exports.init = function(server){
	var handlerModule = server.getModule('handler', true);
	handlerModule.addHandler(this, 'cgi');
	
	var confModule = server.getModule('config');
	if(confModule) {
		confModule.addPropertyHandlerAsIs('cgiScript', ['request', 'requestFile']);
	}
};

var createEnviroment = function(context) {
	var config = context.config,
	    request = context.request,
		headers = request.headers;
	
	var env = {
		'DOCUMENT_ROOT': config.documentRoot,
		'HTTP_COOKIE': headers.cookie,
		'HTTP_HOST': headers.host,
		'HTTP_REFERER': headers.referer,
		'HTTP_USER_AGENT': headers['user-agent'],
		'HTTP_ACCEPT': headers.accept,
		'HTTP_ACCEPT_CHARSET': headers['accept-charset'],
		'HTTP_ACCEPT_ENCODING': headers['accept-encoding'],
		'HTTP_ACCEPT_LANGUAGE': headers['accept-language'],
		'HTTPS': 'Off',
		'PATH': context.location,
		'QUERY_STRING': nodeQuerystring.stringify(context.query),
		'REMOTE_ADDR': context.remoteAddress,
		'REMOTE_PORT': context.remotePort,
		'REQUEST_METHOD': request.method,
		'REQUEST_URI': context.url,
		'SCRIPT_FILENAME': context.path,
		'SCRIPT_NAME': context.path,
		'SERVER_ADMIN': '',
		'SERVER_NAME': context.virtualHostName,
		'SERVER_PORT': context.virtualHostPort,
		'SERVER_SOFTWARE': context.serverSignature,
		'SERVER_SIGNATURE': context.serverSignature
	};
	
	return env;
};

exports.handle = function(context, dispatcher) {
	var script = context.config.cgiScript;
	var args = [];
	
	if(!script) {
		script = context.path;
	} else {
		args.push(context.path);
	}
	
	if(!script) {
		throw new Error('cgiScript not especified');
	}
	
	var cwd = nodePath.dirname(context.path);
	var env = createEnviroment(context);
	
	var childProccess = nodeSpawn(script, args, {
		cwd: cwd,
		env: process.env
	});
		
	context.writeHeaders(200);
	
	childProccess.stdout.on('data', function (data) {
		context.write(data);
	});
	
	childProccess.on('exit', function (code) {
		if (code !== 0) {
			console.log('process exited with code ' + code);
		}
		context.end();
		dispatcher.dispatched();
	});
	
	
	return 'async-dispatch';
};
