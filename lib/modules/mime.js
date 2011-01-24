
var mime = require('node-mime');

exports.name = 'Mime';

exports.init = function(server) {
	server.addHook('requestFile', 950, function(c) {
		if(c.pathStat.isFile()) {
			var ct = mime.lookup(c.path);
			if(ct) {
				c.addHeaders({
					'Content-Type': ct
				});
			}
		}
		return false;
	});
}