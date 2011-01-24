var nodeFs = require('fs');

exports.name = 'DirIndex';

exports.init = function(server) {
	server.addHook('requestFile', 900, requestFile);
};

var requestFile = function(context, dispatcher) {
	var path = context.path;
	var stat = context.pathStat;

	if(!stat.isDirectory()) {
		return false;
	}
	
	/*
	 * Redirection
	 */
	if(!context.location.match(/\/$/)) {
		context.addHeaders({'Location': context.location + '/'});
		
		context.writeHeaders(301);
		context.end();
		
		return true;
	}
	
	if(!context.config.indexDirectory) {
		context.error(403);
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
