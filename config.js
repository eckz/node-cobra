
exports.name = 'Config';

exports.init = function(server) {
	server.addConfig({
		'documentRoot': '.'
	});
};

exports.request = function(c) {
	if(c.location.match(/.php$/)) {
		
	}
};