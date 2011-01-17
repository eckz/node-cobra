var nodePath = require('path');
var nodeFs = require('fs');

exports.name = 'FileModule';

exports.request = function(context, dispatcher) {
	if(!context.config.documentRoot) {
		context.error(505, 'Misconfiguration', 'documentRoot is not set');
		return 'dispatched';
	}
	
	var path = context.config.documentRoot + context.location;
	
	console.log('Requesting', path);
	
	nodePath.exists(path, function(exists) {
		if(!exists) {
			context.error(404, 'Not Found', 'File <code>' + context.location + '</code> not found.');
			
			dispatcher.dispatchNext('dispatched');
		} else {
			var readStream = nodeFs.createReadStream(path, {flags: 'r'});
			
			context.addHeaders({'Content-Type': 'application/octet-stream'});
			context.writeHeaders();
			
			readStream.on('data', function(data) {
				context.write(data);
			});
			
			readStream.on('end', function() {
				context.end();
				dispatcher.dispatchNext('dispatched');
			});
		}
	}.bind(this));
	
	return 'async-dispatch';
};
