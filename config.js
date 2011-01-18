
exports.name = 'Config';

exports.init = function(server) {
	server.addConfig({
		'documentRoot': '.',
		'indexDirectory': true
	});
};

exports.request = function(c) {
	if(c.location.match(/.php$/)) {
		
	}
	
	if(c.location.match(/^\/$/)) {
		c.addConfig({
			'indexDirectory': true
		});
	}
	
	console.log('VirtualHost', c.virtualHost);
	
	if(c.virtualHost == '127.0.0.1:8080') {
		c.config.documentRoot = '/';
	}
};
