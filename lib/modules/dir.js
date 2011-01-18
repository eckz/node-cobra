var nodeFs = require('fs');

exports.name = 'DirIndex';
exports.priority = 950;

exports.requestFile = function(context, dispatcher) {
	var path = context.path;
	var stat = context.pathStat;

	if(!stat.isDirectory()) {
		return false;
	}
	
	/*
	 * Redirection
	 */
	if(!context.location.match(/\/$/)) {
		context.statusCode = 301;
		context.addHeaders({'Location': context.location + '/'});
		
		context.writeHeaders();
		context.end();
		
		return true;
	}
	
	if(!context.config.indexDirectory) {
		context.error(403, 'Forbidden');
		return true;
	}
	
	nodeFs.readdir(path, function(err, files) {
	
		context.writeHeaders();

		context.write('<ul>');
		files.forEach(function(f) {
			context.write('<li><a href="' + context.location + f + '">' + f + '</a></li>');
		});
		context.write('</ul>');
		
		context.end();
		
		dispatcher.dispatched();
	});

	
	return 'async-dispatch';
}