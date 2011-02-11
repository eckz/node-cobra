var nodePath = require('path');
var nodeFs = require('fs');

exports.name = 'file';

exports.init = function(server) {
	server.addHook('request', 1000, request);
	server.addHook('requestFile', 1000, requestFile);
	server.addHook('requestUndispatched', 1000, requestUndispatched);
	
	var confModule = server.getModule('config');
	if(confModule) {
		confModule.addPropertyHandlerAsIs('documentRoot', ['server', 'requestFile']);
	}
};

var request = function(context, dispatcher) {
	if(!context.config.documentRoot) {
		context.error(500, 'Misconfiguration: documentRoot is not set');
		return 'dispatched';
	}
	
	var path = context.config.documentRoot + context.location;
	
	nodeFs.realpath(path, function(err, resolvedPath) {
		if(err) {
			dispatcher.dispatchNext();
		} else {
			context.path = resolvedPath;
			
			nodeFs.stat(path, function(err, stat) {
				if(stat.isDirectory()) {
					context.path += '/';
				}
				context.pathStat = stat;
				
				var resPre = context.server.triggerHook('preRequestFile', [context]);
	
				if(resPre !== true) {
					dispatcher.dispatchNext('error', resPre);
				} else {
				
					context.server.triggerHookAsync('requestFile', [context], function(result, error) {
						dispatcher.dispatchNext(result, error);
					});
				
				}
			});
		}
	});
	
	return 'async-dispatch';
};

var requestUndispatched = function(context) {
	context.error(404, 'File <code>' + context.location + '</code> not found.');
	return true;
};

var requestFile = function(context, dispatcher) {
	var path = context.path;
	var stat = context.pathStat;

	if(!stat.isFile()) {
		return false;
	}
	
	/* If-Modified-Since */
	
	var ifs = context.request.headers['if-modified-since'];
	
	if(ifs && (ifs = Date.parse(ifs)) && stat.mtime == ifs) {
		context.addHeaders({
			'Last-Modified': new Date(stat.mtime).toUTCString()
		});
		
		context.writeHeaders(304);
		context.end();
		return true;
	}
	
	var readStream = nodeFs.createReadStream(path, {flags: 'r'});
	
	context.addHeaders({
		'Last-Modified': new Date(stat.mtime).toUTCString(),
		'Length': stat.size
	});
	if(context.headers['Content-Type'] === undefined) {
		context.addHeaders({
			'Content-Type': 'application/octet-stream'
		});
	}
	context.writeHeaders();

	readStream.on('data', function(data) {
		context.write(data);
	});

	readStream.on('end', function() {
		context.end();
		dispatcher.dispatched();
	});
	
	return 'async-dispatch';
};
