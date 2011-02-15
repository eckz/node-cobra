var nodeSpawn = require('child_process').spawn;
var nodePath = require('path');
var nodeQuerystring = require('querystring');

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

var _parseHeaders = function(data) {
	var splitted = data.split('\r\n');
	var result = {};
	
	splitted.forEach(function(h) {
		h = h.split(':', 2);
		var key = h[0].trim(),
		    value = h[1].trim();
		
		if(result[key] === undefined) {
			result[key] = value;
		} else if(Array.isArray(result[key])){
			result[key].push(v);
		} else {
			result[key] = [result[key], value];
		}
	});
	
	return result;
};

var _writeHeaders = function(data, context) {
	var headers = _parseHeaders(data);
	var status = headers.Status;
	
	if(status) {
		delete headers.Status;
	}
	
	context.addHeaders(headers);
	
	if(status) {
		var s = status.split(' ', 2);
		var code = s[0],
		    msg = s[1];
		
		context.writeHeaders(code, msg);
	} else {
		context.writeHeaders(200);
	}
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
	
	var headersParsed = false;
	var headersBuffer = new Buffer(2048);
	
	var execvpErrorChecked = false;
	var execvpError = false;
	var errorBuffers = [];
	
	childProcess.stdout.on('data', function(data) {
		console.log('length', data.length);
		if(!headersParsed) {
			var dataStr = data.toString('ascii');
			var i = dataStr.indexOf('\r\n\r\n');
			if(i >= 0) {
				headersBuffer += dataStr.slice(0, i);
				_writeHeaders(headersBuffer, context);
				headersParsed = true;
				headersBuffer = null;
				
				context.write(data.slice(i + 4));
				
				// stderr data
				errorBuffers.forEach(context.write.bind(context));
			} else {
				headersBuffer += dataStr;
			}
		} else {
			context.write(data);
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
		
		if(!headersParsed) {
			errorBuffers.push(data);
		} else {
			context.write(data);
		}
	});
	
	childProcess.on('exit', function(code) {
		if(execvpError === true) {
			return;
		}
		
		if (code !== 0) {
			console.log('process exited with code ' + code);
		}
		
		if(headersBuffer !== null) {
			// something is wrong, anyway
			context.addHeaders({
				'Content-Type': 'text/html'
			});
			context.writeHeaders(200);
			
			context.write('<p>Something is wrong</p>');
			
			context.write(headersBuffer);
			headersBuffer = null;
			
			// stderr data
			errorBuffers.forEach(context.write.bind(context));
		}
		
		context.end();
		dispatcher.dispatched();
	});

	return 'async-dispatch';
};
