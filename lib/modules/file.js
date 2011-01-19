var nodePath = require('path');
var nodeFs = require('fs');

exports.name = 'File';
exports.priority = 1000;

exports.request = function(context, dispatcher) {
	if(!context.config.documentRoot) {
		context.error(505, 'Misconfiguration', 'documentRoot is not set');
		return 'dispatched';
	}
	
	var path = context.config.documentRoot + context.location;
	
	nodeFs.realpath(path, function(err, resolvedPath) {
		if(err) {
			dispatcher.dispatchNext();
		} else {
			context.path = resolvedPath;
			
			//console.log('Resolved path:', resolvedPath);
			
			nodeFs.stat(path, function(err, stat) {
				context.pathStat = stat;
				context.server.triggerHook('requestFile', [context], function(result) {
					if(result == 'dispatched') {
						dispatcher.dispatched();
					} else {
						dispatcher.dispatchNext();
					}
				});
			});
		}
	});
	
	return 'async-dispatch';
};

exports.requestUndispatched = function(context) {
	context.error(404, 'Not Found', 'File <code>' + context.location + '</code> not found.');
	return true;
}

exports.requestFile = function(context, dispatcher) {
	var path = context.path;
	var stat = context.pathStat;

	if(!stat.isFile()) {
		return false;
	}
	
	/* If-Modified-Since */
	
	var ifs = context.request.headers['if-modified-since'];
	
	if(ifs) {
		ifs = Date.parse(ifs);
		if(ifs) {
			if(stat.mtime <= ifs) {
				context.addHeaders({
					'Last-Modified': new Date(stat.mtime).toUTCString()
				});
				
				context.writeHeaders(304, 'Not Modified');
				context.end();
				return true;
			}
		}
	}
	
	var readStream = nodeFs.createReadStream(path, {flags: 'r'});
	
	context.addHeaders({
		'Content-Type': 'application/octet-stream',
		'Last-Modified': new Date(stat.mtime).toUTCString(),
		'Length': stat.size
	});
	context.writeHeaders();

	readStream.on('data', function(data) {
		context.write(data);
	});

	readStream.on('end', function() {
		context.end();
		dispatcher.dispatched();
	});
	
	return 'async-dispatch';
}
