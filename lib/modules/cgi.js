var nodeSpawn = require('child_process').spawn;
var nodePath = require('path');
var nodeQuerystring = require('querystring');

var cgilib = require('cgi-lib');
var HeadersParser = cgilib.HeadersParser;

exports.name = 'cgi';

exports.init = function(server) {
	var handlerModule = server.getModule('handler', true);
	handlerModule.addHandler(this, 'cgi');

	var confModule = server.getModule('config');
	if (confModule) {
		confModule.addPropertyHandlerAsIs('cgiScript', [ 'request',
				'requestFile' ]);
	}
};

var _createEnviroment = function(context) {
	var config = context.config, request = context.request, headers = request.headers;

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

exports.handle = function(context, dispatcher) {
	var script = context.config.cgiScript;
	var args = [];
	var extraEnv = {};

	if (!script) {
		script = context.path;
	} else {
		args.push(context.path);
		extraEnv['REDIRECT_STATUS'] = '200';
	}

	if (!script) {
		throw new Error('cgiScript not especified');
	}

	var cwd = nodePath.dirname(context.path);
	var env = _createEnviroment(context);
	env.extend(extraEnv);

	var childProcess = nodeSpawn(script, args, {
		cwd : cwd,
		env : env
	});
	
	var parser = new HeadersParser();
	
	var execvpErrorChecked = false;
	var execvpError = false;
	var errorBuffers = [];
	
	childProcess.stdout.on('data', function(data) {
		try {
			parser.write(data);
		} catch(e) {
			dispatcher.exception(a);
		}
	});
	
	childProcess.stderr.on('data', function(data) {
		if (!execvpErrorChecked
				&& /^execvp\(\)/.test(data.asciiSlice(0, data.length))) {
			execvpError = true;
			dispatcher.exception(new Error("Failed to start child process '" + script + "'"));
			return;
		}
		
		execvpErrorChecked = true;
		
		if(errorBuffers !== null) {
			errorBuffers.push(data);
		} else {
			context.write(data);
		}
	});
	
	parser.on('data', function(data) {
		context.write(data);
		if(errorBuffers !== null) {
			// stderr data
			errorBuffers.forEach(context.write.bind(context));
			errorBuffers = null;
		}
	});
	
	parser.on('headers', function(headers) {
		var status = headers.Status;
		if(status) {
			delete headers.Status;
		}
		context.addHeaders(headers);
		if(status) {
			var s = status.split(' ', 2);
			context.writeHeaders(s[0], s[1]);
		} else {
			context.writeHeaders(200);
		}
	});
	
	childProcess.on('exit', function(code) {
		if(execvpError === true) {
			return;
		}
		
		if (code !== 0) {
			//console.log('process exited with code ' + code);
		}
		
		if(errorBuffers !== null) {
			// something is wrong, anyway
			context.addHeaders({
				'Content-Type': 'text/html'
			});
			context.writeHeaders(500);
			
			// stderr data
			errorBuffers.forEach(context.write.bind(context));
		}
		
		context.end();
		dispatcher.dispatched();
	});

	return 'async-dispatch';
};
