var nodeSpawn = require('child_process').spawn;
var nodePath = require('path');

var cgiLib = require('cgi-lib');
var CgiStream = cgiLib.CgiStream;

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
	var env = cgiLib.createEnviroment(context);
	env.extend(extraEnv);

	var childProcess = nodeSpawn(script, args, {
		cwd : cwd,
		env : env
	});
	
	var stream = new CgiStream(context);
	
	var execvpErrorChecked = false;
	var execvpError = false;
	var errorBuffers = [];
	
	childProcess.stdout.on('data', function(data) {
		try {
			stream.write(data);
		} catch(e) {
			dispatcher.exception(e);
			stream.stop();
		}
	});
	
	childProcess.stderr.on('data', function(data) {
		if (!execvpErrorChecked
				&& /^execvp\(\)/.test(data.asciiSlice(0, data.length))) {
			execvpError = true;
			dispatcher.exception(new Error("Failed to start child process '" + script + "'"));
			stream.stop();
			return;
		}
		execvpErrorChecked = true;
		
		stream.writeError(data);
	});
	
	childProcess.on('exit', function(code) {
		if(execvpError === true) {
			return;
		}
		
		stream.end();
		dispatcher.dispatched();
	});

	return 'async-dispatch';
};
