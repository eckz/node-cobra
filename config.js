

function init(server) {
	server.listenOn(8080, '127.0.0.1');
	
	server.addConfig({
		'documentRoot': '.',
		'indexDirectory': true
	});
};

function request(c) {
	if(c.location.match(/.php$/)) {
		
	}
	
	if(c.location.match(/^\/$/)) {
		c.addConfig({
			'indexDirectory': true
		});
	}
	
	if(c.virtualHost == '127.0.0.1:8080') {
		c.config.documentRoot = '/';
	}
};

function requestFile(c) {
	
	if(c.path.match('^' + c.server.cwd)) {
		c.config.allow = 'all';
	}
	
}
