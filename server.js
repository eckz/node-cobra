
require.paths.unshift('./lib/');
require.paths.unshift('./lib/external/');

require('prototype');
var HttpServer = require('httpServer').HttpServer;

var s = new HttpServer();

/* Basic module loading */
s.loadModule('config');
s.loadModule('configJSON');

var configFiles = Array.prototype.slice.call(process.argv, 2);

configFiles.forEach( function(c) {
	s.loadConfig(c);
});
