var nodeFs = require('fs');

exports.name = 'DirIndex';
exports.priority = 950;

exports.requestFile = function(context, dispatcher) {
	var path = context.path;
	
	nodeFs.stat(path, function(err, stat) {
		if(!stat.isDirectory()) {
			dispatcher.dispatchNext();
			return;
		}
		
		if(!context.config.indexDirectory) {
			context.error(403, 'Forbidden');
			dispatcher.dispatched();
		}
		
		nodeFs.readdir(path, function(err, files) {
		
			context.writeHeaders();

			context.write('<ul>');
			files.forEach(function(f) {
				context.write('<li>' + f + '</li>');
			});
			context.write('</ul>');
		});
	});
	
	return 'async-dispatch';
}
