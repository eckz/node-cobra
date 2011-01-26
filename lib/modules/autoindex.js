var nodeFs = require('fs');

exports.name = 'autoindex';

exports.init = function(server) {
	server.addHook('requestFile', 900, requestFile);
	
	var confModule = server.getModule('config');
	if(confModule) {
		confModule.addPropertyHandlerAsIs('autoIndex', ['requestFile']);
	}
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
	
	if(!context.config.autoIndex) {
		context.error(403);
		return true;
	}
	
	nodeFs.readdir(path, function(err, files) {
	
		context.writeHeaders();
		
		var title = 'Directory listing of ' + context.location;
		
		context.write('<html><head><title>');
		context.write(title);
		context.write('</title></head><body>');
		context.write('<h2>' + title + '</h2>');
		context.write('<ul>');
		files.forEach(function(f) {
			context.write('<li><a href="' + context.location + f + '">' + f + '</a></li>');
		});
		context.write('</ul></body></html>');
		
		context.end();
		
		dispatcher.dispatched();
	});

	
	return 'async-dispatch';
};
