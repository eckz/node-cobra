
var mime = require('node-mime');

exports.name = 'Mime';
exports.priority = 900;


exports.requestFile = function(c) {
	if(c.pathStat.isFile()) {
		var ct = mime.lookup(c.path);
		if(ct) {
			c.addHeaders({
				'Content-Type': ct
			});
		}
	}
	return false;
};
