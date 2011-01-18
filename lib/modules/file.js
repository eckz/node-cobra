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
	
	console.log('Requesting', path);
	
	nodeFs.realpath(path, function(err, resolvedPath) {
		if(err) {
			context.error(404, 'Not Found', 'File <code>' + context.location + '</code> not found.');
			
			dispatcher.dispatchNext('dispatched');
		} else {
			context.path = resolvedPath;
			
			console.log('Resolved path:', resolvedPath);
			debugger;
			context.server.triggerHook('requestFile', [context], function(result) {
				if(result == 'dispatched') {
					dispatcher.dispatched();
				} else {
					dispatcher.dispatchNext();
				}
			});
		}
	});
	
	return 'async-dispatch';
};

exports.requestFile = function(context, dispatcher) {
	var path = context.path;
	
	nodeFs.stat(path, function(err, stat) {
		if(!stat.isFile()) {
			dispatcher.dispatchNext();
			return;
		}
		var readStream = nodeFs.createReadStream(path, {flags: 'r'});
		
		context.addHeaders({'Content-Type': 'application/octet-stream'});
		context.writeHeaders();

		readStream.on('data', function(data) {
			context.write(data);
		});

		readStream.on('end', function() {
			context.end();
			dispatcher.dispatched();
		});
	});
	
	return 'async-dispatch';
}
