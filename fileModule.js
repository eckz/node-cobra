var path = require('path');
var fs = require('fs');

exports.name = 'FileModule';

exports.request = function(context) {
	var url = context.url;
	var reqPath = context.config.documentRoot + url;
	
	console.log('REQUEST: ' + url);

	path.exists(reqPath, function(exists) {
		if(!exists) {
			context.server._error(context, 404, 'Not Found', 'File <code>' + url + '</code> not found.');
		} else {
		
			console.log('dispatching file', reqPath);
			var readStream = fs.createReadStream(reqPath, {flags: 'r'});
			
			context.writeHeaders();
			
			readStream.on('data', function(data) {
				context.write(data);
			});
			
			readStream.on('end', function() {
				context.end();
			});
		}
	}.bind(this));
	
	return 'dispatched';
}
