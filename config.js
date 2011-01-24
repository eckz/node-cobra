
/*
 * Executed at the start
 */
function init(server) {
	server.listenOn(8080, '127.0.0.1');
	
	server.addConfig({
		'documentRoot': '.',
		'autoIndex': true,
		'index': ['index.html', 'config.js']
	});
};

/*
 * Executed on every request, before do anything
 */
function request(c) {
	if(c.location.match(/.php$/)) {
		
	}
	
	if(c.virtualHost == '127.0.0.1:8080') {
		c.config.documentRoot = '/';
	}
};

/*
 * Executed on every request, after file path is resolved
 */
function requestFile(c) {
	
	if(c.path.match('^' + c.server.cwd)) {
		c.config.allow = 'all';
	}
	
}
